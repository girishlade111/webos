import { create } from 'zustand';
import { sound } from './sound';

/** Visual styles the screen saver can render. */
export type ScreenSaverVariant = 'logo' | 'aurora' | 'starfield' | 'ripple';

/**
 * Lifecycle of the screen saver overlay.
 *
 * macOS does not cut to black: it first dims the display, then cross-fades the
 * saver in on top of the dimmed desktop. We model the same four phases so the
 * transition timings can be tuned independently.
 */
export type ScreenSaverPhase = 'inactive' | 'dimming' | 'active' | 'waking';

export interface ScreenSaverSettings {
  enabled: boolean;
  /** Idle time before the saver engages. Default 5 minutes. */
  idleDelayMs: number;
  variant: ScreenSaverVariant;
  /** Show the large centred macOS-style clock + date over the artwork. */
  showClock: boolean;
  /** Send the user to the login screen after the saver is dismissed. */
  lockOnWake: boolean;
}

/** Phase durations (ms) — tuned to match macOS's cross-fades. */
export const DIM_DURATION = 900;
export const WAKE_DURATION = 650;

const STORAGE_KEY = 'webos_screen_saver_v1';

export const SCREEN_SAVER_VARIANTS: {
  id: ScreenSaverVariant;
  name: string;
  hint: string;
}[] = [
  { id: 'logo', name: 'WebOS Logo', hint: 'Floating mark with concentric light rings' },
  { id: 'aurora', name: 'Aurora', hint: 'Slow drifting gradient curtains' },
  { id: 'starfield', name: 'Starfield', hint: 'Deep space parallax with warp streaks' },
  { id: 'ripple', name: 'Ripple', hint: 'Expanding water-like interference rings' },
];

/** Presets offered in System Settings, mirroring macOS's dropdown. */
export const IDLE_DELAY_PRESETS: { label: string; value: number }[] = [
  { label: '1 minute', value: 60_000 },
  { label: '2 minutes', value: 120_000 },
  { label: '3 minutes', value: 180_000 },
  { label: '5 minutes', value: 300_000 },
  { label: '10 minutes', value: 600_000 },
  { label: '15 minutes', value: 900_000 },
  { label: 'Never', value: Number.POSITIVE_INFINITY },
];

export const DEFAULT_SCREEN_SAVER_SETTINGS: ScreenSaverSettings = {
  enabled: true,
  idleDelayMs: 300_000,
  variant: 'logo',
  showClock: true,
  lockOnWake: false,
};

const loadSettings = (): ScreenSaverSettings => {
  if (typeof window === 'undefined') return DEFAULT_SCREEN_SAVER_SETTINGS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_SCREEN_SAVER_SETTINGS, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_SCREEN_SAVER_SETTINGS;
};

const persist = (settings: ScreenSaverSettings) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
};

interface ScreenSaverState extends ScreenSaverSettings {
  phase: ScreenSaverPhase;
  /** True while the overlay should be mounted (dimming/active/waking). */
  isVisible: boolean;
  /** Distinguishes a real idle engagement from a Settings preview. */
  isPreview: boolean;
  /** Monotonic token bumped on every engagement so views can restart anims. */
  sessionNonce: number;
  /** Seconds left before engagement; drives the idle hint in the menu bar. */
  idleRemainingMs: number;

  engage: (preview?: boolean) => void;
  dismiss: () => void;
  hide: () => void;
  enterActivePhase: () => void;
  setSettings: (patch: Partial<ScreenSaverSettings>) => void;
  resetSettings: () => void;
  tick: () => void;
}

const initialSettings = loadSettings();

export const useScreenSaverStore = create<ScreenSaverState>((set, get) => ({
  ...initialSettings,
  phase: 'inactive',
  isVisible: false,
  isPreview: false,
  sessionNonce: 0,
  idleRemainingMs: initialSettings.idleDelayMs,

  engage: (preview = false) => {
    const { phase, isVisible } = get();
    // Already showing (or fading in) — don't restart the transition.
    if (isVisible && !preview) return;

    sound.playClick();
    set({
      phase: 'dimming',
      isVisible: true,
      isPreview: preview,
      sessionNonce: get().sessionNonce + 1,
      idleRemainingMs: 0,
    });

    // A preview shortens the dim so it feels instant to inspect.
    window.setTimeout(() => get().enterActivePhase(), preview ? 120 : DIM_DURATION);
  },

  enterActivePhase: () => {
    if (get().phase === 'dimming') set({ phase: 'active' });
  },

  dismiss: () => {
    const { phase } = get();
    if (phase !== 'active' && phase !== 'dimming') return;
    set({ phase: 'waking' });
    window.setTimeout(() => get().hide(), WAKE_DURATION);
  },

  hide: () => {
    set({ phase: 'inactive', isVisible: false, isPreview: false });
  },

  setSettings: (patch) => {
    set((state) => {
      const next = { ...pickSettings(state), ...patch };
      persist(next);
      return { ...patch, idleRemainingMs: patch.idleDelayMs ?? state.idleDelayMs };
    });
  },

  resetSettings: () => {
    persist(DEFAULT_SCREEN_SAVER_SETTINGS);
    set({
      ...DEFAULT_SCREEN_SAVER_SETTINGS,
      idleRemainingMs: DEFAULT_SCREEN_SAVER_SETTINGS.idleDelayMs,
    });
  },

  tick: () => {
    const { idleDelayMs, enabled, phase } = get();
    if (!enabled || phase !== 'inactive') return;
    set({ idleRemainingMs: idleDelayMs });
  },
}));

