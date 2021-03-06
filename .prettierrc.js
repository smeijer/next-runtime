module.exports = {
  semi: true,
  trailingComma: 'all',
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  overrides: [
    {
      files: '*.html',
      options: {
        printWidth: 120,
      },
    },
    {
      files: '*.mdx',
      options: {
        proseWrap: 'always',
      },
    },
  ],
};
