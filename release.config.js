export default {
  branches: [
    'main',
    {
      name: 'development',
      prerelease: 'rc',
    },
  ],

  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
        releaseRules: [
          { type: 'feat', release: 'minor' },
          { type: 'fix', release: 'patch' },
          { type: 'perf', release: 'patch' },

          // ignore everything else
          { type: 'docs', release: false },
          { type: 'style', release: false },
          { type: 'chore', release: false },
          { type: 'refactor', release: false },
          { type: 'test', release: false },
          { type: 'build', release: false },
          { type: 'ci', release: false },
        ],
      },
    ],

    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        presetConfig: {
          types: [
            { type: 'feat', section: '✨ Features', hidden: false },
            { type: 'fix', section: '🐛 Bug Fixes', hidden: false },
            { type: 'perf', section: '⚡ Performance Improvements', hidden: false },

            // hide unwanted types
            { type: 'docs', hidden: true },
            { type: 'style', hidden: true },
            { type: 'chore', hidden: true },
            { type: 'refactor', hidden: true },
            { type: 'test', hidden: true },
            { type: 'build', hidden: true },
            { type: 'ci', hidden: true },
          ],
        },
      },
    ],

    '@semantic-release/changelog',

    ['@semantic-release/npm', { npmPublish: false }],

    [
      '@semantic-release/exec',
      {
        prepareCmd:
          'node scripts/update-versions.js ${nextRelease.version} && npm run build && npm run package',
      },
    ],

    [
      '@semantic-release/git',
      {
        assets: [
          'package.json',
          'package-lock.json',
          'frontend/package.json',
          'frontend/package-lock.json',
          'backend/package.json',
          'backend/package-lock.json',
          'electron/package.json',
          'electron/package-lock.json',
          'CHANGELOG.md',
        ],
        message: 'chore(release): ${nextRelease.version} [skip ci]',
      },
    ],

    [
      '@semantic-release/github',
      {
        assets: [{ path: 'electron/release/*.exe', label: 'Windows Installer' }],
      },
    ],
  ],
};
