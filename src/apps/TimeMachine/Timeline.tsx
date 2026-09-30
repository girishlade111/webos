import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { TimeMachineSnapshot } from '../../core/timeMachineStore';

interface TimelineProps {
  snapshots: TimeMachineSnapshot[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

const DAY_MS = 86_400_000;

const sameDay = (a: number, b: number) => Math.floor(a / DAY_MS) === Math.floor(b / DAY_MS);

const dayLabel = (ts: number) => {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(Date.now() - DAY_MS);
  if (sameDay(ts, today.getTime())) return 'Today';
  if (sameDay(ts, yesterday.getTime())) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
};

const timeLabel = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

/**
 * macOS-style backup timeline: a day-banded scrubber with one tick per snapshot,
 * a draggable handle and a floating date bubble that tracks the selection.
 */
export const Timeline: React.FC<TimelineProps> = ({ snapshots, selectedIndex, onSelect }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const isLive = selectedIndex >= snapshots.length - 1;

  const indexFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el || snapshots.length === 0) return 0;
      const rect = el.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      return Math.round(ratio * (snapshots.length - 1));
    },
    [snapshots.length]
  );

  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => onSelect(indexFromClientX(e.clientX));
    const up = () => setDragging(false);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [dragging, indexFromClientX, onSelect]);

  const step = (delta: number) => {
    onSelect(Math.min(snapshots.length - 1, Math.max(0, selectedIndex + delta)));
  };

  const selected = snapshots[selectedIndex];
  const percent =
    snapshots.length > 1 ? (selectedIndex / (snapshots.length - 1)) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      {/* Step back */}
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={selectedIndex <= 0}
        aria-label="Previous backup"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 disabled:opacity-25 disabled:hover:bg-transparent"
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="min-w-0 flex-1">
        {/* Track */}
        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label="Backup timeline"
          aria-valuemin={0}
          aria-valuemax={Math.max(0, snapshots.length - 1)}
          aria-valuenow={selectedIndex}
          aria-valuetext={selected ? `${dayLabel(selected.createdAt)} ${timeLabel(selected.createdAt)}` : 'No backups'}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              step(-1);
            }
            if (e.key === 'ArrowRight') {
              e.preventDefault();
              step(1);
            }
            if (e.key === 'Home') {
              e.preventDefault();
              onSelect(0);
            }
            if (e.key === 'End') {
              e.preventDefault();
              onSelect(snapshots.length - 1);
            }
          }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture?.(e.pointerId);
            setDragging(true);
            onSelect(indexFromClientX(e.clientX));
          }}
          className="group relative h-9 cursor-pointer touch-none select-none"
        >
          {/* Rail */}
          <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-white/18">
            <div
              className="h-full rounded-full bg-[var(--accent)]"
              style={{ width: `${percent}%` }}
            />
          </div>

          {/* Day separators + ticks */}
          {snapshots.map((snap, i) => {
            const prev = snapshots[i - 1];
            const newDay = !prev || !sameDay(prev.createdAt, snap.createdAt);
            const left = snapshots.length > 1 ? (i / (snapshots.length - 1)) * 100 : 0;
            return (
              <React.Fragment key={snap.id}>
                {newDay && i > 0 && (
                  <div
                    className="absolute top-1/2 h-3.5 w-px -translate-y-1/2 bg-white/30"
                    style={{ left: `${left}%` }}
                    aria-hidden="true"
                  />
                )}
                <div
                  className="absolute top-1/2 h-1.5 w-px -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/45 transition-all"
                  style={{ left: `${left}%`, opacity: i <= selectedIndex ? 0.9 : 0.4 }}
                  aria-hidden="true"
                />
              </React.Fragment>
            );
          })}

          {/* Handle */}
          <div
            className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${percent}%` }}
          >
            <div
              className="h-[13px] w-[13px] rounded-full border border-white/70 bg-white shadow-[0_0_0_3px_rgba(0,0,0,0.28),0_2px_8px_rgba(0,0,0,0.6)] transition-transform group-hover:scale-110"
              style={{ transform: dragging ? 'scale(1.18)' : undefined }}
            />
          </div>
        </div>

        {/* Day labels */}
        <div className="relative -mt-1 h-3.5">
          {snapshots.map((snap, i) => {
            const prev = snapshots[i - 1];
            if (prev && sameDay(prev.createdAt, snap.createdAt)) return null;
            const left = snapshots.length > 1 ? (i / (snapshots.length - 1)) * 100 : 0;
            return (
              <span
                key={`label-${snap.id}`}
                className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium tracking-tight text-white/45"
                style={{
                  left: `${left}%`,
                  transform:
                    i === 0 ? 'translateX(0)' : i === snapshots.length - 1 ? 'translateX(-100%)' : undefined,
                }}
              >
                {dayLabel(snap.createdAt)}
              </span>
            );
          })}
        </div>
      </div>

      {/* Step forward */}
      <button
        type="button"
        onClick={() => step(1)}
        disabled={selectedIndex >= snapshots.length - 1}
        aria-label="Next backup"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 disabled:opacity-25 disabled:hover:bg-transparent"
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Current selection readout */}
      <div className="w-[190px] shrink-0 text-right">
        <p className="truncate text-[12px] font-semibold tracking-tight text-white">
          {isLive ? 'Now' : selected ? `${dayLabel(selected.createdAt)}, ${timeLabel(selected.createdAt)}` : '—'}
        </p>
        <p className="truncate text-[10px] text-white/45">
          {selected ? `${selected.fileCount} files · ${selected.note}` : 'No backups yet'}
        </p>
      </div>
    </div>
  );
};

export default Timeline;
