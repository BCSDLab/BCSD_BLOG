import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const read = (file) => readFileSync(file, 'utf8');
const legacyPaths = JSON.parse(read('scripts/legacy-paths.json'));
const legacyContent = JSON.parse(read('src/data/legacy-routes.json'));
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  );
const errors = [];
for (const path of legacyPaths) {
  if (!existsSync(`dist${path}/index.html`))
    errors.push(`Missing legacy route: ${path}`);
}
for (const { url } of Object.values(legacyContent)) {
  const html = read(`dist/${url}/index.html`.replaceAll('//', '/'));
  if (
    !html.includes('https://utteranc.es/client.js') &&
    !html.includes('utterances')
  )
    errors.push(`Missing comments: ${url}`);
  if (!html.includes('class="prose"'))
    errors.push(`Missing article body: ${url}`);
  const expectedImage = `/og${url.replace(/\/$/, '')}.png`;
  if (!html.includes(`https://blog.bcsdlab.com${expectedImage}`))
    errors.push(`Wrong article social image: ${url}`);
}
for (const file of walk('dist').filter((file) => file.endsWith('.html'))) {
  const html = read(file);
  const image = html.match(/<meta property="og:image" content="([^"]+)"/);
  assert(image, `Missing social preview image: ${file}`);
  const socialUrl = new URL(image[1]);
  assert.equal(socialUrl.origin, 'https://blog.bcsdlab.com');
  assert(
    existsSync(join('dist', decodeURIComponent(socialUrl.pathname))),
    `Missing social image: ${file}`,
  );
  assert(
    html.includes('name="twitter:card" content="summary_large_image"'),
    `Missing social card: ${file}`,
  );
  const body = html.replace(/<pre[\s\S]*?<\/pre>/g, '');
  for (const [image] of body.matchAll(/<img\b[^>]*src="\/_astro\/[^>]+>/g)) {
    assert(
      /\bwidth="\d+"/.test(image) && /\bheight="\d+"/.test(image),
      `Missing imported image dimensions: ${file}`,
    );
  }
  if (/\[object Object\]|<p>:::(note|tip|info|warning|danger)/.test(body))
    errors.push(`Unrendered MDX: ${file}`);
  for (const [, value] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|data:|mailto:|tel:|#|javascript:)/.test(value)) continue;
    const url = new URL(
      value.replaceAll('&amp;', '&'),
      `https://local/${file.slice(5)}`,
    );
    const target = decodeURIComponent(url.pathname);
    if (
      !existsSync(join('dist', target)) &&
      !existsSync(join('dist', target, 'index.html'))
    )
      errors.push(`Broken internal target: ${file} → ${target}`);
  }
}
assert.equal(errors.length, 0, errors.join('\n'));
const home = read('dist/index.html');
assert(
  home.includes('BCSD 기술 블로그') &&
    home.includes('최근 글') &&
    home.includes('/introduce/what-is-bcsd'),
  'Home must include introduction and latest posts',
);
assert(
  read('dist/rss.xml').includes('<item>'),
  'Main RSS must contain articles',
);
assert(existsSync('dist/sitemap-index.xml'), 'Sitemap must be generated');
assert(existsSync('dist/CNAME'), 'Custom domain must be preserved');
const socialFiles = walk('dist/og').filter((file) => file.endsWith('.png'));
assert(
  socialFiles.length >= Object.keys(legacyContent).length,
  'Every article needs a generated social image',
);
for (const file of socialFiles) {
  const png = readFileSync(file);
  assert.equal(
    png.subarray(1, 4).toString(),
    'PNG',
    `Invalid social PNG: ${file}`,
  );
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
}
assert(
  read('dist/guideline/template/index.html').includes('<video'),
  'Video example must render as a native player',
);
assert(
  read('dist/android/kongwoojin/kotlin-dsl-error-handling/index.html').includes(
    'callout-note',
  ),
  'Named callouts must render',
);
console.log(
  `Verified ${legacyPaths.length} legacy routes, ${Object.keys(legacyContent).length} articles, internal links/media, RSS, sitemap, and MDX rendering.`,
);
