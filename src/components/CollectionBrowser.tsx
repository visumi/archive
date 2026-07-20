import { useEffect, useState } from 'react';
import { archive, getEntrySources } from '../lib/archive';
import type { Collection, Photo } from '../types';
import { ArchiveMark } from './ArchiveMark';
import CircularGallery, { type CircularGalleryItem } from './CircularGallery';
import { DomeGallery, type DomeGalleryImage } from './DomeGallery';
import LightRays from './LightRays';
import { Lightbox } from './Lightbox';
import { Masonry } from './Masonry';

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

  const collectionYear = collection.date.match(/\b\d{4}\b/)?.[0] ?? collection.date;
  const masonryItems = collection.entries.map((photo) => ({
    id: photo.id,
    img: getEntrySources(collection, photo).fallback,
    url: `#${photo.id}`,
    height: Math.round(260 * (photo.height / photo.width)),
    alt: photo.alt,
  }));
  return (
    <section className="collection-browser collection-browser--detail" aria-label={`Galeria ${collection.title}`}>
      <header className="collection-browser__header">
        <button className="collection-browser__back" type="button" aria-label="Voltar às coleções" onClick={() => setCollection(null)}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m14.5 5-7 7 7 7" /></svg>
        </button>
        <div className="collection-browser__identity">
          <ArchiveMark />
          <h2>{collection.title}</h2>
          <p>{collectionYear}</p>
        </div>
      </header>
      <LightRays className="collection-browser__rays" raysOrigin="top-center" raysColor="#f4f4f5" raysSpeed={0.45} lightSpread={0.84} rayLength={1.32} fadeDistance={0.98} saturation={0} followMouse={false} mouseInfluence={0} noiseAmount={0} distortion={0} />
      <div className="collection-browser__masonry" aria-label={`Fotografias de ${collection.title}`}>
        <Masonry
          items={masonryItems}
          animateFrom="bottom"
          blurToFocus
          colorShiftOnHover={false}
          onSelect={(item) => setSelectedPhoto(collection.entries.find((photo) => photo.id === item.id) ?? null)}
        />
      </div>
      {selectedPhoto && <Lightbox collection={collection} photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} onSelect={setSelectedPhoto} />}
    </section>
  );
}
