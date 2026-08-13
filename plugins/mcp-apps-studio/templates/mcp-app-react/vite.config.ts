import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Single-file output keeps `_meta.ui.csp.resourceDomains` empty: every asset is
// inlined, so the View mounts in one fetch with no external origin to allow.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: process.env.INPUT,
    },
  },
});
