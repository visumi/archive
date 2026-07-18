import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const outputDirectory = resolve(root, 'public/social');
await mkdir(outputDirectory, { recursive: true });

const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#ffffff"/>
  <rect x="54" y="56" width="18" height="18" fill="#9c1650"/>
  <text x="54" y="330" fill="#282329" font-family="Arial, Helvetica, sans-serif" font-size="154" font-weight="600" letter-spacing="-8">ARCHIVE</text>
  <line x1="54" y1="400" x2="1146" y2="400" stroke="#d8d1d5"/>
  <text x="54" y="442" fill="#625a61" font-family="Arial, Helvetica, sans-serif" font-size="28">A personal photographic collection by Vinicius Isumi</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(resolve(outputDirectory, 'archive.png'));
console.log('Generated institutional social card.');

