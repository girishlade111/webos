import React, { useEffect, useRef, useState } from 'react';
import { Headphones, Laptop, MonitorSmartphone, Radio } from 'lucide-react';
import { useThemeStore, getAudioOutputDevice } from '../core/themeStore';
import { AudioOutputKind } from '../types/os';
import { VolumeGlyph } from './VolumeSlider';

export const OUTPUT_DEVICE_ICONS: Record<AudioOutputKind, React.FC<{ size?: number; className?: string }>> = {
  speakers: Laptop,
  headphones: Headphones,
  display: MonitorSmartphone,
  airplay: Radio,
};

const HUD_VISIBLE_MS = 1200;

/**
 * macOS volume HUD — the transient overlay that appears under the menu bar when
 * the output level is changed from the keyboard or the menu bar glyph.
 * Re-shown whenever `volumeHudNonce` ticks, then auto-dismisses.
 */
export const VolumeHUD: React.FC = () => {
  const volume = useThemeStore((s) => s.volume);
  const muted = useThemeStore((s) => !s.soundEnabled);
  const outputDeviceId = useThemeStore((s) => s.outputDeviceId);
  const nonce = useThemeStore((s) => s.volumeHudNonce);

  const [visible, setVisible] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (nonce === 0) return;

    setVisible(true);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setVisible(false);
      timerRef.current = null;
    }, HUD_VISIBLE_MS);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [nonce]);

  if (!visible) return null;

  const device = getAudioOutputDevice(outputDeviceId);
  const DeviceIcon = OUTPUT_DEVICE_ICONS[device.kind];
  const ratio = Math.max(0, Math.min(1, volume / 100));

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Output volume ${volume} percent${muted ? ', muted' : ''} on ${device.name}`}
      className="mac-hud top-11 right-5 flex w-72 items-center gap-3.5 px-4 py-3 text-neutral-900 dark:text-neutral-100"
    >
      <VolumeGlyph
        volume={volume}
        muted={muted}
        size={26}
        pulseKey={nonce}
        className="shrink-0 text-neutral-700 dark:text-neutral-100"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[12px] font-medium text-neutral-600 dark:text-neutral-300">
            {device.name}
          </span>
          <span className="shrink-0 text-[12px] font-semibold tabular-nums">
            {muted ? 'Muted' : `${volume}%`}
          </span>
        </div>

        {/* Level bar */}
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-black/12 dark:bg-white/18">
          <div
            className="h-full rounded-full bg-neutral-700 dark:bg-neutral-100"
            style={{
              width: `${ratio * 100}%`,
              transition: 'width 220ms cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          />
        </div>
      </div>

      <DeviceIcon size={15} className="shrink-0 opacity-45" />
    </div>
  );
};
