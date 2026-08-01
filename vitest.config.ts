import angular from '@analogjs/vite-plugin-angular';
import { playwright } from '@vitest/browser-playwright';
import { fileURLToPath } from 'node:url';
import { defaultExclude, defineConfig } from 'vitest/config';

const toBool = (value: string | undefined): boolean => {
  if (value === undefined) return false;
  return value !== '' && value !== '0' && value.toLowerCase() !== 'false';
};

const isHeadless = toBool(process.env.VITEST_VSCODE) || toBool(process.env.CI);

export default defineConfig({
  plugins: [angular({ tsconfig: './tsconfig.test.json', fastCompile: true })],
  resolve: {
    alias: [
      {
        find: '@wismaz/vitest-browser-angular/pure',
        replacement: fileURLToPath(new URL('./dist/pure.mjs', import.meta.url)),
      },
      {
        find: '@wismaz/vitest-browser-angular',
        replacement: fileURLToPath(new URL('./dist/index.mjs', import.meta.url)),
      },
    ],
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: { label: 'zone', color: 'red' },
          setupFiles: ['./test/vitest-zones-setup.ts'],
          exclude: [...defaultExclude, '**/zoneless.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: { label: 'zoneless', color: 'magenta' },
          setupFiles: ['./test/vitest-zoneless-setup.ts'],
          include: ['**/zoneless.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: { label: 'types', color: 'blue' },
          include: [],
          typecheck: {
            enabled: true,
            tsconfig: './tsconfig.test.json',
          },
        },
      },
    ],
    globals: true,
    watch: true,
    browser: {
      enabled: true,
      provider: playwright(),
      headless: isHeadless,
      instances: [{ browser: 'chromium' }],
    },
  },
});
