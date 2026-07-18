import { useState } from 'react';
import type { Collection, Photo } from '../types';
import { ArchiveMark } from './ArchiveMark';
import { Lightbox } from './Lightbox';
import { PhotoImage } from './PhotoImage';

export function CollectionView({ collection }: { collection: Collection }) {
  const [selected, setSelected] = useState<Photo | null>(null);

  const openPhoto = (photo: Photo) => {
    if ('startViewTransition' in document && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.startViewTransition(() => setSelected(photo));
      return;
    }
    setSelected(photo);
  };

  return (
    <main className="collection-page">
      <header className="site-header"><ArchiveMark /><a className="header-link" href="/">Índice</a></header>
      <section className="collection-intro">
        <p className="collection-intro__date">{collection.date}</p>
        <h1>{collection.title}</h1>
        {collection.description && <p className="collection-intro__description">{collection.description}</p>}
        <p className="collection-intro__count">{collection.entries.length.toString().padStart(2, '0')} fotografias</p>
      </section>
      <section className="photo-masonry" aria-label={`Fotografias de ${collection.title}`}>
        {collection.entries.map((photo, index) => (
          <button className="photo-tile" key={photo.id} type="button" onClick={() => openPhoto(photo)}>
            <PhotoImage collection={collection} photo={photo} eager={index < 2} />
            <span className="photo-tile__index" aria-hidden="true">{(index + 1).toString().padStart(2, '0')}</span>
          </button>
        ))}
      </section>
      <footer className="site-footer"><span>© {new Date().getFullYear()} ARCHIVE</span><span>Todos os direitos reservados</span></footer>
      {selected && <Lightbox collection={collection} photo={selected} onClose={() => setSelected(null)} onSelect={setSelected} />}
    </main>
  );
}
