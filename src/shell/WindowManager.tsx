import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProcessStore } from '../core/processStore';
import { WindowFrame } from './WindowFrame';

export const WindowManager: React.FC = () => {
  const {
    windows, snapPreview, initializeWindows
  } = useProcessStore();

  // Initialize default window session on first load
  useEffect(() => {
    initializeWindows();
  }, [initializeWindows]);

  /* Keyboard shortcuts are owned exclusively by <ShortcutManager>. This
     component used to run its own window-level keydown listener, which meant
     ⌘W / ⌘M / F3 / F4 could double-fire whenever both were mounted. */

  /* Re-fit windows when the viewport changes. `reflowToViewport` is stable, so
     this does not re-subscribe on every window mutation. */
  const { reflowToViewport } = useProcessStore();
  useEffect(() => {
    const handle = () => reflowToViewport();

    // Resize alone misses mobile browser chrome collapsing on scroll, which
    // changes the visual viewport without firing `resize` on the window.
    window.addEventListener('resize', handle);
    window.addEventListener('orientationchange', handle);
    window.visualViewport?.addEventListener('resize', handle);

    return () => {
      window.removeEventListener('resize', handle);
      window.removeEventListener('orientationchange', handle);
      window.visualViewport?.removeEventListener('resize', handle);
    };
  }, [reflowToViewport]);

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
