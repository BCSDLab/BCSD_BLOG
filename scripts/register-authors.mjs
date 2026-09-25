// 1) 글의 frontmatter에 `authors:` 값이 비어있으면, 그 글을 커밋한 사람의
//    실제 GitHub 계정(login)을 GitHub Commits API로 조회해 채워 넣는다.
//    (.pages.yml의 settings.commit.identity: user 덕분에 Pages CMS 커밋도
//    실제 로그인한 사람의 이름/이메일로 만들어지므로 이 조회가 가능하다.)
// 2) 그렇게 확정된(또는 원래 있던) authors 값이 해당 트랙의 authors.yml에
//    없으면, 그 값을 GitHub username으로 간주해 공개 프로필(name, avatar)을
//    가져와 authors.yml에 등록한다.
// 3) 그래도 끝내 해결 안 되는 author key(오타 등 실존하지 않는 GitHub
//    username)는 authors.yml에 등록할 수 없으므로, 해당 글의 frontmatter에서
//    그 key를 제거한다. Docusaurus는 authors.yml에 없는 key가 frontmatter에
//    남아있으면 사이트 전체 빌드를 실패시키기 때문에(authors.ts의
//    `Blog author with key "${key}" not found` 에러), 이 안전장치 없이는
//    글 하나의 오타가 blog.bcsdlab.com 전체를 다운시킬 수 있다.
//
// 트리거: .github/workflows/register-author.yml (push 시 변경된 *.mdx만 스캔)

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { load as yamlLoad, dump as yamlDump } from "js-yaml";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const BEFORE = process.env.GITHUB_EVENT_BEFORE;
const AFTER = process.env.GITHUB_SHA;
const REPO = process.env.GITHUB_REPOSITORY; // "owner/repo"

function diffRange() {
  return BEFORE && !/^0+$/.test(BEFORE) ? `${BEFORE}..${AFTER}` : `${AFTER}~1..${AFTER}`;
}

function changedMdxFiles() {
  const range = diffRange();
  let diff;
  try {
    diff = execSync(`git diff --name-only --diff-filter=ACM ${range}`, {
      encoding: "utf-8",
    });
  } catch {
    diff = execSync(`git show --name-only --pretty=format: ${AFTER}`, {
      encoding: "utf-8",
    });
  }
  return diff
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^@[^/]+\/.*\.mdx$/.test(l));
}

function readFrontmatter(file) {
  const raw = readFileSync(file, "utf-8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return null;
  return { fm: yamlLoad(match[1]) ?? {}, body: match[2] };
}

function writeFrontmatter(file, fm, body) {
  const newFrontmatter = yamlDump(fm, { lineWidth: -1 }).trimEnd();
  writeFileSync(file, `---\n${newFrontmatter}\n---\n${body}`);
}

function authorKeysOf(fm) {
  if (!fm.authors) return [];
  return Array.isArray(fm.authors) ? fm.authors.map(String) : [String(fm.authors)];
}

function lastCommitTouching(file) {
  const range = diffRange();
  const out = execSync(`git log --format=%H ${range} -- "${file}"`, {
    encoding: "utf-8",
  }).trim();
  return out.split("\n")[0] || AFTER;
}

async function fetchCommitAuthorLogin(sha) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/commits/${sha}`, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.author?.login ?? null; // GitHub이 커밋을 실제 계정에 매칭한 결과
}

async function fetchGithubProfile(username) {
  const res = await fetch(`https://api.github.com/users/${username}`, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return {
    name: data.name || data.login,
    url: data.html_url,
    image_url: data.avatar_url,
    ...(data.email ? { email: data.email } : {}),
  };
}

// authors: 필드가 비어있는 글에 커밋 작성자를 채워 넣는다.
// 채워진(또는 원래 있던) author 키 목록을 반환한다.
async function fillBlankAuthor(file) {
  const parsed = readFrontmatter(file);
  if (!parsed) return [];
  const { fm, body } = parsed;

  const existing = authorKeysOf(fm);
  if (existing.length > 0) return existing;

  const sha = lastCommitTouching(file);
  const login = await fetchCommitAuthorLogin(sha);
  if (!login) {
    console.warn(`  ⚠ ${file}: authors가 비어있는데 커밋 작성자 계정을 못 찾음 — 건너뜀`);
    return [];
  }

  fm.authors = login;
  writeFrontmatter(file, fm, body);
  console.log(`  ✓ ${file}: authors를 "${login}"(으)로 자동 입력`);
  return [login];
}

