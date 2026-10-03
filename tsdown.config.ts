import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/index.ts', './src/pure.ts'],
  format: 'esm',
  outDir: './dist',
  exports: true,
  dts: { build: true },
  publint: true,
  tsconfig: './tsconfig.app.json',
});
