// 1) 글의 frontmatter에 `authors:` 값이 비어있으면, 그 글을 커밋한 사람의
//    실제 GitHub 계정(login)을 GitHub Commits API로 조회해 채워 넣는다.
//    (.pages.yml의 settings.commit.identity: user 덕분에 Pages CMS 커밋도
//    실제 로그인한 사람의 이름/이메일로 만들어지므로 이 조회가 가능하다.)
// 2) 그렇게 확정된(또는 원래 있던) authors 값이 해당 트랙의 authors.yml에
//    없으면, 그 값을 GitHub username으로 간주해 공개 프로필(name, avatar)을
//    가져와 authors.yml에 등록한다.
//
// 트리거: .github/workflows/register-author.yml (push 시 변경된 *.mdx만 스캔)
// 사람이 authors 필드나 authors.yml을 직접 편집할 필요가 없도록 하기 위한 스크립트.

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

function splitFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return null;
  return { frontmatter: match[1], body: match[2] };
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
// 채워진(또는 원래 있던) author 값을 반환한다.
async function fillBlankAuthor(file) {
  const raw = readFileSync(file, "utf-8");
  const split = splitFrontmatter(raw);
  if (!split) return [];

  const fm = yamlLoad(split.frontmatter) ?? {};
  if (fm.authors) {
    return Array.isArray(fm.authors) ? fm.authors : [fm.authors];
  }

  const sha = lastCommitTouching(file);
  const login = await fetchCommitAuthorLogin(sha);
  if (!login) {
    console.warn(`  ⚠ ${file}: authors가 비어있는데 커밋 작성자 계정을 못 찾음 — 건너뜀`);
    return [];
  }

  fm.authors = login;
  const newFrontmatter = yamlDump(fm, { lineWidth: -1 }).trimEnd();
  writeFileSync(file, `---\n${newFrontmatter}\n---\n${split.body}`);
  console.log(`  ✓ ${file}: authors를 "${login}"(으)로 자동 입력`);
  return [login];
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

  // track -> Set(authorKey)
  const byTrack = new Map();
  for (const file of files) {
    const track = file.split("/")[0]; // "@frontEnd"
    const authors = await fillBlankAuthor(file);
    if (authors.length === 0) continue;
    if (!byTrack.has(track)) byTrack.set(track, new Set());
    authors.forEach((a) => byTrack.get(track).add(String(a)));
  }

  let anyChange = false;

  for (const [track, authorKeys] of byTrack) {
    const authorsPath = `${track}/authors.yml`;
    if (!existsSync(authorsPath)) {
      console.log(`${authorsPath} 없음, 건너뜀`);
      continue;
    }
    const doc = yamlLoad(readFileSync(authorsPath, "utf-8")) ?? {};

    for (const key of authorKeys) {
      if (doc[key]) continue; // 이미 등록됨

      console.log(`[${track}] "${key}" 미등록 → GitHub 프로필 조회 시도`);
      const profile = await fetchGithubProfile(key);
      if (!profile) {
        console.warn(
          `  ⚠ GitHub 사용자 "${key}"를 찾을 수 없음 — 수동 등록 필요, 건너뜀`
        );
        continue;
      }
      doc[key] = profile;
      anyChange = true;
      console.log(`  ✓ 등록: ${profile.name} (${profile.url})`);
    }

    if (anyChange) {
      writeFileSync(authorsPath, yamlDump(doc, { lineWidth: -1 }));
    }
  }

  console.log(anyChange ? "CHANGED=true" : "CHANGED=false");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
