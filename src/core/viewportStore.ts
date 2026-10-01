import { create } from 'zustand';

/**
 * Viewport / input-capability model.
 *
 * The shell is not a responsive website — it is a window manager. Shrinking the
 * viewport does not mean scaling the UI down; it means the *windowing model*
 * itself has to change. macOS solves this on iPad by dropping free-floating
 * overlapping windows for a single full-bleed app at a time, and we follow the
 * same rule here.
 */

export type Breakpoint = 'compact' | 'regular';

/** Matches the 768px threshold the shell already used for its "desktop only" notice. */
export const COMPACT_MAX_WIDTH = 768;

/** Apple HIG minimum comfortable hit target. Anything smaller needs padding. */
export const TOUCH_TARGET = 44;

export interface SafeArea {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface ViewportState {
  width: number;
  height: number;
  /** Coarse pointer (finger) vs fine (mouse/trackpad). */
  isTouch: boolean;
  /** < 768px — the window manager switches to single-window mode. */
  isCompact: boolean;
  /** Inset from notches / home indicators, in CSS px. */
  safeArea: SafeArea;

  measure: () => void;
}

/**
 * `env(safe-area-inset-*)` is only populated on notched devices, and only via
 * `viewport-fit=cover` in the document meta. Without that, every iOS inset
 * reads 0 — which is correct on a desktop browser, so the fallback is safe.
 */
const readSafeArea = (): SafeArea => {
  if (typeof window === 'undefined') return { top: 0, right: 0, bottom: 0, left: 0 };
  const styles = getComputedStyle(document.documentElement);
  const px = (name: string) => {
    const raw = styles.getPropertyValue(name).trim();
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) ? n : 0;
  };
  return {
    top: px('--webos-safe-top'),
    right: px('--webos-safe-right'),
    bottom: px('--webos-safe-bottom'),
    left: px('--webos-safe-left'),
  };
};

const readTouch = (): boolean => {
  if (typeof window === 'undefined') return false;
  /* Coarse primary pointer means a finger is the main input. iPad reports
     `pointer: fine` when a trackpad is attached, so this is deliberately based
     on the *primary* pointer rather than "any coarse pointer exists". */
  if (window.matchMedia('(pointer: coarse)').matches) return true;
  return 'ontouchstart' in window && navigator.maxTouchPoints > 0;
};

const initial = () => {
  if (typeof window === 'undefined') {
    return {
      width: 1440,
      height: 900,
      isTouch: false,
      isCompact: false,
      safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
    };
  }
  const width = window.innerWidth;
  const height = window.innerHeight;
  return {
    width,
    height,
    isTouch: readTouch(),
    isCompact: width < COMPACT_MAX_WIDTH,
    safeArea: readSafeArea(),
  };
};

export const useViewportStore = create<ViewportState>((set) => ({
  ...initial(),

  measure: () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    set({
      width,
      height,
      isCompact: width < COMPACT_MAX_WIDTH,
      isTouch: readTouch(),
      safeArea: readSafeArea(),
    });
  },
}));

/** Imperative read for non-React code (stores, event handlers). */
export const getViewport = () => useViewportStore.getState();

/**
 * Height available to a full-bleed window: the viewport minus the menu bar and
 * the inset reserved for the dock. Shared by the window manager and the frame
 * so both agree on where a maximized window ends.
 */
export const MENUBAR_HEIGHT = 28;
/** Dock height plus its bottom breathing room. */
export const DOCK_RESERVE = 92;

export const usableHeight = (v: { height: number; safeArea: SafeArea; isCompact: boolean }): number =>
  Math.max(200, v.height - MENUBAR_HEIGHT - (v.isCompact ? 0 : DOCK_RESERVE) - v.safeArea.top);
