import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/*.ts'],
  format: 'esm',
  outDir: './dist',
  exports: true,
  dts: { build: true },
  publint: true,
  tsconfig: './tsconfig.app.json',
  sourcemap: true,
});
