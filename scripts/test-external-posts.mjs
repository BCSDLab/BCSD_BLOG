import assert from 'node:assert/strict';
import {
  readFileSync,
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import { stringify } from 'yaml';

const require = createRequire(import.meta.url);
const root = mkdtempSync(join(tmpdir(), 'bcsd-feed-test-'));
try {
  mkdirSync(join(root, '@test'));
  const authorPath = join(root, '@test/authors.yml');
  const warnings = [];
  let requests = 0;
  const items = Array.from(
    { length: 35 },
    (_, i) =>
      `<item><title>Post ${i}</title><link>https://example.com/${i}</link><pubDate>${new Date(Date.UTC(2026, 0, i + 1)).toUTCString()}</pubDate><category>React</category><description>Summary ${i}</description></item>`,
  ).join('');
  const xml = `<?xml version="1.0"?><rss version="2.0"><channel><title>Test</title><link>https://example.com</link><description>Test feed</description>${items}<item><title>Duplicate</title><link>https://example.com/0</link><category>React</category></item><item><title>Filtered</title><link>https://example.com/filtered</link><category>Other</category></item><item><title>Unsafe link</title><link>javascript:alert(1)</link><category>React</category></item></channel></rss>`;
  const module = { exports: {} };
  const code = ts.transpileModule(
    readFileSync('src/lib/external-posts.ts', 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    },
  ).outputText;
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: (name) =>
      name === '../data/site'
        ? { tracks: [{ directory: '@test', slug: 'test' }] }
        : require(name),
    process: { cwd: () => root },
    URL,
    AbortSignal,
    console: { warn: (message) => warnings.push(message) },
    fetch: async (url) => {
      requests++;
      if (url.includes('broken')) throw new Error('feed unavailable');
      return new Response(xml);
    },
  });
  const load = module.exports.loadExternalPosts;
  writeFileSync(authorPath, stringify({ member: { name: 'Member' } }));
  assert.equal((await load()).length, 0);
  assert.equal(requests, 0);
  writeFileSync(
    authorPath,
    stringify({
      member: {
        name: 'Member',
        rss: 'https://example.com/feed.xml',
        include_tags: ['react'],
      },
      broken: { rss: 'https://broken.example/feed.xml' },
    }),
  );
  const posts = await load();
  assert.equal(posts.length, 30);
  assert.equal(posts[0].data.title, 'Post 34');
  assert.equal(posts[0].author.name, 'Member');
  assert(
    posts.every((post) => post.external && post.data.tags.includes('React')),
  );
  assert(
    posts.every(
      (post) =>
        !post.link.includes('filtered') && !post.link.startsWith('javascript:'),
    ),
  );
  assert.equal(new Set(posts.map((post) => post.link)).size, posts.length);
  assert.equal(warnings.length, 1);
  writeFileSync(
    authorPath,
    stringify({ member: { rss: 'file:///etc/passwd' } }),
  );
  const before = requests;
  assert.equal((await load()).length, 0);
  assert.equal(requests, before);
  console.log(
    'RSS checks passed: optional feeds, tag filtering, newest-first sorting, 30-item limit, deduplication, safe URLs, and failure isolation.',
  );
} finally {
  rmSync(root, { recursive: true, force: true });
}
