import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import manifest from '../content/collections.json' with { type: 'json' };
import { validateManifest } from './content-schema.mjs';

const errors = validateManifest(manifest);
if (errors.length) throw new Error(errors.join('\n'));

const root = resolve(import.meta.dirname, '..');
const outputRoot = resolve(root, '.generated/routes');
await rm(outputRoot, { recursive: true, force: true });

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]);

for (const collection of manifest.collections) {
  const output = resolve(outputRoot, `collections/${collection.slug}/index.html`);
  const title = `${collection.title} — ARCHIVE`;
  const description = collection.description || `${collection.title}, a photographic collection by Vinicius Isumi.`;
  const canonical = `https://archive.isumi.com.br/collections/${collection.slug}`;
  const social = `https://archive.isumi.com.br/social/collections/${collection.slug}.jpg`;
  const relativeScript = '../../../../src/main.tsx';
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `<!doctype html>
<html lang="en"><head>
  <meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#ffffff" /><meta name="robots" content="noindex,nofollow" />
  <meta name="description" content="${escapeHtml(description)}" /><link rel="canonical" href="${canonical}" />
  <meta property="og:type" content="website" /><meta property="og:site_name" content="ARCHIVE" />
  <meta property="og:title" content="${escapeHtml(title)}" /><meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${social}" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" /><title>${escapeHtml(title)}</title>
</head><body><div id="root"></div><script type="module" src="${relativeScript}"></script></body></html>\n`);
}
console.log(`Generated ${manifest.collections.length} static collection route(s).`);
