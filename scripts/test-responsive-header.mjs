import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = ts.transpileModule(
  readFileSync('src/lib/responsive-header.ts', 'utf8'),
  {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  },
).outputText;
let linkWidth = 60;
const links = Array.from({ length: 10 }, () => ({
  getBoundingClientRect: () => ({ width: linkWidth }),
}));
const brand = { getBoundingClientRect: () => ({ width: 170 }) };
const actions = { getBoundingClientRect: () => ({ width: 72 }) };
const nav = { children: links, scrollWidth: 10000 };
const header = {
  clientWidth: 1200,
  wrapped: false,
  querySelector: (selector) =>
    ({ '.brand': brand, '.main-nav': nav, '.header-actions': actions })[
      selector
    ],
  toggleAttribute: (_, value) => {
    header.wrapped = value;
  },
};
const frames = new Map();
let nextFrame = 0;
const observers = [];
const fonts = new EventTarget();
fonts.ready = Promise.resolve();
const context = {
  exports: {},
  document: { querySelector: () => header, fonts },
  getComputedStyle: (element) => ({
    columnGap: element === header ? '20px' : '18px',
    paddingLeft: '0',
    paddingRight: '0',
    marginLeft: '0',
    marginRight: '0',
  }),
  ResizeObserver: class {
    constructor(callback) {
      this.callback = callback;
      this.disconnected = false;
      observers.push(this);
    }
    observe() {}
    disconnect() {
      this.disconnected = true;
    }
  },
  requestAnimationFrame: (callback) => {
    const id = ++nextFrame;
    frames.set(id, callback);
    return id;
  },
  cancelAnimationFrame: (id) => frames.delete(id),
};
vm.runInNewContext(source, context);
const flush = () => {
  const pending = [...frames.values()];
  frames.clear();
  pending.forEach((callback) => callback());
};
const dispose = context.exports.setupResponsiveHeader();
assert.equal(header.wrapped, false);
header.clientWidth = 1000;
observers[0].callback();
flush();
assert.equal(header.wrapped, true);
header.clientWidth = 1200;
observers[0].callback();
flush();
assert.equal(
  header.wrapped,
  false,
  'Menu must unwrap even if its stretched scrollWidth is large',
);
linkWidth = 90;
fonts.dispatchEvent(new Event('loadingdone'));
flush();
assert.equal(
  header.wrapped,
  true,
  'Font loading can require wrapping without a viewport resize',
);
linkWidth = 40;
fonts.dispatchEvent(new Event('loadingdone'));
flush();
assert.equal(
  header.wrapped,
  false,
  'Shorter labels fit at the same viewport width',
);
observers[0].callback();
dispose();
assert.equal(observers[0].disconnected, true);
assert.equal(frames.size, 0);
await Promise.resolve();
assert.equal(
  frames.size,
  0,
  'A disposed header must not schedule font-ready work',
);
const disposeNext = context.exports.setupResponsiveHeader();
assert.equal(observers.length, 2);
disposeNext();
console.log(
  'Header checks passed: content-based wrapping, unwrapping, font changes, and navigation cleanup.',
);
