import { defineConfig, Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// Vite plugin that stubs CSS imports so vitest doesn't fail on them
const cssStub: Plugin = {
  name: 'css-stub',
  transform(code, id) {
    if (id.endsWith('.css')) {
      return { code: 'export default {}', map: null };
    }
  },
};

export default defineConfig({
  plugins: [react(), cssStub],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{ts,tsx}',
        '**/*.config.{ts,js}',
        '.next/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
