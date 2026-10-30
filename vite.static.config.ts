import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { copyFileSync } from 'node:fs';
// Keep a single source brand asset while supporting both dev and static builds.
copyFileSync('public/airweave-logo.png', 'static-site/public/airweave-logo.png');
export default defineConfig({
  root: 'static-site', base: './',
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  plugins: [react(), { name: 'copy-brand-logo', closeBundle() { copyFileSync('docs/STATIC-DEPLOYMENT.md', 'dist-static/DEPLOYMENT.md'); } }],
  build: { outDir: '../dist-static', emptyOutDir: true },
});
