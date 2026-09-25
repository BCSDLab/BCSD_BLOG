// 새로 작성된 글의 `authors:` 값이 해당 트랙의 authors.yml에 없으면,
// 그 값을 GitHub username으로 간주해 공개 프로필(name, avatar) 정보를
// 자동으로 가져와 authors.yml에 등록한다.
//
// 트리거: .github/workflows/register-author.yml (push 시 변경된 *.mdx만 스캔)
// 사람이 직접 authors.yml을 편집할 필요가 없도록 하기 위한 스크립트.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { load as yamlLoad, dump as yamlDump } from "js-yaml";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const BEFORE = process.env.GITHUB_EVENT_BEFORE;
const AFTER = process.env.GITHUB_SHA;

function changedMdxFiles() {
  const range =
    BEFORE && !/^0+$/.test(BEFORE) ? `${BEFORE}..${AFTER}` : `${AFTER}~1..${AFTER}`;
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

function parseFrontmatterAuthors(filePath) {
  const raw = readFileSync(filePath, "utf-8");
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return [];
  const fm = yamlLoad(match[1]) ?? {};
  if (!fm.authors) return [];
  return Array.isArray(fm.authors) ? fm.authors : [fm.authors];
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

async function main() {
  const files = changedMdxFiles();
  if (files.length === 0) {
    console.log("변경된 .mdx 없음, 종료");
    return;
  }

  // track -> Set(authorKey)
  const byTrack = new Map();
  for (const file of files) {
    const track = file.split("/")[0]; // "@frontEnd"
    const authors = parseFrontmatterAuthors(file);
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

  if (anyChange) {
    console.log("CHANGED=true");
  } else {
    console.log("CHANGED=false");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
