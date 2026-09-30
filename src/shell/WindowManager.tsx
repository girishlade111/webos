import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProcessStore } from '../core/processStore';
import { useThemeStore } from '../core/themeStore';
import { WindowFrame } from './WindowFrame';
import { eventBus } from '../core/eventBus';

export const WindowManager: React.FC = () => {
  const {
    windows, focusedWindowId, snapPreview, closeWindow, minimizeWindow,
    initializeWindows, setAppSwitcherOpen, cycleAppSwitcher, snapWindow, toggleMaximize
  } = useProcessStore();

  const {
    toggleSpotlight, toggleMissionControl, toggleLaunchpad,
    closeAllOverlays, isSpotlightOpen, isLaunchpadOpen, isMissionControlOpen
  } = useThemeStore();

  // Initialize default window session on first load
  useEffect(() => {
    initializeWindows();
  }, [initializeWindows]);

  // Global Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // Spotlight: Cmd/Ctrl + Space
      if (isCmdOrCtrl && e.code === 'Space') {
        e.preventDefault();
        toggleSpotlight();
        return;
      }

      // App Switcher: Cmd/Ctrl + Tab
      if (isCmdOrCtrl && e.key === 'Tab') {
        e.preventDefault();
        setAppSwitcherOpen(true);
        cycleAppSwitcher();
        return;
      }

      // Snap Window Keyboard Shortcuts (macOS Sequoia / Magnet / Rectangle style)
      // Ctrl + Option + Left Arrow OR Cmd + Option + Left Arrow -> Snap Left Half
      if (focusedWindowId && (e.ctrlKey || isCmdOrCtrl) && e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        snapWindow(focusedWindowId, 'left');
        return;
      }

      // Ctrl + Option + Right Arrow OR Cmd + Option + Right Arrow -> Snap Right Half
      if (focusedWindowId && (e.ctrlKey || isCmdOrCtrl) && e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        snapWindow(focusedWindowId, 'right');
        return;
      }

      // Ctrl + Option + Up Arrow -> Maximize
      if (focusedWindowId && (e.ctrlKey || isCmdOrCtrl) && e.altKey && e.key === 'ArrowUp') {
        e.preventDefault();
        toggleMaximize(focusedWindowId);
        return;
      }

      // Close Window: Cmd/Ctrl + W (Animated)
      if (isCmdOrCtrl && (e.key === 'w' || e.key === 'W')) {
        e.preventDefault();
        if (focusedWindowId) {
          eventBus.emit('request-close-window', focusedWindowId);
        }
        return;
      }

      // Minimize Window: Cmd/Ctrl + M (Animated)
      if (isCmdOrCtrl && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        if (focusedWindowId) {
          eventBus.emit('request-minimize-window', focusedWindowId);
        }
        return;
      }

      // Mission Control: F3 or Ctrl + ArrowUp
      if (e.key === 'F3' || (e.ctrlKey && e.key === 'ArrowUp')) {
        e.preventDefault();
        toggleMissionControl();
        return;
      }

      // Launchpad: F4 or Cmd + Shift + L
      if (e.key === 'F4' || (isCmdOrCtrl && e.shiftKey && (e.key === 'l' || e.key === 'L'))) {
        e.preventDefault();
        toggleLaunchpad();
        return;
      }

      // Escape closes overlays
      if (e.key === 'Escape') {
        if (isSpotlightOpen || isLaunchpadOpen || isMissionControlOpen) {
          closeAllOverlays();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Meta' || e.key === 'Control') {
        setAppSwitcherOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    focusedWindowId, closeWindow, minimizeWindow, toggleSpotlight,
    toggleMissionControl, toggleLaunchpad, closeAllOverlays,
    isSpotlightOpen, isLaunchpadOpen, isMissionControlOpen,
    setAppSwitcherOpen, cycleAppSwitcher, snapWindow, toggleMaximize
  ]);

  return (
    <>
      {/* macOS Sequoia Snap Preview Overlay */}
      <AnimatePresence>
        {snapPreview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              left: `${snapPreview.x}px`,
              top: `${snapPreview.y}px`,
              width: `${snapPreview.width}px`,
              height: `${snapPreview.height}px`,
              zIndex: 6500,
            }}
            className="rounded-[14px] border-2 border-white/60 dark:border-white/35 bg-blue-500/25 dark:bg-blue-400/20 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.25)] pointer-events-none flex items-center justify-center select-none"
          >
            <div className="flex items-center gap-2 rounded-full bg-neutral-900/85 px-4 py-1.5 text-xs font-semibold text-white shadow-2xl backdrop-blur-xl border border-white/20">
              {snapPreview.type === 'left' && <span>◧ Snap to Left Half</span>}
              {snapPreview.type === 'right' && <span>◨ Snap to Right Half</span>}
              {snapPreview.type === 'top' && <span>□ Maximize Fullscreen</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Render all open windows with smooth Framer Motion AnimatePresence entrance/exit */}
      <AnimatePresence>
        {windows
          .filter((win) => !win.isMinimized)
          .map((win) => (
            <WindowFrame key={win.id} window={win} />
          ))}
      </AnimatePresence>
    </>
  );
};
