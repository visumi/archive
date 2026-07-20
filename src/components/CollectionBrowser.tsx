import { useEffect, useState } from 'react';
import { archive, getEntrySources } from '../lib/archive';
import type { Collection, Photo } from '../types';
import { ArchiveMark } from './ArchiveMark';
import CircularGallery, { type CircularGalleryItem } from './CircularGallery';
import { DomeGallery, type DomeGalleryImage } from './DomeGallery';
import LightRays from './LightRays';
import { Lightbox } from './Lightbox';

function coverFor(collection: Collection) {
  return collection.entries.find((photo) => photo.id === collection.cover) ?? collection.entries[0];
}

function collectionItems(collections: Collection[]): CircularGalleryItem[] {
  return collections.flatMap((collection) => {
    const cover = coverFor(collection);
    if (!cover) return [];
    return [{
      image: getEntrySources(collection, cover).fallback,
      text: `${collection.title}\n${collection.date.match(/\b\d{4}\b/)?.[0] ?? collection.date}`,
    }];
  });
}

function photoItems(collection: Collection): CircularGalleryItem[] {
  return collection.entries.map((photo, index) => ({
    image: getEntrySources(collection, photo).fallback,
    text: (index + 1).toString().padStart(2, '0'),
  }));
}

function domeGalleryItems(items: CircularGalleryItem[]): DomeGalleryImage[] {
  return items.map((item) => {
    const [title, subtitle] = item.text.split('\n');
    return { src: item.image, alt: item.text.replace('\n', ' '), title, subtitle };
  });
}

function useMobileGallery() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 640px)').matches);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 640px)');
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return isMobile;
}

export function CollectionBrowser() {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const collections = archive.collections;
  const isMobileGallery = useMobileGallery();
  const collectionsGalleryItems = collectionItems(collections);

  if (!collection) {
    return (
      <section className="collection-browser" aria-label="Seleção de coleções">
        <ArchiveMark />
        <LightRays className="collection-browser__rays" raysOrigin="top-center" raysColor="#f4f4f5" raysSpeed={0.45} lightSpread={0.84} rayLength={1.32} fadeDistance={0.98} saturation={0} followMouse={false} mouseInfluence={0} noiseAmount={0} distortion={0} />
        {isMobileGallery ? (
          <DomeGallery images={domeGalleryItems(collectionsGalleryItems)} onSelect={(index) => setCollection(collections[index] ?? null)} />
        ) : (
          <CircularGallery
            items={collectionsGalleryItems}
            bend={3}
            borderRadius={0.05}
            scrollEase={0.05}
            wheelEnabled={false}
            onSelect={(index) => setCollection(collections[index] ?? null)}
          />
        )}
      </section>
    );
  }

  const photos = photoItems(collection);
  return (
    <section className="collection-browser collection-browser--detail" aria-label={`Galeria ${collection.title}`}>
      <header className="collection-browser__header">
        <button className="collection-browser__back" type="button" onClick={() => setCollection(null)}>Voltar</button>
        <div><h2>{collection.title}</h2><p>{collection.date}</p></div>
        <ArchiveMark />
      </header>
      <LightRays className="collection-browser__rays" raysOrigin="top-center" raysColor="#f4f4f5" raysSpeed={0.45} lightSpread={0.84} rayLength={1.32} fadeDistance={0.98} saturation={0} followMouse={false} mouseInfluence={0} noiseAmount={0} distortion={0} />
      {isMobileGallery ? (
        <DomeGallery images={domeGalleryItems(photos)} onSelect={(index) => setSelectedPhoto(collection.entries[index] ?? null)} />
      ) : (
        <CircularGallery
          items={photos}
          bend={3}
          borderRadius={0.05}
          scrollEase={0.05}
          wheelEnabled={false}
          onSelect={(index) => setSelectedPhoto(collection.entries[index] ?? null)}
        />
      )}
      {selectedPhoto && <Lightbox collection={collection} photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} onSelect={setSelectedPhoto} />}
    </section>
  );
}
