import React, { useMemo } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  hue: 'white' | 'cool' | 'warm';
}

/** Deterministic PRNG so the sky is identical across re-renders and reloads. */
const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const buildSky = (count: number, seed: number): Star[] => {
  const rand = mulberry32(seed);
  const stars: Star[] = [];
  for (let i = 0; i < count; i += 1) {
    // Bias sizes small so a handful of bright anchors stand out.
    const roll = rand();
    const size = roll > 0.965 ? 2.4 : roll > 0.86 ? 1.5 : 0.9;
    stars.push({
      x: rand() * 100,
      y: rand() * 100,
      size,
      opacity: 0.24 + rand() * 0.62,
      duration: 2.6 + rand() * 5.2,
      delay: rand() * 6,
      hue: roll > 0.93 ? 'warm' : roll > 0.82 ? 'cool' : 'white',
    });
  }
  return stars;
};

const HUE: Record<Star['hue'], string> = {
  white: 'rgba(255,255,255,1)',
  cool: 'rgba(186,220,255,1)',
  warm: 'rgba(255,226,186,1)',
};

interface StarfieldProps {
  seed?: number;
  count?: number;
  className?: string;
}

/**
 * The deep-space backdrop of Time Machine's browse view: a seeded star field
 * with slow parallax drift and per-star twinkle.
 */
export const Starfield: React.FC<StarfieldProps> = ({ seed = 20251012, count = 190, className = '' }) => {
  const stars = useMemo(() => buildSky(count, seed), [count, seed]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {/* Deep space gradient + nebula wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 78% 42%, #12224a 0%, #080e22 42%, #03050e 74%, #01020a 100%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(38% 30% at 22% 74%, rgba(64,102,196,0.34) 0%, transparent 68%),' +
            'radial-gradient(30% 24% at 84% 20%, rgba(120,86,196,0.28) 0%, transparent 70%)',
        }}
      />

      {/* Drifting star layers */}
      <div className="tm-drift absolute inset-0">
        {stars.map((star, i) => (
          <span
            key={i}
            className="tm-twinkle absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              backgroundColor: HUE[star.hue],
              boxShadow: star.size > 2 ? `0 0 6px 1px ${HUE[star.hue]}` : 'none',
              opacity: star.opacity,
              animationDuration: `${star.duration}s`,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Vignette so the UI chrome always stays legible on top */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 100% at 50% 50%, transparent 38%, rgba(0,0,0,0.42) 100%)',
        }}
      />
    </div>
  );
};

export default Starfield;
