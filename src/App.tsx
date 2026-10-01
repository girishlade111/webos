import React, { useState, useEffect } from 'react';
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
import { Monitor, X } from 'lucide-react';
import { startTimeMachineService, stopTimeMachineService } from './core/timeMachineStore';
import { ScreenSaver } from './shell/ScreenSaver';
import {
  startScreenSaverService,
  stopScreenSaverService,
  useScreenSaverStore,
} from './core/screenSaverStore';

export default function App() {
  const { osState, brightness } = useThemeStore();
  const [showMobileNotice, setShowMobileNotice] = useState<boolean>(false);

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

  useEffect(() => {
    const checkWidth = () => {
      if (window.innerWidth < 768) {
        setShowMobileNotice(true);
      }
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  return (
    <div
      style={{
        filter: brightness < 100 ? `brightness(${brightness / 100})` : 'none',
      }}
      className="relative h-screen w-screen overflow-hidden bg-black text-slate-100 font-sans select-none"
    >
      {/* Small Screen / Mobile Experience Notice */}
      {showMobileNotice && (
        <div className="fixed top-10 left-4 right-4 z-[99999] flex items-center justify-between rounded-xl border border-white/20 bg-neutral-900/95 p-3.5 shadow-2xl backdrop-blur-xl text-xs text-white">
          <div className="flex items-center gap-2.5">
            <Monitor size={18} className="text-blue-400 shrink-0" />
            <div>
              <p className="font-semibold">Best on Desktop</p>
              <p className="text-[11px] text-neutral-400">
                WebOS is optimized for desktop and tablet displays (1280px+).
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowMobileNotice(false)}
            className="rounded-full p-1 text-neutral-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* OS Lifecycle State Renderers */}
      {osState === 'booting' && <BootScreen />}
      {osState === 'locked' && <LoginScreen />}
      {osState === 'sleeping' && <SleepScreen />}
      {osState === 'shutdown' && <ShutdownScreen />}

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

          {/* Inactivity Screen Saver — topmost shell layer */}
          <ScreenSaver />
        </>
      )}
    </div>
  );
}
