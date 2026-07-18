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

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') onSelect(adjacentPhoto(collection.entries, photo.id, -1) ?? photo);
      if (event.key === 'ArrowRight') onSelect(adjacentPhoto(collection.entries, photo.id, 1) ?? photo);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, [collection.entries, onClose, onSelect, photo]);

  const previous = adjacentPhoto(collection.entries, photo.id, -1);
  const next = adjacentPhoto(collection.entries, photo.id, 1);

  return (
    <dialog ref={dialogRef} className="lightbox" aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <div className="lightbox__topline">
        <p id={titleId}>{collection.title}</p>
        <button type="button" className="lightbox__close" onClick={onClose}>Fechar <span aria-hidden="true">×</span></button>
      </div>
      <div className="lightbox__stage">
        <button type="button" className="lightbox__edge lightbox__edge--previous" onClick={() => previous && onSelect(previous)} aria-label="Fotografia anterior">‹</button>
        <figure>
          <PhotoImage collection={collection} photo={photo} eager />
          {photo.caption && <figcaption>{photo.caption}</figcaption>}
        </figure>
        <button type="button" className="lightbox__edge lightbox__edge--next" onClick={() => next && onSelect(next)} aria-label="Próxima fotografia">›</button>
      </div>
    </dialog>
  );
}