// authors.yml에 끝내 등록되지 못한 key를 글의 frontmatter에서 제거해
// Docusaurus 빌드가 깨지는 것을 막는다.
function stripUnresolvableAuthors(file, badKeys) {
  const parsed = readFrontmatter(file);
  if (!parsed) return;
  const { fm, body } = parsed;

  const before = authorKeysOf(fm);
  const remaining = before.filter((k) => !badKeys.includes(k));

  if (remaining.length === before.length) return; // 이 파일엔 해당 없음

  if (remaining.length === 0) {
    delete fm.authors;
  } else {
    fm.authors = Array.isArray(fm.authors) ? remaining : remaining[0];
  }
  writeFrontmatter(file, fm, body);
  console.warn(
    `🚨 ${file}: author key [${badKeys.filter((k) => before.includes(k)).join(", ")}] 를 GitHub에서 찾을 수 없어 frontmatter에서 제거함 — 오타일 수 있으니 수동 확인 필요.`
  );
}

async function main() {
  if (!REPO) {
    console.error("GITHUB_REPOSITORY 환경변수가 없음");
    process.exit(1);
  }

  const files = changedMdxFiles();
  if (files.length === 0) {
    console.log("변경된 .mdx 없음, 종료");
    return;
  }

  // file -> { track, keys }
  const fileAuthors = new Map();
  for (const file of files) {
    const track = file.split("/")[0]; // "@frontEnd"
    const keys = await fillBlankAuthor(file);
    fileAuthors.set(file, { track, keys });
  }

  // track -> Set(authorKey), 등록 시도 대상
  const byTrack = new Map();
  for (const { track, keys } of fileAuthors.values()) {
    if (keys.length === 0) continue;
    if (!byTrack.has(track)) byTrack.set(track, new Set());
    keys.forEach((k) => byTrack.get(track).add(k));
  }

  let authorsYmlChanged = false;
  const unresolvedByTrack = new Map(); // track -> Set(key) 끝내 등록 실패

  for (const [track, authorKeys] of byTrack) {
    const authorsPath = `${track}/authors.yml`;
    if (!existsSync(authorsPath)) {
      console.log(`${authorsPath} 없음, 건너뜀 — 이 트랙의 author 전부 미해결 처리`);
      unresolvedByTrack.set(track, new Set(authorKeys));
      continue;
    }
    const doc = yamlLoad(readFileSync(authorsPath, "utf-8")) ?? {};
    let trackChanged = false;

    for (const key of authorKeys) {
      if (doc[key]) continue; // 이미 등록됨

      console.log(`[${track}] "${key}" 미등록 → GitHub 프로필 조회 시도`);
      const profile = await fetchGithubProfile(key);
      if (!profile) {
        console.warn(`  ⚠ GitHub 사용자 "${key}"를 찾을 수 없음`);
        if (!unresolvedByTrack.has(track)) unresolvedByTrack.set(track, new Set());
        unresolvedByTrack.get(track).add(key);
        continue;
      }
      doc[key] = profile;
      trackChanged = true;
      console.log(`  ✓ 등록: ${profile.name} (${profile.url})`);
    }

    if (trackChanged) {
      writeFileSync(authorsPath, yamlDump(doc, { lineWidth: -1 }));
      authorsYmlChanged = true;
    }
  }

  // 끝내 해결되지 않은 key가 있으면, 그 key를 쓴 글들에서 제거해 빌드 실패를 막는다.
  let filesPatched = false;
  if (unresolvedByTrack.size > 0) {
    for (const [file, { track, keys }] of fileAuthors) {
      const badKeys = unresolvedByTrack.get(track);
      if (!badKeys) continue;
      const relevant = keys.filter((k) => badKeys.has(k));
      if (relevant.length === 0) continue;
      stripUnresolvableAuthors(file, relevant);
      filesPatched = true;
    }
  }

  console.log(authorsYmlChanged || filesPatched ? "CHANGED=true" : "CHANGED=false");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
