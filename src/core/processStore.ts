import { create } from 'zustand';
import { WindowState } from '../types/os';
import { sound } from './sound';
import { useThemeStore } from './themeStore';
import { COMPACT_MAX_WIDTH, MENUBAR_HEIGHT } from './viewportStore';

const WINDOWS_STORAGE_KEY = 'webos_windows_v1';
const DOCK_PINNED_STORAGE_KEY = 'webos_dock_pinned_v3';

const DEFAULT_PINNED_APPS = [
  'finder',
  'launchpad',
  'browser',
  'notes',
  'reminders',
  'calendar',
  'photos',
  'music',
  'terminal',
  'settings',
];

interface SnapPreview {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'left' | 'right' | 'top' | null;
}

interface ProcessState {
  windows: WindowState[];
  focusedWindowId: string | null;
  runningAppIds: string[];
  pinnedAppIds: string[];
  bouncingAppId: string | null;
  snapPreview: SnapPreview | null;
  isAppSwitcherOpen: boolean;
  appSwitcherIndex: number;

  // Actions
  initializeWindows: () => void;
  openWindow: (appId: string, title?: string, bounds?: { w: number; h: number }, initialParams?: any) => string;
  closeWindow: (windowId: string) => void;
  quitApp: (appId: string) => void;
  focusWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  restoreWindow: (windowId: string) => void;
  toggleMaximize: (windowId: string) => void;
  updateWindowPosition: (windowId: string, x: number, y: number) => void;
  updateWindowSize: (windowId: string, width: number, height: number, x?: number, y?: number) => void;
  setSnapPreview: (preview: SnapPreview | null) => void;
  snapWindow: (windowId: string, side: 'left' | 'right' | 'top') => void;
  cycleWindows: (appIdOnly?: boolean, direction?: number) => void;
  setAppSwitcherOpen: (open: boolean) => void;
  cycleAppSwitcher: (direction?: number) => void;
  commitAppSwitcher: () => void;
  /** Switchable apps in display order (most-recently-used first). */
  getSwitcherApps: () => string[];
  setPinnedApps: (ids: string[]) => void;
  pinApp: (appId: string) => void;
  unpinApp: (appId: string) => void;
}

