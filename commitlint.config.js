export default {
  extends: ['@commitlint/config-conventional'],
  ignores: [(commit) => commit.includes('Signed-off-by: dependabot[bot]')],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation changes
        'style', // Code style changes (formatting, missing semi-colons, etc)
        'refactor', // Code refactoring
        'perf', // Performance improvements
        'test', // Adding or updating tests
        'build', // Build system changes
        'ci', // CI/CD changes
        'chore', // Other changes that don't modify src or test files
        'revert', // Revert a previous commit
      ],
    ],
    'subject-case': [2, 'always', 'sentence-case'],
  },
};
