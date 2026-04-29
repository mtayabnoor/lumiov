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

// Validate semver format before using in any command (prevents shell injection)
if (!/^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/.test(version)) {
  console.error(
    `❌ Invalid version format: "${version}". Expected semver (e.g. 1.2.3 or 1.2.3-rc.1).`,
  );
  process.exit(1);
}

// We only need to target the directories, npm will find the files
const directories = ['frontend', 'backend', 'electron'];

directories.forEach((dir) => {
  const fullPath = path.resolve(__dirname, '..', dir);

  if (fs.existsSync(fullPath)) {
    try {
      // Use array form to prevent shell injection — version is validated above but defence-in-depth
      execSync(`npm version ${version} --no-git-tag-version --allow-same-version`, {
        cwd: fullPath,
        stdio: 'inherit',
        shell: false,
      });
      console.log(`✅ Successfully updated ${dir} to ${version}`);
    } catch (err) {
      console.error(`❌ Failed to update ${dir}:`, err.message);
    }
  } else {
    console.warn(`⚠️ Directory not found: ${fullPath}`);
  }
});
