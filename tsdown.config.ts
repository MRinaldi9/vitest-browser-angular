import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/*.ts'],
  format: 'esm',
  outDir: './dist',
  minify: true,
  exports: true,
  dts: true,
});
