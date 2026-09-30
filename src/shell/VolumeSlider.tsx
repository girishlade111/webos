import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Volume1, Volume2, Volume3, VolumeX } from 'lucide-react';

/* ------------------------------------------------------------------ *
 * Volume level glyph
 * ------------------------------------------------------------------ */

export type VolumeLevel = 'muted' | 'low' | 'mid' | 'high';

/** Thresholds match AppKit's speaker-glyph breakpoints. */
export function volumeLevelOf(volume: number, muted: boolean): VolumeLevel {
  if (muted || volume <= 0) return 'muted';
  if (volume < 34) return 'low';
  if (volume < 67) return 'mid';
  return 'high';
}

export interface VolumeGlyphProps {
  volume: number;
  muted: boolean;
  size?: number;
  /** Bump to replay the attention pulse (used by the volume HUD). */
  pulseKey?: number;
  className?: string;
}

/**
 * The speaker glyph macOS shows in Control Center, the menu bar and the
 * volume HUD. Muted state swaps in VolumeX; otherwise the wave count grows
 * with the level.
 */
export const VolumeGlyph: React.FC<VolumeGlyphProps> = ({
  volume,
  muted,
  size = 16,
  pulseKey,
  className = '',
}) => {
  const level = volumeLevelOf(volume, muted);

  const Glyph =
    level === 'muted' ? VolumeX : level === 'low' ? Volume1 : level === 'mid' ? Volume2 : Volume3;

  const glyph = <Glyph size={size} strokeWidth={2} className={className} />;

  if (pulseKey === undefined) return glyph;

  return (
    <span key={pulseKey} className="inline-flex animate-volume-pulse">
      {glyph}
    </span>
  );
};

/* ------------------------------------------------------------------ *
 * macOS Control Center slider
 * ------------------------------------------------------------------ */

/** Diameter of the draggable knob in px. Knob travel is inset by this on both sides. */
const KNOB = 14;

export interface MacSliderProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  /** Called once at the end of a drag gesture — used for audio feedback ticks. */
  onCommit?: (value: number) => void;
  disabled?: boolean;
  ariaLabel: string;
  className?: string;
}

/**
 * Reproduces the Control Center Display/Sound slider: a 4pt capsule track with
 * a white circular knob, a larger invisible hit area, click-to-jump, 1:1 drag,
 * and full keyboard support.
 */
export const MacSlider: React.FC<MacSliderProps> = ({
  value,
  min = 0,
  max = 100,
  onChange,
  onCommit,
  disabled = false,
  ariaLabel,
  className = '',
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [focused, setFocused] = useState(false);

  const span = max - min || 1;
  const ratio = Math.max(0, Math.min(1, (value - min) / span));

  /** Invert a client X into a value, accounting for the knob radius on both ends. */
  const valueFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return min;
      const rect = el.getBoundingClientRect();
      const travel = Math.max(1, rect.width - KNOB);
      const raw = (clientX - rect.left - KNOB / 2) / travel;
      return Math.round(min + Math.max(0, Math.min(1, raw)) * span);
    },
    [min, span]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const next = valueFromClientX(e.clientX);
    setDragging(true);
    onChange(next);

    const handleMove = (move: PointerEvent) => onChange(valueFromClientX(move.clientX));
    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
      setDragging(false);
      onCommit?.(valueFromClientX(e.clientX));
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    const step = e.shiftKey ? 10 : 2;
    let next: number | null = null;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = value + step;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = value - step;
        break;
      case 'PageUp':
        next = value + 10;
        break;
      case 'PageDown':
        next = value - 10;
        break;
      case 'Home':
        next = min;
        break;
      case 'End':
        next = max;
        break;
      default:
        return;
    }

    e.preventDefault();
    e.stopPropagation();
    onChange(Math.max(min, Math.min(max, next)));
  };

  const active = dragging || (hovering && !disabled);
  /* Knob centre travels from KNOB/2 to trackWidth - KNOB/2, matching AppKit. */
  const knobOffset = `calc(${ratio * 100}% - ${ratio * KNOB}px)`;

  return (
    <div
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${value} percent`}
      aria-disabled={disabled || undefined}
      data-dragging={dragging || undefined}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={`group relative flex h-5 w-full touch-none select-none items-center outline-none ${
        disabled ? 'cursor-default' : 'cursor-pointer'
      } ${className}`}
    >
      {/* Track */}
      <div ref={trackRef} className="mac-slider-track relative h-1 w-full overflow-hidden rounded-full">
        {/* Fill ends at the knob's leading edge; animates while idle,
            tracks the pointer 1:1 mid-drag. */}
        <div
          className="mac-slider-fill absolute inset-y-0 left-0 rounded-full"
          style={{
            width: knobOffset,
            transition: dragging ? 'none' : 'width 180ms cubic-bezier(0.32, 0.72, 0, 1)',
          }}
        />
      </div>

      {/* Knob */}
      <div
        aria-hidden
        data-focused={focused && !disabled ? 'true' : undefined}
        className="mac-slider-knob pointer-events-none absolute top-1/2 rounded-full bg-white"
        style={{
          width: KNOB,
          height: KNOB,
          left: knobOffset,
          marginLeft: KNOB / 2,
          transform: `translate(-50%, -50%) scale(${active ? 1.14 : 1})`,
          transition: dragging
            ? 'none'
            : 'transform 180ms cubic-bezier(0.32, 0.72, 0, 1), left 180ms cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      />
    </div>
  );
};
