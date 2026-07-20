import { type TouchEvent, useEffect, useRef, useState } from 'react';
import AsciiLayer from './components/AsciiLayer';
import BlurText from './components/BlurText';
import Grainient from './components/Grainient';
import Orb from './components/Orb';
import { CollectionBrowser } from './components/CollectionBrowser';

const HOME_EXIT_DURATION = 260;

export default function App() {
  const [activePage, setActivePage] = useState(0);
  const [homeState, setHomeState] = useState<'visible' | 'leaving' | 'entering'>('visible');
  const activePageRef = useRef(0);
  const lastChange = useRef(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigateTo = (page: number) => {
    if (page < 0 || page > 2 || page === activePageRef.current) return;
    if (exitTimer.current) clearTimeout(exitTimer.current);

    if (activePageRef.current === 0) {
      setHomeState('leaving');
      exitTimer.current = setTimeout(() => {
        activePageRef.current = page;
        setActivePage(page);
      }, HOME_EXIT_DURATION);
      return;
    }

    activePageRef.current = page;
    setActivePage(page);
    if (page === 0) setHomeState('entering');
  };

  const changePage = (direction: -1 | 1) => {
    const now = performance.now();
    if (now - lastChange.current < 720) return;
    navigateTo(activePageRef.current + direction);
    lastChange.current = now;
  };

  const beginPageGesture = (event: TouchEvent<HTMLElement>) => {
    const touch = event.changedTouches[0];
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  };

  const endPageGesture = (event: TouchEvent<HTMLElement>) => {
    const start = touchStart.current;
    const end = event.changedTouches[0];
    touchStart.current = null;
    if (!start || !end) return;

    const deltaX = start.x - end.clientX;
    const deltaY = start.y - end.clientY;
    if (Math.abs(deltaX) < 42 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    changePage(deltaX > 0 ? 1 : -1);
  };

  useEffect(() => () => {
    if (exitTimer.current) clearTimeout(exitTimer.current);
  }, []);

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (Math.abs(event.deltaY) >= 8) changePage(event.deltaY > 0 ? 1 : -1);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (['ArrowDown', 'PageDown', ' '].includes(event.key)) {
        event.preventDefault();
        changePage(1);
      } else if (['ArrowUp', 'PageUp'].includes(event.key)) {
        event.preventDefault();
        changePage(-1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        navigateTo(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        navigateTo(2);
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <main
      className="archive-stage"
      aria-label="Archive"
    >
      {activePage === 0 && (
        <div className={`archive-stage__home is-${homeState}`}>
          <Grainient
            className="archive-stage__grain"
            color1="#52525b"
            color2="#18181b"
            color3="#09090b"
            timeSpeed={0.12}
            warpStrength={0.7}
            warpFrequency={3.5}
            warpAmplitude={34}
            rotationAmount={180}
            grainAmount={0.16}
            grainScale={3.4}
            grainAnimated
            contrast={1.1}
            saturation={0}
            zoom={0.82}
          />
          <div className="archive-stage__orb" aria-hidden="true">
            <Orb hue={0} hoverIntensity={0.2} rotateOnHover backgroundColor="#151519" />
          </div>
          <section className="archive-stage__content" aria-live="polite" aria-atomic="true">
            <div className="archive-stage__mark"><AsciiLayer /></div>
            <h1><BlurText text="ARCHIVE" /></h1>
            <p className="archive-stage__copy">EXPLORE - OBSERVE - REMAIN</p>
          </section>
        </div>
      )}

      {activePage === 1 && <CollectionBrowser />}

      <div
        className="archive-stage__page-gesture"
        aria-hidden="true"
        onTouchStart={beginPageGesture}
        onTouchEnd={endPageGesture}
      />

      <nav className="archive-stage__navigation" aria-label="Navegação entre seções">
        <button className={activePage === 0 ? 'is-active' : ''} type="button" aria-label="Ir para Archive" aria-current={activePage === 0 ? 'step' : undefined} onClick={() => navigateTo(0)} />
        <button className={activePage === 1 ? 'is-active' : ''} type="button" aria-label="Ir para Coleções" aria-current={activePage === 1 ? 'step' : undefined} onClick={() => navigateTo(1)} />
        <button className={activePage === 2 ? 'is-active' : ''} type="button" aria-label="Ir para Primeira Coleção" aria-current={activePage === 2 ? 'step' : undefined} onClick={() => navigateTo(2)} />
      </nav>
    </main>
  );
}
