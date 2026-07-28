import { fileURLToPath } from 'node:url';
import angular from '@analogjs/vite-plugin-angular';
import { playwright } from '@vitest/browser-playwright';
import { defaultExclude, defineConfig } from 'vitest/config';

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
    ],
    globals: true,
    watch: true,
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
});
