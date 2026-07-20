import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';

const useMedia = (queries: string[], values: number[], defaultValue: number): number => {
  const get = () => values[queries.findIndex((query) => matchMedia(query).matches)] ?? defaultValue;
  const [value, setValue] = useState<number>(get);

  useEffect(() => {
    const handler = () => setValue(get());
    const mediaQueries = queries.map((query) => matchMedia(query));
    mediaQueries.forEach((query) => query.addEventListener('change', handler));
    return () => mediaQueries.forEach((query) => query.removeEventListener('change', handler));
  }, [queries, values, defaultValue]);

  return value;
};

const useMeasure = <T extends HTMLElement>() => {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => setSize(entry.contentRect));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
};

const preloadImages = async (urls: string[]): Promise<void> => {
  await Promise.all(urls.map((src) => new Promise<void>((resolve) => {
    const image = new Image();
    image.src = src;
    image.onload = image.onerror = () => resolve();
  })));
};

export type MasonryItem = {
  id: string;
  img: string;
  url: string;
  height: number;
  alt: string;
};

type GridItem = MasonryItem & { x: number; y: number; w: number; h: number };

type MasonryProps = {
  items: MasonryItem[];
  ease?: string;
  duration?: number;
  stagger?: number;
  animateFrom?: 'bottom' | 'top' | 'left' | 'right' | 'center' | 'random';
  scaleOnHover?: boolean;
  hoverScale?: number;
  blurToFocus?: boolean;
  colorShiftOnHover?: boolean;
  onSelect?: (item: MasonryItem) => void;
};

export function Masonry({
  items,
  ease = 'power3.out',
  duration = 0.6,
  stagger = 0.05,
  animateFrom = 'bottom',
  scaleOnHover = true,
  hoverScale = 0.95,
  blurToFocus = true,
  colorShiftOnHover = false,
  onSelect,
}: MasonryProps) {
  const columns = useMedia(
    ['(min-width:1500px)', '(min-width:1000px)', '(min-width:600px)', '(min-width:400px)'],
    [5, 4, 3, 2],
    1,
  );
  const [containerRef, { width }] = useMeasure<HTMLDivElement>();
  const [imagesReady, setImagesReady] = useState(false);
  const hasMounted = useRef(false);

  const getInitialPosition = (item: GridItem) => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return { x: item.x, y: item.y };

    let direction = animateFrom;
    if (animateFrom === 'random') {
      const directions = ['top', 'bottom', 'left', 'right'] as const;
      direction = directions[Math.floor(Math.random() * directions.length)];
    }

    switch (direction) {
      case 'top': return { x: item.x, y: -200 };
      case 'bottom': return { x: item.x, y: window.innerHeight + 200 };
      case 'left': return { x: -200, y: item.y };
      case 'right': return { x: window.innerWidth + 200, y: item.y };
      case 'center': return { x: containerRect.width / 2 - item.w / 2, y: containerRect.height / 2 - item.h / 2 };
      default: return { x: item.x, y: item.y + 100 };
    }
  };

  useEffect(() => {
    setImagesReady(false);
    preloadImages(items.map((item) => item.img)).then(() => setImagesReady(true));
  }, [items]);

  const grid = useMemo<GridItem[]>(() => {
    if (!width) return [];

    const columnHeights = new Array(columns).fill(0);
    const gap = 16;
    const columnWidth = (width - (columns - 1) * gap) / columns;

    return items.map((item) => {
      const column = columnHeights.indexOf(Math.min(...columnHeights));
      const height = item.height / 2;
      const positioned = { ...item, x: column * (columnWidth + gap), y: columnHeights[column], w: columnWidth, h: height };
      columnHeights[column] += height + gap;
      return positioned;
    });
  }, [columns, items, width]);

  useLayoutEffect(() => {
    if (!imagesReady || !grid.length) return;

    grid.forEach((item, index) => {
      const selector = `[data-key="${item.id}"]`;
      const animation = { x: item.x, y: item.y, width: item.w, height: item.h };

      if (!hasMounted.current) {
        const start = getInitialPosition(item);
        gsap.fromTo(selector, { opacity: 0, x: start.x, y: start.y, width: item.w, height: item.h, ...(blurToFocus && { filter: 'blur(10px)' }) }, {
          opacity: 1,
          ...animation,
          ...(blurToFocus && { filter: 'blur(0px)' }),
          duration: 0.8,
          ease: 'power3.out',
          delay: index * stagger,
        });
      } else {
        gsap.to(selector, { ...animation, duration, ease, overwrite: 'auto' });
      }
    });

    hasMounted.current = true;
  }, [animateFrom, blurToFocus, duration, ease, grid, imagesReady, stagger]);

  const handleMouseEnter = (id: string, element: HTMLElement) => {
    if (scaleOnHover) gsap.to(`[data-key="${id}"]`, { scale: hoverScale, duration: 0.3, ease: 'power2.out' });
    if (colorShiftOnHover) gsap.to(element.querySelector('.color-overlay'), { opacity: 0.3, duration: 0.3 });
  };

  const handleMouseLeave = (id: string, element: HTMLElement) => {
    if (scaleOnHover) gsap.to(`[data-key="${id}"]`, { scale: 1, duration: 0.3, ease: 'power2.out' });
    if (colorShiftOnHover) gsap.to(element.querySelector('.color-overlay'), { opacity: 0, duration: 0.3 });
  };

  return (
    <div ref={containerRef} className="masonry">
      {grid.map((item) => (
        <button
          className="masonry__item"
          key={item.id}
          data-key={item.id}
          type="button"
          aria-label={`Abrir fotografia: ${item.alt}`}
          style={{ willChange: 'transform, width, height, opacity' }}
          onClick={() => onSelect ? onSelect(item) : window.open(item.url, '_blank', 'noopener')}
          onMouseEnter={(event) => handleMouseEnter(item.id, event.currentTarget)}
          onMouseLeave={(event) => handleMouseLeave(item.id, event.currentTarget)}
        >
          <span className="masonry__surface" style={{ backgroundImage: `url(${item.img})` }} role="img" aria-label={item.alt}>
            {colorShiftOnHover && <span className="color-overlay" />}
          </span>
        </button>
      ))}
    </div>
  );
}
