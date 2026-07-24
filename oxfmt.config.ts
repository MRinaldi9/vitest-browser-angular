import { defineConfig } from 'oxfmt';

export default defineConfig({
  singleQuote: true,
  arrowParens: 'avoid',
  ignorePatterns: ['.changeset/*', '.vscode/*', '*.md'],
});
