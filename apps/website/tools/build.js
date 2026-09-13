/**
 * Build script to generate static HTML distribution from the Worker renderer
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderFullWebsite } from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, '..', 'dist');

async function build() {
  console.log('[Website Build] Generating static distribution files in apps/website/dist...');
  await fs.mkdir(distDir, { recursive: true });

  const html = renderFullWebsite();
  await fs.writeFile(path.join(distDir, 'index.html'), html, 'utf8');

  const robots = "User-agent: *\nAllow: /\nSitemap: https://operon.dev/sitemap.xml\n";
  await fs.writeFile(path.join(distDir, 'robots.txt'), robots, 'utf8');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://operon.dev/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>https://operon.dev/#downloads</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>https://operon.dev/#pricing</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
</urlset>`;
  await fs.writeFile(path.join(distDir, 'sitemap.xml'), sitemap, 'utf8');

  const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <polygon points="16,2 29,9.5 29,22.5 16,30 3,22.5 3,9.5" fill="#121518" stroke="#38BDF8" stroke-width="2.5"/>
  <circle cx="16" cy="16" r="3.5" fill="#38BDF8"/>
</svg>`;
  await fs.writeFile(path.join(distDir, 'favicon.svg'), faviconSvg, 'utf8');

  console.log('[Website Build] Static distribution generated successfully.');
}

build().catch(err => {
  console.error('[Website Build] Fatal error:', err);
  process.exit(1);
});
