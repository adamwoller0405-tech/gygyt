import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

console.log('=== GYGYT Full Deploy (web + APK) ===\n');

// 0. Version
execSync('node scripts/version.mjs', { cwd: ROOT, stdio: 'inherit' });

// 1. Build for Android (base /)
console.log('\n[1/6] Building web app for Android...');
execSync('npx vite build', { cwd: ROOT, stdio: 'inherit', env: { ...process.env, VITE_BASE_PATH: '/' } });
console.log('  - Built with base path "/"');

// 2. Sync to Android
console.log('\n[2/6] Syncing to Android...');
execSync('npx cap sync android', { cwd: ROOT, stdio: 'inherit' });

// 3. Build APK
console.log('\n[3/6] Building APK...');
execSync('gradlew.bat assembleRelease', { cwd: path.resolve(ROOT, 'android'), stdio: 'inherit' });

// 4. Copy APK to landing
console.log('\n[4/6] Copying APK...');
fs.cpSync(
  path.resolve(ROOT, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
  path.resolve(ROOT, 'landing', 'downloads', 'gygyt.apk')
);
console.log('  - APK copied to landing/downloads/');

// 5. Build for Cloudflare (base /app/)
console.log('\n[5/6] Building web app for Cloudflare...');
execSync('node scripts/build-deploy.mjs', { cwd: ROOT, stdio: 'inherit' });

// 6. Git
console.log('\n[6/6] Staging all changes...');
execSync('git add -A', { cwd: ROOT, stdio: 'inherit' });

console.log('\n=== Full deploy ready! ===');
const verContent = fs.readFileSync(path.resolve(ROOT, 'src', 'lib', 'version.ts'), 'utf8');
const verMatch = verContent.match(/'([^']+)'/);
const ver = verMatch ? verMatch[1] : '?';
console.log(`Run: git commit -m "update v${ver}" && git push origin master`);
