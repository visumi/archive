import { motion, useReducedMotion, type Easing, type Transition } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';

type BlurTextProps = {
  text: string;
  delay?: number;
  className?: string;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
  threshold?: number;
  rootMargin?: string;
  easing?: Easing | Easing[];
  stepDuration?: number;
  simple?: boolean;
};

const buildKeyframes = (
  from: Record<string, string | number>,
  steps: Array<Record<string, string | number>>
) => Object.fromEntries(
  [...new Set([...Object.keys(from), ...steps.flatMap((step) => Object.keys(step))])].map((key) => [
    key,
    [from[key], ...steps.map((step) => step[key])]
  ])
);

export default function BlurText({
  text,
  delay = 70,
  className = '',
  animateBy = 'letters',
  direction = 'bottom',
  threshold = 0.1,
  rootMargin = '0px',
  easing = [0.16, 1, 0.3, 1],
  stepDuration = 0.35,
  simple = false
}: BlurTextProps) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();
  const elements = animateBy === 'words' ? text.split(' ') : text.split('');

  const from = useMemo(
    () => direction === 'top'
      ? { filter: 'blur(10px)', opacity: 0, y: -50 }
      : { filter: 'blur(10px)', opacity: 0, y: 50 },
    [direction]
  );
  const steps = useMemo(
    () => [
      { filter: 'blur(5px)', opacity: 0.5, y: direction === 'top' ? 5 : -5 },
      { filter: 'blur(0px)', opacity: 1, y: 0 }
    ],
    [direction]
  );
  const keyframes = useMemo(() => buildKeyframes(from, steps), [from, steps]);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, { threshold, rootMargin });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  if (simple) {
    return (
      <span ref={ref} className={`blur-text ${className}`.trim()} aria-label={text}>
        <motion.span
          initial={{ filter: 'blur(8px)', opacity: 0 }}
          animate={inView ? { filter: 'blur(0px)', opacity: 1 } : { filter: 'blur(8px)', opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.42, ease: [0.16, 1, 0.3, 1] }}
        >
          {text}
        </motion.span>
      </span>
    );
  }

  const transition: Transition = {
    duration: stepDuration * steps.length,
    times: [0, 0.5, 1],
    ease: easing
  };

  return (
    <span ref={ref} className={`blur-text ${className}`.trim()} aria-label={text}>
      {elements.map((segment, index) => (
        <motion.span
          key={`${segment}-${index}`}
          initial={from}
          animate={inView ? (reducedMotion ? steps[steps.length - 1] : keyframes) : from}
          transition={{ ...transition, delay: reducedMotion ? 0 : (index * delay) / 1000 }}
        >
          {segment === ' ' ? '\u00A0' : segment}
          {animateBy === 'words' && index < elements.length - 1 && '\u00A0'}
        </motion.span>
      ))}
    </span>
  );
}
