export type Photo = {
  id: string;
  file: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
};

export type Collection = {
  slug: string;
  title: string;
  date: string;
  description?: string;
  cover: string;
  entries: Photo[];
};

export type ArchiveManifest = {
  collections: Collection[];
};
