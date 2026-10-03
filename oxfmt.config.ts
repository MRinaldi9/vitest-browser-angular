import { defineConfig } from 'oxfmt';

export default defineConfig({
  singleQuote: true,
  arrowParens: 'avoid',
  ignorePatterns: ['.changeset/*', '*.md'],
  sortImports: true,
  jsdoc: true,
});
