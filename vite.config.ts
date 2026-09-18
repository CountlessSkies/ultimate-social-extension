import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: 'src/social-all-in-one.ts',
      formats: ['iife'],
      name: 'SocialAllInOne',
      fileName: () => 'social-all-in-one.bundle.js',
    },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
