import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useScreenSaverStore, ScreenSaverVariant } from '../core/screenSaverStore';
import { useThemeStore, ACCENT_MAP } from '../core/themeStore';
import { WebOSLogo } from '../assets/appIcons';
import { sound } from '../core/sound';

/* -------------------------------------------------------------------------- */
/* Shared pieces                                                              */
/* -------------------------------------------------------------------------- */

/**
 * The mark itself. Kept as one component so all four variants share identical
 * optical weight — only the surrounding artwork changes.
 */
const FloatingMark: React.FC = () => (
  <div className="relative flex h-[168px] w-[168px] items-center justify-center">
    {/* Ambient bloom behind the plate */}
    <div
      className="ss-glow pointer-events-none absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        background:
          'radial-gradient(circle, color-mix(in srgb, var(--accent) 42%, transparent) 0%, transparent 68%)',
        filter: 'blur(30px)',
      }}
    />

    {/* Concentric light rings — 6s+ staggered so they never sync up */}
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="ss-ring pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          border: '1px solid color-mix(in srgb, var(--accent) 70%, white 30%)',
          animationDelay: `${i * 2.5}s`,
        }}
      />
    ))}

    {/* The plate */}
    <div className="ss-float relative">
      <div
        className="relative rounded-[38px] shadow-[0_28px_70px_-12px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.12)]"
        style={{ width: 168, height: 168 }}
      >
        <WebOSLogo size={168} className="h-full w-full rounded-[38px]" />

        {/* Specular sweep — the highlight that sells the material */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[38px]">
          <div
            className="ss-sheen absolute inset-y-0 w-1/3"
            style={{
              background:
                'linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.42) 50%, transparent 100%)',
            }}
          />
        </div>
      </div>
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/* Variants                                                                   */
/* -------------------------------------------------------------------------- */

const LogoVariant: React.FC = () => (
  <>
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70"
      style={{
        background:
          'radial-gradient(circle, color-mix(in srgb, var(--accent) 24%, transparent) 0%, transparent 66%)',
        filter: 'blur(56px)',
      }}
    />
    <FloatingMark />
  </>
);

const AuroraVariant: React.FC = () => {
  const blobs = [
    {
      anim: 'ssAurora1',
      dur: '34s',
      size: 720,
      top: '-14%',
      left: '-10%',
      color: 'color-mix(in srgb, var(--accent) 68%, transparent)',
    },
    {
      anim: 'ssAurora2',
      dur: '41s',
      size: 620,
      top: '26%',
      left: '48%',
      color: 'color-mix(in srgb, #a855f7 58%, transparent)',
    },
    {
      anim: 'ssAurora3',
      dur: '47s',
      size: 560,
      top: '52%',
      left: '8%',
      color: 'color-mix(in srgb, #ec4899 50%, transparent)',
    },
    {
      anim: 'ssAurora4',
      dur: '38s',
      size: 660,
      top: '-6%',
      left: '58%',
      color: 'color-mix(in srgb, #22d3ee 46%, transparent)',
    },
  ];

  return (
    <>
      <div className="absolute inset-0 overflow-hidden bg-black">
        {blobs.map((b, i) => (
          <div
            key={i}
            className="ss-aurora pointer-events-none absolute rounded-full"
            style={{
              animationName: b.anim,
              animationDuration: b.dur,
              width: b.size,
              height: b.size,
              top: b.top,
              left: b.left,
              background: `radial-gradient(circle, ${b.color} 0%, transparent 68%)`,
              filter: 'blur(72px)',
            }}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-black/25" />
      <div className="relative opacity-90">
        <FloatingMark />
      </div>
    </>
  );
};

const StarfieldVariant: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Deterministic PRNG so the sky doesn't re-shuffle on every re-render.
    let seed = 0x2f6e2b1;
    const rand = () => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return ((seed >>> 0) % 100000) / 100000;
    };

    interface Star {
      x: number;
      y: number;
      z: number;
      pz: number;
      accent: boolean;
    }

    let stars: Star[] = [];

    const build = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round((w * h) / 5200);
      stars = Array.from({ length: count }, () => {
        const z = 0.35 + rand() * 0.65;
        return { x: rand() * w, y: rand() * h, z, pz: z, accent: rand() > 0.86 };
      });
    };

    const frame = () => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      for (const s of stars) {
        s.z -= 0.0032;
        if (s.z <= 0.02) {
          s.z = 1;
          s.x = rand() * w;
          s.y = rand() * h;
          s.pz = 1;
        }

        const k = s.z / s.pz;
        // 1/k blow-up gives the authentic warp-streak near the centre.
        const px = cx + (s.x - cx) * k;
        const py = cy + (s.y - cy) * k;

        const size = Math.max(0.4, (1.35 - s.z) * 2.6);
        const alpha = Math.min(1, (1.05 - s.z) * 1.15);

        if (k < 1.02) {
          ctx.globalAlpha = alpha;
          ctx.fillStyle = s.accent ? '#9fc7ff' : '#ffffff';
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fill();

          // Warp trail for stars close to the viewer
          if (k > 0.86) {
            ctx.globalAlpha = alpha * 0.35;
            ctx.strokeStyle = s.accent ? '#7fb0ff' : '#e8e8ea';
            ctx.lineWidth = size * 0.8;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(cx + (s.x - cx) * ((s.z - 0.006) / s.pz), cy + (s.y - cy) * ((s.z - 0.006) / s.pz));
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      raf = window.requestAnimationFrame(frame);
    };

    build();
    frame();

    const onResize = () => build();
    window.addEventListener('resize', onResize);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <>
      <div className="absolute inset-0 bg-black">
        <canvas ref={canvasRef} className="h-full w-full" aria-hidden />
      </div>
      {/* Vignette pulls the eye to centre, like every Apple aerial video */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 28%, rgba(0,0,0,0.55) 88%)',
        }}
      />
      <div className="relative opacity-95">
        <FloatingMark />
      </div>
    </>
  );
};

