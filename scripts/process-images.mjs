import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { basename, extname, resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const manifestPath = resolve(root, 'content/collections.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const widths = [720, 1440, 2400];

for (const collection of manifest.collections) {
  const originalDirectory = resolve(root, `private/originals/${collection.slug}`);
  const outputDirectory = resolve(root, `public/media/${collection.slug}`);
  const socialDirectory = resolve(root, 'public/social/collections');
  await mkdir(outputDirectory, { recursive: true });
  await mkdir(socialDirectory, { recursive: true });

  for (const photo of collection.entries) {
    const input = resolve(originalDirectory, photo.file);
    try { await access(input, constants.R_OK); } catch { throw new Error(`Missing original: private/originals/${collection.slug}/${photo.file}`); }
    const image = sharp(input).rotate();
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) throw new Error(`Could not read dimensions for ${photo.file}`);
    photo.width = metadata.width;
    photo.height = metadata.height;
    for (const width of widths) {
      const output = resolve(outputDirectory, `${photo.id}-${width}`);
      await image.clone().resize({ width, withoutEnlargement: true }).avif({ quality: 82 }).toFile(`${output}.avif`);
      await image.clone().resize({ width, withoutEnlargement: true }).jpeg({ quality: 90, progressive: true, mozjpeg: true }).toFile(`${output}.jpg`);
    }
  }

  const cover = collection.entries.find((photo) => photo.id === collection.cover);
  if (cover) {
    const coverInput = resolve(originalDirectory, cover.file);
    await sharp(coverInput).rotate().resize(1200, 630, { fit: 'contain', background: '#1d1c1d' }).jpeg({ quality: 88, progressive: true }).toFile(resolve(root, `public/social/collections/${collection.slug}.jpg`));
  }
}

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Prepared responsive derivatives for ${manifest.collections.length} collection(s).`);
