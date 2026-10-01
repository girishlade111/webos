import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Chord,
  MODIFIER_GLYPH,
  ShortcutDef,
  chordFromEvent,
  formatChord,
  isTextEntryTarget,
  parseChord,
  serializeChord,
  useShortcutStore,
} from '../core/shortcutStore';
import { useThemeStore } from '../core/themeStore';
import { useProcessStore } from '../core/processStore';
import { eventBus } from '../core/eventBus';
import { sound } from '../core/sound';
import { useScreenSaverStore } from '../core/screenSaverStore';

/* ============================================================================
   macOS's own behaviour, encoded as a data table
   ========================================================================== */

/**
 * Bindings are registered from the stores directly rather than passed in as
 * props, so this table can be built at module scope without threading state
 * through the component tree. `getState()` is read at fire time, so the actions
 * always reflect current state.
 */
const buildShortcuts = (): ShortcutDef[] => {
  const theme = () => useThemeStore.getState();
  const proc = () => useProcessStore.getState();

  /** Quit the frontmost app, like ⌘Q. */
  const quitFrontmost = () => {
    const { windows, focusedWindowId, quitApp } = proc();
    const front = windows.find((w) => w.id === focusedWindowId) ?? windows.find((w) => !w.isMinimized);
    if (!front) return;
    sound.playWindowClose();
    quitApp(front.appId);
  };

  /** Hide = send every window of the frontmost app to the Dock, like ⌘H. */
  const hideFrontmost = () => {
    const { windows, focusedWindowId, quitApp, minimizeWindow } = proc();
    const front = windows.find((w) => w.id === focusedWindowId);
    if (!front) return;

    const owned = windows.filter((w) => w.appId === front.appId && !w.isMinimized);
    if (owned.length === 0) return;

    // Hiding the only window of an app quits it, which is what macOS does.
    if (owned.length === 1 && windows.length === 1) {
      sound.playWindowMinimize();
      quitApp(front.appId);
      return;
    }

    sound.playWindowMinimize();
    owned.forEach((w) => minimizeWindow(w.id));
  };

  return [
    /* --- Spotlight & Search --------------------------------------------- */
    {
      id: 'spotlight.toggle',
      chord: 'cmd+space',
      label: 'Spotlight',
      description: 'Open the Spotlight search bar',
      group: 'Spotlight & Search',
      scope: 'system',
      run: () => theme().toggleSpotlight(),
      allowInTextField: true,
      preventDefault: true,
    },
    {
      id: 'spotlight.window',
      chord: 'cmd+shift+space',
      label: 'Finder Search Window',
      description: 'Open a Finder search window',
      group: 'Spotlight & Search',
      scope: 'system',
      run: () => proc().openWindow('finder', 'Search', { w: 760, h: 480 }, { folderId: 'search' }),
      allowInTextField: true,
      preventDefault: true,
    },

    /* --- App Switching --------------------------------------------------- */
    {
      id: 'apps.next',
      chord: 'cmd+tab',
      label: 'Next Application',
      description: 'Switch to the next running application',
      group: 'App Switching',
      scope: 'system',
      run: () => {
        const { runningAppIds, setAppSwitcherOpen, cycleAppSwitcher } = proc();
        if (runningAppIds.length === 0) return;
        setAppSwitcherOpen(true);
        cycleAppSwitcher(1);
      },
      allowInTextField: true,
      preventDefault: true,
    },
    {
      id: 'apps.previous',
      chord: 'cmd+shift+tab',
      label: 'Previous Application',
      description: 'Switch to the previous running application',
      group: 'App Switching',
      scope: 'system',
      run: () => {
        const { runningAppIds, setAppSwitcherOpen, cycleAppSwitcher } = proc();
        if (runningAppIds.length === 0) return;
        setAppSwitcherOpen(true);
        cycleAppSwitcher(-1);
      },
      allowInTextField: true,
      preventDefault: true,
    },
    {
      id: 'apps.cycleWindows',
      chord: 'cmd+`',
      label: 'Cycle Windows',
      description: 'Cycle through windows of the frontmost application',
      group: 'App Switching',
      scope: 'system',
      run: () => proc().cycleWindows(true),
      allowInTextField: true,
      preventDefault: true,
    },
    {
      id: 'apps.quit',
      chord: 'cmd+q',
      label: 'Quit Application',
      description: 'Quit the frontmost application',
      group: 'App Switching',
      scope: 'system',
      run: quitFrontmost,
      allowInTextField: true,
      preventDefault: true,
    },
    {
      id: 'apps.hide',
      chord: 'cmd+h',
      label: 'Hide',
      description: 'Hide the frontmost application',
      group: 'App Switching',
      scope: 'system',
      run: hideFrontmost,
      allowInTextField: true,
      preventDefault: true,
    },

    /* --- Window Management ---------------------------------------------- */
    {
      id: 'window.close',
      chord: 'cmd+w',
      label: 'Close Window',
      description: 'Close the frontmost window',
      group: 'Window Management',
      scope: 'window',
      run: () => {
        const { focusedWindowId } = proc();
        if (focusedWindowId) eventBus.emit('request-close-window', focusedWindowId);
      },
      allowInTextField: true,
      preventDefault: true,
    },
    {
      id: 'window.minimize',
      chord: 'cmd+m',
      label: 'Minimize',
      description: 'Minimize the frontmost window to the Dock',
      group: 'Window Management',
      scope: 'window',
      run: () => {
        const { focusedWindowId } = proc();
        if (focusedWindowId) eventBus.emit('request-minimize-window', focusedWindowId);
      },
      allowInTextField: true,
      preventDefault: true,
    },
    {
      id: 'window.zoom',
      chord: 'cmd+ctrl+f',
      label: 'Zoom',
      description: 'Fill or unfill the screen with the frontmost window',
      group: 'Window Management',
      scope: 'window',
      run: () => {
        const { focusedWindowId, toggleMaximize } = proc();
        if (focusedWindowId) toggleMaximize(focusedWindowId);
      },
      allowInTextField: true,
      preventDefault: true,
    },
    {
      id: 'window.snapLeft',
      chord: 'cmd+alt+ArrowLeft',
      label: 'Snap Left',
      description: 'Snap the window to the left half of the screen',
      group: 'Window Management',
      scope: 'window',
      run: () => {
        const { focusedWindowId, snapWindow } = proc();
        if (focusedWindowId) snapWindow(focusedWindowId, 'left');
      },
      preventDefault: true,
    },
    {
      id: 'window.snapRight',
      chord: 'cmd+alt+ArrowRight',
      label: 'Snap Right',
      description: 'Snap the window to the right half of the screen',
      group: 'Window Management',
      scope: 'window',
      run: () => {
        const { focusedWindowId, snapWindow } = proc();
        if (focusedWindowId) snapWindow(focusedWindowId, 'right');
      },
      preventDefault: true,
    },
    {
      id: 'window.snapTop',
      chord: 'cmd+alt+ArrowUp',
      label: 'Snap to Top',
      description: 'Snap the window to the top of the screen',
      group: 'Window Management',
      scope: 'window',
      run: () => {
        const { focusedWindowId, snapWindow } = proc();
        if (focusedWindowId) snapWindow(focusedWindowId, 'top');
      },
      preventDefault: true,
    },
    {
      id: 'window.settings',
      chord: 'cmd+,',
      label: 'System Settings',
      description: 'Open System Settings for the frontmost application',
      group: 'Window Management',
      scope: 'system',
      run: () => proc().openWindow('settings'),
      allowInTextField: true,
      preventDefault: true,
    },

    /* --- System ------------------------------------------------------------ */
    {
      id: 'system.lock',
      chord: 'ctrl+cmd+q',
      label: 'Lock Screen',
      description: 'Return to the login screen',
      group: 'System',
      scope: 'system',
      run: () => {
        sound.playClick();
        theme().setOSState('locked');
      },
      allowInTextField: true,
      preventDefault: true,
    },
    {
      id: 'system.volumeUp',
      chord: 'cmd+ArrowUp',
      label: 'Volume Up',
      description: 'Turn the output volume up',
      group: 'System',
      scope: 'system',
      run: () => {
        const { adjustVolume, showVolumeHud } = theme();
        adjustVolume(6);
        showVolumeHud();
      },
      allowInTextField: true,
      preventDefault: true,
    },
    {
      id: 'system.volumeDown',
      chord: 'cmd+ArrowDown',
      label: 'Volume Down',
      description: 'Turn the output volume down',
      group: 'System',
      scope: 'system',
      run: () => {
        const { adjustVolume, showVolumeHud } = theme();
        adjustVolume(-6);
        showVolumeHud();
      },
      allowInTextField: true,
      preventDefault: true,
    },
    {
      id: 'system.mute',
      chord: 'cmd+shift+m',
      label: 'Mute',
      description: 'Mute or unmute the system output',
      group: 'System',
      scope: 'system',
      run: () => theme().toggleSound(),
      allowInTextField: true,
      preventDefault: true,
    },
    {
      id: 'system.screenSaver',
      chord: 'cmd+shift+s',
      label: 'Start Screen Saver',
      description: 'Begin the screen saver immediately',
      group: 'System',
      scope: 'system',
      run: () => useScreenSaverStore.getState().engage(false),
      allowInTextField: true,
      preventDefault: true,
    },

    /* --- Mission Control & Spaces ------------------------------------------ */
    {
      id: 'spaces.missionControl',
      chord: 'f3',
      label: 'Mission Control',
      description: 'Show all windows in Mission Control',
      group: 'Mission Control & Spaces',
      scope: 'system',
      run: () => theme().toggleMissionControl(),
      preventDefault: true,
    },
    {
      id: 'spaces.launchpad',
      chord: 'f4',
      label: 'Launchpad',
      description: 'Show the application launcher',
      group: 'Mission Control & Spaces',
      scope: 'system',
      run: () => theme().toggleLaunchpad(),
      preventDefault: true,
    },
  ];
};

