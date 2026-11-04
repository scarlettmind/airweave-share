import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const result = await build({
  configFile: false, root, publicDir: false,
  resolve: { alias: { '@': root } }, plugins: [react()],
  define: { 'process.env.NODE_ENV': '"production"' },
  build: { write: false, minify: true, cssCodeSplit: false,
    lib: { entry: root + 'single-site/main.tsx', name: 'AirweaveShare', formats: ['iife'] },
  },
});
const outputs = (Array.isArray(result) ? result : [result]).flatMap(r => r.output);
const chunks = outputs.filter(o => o.type === 'chunk');
if (chunks.length !== 1 || chunks[0].imports.length || chunks[0].dynamicImports.length) throw new Error('Single HTML must have one self-contained script');
const css = outputs.filter(o => o.type === 'asset' && o.fileName.endsWith('.css')).map(o => o.source).join('\n');
const unexpected = outputs.filter(o => o.type === 'asset' && !o.fileName.endsWith('.css'));
if (unexpected.length || /url\(\s*['"]?(?!data:|#)/i.test(css)) throw new Error('Unexpected external asset');
const config = await readFile(root + 'static-site/public/analytics-config.js', 'utf8');
const safeScript = s => s.replace(/<\/script/gi, '<\\/script');
const html = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>airweave · Share your experience</title>
<!-- Self-contained page. Company Digital team: insert approved GTM/Google tag and consent configuration here. -->
<style>${css.replace(/<\/style/gi, '<\\/style')}</style>
<script>${safeScript(config)}</script></head><body><div id="root"></div><script>${safeScript(chunks[0].code)}</script></body></html>`;
await mkdir(root + 'dist-single', { recursive: true });
await writeFile(root + 'dist-single/index.html', html);
console.log(`Single HTML ready: dist-single/index.html (${Buffer.byteLength(html)} bytes)`);
