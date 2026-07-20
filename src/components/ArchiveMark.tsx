import BlurText from './BlurText';

export function ArchiveMark() {
  return (
    <span className="archive-mark" aria-label="ARCHIVE">
      <span className="archive-mark__word" aria-hidden="true"><BlurText text="ARCHIVE" delay={42} stepDuration={0.28} /></span>
    </span>
  );
}
