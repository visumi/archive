import { useEffect, useId, useRef } from 'react';
import { adjacentPhoto } from '../lib/archive';
import type { Collection, Photo } from '../types';
import { PhotoImage } from './PhotoImage';

type LightboxProps = {
  collection: Collection;
  photo: Photo;
  onClose: () => void;
  onSelect: (photo: Photo) => void;
};

export function Lightbox({ collection, photo, onClose, onSelect }: LightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const photoIndex = collection.entries.findIndex((entry) => entry.id === photo.id);
  const photoNumber = (photoIndex + 1).toString().padStart(2, '0');
  const photoTotal = collection.entries.length.toString().padStart(2, '0');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') onSelect(adjacentPhoto(collection.entries, photo.id, -1) ?? photo);
      if (event.key === 'ArrowRight') onSelect(adjacentPhoto(collection.entries, photo.id, 1) ?? photo);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [collection.entries, onClose, onSelect, photo]);

  const previous = adjacentPhoto(collection.entries, photo.id, -1);
  const next = adjacentPhoto(collection.entries, photo.id, 1);

  return (
    <dialog ref={dialogRef} className="lightbox" aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <div className="lightbox__topline">
        <p id={titleId}><span>ARCHIVE</span><strong>{collection.title}</strong></p>
        <span className="lightbox__counter" aria-label={`Fotografia ${photoNumber} de ${photoTotal}`}>{photoNumber} / {photoTotal}</span>
        <button type="button" className="lightbox__close" onClick={onClose} aria-label="Fechar visualização">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m5 5 14 14M19 5 5 19" /></svg>
        </button>
      </div>
      <div className="lightbox__stage">
        <button type="button" className="lightbox__edge lightbox__edge--previous" onClick={() => previous && onSelect(previous)} aria-label="Fotografia anterior">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m14.5 5-7 7 7 7" /></svg>
        </button>
        <figure key={photo.id}>
          <PhotoImage collection={collection} photo={photo} eager />
          {photo.caption && <figcaption>{photo.caption}</figcaption>}
        </figure>
        <button type="button" className="lightbox__edge lightbox__edge--next" onClick={() => next && onSelect(next)} aria-label="Próxima fotografia">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m9.5 5 7 7-7 7" /></svg>
        </button>
      </div>
      <p className="lightbox__hint" aria-hidden="true">← / → NAVEGAR&nbsp;&nbsp;&nbsp; ESC FECHAR</p>
    </dialog>
  );
}
