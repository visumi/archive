import type { Collection, Photo } from '../types';
import { getEntrySources } from '../lib/archive';

type PhotoImageProps = {
  collection: Collection;
  photo: Photo;
  eager?: boolean;
};

export function PhotoImage({ collection, photo, eager = false }: PhotoImageProps) {
  const sources = getEntrySources(collection, photo);

  if (photo.file.startsWith('/')) {
    return <img src={sources.fallback} alt={photo.alt} width={photo.width} height={photo.height} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} />;
  }

  return (
    <picture>
      <source type="image/avif" srcSet={sources.avif} sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" />
      <source type="image/jpeg" srcSet={sources.jpeg} sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" />
      <img
        src={sources.fallback}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
      />
    </picture>
  );
}