const pickSettings = (s: ScreenSaverState): ScreenSaverSettings => ({
  enabled: s.enabled,
  idleDelayMs: s.idleDelayMs,
  variant: s.variant,
  showClock: s.showClock,
  lockOnWake: s.lockOnWake,
});

/* -------------------------------------------------------------------------- */
/* Idle watcher service                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Tracks real user input (pointer, keyboard, wheel, touch, scroll, focus) and
 * engages the screen saver once the machine has been quiet for `idleDelayMs`.
 *
 * Activity timestamps live in a ref rather than store state: mousemove can fire
 * dozens of times a second and must never trigger a React re-render.
 */
class ScreenSaverIdleService {
  private lastActivity = Date.now();
  private intervalId: number | null = null;
  private timerId: number | null = null;
  /** Pointer positions, to ignore sub-pixel jitter from a resting hand. */
  private lastPointer = { x: -1, y: -1 };

  /** Pointer travel (px) required to count as "real" movement while awake. */
  private static readonly WAKE_THRESHOLD = 6;

  private readonly onActivity = () => {
    this.lastActivity = Date.now();
    const store = useScreenSaverStore.getState();

    if (store.phase === 'active' || store.phase === 'dimming') {
      store.dismiss();
    } else {
      // Re-arm the countdown without re-rendering the whole shell.
      store.setState({ idleRemainingMs: store.idleDelayMs });
    }
  };

  private readonly onPointerMove = (e: PointerEvent) => {
    const store = useScreenSaverStore.getState();
    const moved =
      Math.abs(e.clientX - this.lastPointer.x) + Math.abs(e.clientY - this.lastPointer.y);

    if (this.lastPointer.x === -1) this.lastPointer = { x: e.clientX, y: e.clientY };

    if (store.phase === 'active' || store.phase === 'dimming') {
      // macOS wakes on genuine movement, not on a 1px jitter from a resting mouse.
      if (moved >= ScreenSaverIdleService.WAKE_THRESHOLD) {
        this.lastPointer = { x: e.clientX, y: e.clientY };
        this.onActivity();
      }
      return;
    }

    this.lastPointer = { x: e.clientX, y: e.clientY };
    this.onActivity();
  };

  private readonly onVisibilityChange = () => {
    // Returning to a backgrounded tab should not instantly fire the saver.
    if (document.visibilityState === 'visible') this.lastActivity = Date.now();
  };

  private start() {
    if (this.intervalId !== null) return;

    const events: (keyof WindowEventMap)[] = [
      'pointermove',
      'pointerdown',
      'keydown',
      'keyup',
      'wheel',
      'touchstart',
      'touchmove',
      'focus',
    ];

    events.forEach((evt) => window.addEventListener(evt, this.onActivity, { passive: true }));
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    this.lastActivity = Date.now();

    // 1 Hz heartbeat — cheap, and the countdown is only shown in menus.
    this.intervalId = window.setInterval(() => {
      const store = useScreenSaverStore.getState();
      if (!store.enabled || store.isPreview) return;
      if (store.phase !== 'inactive') return;

      const idleFor = Date.now() - this.lastActivity;
      const remaining = Math.max(0, store.idleDelayMs - idleFor);

      if (remaining !== store.idleRemainingMs) {
        useScreenSaverStore.setState({ idleRemainingMs: remaining });
      }

      if (idleFor >= store.idleDelayMs) {
        store.engage(false);
      }
    }, 1000);
  }

  private stop() {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }

    const events: (keyof WindowEventMap)[] = [
      'pointermove',
      'pointerdown',
      'keydown',
      'keyup',
      'wheel',
      'touchstart',
      'touchmove',
      'focus',
    ];

    events.forEach((evt) => window.removeEventListener(evt, this.onActivity));
    window.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  /** Reset the countdown from outside the service (e.g. after a wake). */
  reset() {
    this.lastActivity = Date.now();
  }
}

export const screenSaverIdle = new ScreenSaverIdleService();

export const startScreenSaverService = () => screenSaverIdle.start();
export const stopScreenSaverService = () => screenSaverIdle.stop();
