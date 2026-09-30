import { create } from 'zustand';

export type BatterySource = 'pending' | 'native' | 'simulated';

interface BatteryManagerLike extends EventTarget {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
}

type NavigatorWithBattery = Navigator & {
  getBattery?: () => Promise<BatteryManagerLike>;
};

interface BatteryStoreState {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  source: BatterySource;
  hasBattery: boolean;
  showPercentage: boolean;
  attach: () => () => void;
  setShowPercentage: (show: boolean) => void;
}

const PREFS_KEY = 'webos_battery_prefs';

const LOW_BATTERY_THRESHOLD = 0.2;
const SIM_TICK_MS = 45000;
const SIM_STEP = 0.01;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const readPrefs = (): { showPercentage?: boolean } => {
  if (typeof localStorage === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
  } catch {
    return {};
  }
};

const writePrefs = (showPercentage: boolean) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ showPercentage }));
  } catch {}
};

let subscribers = 0;
let teardownNative: (() => void) | null = null;
let simTimer: ReturnType<typeof setInterval> | null = null;
let simLevel = 0.82;
let simCharging = false;

export const useBatteryStore = create<BatteryStoreState>((set) => ({
  level: 1,
  charging: false,
  chargingTime: Infinity,
  dischargingTime: Infinity,
  source: 'pending',
  hasBattery: true,
  showPercentage: readPrefs().showPercentage ?? true,

  attach: () => {
    subscribers += 1;
    if (subscribers === 1) void connect();

    let released = false;
    return () => {
      if (released) return;
      released = true;
      subscribers -= 1;
      if (subscribers > 0) return;
      teardownNative?.();
      teardownNative = null;
      if (simTimer !== null) {
        clearInterval(simTimer);
        simTimer = null;
      }
    };
  },

  setShowPercentage: (showPercentage) => {
    writePrefs(showPercentage);
    set({ showPercentage });
  },
}));

const publish = (state: {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  source: BatterySource;
  hasBattery: boolean;
}) => {
  useBatteryStore.setState(state);
};

const connect = async () => {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return;

  const nav = navigator as NavigatorWithBattery;
  if (typeof nav.getBattery === 'function') {
    try {
      const manager = await nav.getBattery();
      if (subscribers === 0 || teardownNative) return;
      teardownNative = bindManager(manager);
      return;
    } catch {}
  }

  if (subscribers > 0) startSimulation();
};

const bindManager = (manager: BatteryManagerLike) => {
  const read = () => {
    const level = clamp01(manager.level);
    publish({
      level,
      charging: manager.charging,
      chargingTime: manager.chargingTime,
      dischargingTime: manager.dischargingTime,
      source: 'native',
      hasBattery: isBatteryPackPresent(manager),
    });
  };

  const events = [
    'levelchange',
    'chargingchange',
    'chargingtimechange',
    'dischargingtimechange',
  ] as const;

  const onWake = () => {
    if (document.visibilityState === 'visible') read();
  };

  events.forEach((event) => manager.addEventListener(event, read));
  document.addEventListener('visibilitychange', onWake);
  window.addEventListener('focus', onWake);
  read();

  return () => {
    events.forEach((event) => manager.removeEventListener(event, read));
    document.removeEventListener('visibilitychange', onWake);
    window.removeEventListener('focus', onWake);
  };
};

const isBatteryPackPresent = (manager: BatteryManagerLike) => {
  const noPack =
    manager.charging &&
    manager.chargingTime === 0 &&
    manager.dischargingTime === Infinity;
  return !noPack;
};

const startSimulation = () => {
  if (simTimer !== null) return;

  const publishSimulated = () => {
    const stepsToFull = (1 - simLevel) / SIM_STEP;
    const stepsToEmpty = simLevel / SIM_STEP;
    publish({
      level: simLevel,
      charging: simCharging,
      chargingTime: simCharging ? Math.round((stepsToFull * SIM_TICK_MS) / 1000) : Infinity,
      dischargingTime: simCharging ? Infinity : Math.round((stepsToEmpty * SIM_TICK_MS) / 1000),
      source: 'simulated',
      hasBattery: true,
    });
  };

  publishSimulated();

  simTimer = setInterval(() => {
    simLevel = clamp01(simCharging ? simLevel + SIM_STEP : simLevel - SIM_STEP);
    if (simLevel >= 1) simCharging = false;
    if (simLevel <= 0.08) simCharging = true;
    publishSimulated();
  }, SIM_TICK_MS);
};

export const isLowBattery = (level: number, charging: boolean) =>
  level <= LOW_BATTERY_THRESHOLD && !charging;

export const formatBatteryTime = (seconds: number): string | null => {
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  if (seconds < 60) return 'Less than a minute';
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return `${hours}:${String(minutes).padStart(2, '0')}`;
};

export const describeCharge = (
  level: number,
  charging: boolean,
  chargingTime: number,
  dischargingTime: number,
) => {
  const remaining = formatBatteryTime(charging ? chargingTime : dischargingTime);
  if (remaining) return `${remaining} remaining`;
  if (level >= 0.995) return 'Fully charged';
  return 'Calculating…';
};
