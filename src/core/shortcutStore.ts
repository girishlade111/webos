import { create } from 'zustand';

/* ============================================================================
   Chord model
   A chord is a modifier signature plus a non-modifier key, stored as a sorted,
   order-independent string like "cmd+shift+Tab". Sorting the modifiers is what
   lets Cmd+Shift+Tab and Shift+Cmd+Tab resolve to the same binding.
   ========================================================================== */

export type Modifier = 'cmd' | 'shift' | 'alt' | 'ctrl';

/** Apple's canonical modifier display order (also the menu-bar order). */
export const MODIFIER_ORDER: Modifier[] = ['ctrl', 'alt', 'shift', 'cmd'];

/** macOS menu-bar glyphs. These are the exact codepoints Apple uses. */
export const MODIFIER_GLYPH: Record<Modifier, string> = {
  ctrl: '⌃', // ⌃
  alt: '⌥', // ⌥
  shift: '⇧', // ⇧
  cmd: '⌘', // ⌘
};

/** Named-key glyphs, matching the macOS Keyboard Shortcuts pane. */
const KEY_GLYPH: Record<string, string> = {
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
  space: 'Space',
  tab: '⇥',
  escape: 'esc',
  enter: '↩',
  backspace: '⌫',
  delete: '⌦',
  home: '↖',
  end: '↘',
  pageup: '⇞',
  pagedown: '⇟',
  capslock: '⇪',
  '`': '`',
  '\\': '\\',
};

const isModifierKey = (key: string): boolean =>
  key === 'Meta' || key === 'Control' || key === 'Shift' || key === 'Alt';

/** True for keys that must never be swallowed by a shortcut while typing. */
const isTextual = (key: string): boolean => key.length === 1 || key === 'Space' || key === 'Enter';

export interface Chord {
  mods: Modifier[];
  key: string;
}

/**
 * Build a chord from a live keydown event.
 *
 * `Cmd` is treated as meta OR ctrl so the same bindings work on macOS and on
 * Windows/Linux browsers, matching the convention already used elsewhere in the
 * shell. Returns null for bare modifier presses — those are handled separately
 * to drive the held-modifier UI.
 */
export const chordFromEvent = (e: KeyboardEvent): Chord | null => {
  if (isModifierKey(e.key)) return null;

  const mods: Modifier[] = [];
  // Ctrl doubles as Cmd on non-Apple keyboards, but only when Meta is absent.
  if (e.metaKey) mods.push('cmd');
  else if (e.ctrlKey) mods.push('cmd');
  if (e.altKey) mods.push('alt');
  if (e.shiftKey) mods.push('shift');

  return { mods, key: normalizeKey(e) };
};

/**
 * Normalize a key to a stable id.
 *
 * `code` is layout-independent, but it is unreliable for a few keys that matter
 * here: ⌘` and ⌘\ both report `Backquote` on US layouts, so they would collide
 * into one binding. Those are resolved from `key` first; everything else uses
 * `code` so the bindings survive a Dvorak/AZERTY remap.
 */
const normalizeKey = (e: KeyboardEvent): string => {
  // Backtick and backslash share a physical key on US layouts but are distinct
  // shortcuts on macOS (⌘` cycles windows, ⌘\ is a system binding).
  if (e.key === '`' || e.key === '\\') return e.key;

  if (e.code) {
    if (e.code.startsWith('Key') || e.code.startsWith('Digit')) {
      return e.code.replace(/^Key|^Digit/, '').toLowerCase();
    }
  }
  return e.key.toLowerCase();
};

/** Canonical string form, e.g. "cmd+shift+Tab". */
export const serializeChord = (chord: Chord): string => {
  const mods = MODIFIER_ORDER.filter((m) => chord.mods.includes(m));
  return [...mods, chord.key].join('+');
};

export const parseChord = (serialized: string): Chord | null => {
  const parts = serialized.split('+');
  if (parts.length === 0) return null;
  const key = parts[parts.length - 1];
  const mods = parts.slice(0, -1) as Modifier[];
  return { mods, key };
};

/**
 * Render a chord the way the macOS menus and Keyboard Shortcuts pane do:
 * modifier glyphs first in Apple order, then the key, with no separators.
 */
export const formatChord = (chord: Chord | string): string => {
  const c = typeof chord === 'string' ? parseChord(chord) : chord;
  if (!c) return '';

  const mods = MODIFIER_ORDER.filter((m) => c.mods.includes(m)).map((m) => MODIFIER_GLYPH[m]);
  const key = c.key.toLowerCase();
  const glyph = KEY_GLYPH[key];

  if (glyph) return [...mods, glyph].join('');
  // Single characters render as-is; F-keys keep their number.
  return [...mods, key.length === 1 ? key.toUpperCase() : key].join('');
};

/** Spaced variant used in the settings list so glyphs stay legible. */
export const formatChordParts = (chord: Chord | string): string[] => {
  const c = typeof chord === 'string' ? parseChord(chord) : chord;
  if (!c) return [];
  const mods = MODIFIER_ORDER.filter((m) => c.mods.includes(m)).map((m) => MODIFIER_GLYPH[m]);
  const key = c.key.toLowerCase();
  return [...mods, KEY_GLYPH[key] ?? (key.length === 1 ? key.toUpperCase() : key)];
};