const RippleVariant: React.FC = () => {
  const rings = useMemo(() => Array.from({ length: 7 }, (_, i) => i), []);

  return (
    <>
      <div className="absolute inset-0 overflow-hidden bg-black">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[1100px] w-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--accent) 26%, transparent) 0%, transparent 62%)',
            filter: 'blur(64px)',
          }}
        />

        <div className="absolute left-1/2 top-1/2 h-0 w-0">
          {rings.map((i) => (
            <div
              key={i}
              className="ss-ripple pointer-events-none absolute rounded-full"
              style={{
                // Rings are all the same size and expand — only the phase differs.
                width: 1000,
                height: 1000,
                marginLeft: -500,
                marginTop: -500,
                border: '1px solid color-mix(in srgb, var(--accent) 62%, white 38%)',
                animationDelay: `${(i * 8) / rings.length}s`,
              }}
            />
          ))}
        </div>
      </div>
      <div className="relative">
        <FloatingMark />
      </div>
    </>
  );
};

const ARTWORK: Record<ScreenSaverVariant, React.FC> = {
  logo: LogoVariant,
  aurora: AuroraVariant,
  starfield: StarfieldVariant,
  ripple: RippleVariant,
};

/* -------------------------------------------------------------------------- */
/* Clock                                                                      */
/* -------------------------------------------------------------------------- */

const SaverClock: React.FC = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // macOS omits the leading zero on the hour ("9:41", not "09:41").
  const time = now
    .toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    .replace(/\s+/g, ' ');
  const date = now.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="ss-rising pointer-events-none absolute inset-x-0 top-[13vh] z-20 flex flex-col items-center text-white">
      <div
        className="ss-clock"
        style={{ fontSize: 'clamp(64px, 11vw, 132px)', lineHeight: 1.02 }}
      >
        {time}
      </div>
      <div
        className="ss-date mt-1.5 text-white/85"
        style={{ fontSize: 'clamp(15px, 1.5vw, 21px)', fontWeight: 500 }}
      >
        {date}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Overlay                                                                    */
/* -------------------------------------------------------------------------- */

export const ScreenSaver: React.FC = () => {
  const { phase, isVisible, variant, showClock, sessionNonce, lockOnWake } = useScreenSaverStore();
  const setOSState = useThemeStore((s) => s.setOSState);
  const Artwork = ARTWORK[variant];

  // Returning the user to the login screen is a separate step from dismissing
  // the overlay, so it waits for the wake fade to finish.
  useEffect(() => {
    if (!lockOnWake) return;
    if (phase !== 'waking') return;
    const id = window.setTimeout(() => {
      const store = useScreenSaverStore.getState();
      if (store.phase === 'waking') setOSState('locked');
    }, 650);
    return () => window.clearTimeout(id);
  }, [phase, lockOnWake, setOSState]);

  if (!isVisible) return null;

  const isWaking = phase === 'waking';

  return (
    <div
      // Re-keying on every engagement restarts the CSS entry animations.
      key={sessionNonce}
      role="dialog"
      aria-label="Screen Saver"
      aria-modal="true"
      className={`ss-root ss-art flex items-center justify-center ${isWaking ? 'ss-waking' : ''}`}
    >
      {/* Pass 1 — dim the desktop out from under the artwork */}
      <div className="ss-dim pointer-events-none absolute inset-0 bg-black" />

      {/* Pass 2 — the artwork + clock */}
      <div className="ss-art pointer-events-none absolute inset-0 overflow-hidden">
        <Artwork />
        {showClock && <SaverClock />}
      </div>

      {/* Vignette + top/bottom scrims, so the clock always has contrast */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, transparent 26%, transparent 62%, rgba(0,0,0,0.5) 100%)',
        }}
      />

      {/* macOS shows no hint here — movement alone dismisses it. */}
      <span className="sr-only" aria-live="polite">
        Screen saver active. Move the mouse or press any key to continue.
      </span>
    </div>
  );
};

/** Menu-bar / Apple-menu entry point: engage immediately. */
export const startScreenSaverNow = () => {
  sound.playClick();
  useScreenSaverStore.getState().engage(false);
};
