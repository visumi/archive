import { describe, expect, it } from 'vitest';
import { adjacentPhoto, collectionFromPath, getEntrySources } from './archive';

describe('archive navigation', () => {
  it('does not resolve an absent collection', () => {
    expect(collectionFromPath('/collections/missing')).toBeUndefined();
  });

  it('cycles through photographs in either direction', () => {
    const entries = [
      { id: 'one', file: 'one.jpg', alt: 'One', width: 1, height: 1 },
      { id: 'two', file: 'two.jpg', alt: 'Two', width: 1, height: 1 },
    ];

    expect(adjacentPhoto(entries, 'one', -1)?.id).toBe('two');
    expect(adjacentPhoto(entries, 'two', 1)?.id).toBe('one');
  });

  it('uses a local mock image directly when one is declared', () => {
    const sources = getEntrySources(
      { slug: 'mock', title: 'Mock', date: '2026', cover: 'one', entries: [] },
      { id: 'one', file: '/mock/one.png', alt: 'Mock', width: 1, height: 1 },
    );

    expect(sources.fallback).toBe('/mock/one.png');
  });
});
