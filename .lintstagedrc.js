module.exports = {
  '**/*.{js,jsx}': (files) => [`eslint --quiet --fix ${files.join(' ')}`],
  '**/*.{ts,tsx}': (files) => [
    `tsc --noEmit`,
    `eslint --quiet --fix ${files.join(' ')}`,
  ],
  '**/*.{md,js,json,yml,html,css,pcss}': (files) => [
    `prettier --write ${files.join(' ')}`,
  ],
};
