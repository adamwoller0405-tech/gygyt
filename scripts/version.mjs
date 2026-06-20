import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Get commit count as build number
let buildNum = '1';
try {
  buildNum = execSync('git rev-list --count HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
} catch {}

const version = `2.${buildNum}.0`;

fs.writeFileSync(
  path.resolve(ROOT, 'src', 'lib', 'version.ts'),
  `export const APP_VERSION = '${version}';\n`
);

console.log(`  - Version generated: ${version}`);
