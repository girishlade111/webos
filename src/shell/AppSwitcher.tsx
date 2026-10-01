import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useProcessStore } from '../core/processStore';
import { useThemeStore } from '../core/themeStore';
import { APP_REGISTRY } from '../core/appRegistry';

/**
 * The Cmd+Tab application switcher.
 *
 * macOS shows this as a translucent capsule holding a row of app icons with the
 * highlighted app *enlarged and full-opacity* rather than ringed. Unselected
 * icons shrink and dim. The capsule is also transient in one important respect:
 * it closes on ⌘ release, which ShortcutManager handles via commitAppSwitcher.
 */
export const AppSwitcher: React.FC = () => {
  const isOpen = useProcessStore((s) => s.isAppSwitcherOpen);
  const index = useProcessStore((s) => s.appSwitcherIndex);
  const runningAppIds = useProcessStore((s) => s.runningAppIds);
  const windows = useProcessStore((s) => s.windows);

  /* Only the apps worth showing: hide the Finder placeholder and anything with
     no live windows. macOS never lists Launchpad here either. */
  const apps = useMemo(() => {
    return runningAppIds
      .filter((appId) => appId !== 'finder' && appId !== 'launchpad')
      .map((appId) => {
        const manifest = APP_REGISTRY[appId];
        if (!manifest) return null;

        /* Show the app's frontmost window title underneath, the way macOS
           lists documents rather than bare app names. */
        const owned = windows
          .filter((w) => w.appId === appId)
          .sort((a, b) => b.zIndex - a.zIndex);
        const front = owned[0];

        return {
          appId,
          manifest,
          title: front?.title,
          isMinimized: owned.length > 0 && owned.every((w) => w.isMinimized),
        };
      })
      .filter((a): a is NonNullable<typeof a> => a !== null);
  }, [runningAppIds, windows]);

  /* Hold the capsule open only while a command modifier is down. Committed on
     keyup by ShortcutManager, so this is purely presentational state. */
  const osState = useThemeStore((s) => s.osState);

  const visible = isOpen && apps.length > 0 && osState !== 'booting';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          /* Keyed on the selected app so the capsule can slide as the
             selection moves, the way macOS nudges the row. */
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 6 }}
          transition={{ duration: 0.13, ease: [0.32, 0.72, 0, 1] }}
          className="pointer-events-none fixed inset-0 z-[9400] flex items-center justify-center"
          role="dialog"
          aria-label="Application Switcher"
        >
          <div className="flex max-w-[86vw] flex-col items-center gap-3">
            {/* Icon capsule */}
            <div className="flex items-end gap-1 rounded-[22px] border border-white/20 bg-neutral-900/72 px-3.5 py-3 shadow-[0_22px_60px_-12px_rgba(0,0,0,0.7)] backdrop-blur-[40px] backdrop-saturate-[180%]">
              {apps.map((app, i) => {
                const isSelected = i === index;
                const Icon = app.manifest.icon;

                return (
                  <div
                    key={app.appId}
                    className="flex flex-col items-center justify-end"
                    style={{ width: 84 }}
                  >
                    <motion.div
                      animate={{
                        scale: isSelected ? 1 : 0.76,
                        opacity: isSelected ? 1 : 0.5,
                        y: isSelected ? 0 : 6,
                      }}
                      transition={{ duration: 0.12, ease: [0.32, 0.72, 0, 1] }}
                      className="flex h-[64px] w-[64px] items-center justify-center"
                    >
                      <Icon size={64} />
                    </motion.div>

                    {/* Selection plate sits *behind* the icon, not on top. */}
                    <div className="relative h-2.5 w-full">
                      {isSelected && (
                        <motion.div
                          layoutId="app-switcher-plate"
                          transition={{ duration: 0.14, ease: [0.32, 0.72, 0, 1] }}
                          className="absolute inset-x-1 top-0 h-1 rounded-full bg-white/85"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Frontmost window title, in macOS's small-caps-ish treatment */}
            {apps[index] && (
              <motion.div
                key={apps[index].appId}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.1 }}
                className="flex max-w-[420px] items-baseline gap-2 rounded-full border border-white/12 bg-neutral-900/60 px-3.5 py-1.5 text-[12px] text-white/90 shadow-lg backdrop-blur-xl"
              >
                <span className="font-semibold tracking-tight">{apps[index].manifest.name}</span>
                {apps[index].title && (
                  <span className="truncate text-white/60">— {apps[index].title}</span>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};