import manifest from '../../content/collections.json';
import type { ArchiveManifest, Collection, Photo } from '../types';

export const archive = manifest as ArchiveManifest;

export function collectionFromPath(pathname: string): Collection | undefined {
  const match = pathname.replace(/\/+$/, '').match(/\/collections\/([^/]+)$/);
  return match ? archive.collections.find((collection) => collection.slug === match[1]) : undefined;
}

export function getEntrySources(collection: Collection, photo: Photo) {
  const base = `/media/${collection.slug}/${photo.id}`;
  return {
    avif: `${base}-720.avif 720w, ${base}-1440.avif 1440w, ${base}-2400.avif 2400w`,
    jpeg: `${base}-720.jpg 720w, ${base}-1440.jpg 1440w, ${base}-2400.jpg 2400w`,
    fallback: `${base}-1440.jpg`,
  };
}

export function adjacentPhoto(entries: Photo[], currentId: string, direction: -1 | 1) {
  const currentIndex = entries.findIndex((photo) => photo.id === currentId);
  if (currentIndex === -1) return undefined;
  return entries[(currentIndex + direction + entries.length) % entries.length];
}
