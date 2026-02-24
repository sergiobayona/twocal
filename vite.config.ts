import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TwoCal',
      fileName: 'twocal',
      formats: ['es', 'umd'],
    },
    minify: 'esbuild',
    sourcemap: true,
  },
  plugins: [
    dts({ rollupTypes: true }),
  ],
});
