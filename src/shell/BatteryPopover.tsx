import React from 'react';
import { BatteryCharging, Plug, Settings2 } from 'lucide-react';
import {
  describeCharge,
  isLowBattery,
  useBatteryStore,
} from '../core/batteryStore';
import { useProcessStore } from '../core/processStore';
import { sound } from '../core/sound';
import { BatteryGlyph } from './BatteryGlyph';

interface RowProps {
  label: string;
  value: string;
  danger?: boolean;
}

const Row: React.FC<RowProps> = ({ label, value, danger = false }) => (
  <div className="flex items-baseline justify-between gap-4 px-1.5 py-1">
    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">{label}</span>
    <span
      className={`text-[11px] font-medium tabular-nums ${
        danger ? 'text-[#ff3b30] dark:text-[#ff453a]' : ''
      }`}
    >
      {value}
    </span>
  </div>
);

export const BatteryPopover: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    level,
    charging,
    chargingTime,
    dischargingTime,
    source,
    showPercentage,
    setShowPercentage,
  } = useBatteryStore();
  const { openWindow } = useProcessStore();

  const percent = Math.round(level * 100);
  const low = isLowBattery(level, charging);

  const chargeValue = describeCharge(level, charging, chargingTime, dischargingTime);

  return (
    <div
      role="dialog"
      aria-label="Battery"
      className="absolute top-7 right-0 z-50 w-[260px] animate-fade-in rounded-xl border border-[var(--menu-dropdown-border)] bg-[var(--menu-dropdown-bg)] p-2.5 text-xs text-[var(--menu-bar-text)] shadow-2xl glass-panel"
    >
      <div className="flex items-center gap-2.5 px-1 pb-2 pt-0.5">
        <BatteryGlyph level={level} charging={charging} size={22} />
        <span className="text-[22px] font-semibold leading-none tracking-tight tabular-nums">
          {percent}%
        </span>
      </div>

      <div className="mx-1 h-px bg-black/10 dark:bg-white/10" />

      <div className="space-y-0.5 py-1.5">
        <Row
          label="Power Source"
          value={charging ? 'Power Adapter' : 'Battery'}
        />
        {low ? (
          <Row label="Battery" value="Low — connect a power source" danger />
        ) : (
          <Row label="Charge" value={chargeValue} />
        )}
      </div>

      <div className="mx-1 h-px bg-black/10 dark:bg-white/10" />

      <label className="mt-1 flex cursor-pointer items-center justify-between gap-3 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10">
        <span className="text-[11px]">Show Battery Percentage</span>
        <span className="relative inline-flex shrink-0">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={showPercentage}
            onChange={(e) => {
              sound.playClick();
              setShowPercentage(e.target.checked);
            }}
          />
          <span className="h-[22px] w-[38px] rounded-full bg-neutral-300 transition-colors peer-focus:outline-none peer-checked:bg-[var(--accent)] dark:bg-neutral-600" />
          <span
            className={[
              'absolute left-[2px] top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform duration-200',
              'peer-checked:translate-x-4',
            ].join(' ')}
          />
        </span>
      </label>

      <button
        onClick={() => {
          sound.playClick();
          onClose();
          openWindow('settings');
        }}
        className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left text-[11px] transition-colors hover:bg-black/5 dark:hover:bg-white/10"
      >
        {charging ? (
          <BatteryCharging size={13} className="text-neutral-500 dark:text-neutral-400" />
        ) : (
          <Plug size={13} className="text-neutral-500 dark:text-neutral-400" />
        )}
        <span>Battery Settings…</span>
      </button>

      {source === 'simulated' && (
        <p className="px-1.5 pt-1 text-[10px] leading-snug text-neutral-400">
          This browser does not expose the Battery Status API. Values are estimated.
        </p>
      )}
    </div>
  );
};
