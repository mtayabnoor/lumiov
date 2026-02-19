import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const version = process.argv[2];

if (!version) {
  console.error('Please provide a version number.');
  process.exit(1);
}

const packages = [
  'frontend/package.json',
  'backend/package.json',
  'electron/package.json',
];

packages.forEach((relPath) => {
  const fullPath = path.resolve(__dirname, '..', relPath);
  if (fs.existsSync(fullPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      pkg.version = version;
      fs.writeFileSync(fullPath, JSON.stringify(pkg, null, 2) + '\n');
      console.log(`Updated ${relPath} to ${version}`);
    } catch (err) {
      console.error(`Error updating ${relPath}:`, err.message);
    }
  } else {
    console.warn(`File not found: ${fullPath}`);
  }
});
