import { defineConfig } from 'oxfmt';

export default defineConfig({
  singleQuote: true,
  arrowParens: 'avoid',
  jsdoc: true,
  ignorePatterns: ['.changeset/*', '.vscode/*', '*.md'],
});
