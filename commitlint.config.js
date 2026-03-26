module.exports = {
  extends: ['@commitlint/config-angular'],
  rules: {
    modami_RULE: [2, 'always'],
    'subject-case': [
      2,
      'always',
      [
        'sentence-case',
        'start-case',
        'pascal-case',
        'upper-case',
        'lower-case',
      ],
    ],
    'scope-enum': [1, 'always'],
    'type-enum': [
      2,
      'always',
      [
        'build',
        'ci',
        'docs',
        'feat',
        'fix',
        'refactor',
        'perf',
        'test',
        'style',
      ],
    ],
  },
  plugins: [
    {
      rules: {
        modami_RULE: (input) => {
          const { type, subject } = input;
          if (['build', 'style', 'docs'].includes(type)) {
            return [true, ''];
          }
          return [
            /^(BEIN-\d+)\s(.+)$/.test(subject),
            `Commit message must include a modami task id and description: "<bein_task_id> <description>". Example: feat: BEIN-13110 add husky\nSee more: https://app.clickup.com/3649385/v/dc/3fbv9-27427/3fbv9-79965`,
          ];
        },
        'scope-enum': ({ scope }) => {
          return [
            !!scope,
            `Scope should not empty. Because it describes the area or component of the codebase that is affected by the changes made in a particular commit`,
          ];
        },
      },
    },
  ],
};
