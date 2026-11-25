import { useMemo, type CSSProperties } from 'react';

const COLORS = ['#1f6fd1', '#18a5d6', '#13908a', '#ffb020', '#5b5fc7', '#ff6b6b'];

/** Chuva de confete leve, só CSS. Monta, cai e some sozinha. */
export function Confetti({ pieces = 70 }: { pieces?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 1.8 + Math.random() * 1.4,
        rotate: Math.random() * 720 - 360,
        drift: Math.random() * 160 - 80,
        color: COLORS[i % COLORS.length],
        w: 6 + Math.random() * 6,
      })),
    [pieces],
  );
  return (
    <div className="confetti" aria-hidden>
      {bits.map((b, i) => (
        <i
          key={i}
          style={
            {
              left: `${b.left}%`,
              width: b.w,
              height: b.w * 1.6,
              background: b.color,
              animationDelay: `${b.delay}s`,
              animationDuration: `${b.duration}s`,
              '--rot': `${b.rotate}deg`,
              '--drift': `${b.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