/* ============================================================================
   Component
   ========================================================================== */

/**
 * Owns the one and only global keydown/keyup listener for the shell.
 *
 * Every other component previously registered its own listener, which meant
 * bindings could double-fire or be swallowed depending on mount order. One
 * dispatcher with a single registry removes that class of bug entirely.
 */
export const ShortcutManager: React.FC = () => {
  const shortcuts = useMemo(buildShortcuts, []);

  const overrides = useShortcutStore((s) => s.overrides);
  const markPressed = useShortcutStore((s) => s.markPressed);
  const clearPressed = useShortcutStore((s) => s.clearPressed);
  const reportFired = useShortcutStore((s) => s.reportFired);

  /* Resolve overrides into a lookup map. Rebinding a shortcut only changes
     which chord maps to it, so the map is rebuilt when overrides change. */
  const chordMap = useMemo(() => {
    const map = new Map<string, ShortcutDef>();
    shortcuts.forEach((def) => {
      const chord = overrides[def.id] ?? def.chord;
      // First registration wins, so a later duplicate can't shadow an earlier
      // binding — predictable beats last-writer-wins here.
      if (!map.has(chord)) map.set(chord, def);
    });
    return map;
  }, [shortcuts, overrides]);

  /* Escape is handled here rather than as a registry entry because it has no
     chord modifiers and must always win, including while a menu is open. */
  const closeAllOverlays = useThemeStore((s) => s.closeAllOverlays);
  const setAppSwitcherOpen = useProcessStore((s) => s.setAppSwitcherOpen);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const store = useShortcutStore.getState();

      // Track held modifiers for the hint overlay on every event.
      store.setHeld({
        cmd: e.metaKey || (e.ctrlKey && !e.altKey),
        shift: e.shiftKey,
        alt: e.altKey,
        ctrl: e.ctrlKey,
      });

      /* While a binding is being re-recorded the pane owns the keyboard. The
         recorder lives in a settings window that may not hold DOM focus, so it
         listens at the window level — handing over entirely is the only way to
         stop the chord being captured from also firing the old binding. */
      if (store.recordingId) return;

      // Escape: dismiss overlays. Registered here so it beats everything,
      // including the ContextMenu's own capture-phase listener.
      if (e.key === 'Escape') {
        closeAllOverlays();
        setAppSwitcherOpen(false);
        e.preventDefault();
        return;
      }

      const chord = chordFromEvent(e);
      if (!chord) return;

      const serialized = serializeChord(chord);
      const def = chordMap.get(serialized);
      if (!def) return;

      // Fire once per physical press, not on auto-repeat.
      if (e.repeat) {
        e.preventDefault();
        return;
      }
      if (store.isPressed(serialized)) {
        e.preventDefault();
        return;
      }

      // Suppress bindings that would corrupt typed text, unless the binding is
      // explicitly safe in a text field.
      const inTextField = isTextEntryTarget(e.target);
      if (inTextField && !def.allowInTextField) return;

      markPressed(serialized);
      if (def.preventDefault) e.preventDefault();
      reportFired(def.chord, def.label);

      try {
        def.run(e);
      } catch {
        // A misbehaving binding must never break the keyboard for everything else.
      }
    },
    [chordMap, closeAllOverlays, setAppSwitcherOpen, markPressed, reportFired],
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      const store = useShortcutStore.getState();

      store.setHeld({
        cmd: e.metaKey || (e.ctrlKey && !e.altKey),
        shift: e.shiftKey,
        alt: e.altKey,
        ctrl: e.ctrlKey,
      });

      if (e.key === 'Meta' || e.key === 'Control') {
        // Releasing the command key commits the app switcher, exactly as macOS
        // does: you hold ⌘, tap ⇥ repeatedly, then let go to activate.
        const proc = useProcessStore.getState();
        if (proc.isAppSwitcherOpen) {
          proc.commitAppSwitcher();
        }
      }

      // Clear the pressed latch for this exact chord.
      if (e.key === 'Meta' || e.key === 'Control' || e.key === 'Shift' || e.key === 'Alt') {
        // A modifier release can complete a chord; clear everything still held.
        Object.keys(store.pressed).forEach((c) => clearPressed(c));
        return;
      }

      const chord = chordFromEvent(e);
      if (chord) clearPressed(serializeChord(chord));
    },
    [clearPressed],
  );

  /* Losing focus must not leave a modifier stuck on in the overlay. */
  const handleBlur = useCallback(() => {
    const store = useShortcutStore.getState();
    store.setHeld({ cmd: false, shift: false, alt: false, ctrl: false });
    Object.keys(store.pressed).forEach((c) => store.clearPressed(c));
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [handleKeyDown, handleKeyUp, handleBlur]);

  return null;
};

export default ShortcutManager;

/* Re-exported for the settings pane, which renders the same table. */
export { buildShortcuts };