/* ============================================================================
   Registry
   ========================================================================== */

export type ShortcutScope =
  /** Always available. */
  | 'system'
  /** Only while a window is focused. */
  | 'window'
  /** Only while a text field has focus. */
  | 'text';

export interface ShortcutDef {
  id: string;
  chord: string;
  label: string;
  /** Shown in System Settings to explain what the binding does. */
  description: string;
  /** Grouping for the settings pane — mirrors macOS's shortcut categories. */
  group: string;
  scope: ShortcutScope;
  /** Runs the action. Receives the originating event. */
  run: (e: KeyboardEvent) => void;
  /**
   * When true the binding fires even with a text field focused. macOS keeps
   * window management alive while typing but suppresses bare text keys.
   */
  allowInTextField?: boolean;
  /** When true the manager calls preventDefault (needed to beat browser defaults). */
  preventDefault?: boolean;
}

/** Settings-pane categories, in macOS's own order. */
export const SHORTCUT_GROUPS = [
  'Spotlight & Search',
  'App Switching',
  'Window Management',
  'System',
  'Mission Control & Spaces',
] as const;

/* ============================================================================
   Live state
   ========================================================================== */

/** Snapshot of every modifier currently held, for the hint overlay. */
export interface HeldModifiers {
  cmd: boolean;
  shift: boolean;
  alt: boolean;
  ctrl: boolean;
}

interface ShortcutState {
  held: HeldModifiers;
  /** Chords that are down right now — lets us fire once per physical press. */
  pressed: Record<string, boolean>;
  /** The most recent binding to fire, for the transient HUD. */
  lastFired: { chord: string; label: string; nonce: number } | null;
  /** Set while ⌘ is held so the menu bar can surface shortcut hints. */
  isCommandHeld: boolean;
  /** Custom rebinds, keyed by shortcut id. */
  overrides: Record<string, string>;
  /**
   * The shortcut currently being re-recorded, or null. While set, the global
   * dispatcher stands down so the recorder owns the keyboard — otherwise the
   * very chord being captured would also fire the old binding.
   */
  recordingId: string | null;

  setHeld: (held: HeldModifiers) => void;
  markPressed: (chord: string) => void;
  clearPressed: (chord: string) => void;
  isPressed: (chord: string) => boolean;
  reportFired: (chord: string, label: string) => void;
  clearFired: () => void;
  setOverride: (id: string, chord: string | null) => void;
  getChord: (id: string, fallback: string) => string;
  setRecordingId: (id: string | null) => void;
}

const OVERRIDES_KEY = 'webos_shortcut_overrides_v1';

const loadOverrides = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const persistOverrides = (overrides: Record<string, string>) => {
  try {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {}
};

export const useShortcutStore = create<ShortcutState>((set, get) => ({
  held: { cmd: false, shift: false, alt: false, ctrl: false },
  pressed: {},
  lastFired: null,
  isCommandHeld: false,
  overrides: loadOverrides(),
  recordingId: null,

  setHeld: (held) => set({ held, isCommandHeld: held.cmd }),

  markPressed: (chord) => set((s) => ({ pressed: { ...s.pressed, [chord]: true } })),

  clearPressed: (chord) =>
    set((s) => {
      if (!s.pressed[chord]) return s;
      const next = { ...s.pressed };
      delete next[chord];
      return { pressed: next };
    }),

  isPressed: (chord) => Boolean(get().pressed[chord]),

  reportFired: (chord, label) =>
    set((s) => ({ lastFired: { chord, label, nonce: (s.lastFired?.nonce ?? 0) + 1 } })),

  clearFired: () => set({ lastFired: null }),

  setOverride: (id, chord) => {
    const next = { ...get().overrides };
    if (chord === null) delete next[id];
    else next[id] = chord;
    persistOverrides(next);
    set({ overrides: next });
  },

  getChord: (id, fallback) => get().overrides[id] ?? fallback,

  setRecordingId: (recordingId) => set({ recordingId }),
}));

/* ============================================================================
   Held-modifier tracking
   ========================================================================== */

const readHeld = (e: KeyboardEvent): HeldModifiers => ({
  cmd: e.metaKey || (e.ctrlKey && !e.altKey),
  shift: e.shiftKey,
  alt: e.altKey,
  // A bare Ctrl is only distinguishable from Cmd when Meta is not also down.
  ctrl: e.ctrlKey && !e.metaKey && !e.altKey ? false : e.ctrlKey,
});

/** True when the event target is a text-entry surface. */
export const isTextEntryTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
};

/**
 * Whether a binding should be allowed to fire given the current focus.
 * Text fields suppress everything except bindings explicitly marked safe.
 */
export const isBindingAllowed = (
  def: Pick<ShortcutDef, 'scope' | 'allowInTextField'>,
  inTextField: boolean,
): boolean => {
  if (!inTextField) return true;
  return Boolean(def.allowInTextField);
};

export { isModifierKey, isTextual };
