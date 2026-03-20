#!/usr/bin/env node
// One-shot build script to produce src/vendor/tiptap.umd.min.js
// Run: node scripts/build-tiptap.mjs
// Requires: npm install (packages listed below must be in node_modules)

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Install required packages (idempotent)
const packages = [
  '@tiptap/core', '@tiptap/pm', '@tiptap/react',
  '@tiptap/extension-document', '@tiptap/extension-paragraph', '@tiptap/extension-text',
  '@tiptap/extension-bold', '@tiptap/extension-italic', '@tiptap/extension-underline',
  '@tiptap/extension-heading', '@tiptap/extension-bullet-list', '@tiptap/extension-ordered-list',
  '@tiptap/extension-list-item', '@tiptap/extension-hard-break', '@tiptap/extension-history',
  '@tiptap/extension-dropcursor', '@tiptap/extension-gapcursor',
  '@tiptap/extension-color', '@tiptap/extension-text-style', '@tiptap/extension-font-family',
  '@tiptap/extension-image', '@tiptap/extension-placeholder',
  '@tiptap/suggestion',
  // New extensions
  '@tiptap/extension-table', '@tiptap/extension-table-row',
  '@tiptap/extension-table-cell', '@tiptap/extension-table-header',
  '@tiptap/extension-task-list', '@tiptap/extension-task-item',
  '@tiptap/extension-code-block', '@tiptap/extension-horizontal-rule',
  '@tiptap/extension-subscript', '@tiptap/extension-superscript',
  '@tiptap/extension-highlight', '@tiptap/extension-text-align',
  '@tiptap/extension-character-count',
  'esbuild',
];

console.log('Installing packages...');
execSync(`npm install --no-save ${packages.join(' ')}`, { cwd: root, stdio: 'inherit' });

console.log('Building vendor bundle...');

// Use esbuild programmatically
const esbuild = await import('esbuild');

const result = await esbuild.build({
  entryPoints: [resolve(__dirname, 'tiptap-entry.js')],
  bundle: true,
  format: 'iife',
  globalName: 'Tiptap',
  outfile: resolve(root, 'src/vendor/tiptap.umd.min.js'),
  minify: true,
  // React and ReactDOM are loaded as UMD globals before this script
  external: ['react', 'react-dom'],
  // Map bare imports to globals
  plugins: [{
    name: 'externalize-react',
    setup(build) {
      // Intercept react/react-dom imports and point to globals
      build.onResolve({ filter: /^react$/ }, () => ({ path: 'react', namespace: 'external-global' }));
      build.onResolve({ filter: /^react-dom$/ }, () => ({ path: 'react-dom', namespace: 'external-global' }));
      build.onResolve({ filter: /^react-dom\/client$/ }, () => ({ path: 'react-dom', namespace: 'external-global' }));
      build.onResolve({ filter: /^react\/jsx-runtime$/ }, () => ({ path: 'react', namespace: 'external-global' }));
      build.onLoad({ filter: /.*/, namespace: 'external-global' }, (args) => {
        if (args.path === 'react') {
          return { contents: 'module.exports = React;', loader: 'js' };
        }
        if (args.path === 'react-dom') {
          return { contents: 'module.exports = ReactDOM;', loader: 'js' };
        }
      });
    }
  }],
  target: ['es2020'],
  legalComments: 'none',
  metafile: true,
});

// Report size
const outFile = resolve(root, 'src/vendor/tiptap.umd.min.js');
const stats = readFileSync(outFile);
console.log(`\nBundle built: src/vendor/tiptap.umd.min.js (${(stats.length / 1024).toFixed(1)} KB)`);

// Report what's included
const meta = result.metafile;
const inputs = Object.keys(meta.inputs).filter(k => k.includes('node_modules/@tiptap'));
const tiptapPkgs = [...new Set(inputs.map(k => {
  const m = k.match(/node_modules\/(@tiptap\/[^/]+)/);
  return m ? m[1] : null;
}).filter(Boolean))].sort();
console.log(`\nIncluded ${tiptapPkgs.length} @tiptap packages:`);
tiptapPkgs.forEach(p => console.log(`  ${p}`));
