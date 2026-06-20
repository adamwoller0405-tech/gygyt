import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

console.log('=== GYGYT Full Deploy (web + APK) ===\n');

// 1. Version
execSync('node scripts/version.mjs', { cwd: ROOT, stdio: 'inherit' });

// 2. Build web app
console.log('\n[1/5] Building web app...');
execSync('npx vite build', { cwd: ROOT, stdio: 'inherit' });

// 3. Sync to Android
console.log('\n[2/5] Syncing to Android...');
execSync('npx cap sync android', { cwd: ROOT, stdio: 'inherit' });

// 4. Build APK
console.log('\n[3/5] Building APK...');
execSync('gradlew.bat assembleRelease', { cwd: path.resolve(ROOT, 'android'), stdio: 'inherit' });

// 5. Copy APK to landing
console.log('\n[4/5] Copying APK...');
fs.cpSync(
  path.resolve(ROOT, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
  path.resolve(ROOT, 'landing', 'downloads', 'gygyt.apk')
);
console.log('  - APK copied to landing/downloads/');

// 6. Build deploy output
console.log('\n[5/5] Building deploy output...');
execSync('node scripts/build-deploy.mjs', { cwd: ROOT, stdio: 'inherit' });

console.log('\n=== Full deploy ready! ===');
console.log('Run: git add . && git commit -m "update" && git push origin master');
