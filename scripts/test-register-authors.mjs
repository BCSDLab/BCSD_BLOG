import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import { parse } from 'yaml';

const require = createRequire(import.meta.url);
const source = fs.readFileSync('scripts/register-authors.mjs', 'utf8');
const code = ts.transpileModule(
  source.slice(0, source.lastIndexOf('main().catch')) +
    '\nglobalThis.completion = main();',
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  },
).outputText;
async function scenario(status, existing) {
  const root = fs.mkdtempSync(join(tmpdir(), 'bcsd-author-test-'));
  try {
    fs.mkdirSync(join(root, '@test'));
    fs.writeFileSync(join(root, '@test/authors.yml'), '{}\n');
    const content = `---\ntitle: Test\n${existing ? 'authors: missing-member\n' : ''}---\nBody unchanged.\n`;
    fs.writeFileSync(join(root, '@test/post.mdx'), content);
    const context = {
      module: { exports: {} },
      exports: {},
      require: (name) => {
        if (name === 'node:fs')
          return {
            readFileSync: (path, ...args) =>
              fs.readFileSync(join(root, path), ...args),
            writeFileSync: (path, ...args) =>
              fs.writeFileSync(join(root, path), ...args),
            existsSync: (path) => fs.existsSync(join(root, path)),
          };
        if (name === 'node:child_process')
          return {
            execFileSync: (command, args) => {
              assert.equal(command, 'git');
              return args[0] === 'diff' ? '@test/post.mdx\n' : 'commit-sha\n';
            },
          };
        return require(name);
      },
      process: {
        env: {
          GITHUB_REPOSITORY: 'example/blog',
          GITHUB_EVENT_BEFORE: 'before',
          GITHUB_SHA: 'after',
        },
        exit: () => {
          throw new Error('Unexpected exit');
        },
      },
      console: { log() {}, warn() {}, error() {} },
      fetch: async (url) =>
        url.includes('/commits/')
          ? new Response(JSON.stringify({ author: { login: 'new-member' } }))
          : new Response(
              JSON.stringify({
                login: 'new-member',
                name: 'New Member',
                html_url: 'https://github.com/new-member',
                avatar_url: 'https://example.com/avatar.png',
              }),
              { status },
            ),
    };
    vm.runInNewContext(code, context);
    if (status === 403) {
      await assert.rejects(context.completion, /HTTP 403/);
      assert.equal(
        fs.readFileSync(join(root, '@test/post.mdx'), 'utf8'),
        content,
      );
    } else {
      await context.completion;
      const updated = fs.readFileSync(join(root, '@test/post.mdx'), 'utf8');
      assert(updated.endsWith('Body unchanged.\n'));
      if (status === 200) {
        assert(updated.includes('authors: new-member'));
        assert.equal(
          parse(fs.readFileSync(join(root, '@test/authors.yml'), 'utf8'))[
            'new-member'
          ].name,
          'New Member',
        );
      } else assert(!updated.includes('authors:'));
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
await scenario(200, false);
await scenario(404, true);
await scenario(403, true);
console.log(
  'Author checks passed: commit author detection, YAML registration, missing-user cleanup, body preservation, and no deletion on API errors.',
);