const getStoredPinned = (): string[] => {
  if (typeof window === 'undefined') return DEFAULT_PINNED_APPS;
  try {
    const s = localStorage.getItem(DOCK_PINNED_STORAGE_KEY);
    if (s) {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_PINNED_APPS;
};

let nextZIndex = 100;

export const useProcessStore = create<ProcessState>((set, get) => ({
  windows: [],
  focusedWindowId: null,
  runningAppIds: [],
  pinnedAppIds: getStoredPinned(),
  bouncingAppId: null,
  snapPreview: null,
  isAppSwitcherOpen: false,
  appSwitcherIndex: 0,

  initializeWindows: () => {
    // Default open Finder on desktop load
    const initialPinned = getStoredPinned();
    set({ pinnedAppIds: initialPinned });
    
    // Automatically launch Finder on initial boot
    setTimeout(() => {
      if (get().windows.length === 0) {
        get().openWindow('finder', 'Finder', { w: 780, h: 480 });
      }
    }, 400);
  },

  openWindow: (appId, title, bounds, initialParams) => {
    if (appId === 'launchpad') {
      useThemeStore.getState().toggleLaunchpad();
      return '';
    }

    const state = get();
    sound.playWindowOpen();

    // Check if single instance and already open
    const existing = state.windows.find((w) => w.appId === appId && !w.isMinimized);
    if (existing) {
      get().focusWindow(existing.id);
      return existing.id;
    }
    const minimizedExisting = state.windows.find((w) => w.appId === appId && w.isMinimized);
    if (minimizedExisting) {
      get().restoreWindow(minimizedExisting.id);
      return minimizedExisting.id;
    }

    // Trigger bounce animation for dock
    set({ bouncingAppId: appId });
    setTimeout(() => {
      if (get().bouncingAppId === appId) {
        set({ bouncingAppId: null });
      }
    }, 700);

    const screenW = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const compact = screenW < COMPACT_MAX_WIDTH;

    /* Compact viewports get one full-bleed app at a time, the way iPadOS drops
       free-floating windows entirely. Floating a 780px window on a 390px phone
       would leave it wider than the screen with no way to recover. */
    const requestedW = bounds?.w || 760;
    const requestedH = bounds?.h || 500;

    // Never let a window exceed the screen, at any size.
    const winW = Math.min(requestedW, screenW - 16);
    const winH = Math.min(requestedH, Math.max(240, screenH - MENUBAR_HEIGHT - 40));

    const fullBleed = compact;
    const startX = fullBleed
      ? 0
      : Math.max(20, Math.min(screenW - winW - 30, Math.floor((screenW - winW) / 2) + (state.windows.length % 6) * 28));
    const startY = fullBleed
      ? MENUBAR_HEIGHT
      : Math.max(40, Math.min(screenH - winH - 80, 70 + (state.windows.length % 6) * 28));

    nextZIndex += 1;
    const id = `win-${appId}-${Date.now()}`;
    const newWindow: WindowState = {
      id,
      appId,
      title: title || appId.toUpperCase(),
      x: startX,
      y: startY,
      width: fullBleed ? screenW : winW,
      height: fullBleed ? screenH - MENUBAR_HEIGHT : winH,
      isMinimized: false,
      isMaximized: fullBleed,
      isFocused: true,
      zIndex: nextZIndex,
      spaceId: 'space-0',
      initialParams,
    };

    const nextWindows = state.windows.map((w) => ({ ...w, isFocused: false })).concat(newWindow);
    const running = Array.from(new Set([...state.runningAppIds, appId]));

    set({
      windows: nextWindows,
      focusedWindowId: id,
      runningAppIds: running,
    });

    return id;
  },

  closeWindow: (windowId) => {
    sound.playWindowClose();
    set((state) => {
      const closing = state.windows.find((w) => w.id === windowId);
      if (!closing) return state;

      const remaining = state.windows.filter((w) => w.id !== windowId);
      const isAppStillRunning = remaining.some((w) => w.appId === closing.appId);
      const running = isAppStillRunning
        ? state.runningAppIds
        : state.runningAppIds.filter((id) => id !== closing.appId);

      let newFocusedId = state.focusedWindowId;
      if (state.focusedWindowId === windowId) {
        // focus the highest z-index remaining window
        const activeRemaining = remaining.filter((w) => !w.isMinimized);
        if (activeRemaining.length > 0) {
          activeRemaining.sort((a, b) => b.zIndex - a.zIndex);
          newFocusedId = activeRemaining[0].id;
        } else {
          newFocusedId = null;
        }
      }

      return {
        windows: remaining.map((w) => ({
          ...w,
          isFocused: w.id === newFocusedId,
        })),
        focusedWindowId: newFocusedId,
        runningAppIds: running,
      };
    });
  },

  quitApp: (appId) => {
    sound.playWindowClose();
    set((state) => {
      const remaining = state.windows.filter((w) => w.appId !== appId);
      const running = state.runningAppIds.filter((id) => id !== appId);
      let newFocusedId = state.focusedWindowId;

      if (!remaining.some((w) => w.id === newFocusedId)) {
        const visible = remaining.filter((w) => !w.isMinimized);
        if (visible.length > 0) {
          visible.sort((a, b) => b.zIndex - a.zIndex);
          newFocusedId = visible[0].id;
        } else {
          newFocusedId = null;
        }
      }

      return {
        windows: remaining.map((w) => ({
          ...w,
          isFocused: w.id === newFocusedId,
        })),
        focusedWindowId: newFocusedId,
        runningAppIds: running,
      };
    });
  },

  focusWindow: (windowId) => {
    const currentFocused = get().focusedWindowId;
    if (currentFocused !== windowId) {
      sound.playWindowFocus();
    }
    nextZIndex += 1;
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === windowId
          ? { ...w, isFocused: true, isMinimized: false, zIndex: nextZIndex }
          : { ...w, isFocused: false }
      ),
      focusedWindowId: windowId,
    }));
  },

  minimizeWindow: (windowId) => {
    sound.playWindowMinimize();
    set((state) => {
      const remainingVisible = state.windows.filter((w) => w.id !== windowId && !w.isMinimized);
      let nextFocus: string | null = null;
      if (remainingVisible.length > 0) {
        remainingVisible.sort((a, b) => b.zIndex - a.zIndex);
        nextFocus = remainingVisible[0].id;
      }

      return {
        windows: state.windows.map((w) =>
          w.id === windowId
            ? { ...w, isMinimized: true, isFocused: false }
            : w.id === nextFocus
            ? { ...w, isFocused: true }
            : w
        ),
        focusedWindowId: nextFocus,
      };
    });
  },

  restoreWindow: (windowId) => {
    sound.playWindowOpen();
    nextZIndex += 1;
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === windowId
          ? { ...w, isMinimized: false, isFocused: true, zIndex: nextZIndex, isRestoring: true }
          : { ...w, isFocused: false }
      ),
      focusedWindowId: windowId,
    }));
  },

  toggleMaximize: (windowId) => {
    sound.playWindowMaximize();
    set((state) => {
      const target = state.windows.find((w) => w.id === windowId);
      if (!target) return state;

      const screenW = typeof window !== 'undefined' ? window.innerWidth : 1280;
      const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;

      if (!target.isMaximized) {
        // Maximize
        const prevBounds = {
          x: target.x,
          y: target.y,
          width: target.width,
          height: target.height,
        };
        return {
          windows: state.windows.map((w) =>
            w.id === windowId
              ? {
                  ...w,
                  isMaximized: true,
                  prevBounds,
                  x: 0,
                  y: 28,
                  width: screenW,
                  height: screenH - 28,
                }
              : w
          ),
        };
      } else {
        // Restore
        const prev = target.prevBounds || {
          x: 100,
          y: 70,
          width: Math.min(800, screenW - 100),
          height: Math.min(520, screenH - 120),
        };
        return {
          windows: state.windows.map((w) =>
            w.id === windowId
              ? {
                  ...w,
                  isMaximized: false,
                  x: prev.x,
                  y: prev.y,
                  width: prev.width,
                  height: prev.height,
                }
              : w
          ),
        };
      }
    });
  },

  updateWindowPosition: (windowId, x, y) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === windowId ? { ...w, x, y, isMaximized: false } : w
      ),
    }));
  },

  updateWindowSize: (windowId, width, height, x, y) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === windowId
          ? {
              ...w,
              width,
              height,
              x: x !== undefined ? x : w.x,
              y: y !== undefined ? y : w.y,
              isMaximized: false,
            }
          : w
      ),
    }));
  },

  setSnapPreview: (snapPreview) => set({ snapPreview }),

  snapWindow: (windowId, side) => {
    sound.playWindowSnap();
    const screenW = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const topBarHeight = 28;

    let x = 0;
    let y = topBarHeight;
    let width = screenW;
    let height = screenH - topBarHeight;

    if (side === 'left') {
      width = Math.floor(screenW / 2);
    } else if (side === 'right') {
      x = Math.floor(screenW / 2);
      width = Math.ceil(screenW / 2);
    }

    set((state) => ({
      snapPreview: null,
      windows: state.windows.map((w) =>
        w.id === windowId
          ? {
              ...w,
              x,
              y,
              width,
              height,
              isMaximized: side === 'top',
              prevBounds: { x: w.x, y: w.y, width: w.width, height: w.height },
            }
          : w
      ),
    }));
  },

  cycleWindows: (appIdOnly?: boolean, direction = 1) => {
    const state = get();
    const visible = state.windows.filter((w) => !w.isMinimized);
    if (visible.length <= 1) return;

    let pool = visible;
    if (appIdOnly && state.focusedWindowId) {
      const curr = state.windows.find((w) => w.id === state.focusedWindowId);
      if (curr) {
        // ⌘` cycles *within* the frontmost app. If that app has a single window
        // macOS falls back to cycling across all apps rather than doing nothing.
        const sameApp = visible.filter((w) => w.appId === curr.appId);
        pool = sameApp.length > 1 ? sameApp : visible;
      }
    }
    if (pool.length <= 1) return;

    const currentIdx = pool.findIndex((w) => w.id === state.focusedWindowId);
    const nextIdx = (currentIdx + direction + pool.length) % pool.length;
    get().focusWindow(pool[nextIdx].id);
  },

  /**
   * Switchable apps in the order the ⌘Tab capsule displays them.
   *
   * macOS orders this row most-recently-used first, so the app you just left
   * sits at index 0 and each ⇥ tap walks *away* from it. Launch order would
   * look wrong here — after using Photos then Notes, ⌘Tab must land on Notes,
   * not on whichever app happened to open first.
   *
   * Finder is excluded: this shell keeps a Finder window open permanently, so
   * listing it would put a permanent, un-actionable entry at the head of the row.
   */
  getSwitcherApps: () => {
    const { windows, runningAppIds } = get();

    const frontZByApp = new Map<string, number>();
    windows.forEach((w) => {
      frontZByApp.set(w.appId, Math.max(frontZByApp.get(w.appId) ?? 0, w.zIndex));
    });

    return runningAppIds
      .filter((id) => id !== 'finder' && id !== 'launchpad')
      .sort((a, b) => (frontZByApp.get(b) ?? 0) - (frontZByApp.get(a) ?? 0));
  },

  setAppSwitcherOpen: (isAppSwitcherOpen) => {
    if (!isAppSwitcherOpen) {
      set({ isAppSwitcherOpen: false });
      return;
    }

    /* macOS selects the *next* app on the first ⇥ tap, not the current one, so
       opening lands one position ahead of whatever is focused. Anchoring to the
       focused app here (rather than to 0) is what makes repeated ⇥ taps feel
       like a rotation instead of a jump to the top of the list. */
    const apps = get().getSwitcherApps();
    const focusedAppId = get().windows.find((w) => w.id === get().focusedWindowId)?.appId;

    let startIndex = 0;
    if (apps.length > 1) {
      const idx = focusedAppId ? apps.indexOf(focusedAppId) : -1;
      // Single app running: stay put rather than wrapping onto itself.
      startIndex = idx === -1 ? 0 : (idx + 1) % apps.length;
    }

    set({ isAppSwitcherOpen: true, appSwitcherIndex: startIndex });
  },

  cycleAppSwitcher: (direction = 1) => {
    const apps = get().getSwitcherApps();
    if (apps.length <= 1) return;

    const current = get().appSwitcherIndex;
    const next = (current + direction + apps.length) % apps.length;
    set({ appSwitcherIndex: next });
  },

  /**
   * Activate the highlighted app and close the switcher. Called when ⌘ is
   * released, matching macOS: you hold the modifier and let go to commit.
   */
  commitAppSwitcher: () => {
    const apps = get().getSwitcherApps();
    const appId = apps[get().appSwitcherIndex];
    set({ isAppSwitcherOpen: false });
    if (!appId) return;

    /* Prefer the app's frontmost window. A minimized app is restored and
       focused — selecting a backgrounded app must bring it forward. */
    const owned = get().windows.filter((w) => w.appId === appId);
    if (owned.length === 0) return;

    const target = owned.reduce((best, w) => (!best || w.zIndex > best.zIndex ? w : best), owned[0]);

    const { restoreWindow, focusWindow } = get();
    if (target.isMinimized) restoreWindow(target.id);
    focusWindow(target.id);
  },

  setPinnedApps: (pinnedAppIds) => {
    localStorage.setItem(DOCK_PINNED_STORAGE_KEY, JSON.stringify(pinnedAppIds));
    set({ pinnedAppIds });
  },

  pinApp: (appId) => {
    const current = get().pinnedAppIds;
    if (current.includes(appId)) return;
    const updated = [...current, appId];
    localStorage.setItem(DOCK_PINNED_STORAGE_KEY, JSON.stringify(updated));
    set({ pinnedAppIds: updated });
  },

  unpinApp: (appId) => {
    const updated = get().pinnedAppIds.filter((id) => id !== appId);
    localStorage.setItem(DOCK_PINNED_STORAGE_KEY, JSON.stringify(updated));
    set({ pinnedAppIds: updated });
  },
}));
