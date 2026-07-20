import { useGesture } from '@use-gesture/react';
import { useEffect, useMemo, useRef, useState } from 'react';

export interface DomeGalleryImage {
  src: string;
  alt: string;
  title: string;
  subtitle?: string;
}

interface DomeGalleryProps {
  images: DomeGalleryImage[];
  onSelect?: (index: number) => void;
  segments?: number;
}

type DomeTile = DomeGalleryImage & { itemIndex: number; x: number; y: number };

const verticalRows = [-3, -1, 1, 3];

function buildTiles(images: DomeGalleryImage[], segments: number): DomeTile[] {
  if (!images.length) return [];
  const horizontalRange = Array.from({ length: segments }, (_, index) => -segments + index * 2);
  return horizontalRange.flatMap((x, columnIndex) => {
    const offset = columnIndex % 2 === 0 ? 0 : 1;
    return verticalRows.map((row, rowIndex) => {
      const itemIndex = (columnIndex * verticalRows.length + rowIndex) % images.length;
      return { ...images[itemIndex], itemIndex, x, y: row + offset };
    });
  });
}

export function DomeGallery({ images, onSelect, segments = 18 }: DomeGalleryProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sphereRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef({ x: 0, y: 0 });
  const startRotationRef = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const gestureAxisRef = useRef<'pending' | 'horizontal' | 'vertical'>('pending');
  const lastDragEndRef = useRef(0);
  const inertiaFrameRef = useRef<number | null>(null);
  const [radius, setRadius] = useState(540);
  const tiles = useMemo(() => buildTiles(images, segments), [images, segments]);

  const applyTransform = (x: number, y: number) => {
    if (!sphereRef.current) return;
    sphereRef.current.style.transform = `translateZ(${-radius}px) rotateX(${x}deg) rotateY(${y}deg)`;
  };

  useEffect(() => {
    applyTransform(rotationRef.current.x, rotationRef.current.y);
  }, [radius]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setRadius(Math.round(Math.max(400, Math.min(500, Math.min(width, height) * 1.2))));
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => {
    if (inertiaFrameRef.current) window.cancelAnimationFrame(inertiaFrameRef.current);
  }, []);

  useGesture(
    {
      onDragStart: ({ event }) => {
        if (inertiaFrameRef.current) window.cancelAnimationFrame(inertiaFrameRef.current);
        draggingRef.current = false;
        movedRef.current = false;
        gestureAxisRef.current = 'pending';
        startRotationRef.current = { ...rotationRef.current };
      },
      onDrag: ({ event, movement: [movementX, movementY], velocity: [velocityX], direction: [directionX], last }) => {
        if (gestureAxisRef.current === 'pending' && Math.abs(movementX) + Math.abs(movementY) > 8) {
          gestureAxisRef.current = Math.abs(movementX) > Math.abs(movementY) ? 'horizontal' : 'vertical';
          if (gestureAxisRef.current === 'horizontal') draggingRef.current = true;
        }

        if (gestureAxisRef.current === 'vertical') {
          movedRef.current = true;
          if (last) {
            draggingRef.current = false;
            lastDragEndRef.current = performance.now();
            window.setTimeout(() => {
              movedRef.current = false;
            }, 140);
          }
          return;
        }

        if (gestureAxisRef.current !== 'horizontal') return;
        event.stopPropagation();
        if (event.cancelable) event.preventDefault();
        movedRef.current = true;
        const nextX = startRotationRef.current.x;
        const nextY = startRotationRef.current.y + movementX / 19;
        rotationRef.current = { x: nextX, y: nextY };
        applyTransform(nextX, nextY);

        if (!last) return;
        draggingRef.current = false;
        if (movedRef.current) {
          lastDragEndRef.current = performance.now();
          window.setTimeout(() => {
            movedRef.current = false;
          }, 140);
        }
        let xVelocity = velocityX * directionX * 1.15;
        const animateInertia = () => {
          xVelocity *= 0.92;
          if (Math.abs(xVelocity) < 0.012) {
            inertiaFrameRef.current = null;
            return;
          }
          const inertiaX = rotationRef.current.x;
          const inertiaY = rotationRef.current.y + xVelocity;
          rotationRef.current = { x: inertiaX, y: inertiaY };
          applyTransform(inertiaX, inertiaY);
          inertiaFrameRef.current = window.requestAnimationFrame(animateInertia);
        };
        if (movedRef.current) inertiaFrameRef.current = window.requestAnimationFrame(animateInertia);
      }
    },
    { target: stageRef, eventOptions: { passive: false } }
  );

  const degreesPerSegment = 360 / segments / 2;
  const tileWidth = ((Math.PI * radius * 2) / segments) * 0.74;
  const tileHeight = tileWidth;

  return (
    <section ref={rootRef} className="dome-gallery" aria-label="Galeria em cúpula">
      <div ref={stageRef} className="dome-gallery__stage">
        <div ref={sphereRef} className="dome-gallery__sphere">
          {tiles.map((tile, index) => (
            <button
              key={`${tile.x}-${tile.y}-${index}`}
              className="dome-gallery__tile"
              type="button"
              aria-label={`Abrir ${tile.alt}`}
              style={{
                width: tileWidth,
                height: tileHeight,
                transform: `translate(-50%, -50%) rotateY(${degreesPerSegment * tile.x}deg) rotateX(${degreesPerSegment * tile.y}deg) translateZ(${radius}px)`
              }}
              onClick={(event) => {
                event.stopPropagation();
                if (draggingRef.current || movedRef.current || performance.now() - lastDragEndRef.current < 120) return;
                onSelect?.(tile.itemIndex);
              }}
            >
              <img src={tile.src} alt="" draggable={false} />
              <span className="dome-gallery__tile-copy">
                <strong>{tile.title}</strong>
                {tile.subtitle && <small>{tile.subtitle}</small>}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="dome-gallery__vignette" aria-hidden="true" />
    </section>
  );
}
