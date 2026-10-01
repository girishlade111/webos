import React, { useEffect } from 'react';
import { useThemeStore } from './core/themeStore';
import { BootScreen } from './shell/BootScreen';
import { LoginScreen } from './shell/LoginScreen';
import { SleepScreen, ShutdownScreen } from './shell/PowerScreens';
import { MenuBar } from './shell/MenuBar';
import { Desktop } from './shell/Desktop';
import { WindowManager } from './shell/WindowManager';
import { Dock } from './shell/Dock';
import { Spotlight } from './shell/Spotlight';
import { ControlCenter } from './shell/ControlCenter';
import { VolumeHUD } from './shell/VolumeHUD';
import { NotificationCenter } from './shell/NotificationCenter';
import { MissionControl } from './shell/MissionControl';
import { Launchpad } from './shell/Launchpad';
import { AppSwitcher } from './shell/AppSwitcher';
import { startTimeMachineService, stopTimeMachineService } from './core/timeMachineStore';
import { ScreenSaver } from './shell/ScreenSaver';
import {
  startScreenSaverService,
  stopScreenSaverService,
  useScreenSaverStore,
} from './core/screenSaverStore';
import ShortcutManager from './shell/ShortcutManager';
import { ShortcutToast } from './shell/ShortcutToast';
import { useViewportStore } from './core/viewportStore';

export default function App() {
  const { osState, brightness } = useThemeStore();

  // Time Machine runs as an OS-level service: it keeps capturing snapshots on
  // schedule whether or not its window is open.
  useEffect(() => {
    startTimeMachineService();
    return () => stopTimeMachineService();
  }, []);

  // The idle watcher watches real input and only counts time while the user is
  // actually at the desktop — a screen saver during boot or on the lock screen
  // would be nonsense.
  useEffect(() => {
    const sync = () => {
      if (useThemeStore.getState().osState === 'desktop') {
        startScreenSaverService();
      } else {
        stopScreenSaverService();
        // Leaving the desktop (sleeping / shutting down) must not leave the
        // overlay stranded on top of the lock screen.
        const store = useScreenSaverStore.getState();
        if (store.isVisible) store.hide();
      }
    };

    sync();
    const unsubscribe = useThemeStore.subscribe((state, prev) => {
      if (state.osState !== prev.osState) sync();
    });

    return () => {
      unsubscribe();
      stopScreenSaverService();
    };
  }, []);

  /* Viewport measurement. A single subscriber drives compact-mode layout,
     touch sizing and safe-area insets across the whole shell. */
  useEffect(() => {
    const measure = useViewportStore.getState().measure;
    measure();

    const handle = () => measure();
    window.addEventListener('resize', handle);
    window.addEventListener('orientationchange', handle);
    // Mobile browser chrome collapsing on scroll changes the visual viewport
    // without firing a window resize.
    window.visualViewport?.addEventListener('resize', handle);
    return () => {
      window.removeEventListener('resize', handle);
      window.removeEventListener('orientationchange', handle);
      window.visualViewport?.removeEventListener('resize', handle);
    };
  }, []);

  return (
    <div
      style={{
        filter: brightness < 100 ? `brightness(${brightness / 100})` : 'none',
      }}
      className="relative h-screen w-screen overflow-hidden bg-black text-slate-100 font-sans select-none"
    >
      {/* OS Lifecycle State Renderers */}
      {osState === 'booting' && <BootScreen />}
      {osState === 'locked' && <LoginScreen />}
      {osState === 'sleeping' && <SleepScreen />}
      {osState === 'shutdown' && <ShutdownScreen />}

      {/* Global shortcut dispatcher — mounted first so it is always listening,
          even while an OS-level screen (boot / sleep) is covering the desktop. */}
      <ShortcutManager />

      {/* Main Desktop Operating System Shell */}
      {(osState === 'desktop' || osState === 'locked') && (
        <>
          {/* Top Menu Bar */}
          <MenuBar />

          {/* Desktop Canvas & Wallpapers */}
          <Desktop />

          {/* Window Manager */}
          <WindowManager />

          {/* Bottom Dock */}
          <Dock />

          {/* System Overlays */}
          <Spotlight />
          <ControlCenter />
          <VolumeHUD />
          <NotificationCenter />
          <MissionControl />
          <Launchpad />
          <AppSwitcher />

          {/* Shortcut confirmation toast */}
          <ShortcutToast />

          {/* Inactivity Screen Saver — topmost shell layer */}
          <ScreenSaver />
        </>
      )}
    </div>
  );
}
