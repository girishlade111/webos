import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Folder } from 'lucide-react';
import type { TimeMachineSnapshot } from '../../core/timeMachineStore';
import { formatBytes } from '../../core/timeMachineStore';

interface TunnelProps {
  snapshots: TimeMachineSnapshot[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  reducedMotion: boolean;
}

const DEPTH = 7;
const STEP_Z = 175;
const STEP_X = 82;

const timeLabel = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

/**
 * The signature Time Machine view: a tunnel of glass volume planes receding
 * into the star field, one plane per backup. Scrubbing the timeline flies the
 * camera to a different depth in the stack.
 */
export const Tunnel: React.FC<TunnelProps> = ({
  snapshots,
  selectedIndex,
  onSelect,
  reducedMotion,
}) => {
  const planes = [];
  for (let d = 0; d <= DEPTH; d += 1) {
    const i = selectedIndex - d;
    if (i < 0) break;
    const snap = snapshots[i];
    if (!snap) break;

    const isFront = d === 0;
    const z = -d * STEP_Z;
    const x = d * STEP_X;
    const opacity = isFront ? 1 : Math.max(0, 0.92 - d * 0.11);
    const blur = isFront ? 0 : Math.min(1.4, d * 0.24);
    const sample = Object.values(snap.nodes)
      .sort((a, b) => b.modifiedAt - a.modifiedAt)
      .slice(0, 4);

    planes.push(
      <motion.button
        key={snap.id}
        type="button"
        onClick={() => onSelect(i)}
        animate={{
          z: isFront && !reducedMotion ? 0 : z,
          x: isFront && !reducedMotion ? 0 : x,
          y: isFront && !reducedMotion ? 0 : -d * 6,
          opacity,
          filter: `blur(${blur}px)`,
        }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { type: 'spring', stiffness: 190, damping: 26, mass: 0.9 }
        }
        style={{
          transformStyle: 'preserve-3d', zIndex: 100 - d }}
        className={`absolute left-1/2 top-1/2 flex h-[212px] w-[352px] -ml-[176px] -mt-[106px] flex-col overflow-hidden rounded-[14px] text-left ${
          isFront ? 'ring-1 ring-white/70' : ''
        }`}
        aria-label={`Backup from ${new Date(snap.createdAt).toLocaleString()}`}
        aria-current={isFront}
      >
        {/* Glass body */}
        <div
          className="absolute inset-0 rounded-[14px] border"
          style={{
            borderColor: isFront ? 'rgba(126,176,255,0.9)' : 'rgba(255,255,255,0.3)',
            background: isFront
              ? 'linear-gradient(155deg, rgba(42,68,132,0.96) 0%, rgba(18,30,62,0.97) 58%, rgba(10,16,36,0.98) 100%)'
              : `linear-gradient(155deg, rgba(24,34,62,0.94) 0%, rgba(12,19,40,0.96) 100%)`,
            boxShadow: isFront
              ? '0 26px 70px -18px rgba(0,0,0,0.85), 0 0 46px -10px rgba(80,150,255,0.6), inset 0 1px 0 rgba(255,255,255,0.24)'
              : '0 16px 44px -16px rgba(0,0,0,0.78), inset 0 1px 0 rgba(255,255,255,0.16)',
          }}
        />

        {/* Header strip */}
        <div className="relative flex items-center justify-between border-b border-white/12 px-3.5 py-2">
          <div className="flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: snap.reason === 'auto' ? '#60a5fa' : snap.reason === 'manual' ? '#34d399' : '#fbbf24',
                boxShadow: isFront ? '0 0 8px currentColor' : 'none',
              }}
            />
            <span className="text-[12px] font-semibold tracking-tight text-white/95">
              {timeLabel(snap.createdAt)}
            </span>
          </div>
          <span className="text-[10px] font-medium tracking-tight text-white/45">{snap.note}</span>
        </div>

        {/* Volume body */}
        <div className="relative flex-1 px-3.5 py-2.5">
          <p className="mb-2 text-[10px] font-medium tracking-wide text-white/40">
            {snap.folderCount} folders · {snap.fileCount} files · {formatBytes(snap.logicalSize)}
          </p>
          <ul className="space-y-[3px]">
            {sample.map((node) => (
              <li key={node.id} className="flex items-center gap-1.5 text-[11px] text-white/65">
                {node.type === 'folder' ? (
                  <Folder size={11} className="shrink-0 text-sky-300/80" />
                ) : (
                  <FileText size={11} className="shrink-0 text-white/40" />
                )}
                <span className="truncate">{node.name}</span>
              </li>
            ))}
            {sample.length === 0 && (
              <li className="text-[11px] italic text-white/30">Empty volume</li>
            )}
          </ul>
        </div>
      </motion.button>
    );
  }

  const reach = STEP_X * DEPTH;
  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
      style={{ perspective: '1150px', perspectiveOrigin: '50% 50%' }}
    >
      {/* Light path threading the stack, running from the vanishing point back to the viewer */}
      <div
        className="pointer-events-none absolute top-1/2 h-px -translate-y-1/2"
        style={{
          left: '50%',
          width: `${reach + 420}px`,
          marginLeft: `${-reach / 2}px`,
          background:
            'linear-gradient(90deg, rgba(140,190,255,0) 0%, rgba(140,190,255,0.32) 46%, rgba(198,220,255,0.72) 68%, rgba(140,190,255,0.22) 100%)',
          filter: 'blur(0.6px)',
        }}
        aria-hidden="true"
      />
      {planes}
    </div>
  );
};

export default Tunnel;
