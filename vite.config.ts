import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { defineConfig } from 'vite';
import archive from './content/collections.json';
import type { ArchiveManifest } from './src/types';

const root = dirname(fileURLToPath(import.meta.url));
const typedArchive = archive as ArchiveManifest;

const albumEntries = Object.fromEntries(
  typedArchive.collections.map((collection) => [
    `collections/${collection.slug}/index`,
    resolve(root, `.generated/routes/collections/${collection.slug}/index.html`),
  ]),
);

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        home: resolve(root, 'index.html'),
        ...albumEntries,
      },
    },
  },
});
