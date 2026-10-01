import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useShortcutStore } from '../core/shortcutStore';

/**
 * Transient confirmation that a binding fired.
 *
 * macOS shows almost nothing for most shortcuts — but it does surface a glyph
 * when a system-level action (Mission Control, Launchpad) triggers, and always
 * confirms actions that aren't self-evident (Quit, Hide). Reusing the same
 * frosted capsule as the app switcher keeps the language consistent.
 */
export const ShortcutToast: React.FC = () => {
  const lastFired = useShortcutStore((s) => s.lastFired);
  const clearFired = useShortcutStore((s) => s.clearFired);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!lastFired) return;
    setVisible(true);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setVisible(false);
      clearFired();
    }, 900);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [lastFired, clearFired]);

  if (!lastFired) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.14, ease: [0.32, 0.72, 0, 1] }}
          className="pointer-events-none fixed bottom-[92px] left-1/2 z-[9300] -translate-x-1/2"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-neutral-900/72 px-3.5 py-2 text-[12px] font-medium text-white/90 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.6)] backdrop-blur-[32px] backdrop-saturate-[180%]">
            <span>{lastFired.label}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};