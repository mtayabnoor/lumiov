import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const version = process.argv[2];

if (!version) {
  console.error('❌ Please provide a version number.');
  process.exit(1);
}

// We only need to target the directories, npm will find the files
const directories = ['frontend', 'backend', 'electron'];

directories.forEach((dir) => {
  const fullPath = path.resolve(__dirname, '..', dir);

  if (fs.existsSync(fullPath)) {
    try {
      // --no-git-tag-version prevents npm from creating git tags (semantic-release does that)
      // --allow-same-version prevents errors if the version is already set
      execSync(`npm version ${version} --no-git-tag-version --allow-same-version`, {
        cwd: fullPath,
        stdio: 'inherit',
      });
      console.log(`✅ Successfully updated ${dir} to ${version}`);
    } catch (err) {
      console.error(`❌ Failed to update ${dir}:`, err.message);
    }
  } else {
    console.warn(`⚠️ Directory not found: ${fullPath}`);
  }
});
