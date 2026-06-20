/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Build script for Cloudflare Pages deployment.
 * Produces a dist/ directory with:
 *   /               -> landing page (index.html)
 *   /app/*          -> React SPA
 *   /downloads/*    -> APK download files
 *   /_redirects     -> Cloudflare Pages routing rules
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.resolve(ROOT, 'dist');
const LANDING = path.resolve(ROOT, 'landing');
const SPA_TMP = path.resolve(ROOT, 'dist-spa-tmp');

console.log('=== GYGYT Cloudflare Pages Build ===\n');

// 1. Clean directories
console.log('[1/5] Cleaning directories...');
for (const dir of [DIST, SPA_TMP]) {
  fs.rmSync(dir, { recursive: true, force: true });
}

// 2. Build Vite SPA into temp directory
console.log('[2/5] Building React SPA...');
execSync('npx vite build --outDir="dist-spa-tmp"', {
  cwd: ROOT,
  stdio: 'inherit',
  env: { ...process.env, VITE_BASE_PATH: '/app/' },
});

// 3. Organize dist/
console.log('[3/5] Organizing output...');
fs.mkdirSync(DIST, { recursive: true });

// Move SPA build to dist/app/
if (fs.existsSync(SPA_TMP)) {
  fs.renameSync(SPA_TMP, path.resolve(DIST, 'app'));
  console.log('  - SPA placed in dist/app/');
}

// 4. Copy landing page and APK
console.log('[4/5] Copying landing page and APK...');

if (fs.existsSync(path.resolve(LANDING, 'index.html'))) {
  fs.copyFileSync(path.resolve(LANDING, 'index.html'), path.resolve(DIST, 'index.html'));
  console.log('  - Landing page copied to dist/index.html');
} else {
  // Fallback: redirect to SPA
  fs.writeFileSync(path.resolve(DIST, 'index.html'),
    '<!DOCTYPE html><html lang="hu"><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0;url=/app/"><title>GYGYT Tekerés</title></head><body></body></html>');
}

if (fs.existsSync(path.resolve(LANDING, 'downloads'))) {
  fs.cpSync(path.resolve(LANDING, 'downloads'), path.resolve(DIST, 'downloads'), { recursive: true });
  console.log('  - APK files copied to dist/downloads/');
}

// 5. Create Cloudflare Pages _redirects
console.log('[5/5] Creating _redirects file...');
const redirects = [
  '# Cloudflare Pages _redirects for GYGYT',
  '# SPA fallback: any /app/* path serves /app/index.html',
  '/app/* /app/index.html 200',
].join('\n');
fs.writeFileSync(path.resolve(DIST, '_redirects'), redirects);
console.log('  - _redirects created');

// Cleanup temp
fs.rmSync(SPA_TMP, { recursive: true, force: true });

// Summary
console.log('\n=== Build complete! ===');
console.log(`Output: ${DIST}\n`);

function printDir(dir, prefix) {
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const p = path.join(dir, item.name);
      if (item.isDirectory()) {
        console.log(`${prefix} ${item.name}/`);
        printDir(p, prefix + '  ');
      } else {
        const size = fs.statSync(p).size;
        const s = size > 1024 ? `${(size / 1024).toFixed(1)} KB` : `${size} B`;
        console.log(`${prefix} ${item.name} (${s})`);
      }
    }
  } catch {}
}
printDir(DIST, '');
