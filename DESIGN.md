# Design

## Intent

ARCHIVE is a dark chamber for photography: zinc-black, precise, and materially spare. The interface feels like steel shelving and exposed contact sheets under a single controlled light. It is brutalist in structure, never in legibility; the photographs retain all visual authority.

## Color

Use a zinc-only dark strategy. The lightest values are reserved for type and image highlights; surfaces are separated by luminance and rules, not by colored decoration.

```css
:root {
  color-scheme: dark;
  --archive-bg: oklch(0.145 0.008 285);
  --archive-surface: oklch(0.19 0.01 285);
  --archive-surface-raised: oklch(0.235 0.011 285);
  --archive-ink: oklch(0.94 0.004 285);
  --archive-muted: oklch(0.71 0.01 285);
  --archive-line: oklch(0.36 0.012 285);
  --archive-mark: oklch(0.86 0.006 285);
  --archive-night: oklch(0.09 0.006 285);
}
```

## Typography

Use a direct system sans-serif stack for all reading and display copy. Functional information uses a compact system monospace stack. Display lettering is massive but contained, with tight spacing no lower than `-0.04em`. Avoid italic editorial gestures.

## Layout

- The shell is a field of dark zinc with crisp, visible rules and squared edges.
- The mark is an abstract block; navigation stays compact and architectural.
- The landing statement occupies one forceful field; the still-life is a full-width photographic slab, not a card.
- Collections use a strict masonry field that preserves image aspect ratio while keeping generous, dark gutters.
- The lightbox is a full-screen dark chamber with sparse, high-contrast controls.

## Motion

The primary motion is opening a photograph: a short, cinematic application transition with a scale-settle on the stage. Image fields lift by only a few pixels on hover. Motion remains optional and collapses to static state under reduced-motion preferences.
