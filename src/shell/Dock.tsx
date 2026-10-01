import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useProcessStore } from '../core/processStore';
import { useThemeStore } from '../core/themeStore';
import { APP_REGISTRY } from '../core/appRegistry';
import { TrashIcon } from '../assets/appIcons';
import { useFSStore, TRASH_ID } from '../core/fsStore';
import { sound } from '../core/sound';
import { useViewportStore } from '../core/viewportStore';

export const Dock: React.FC = () => {
  const {
    pinnedAppIds, runningAppIds, bouncingAppId, windows,
    openWindow, restoreWindow, quitApp, pinApp, unpinApp
  } = useProcessStore();

  const { dockSize, dockMagnification, dockAutoHide } = useThemeStore();
  const { getChildren } = useFSStore();

  const [mouseX, setMouseX] = useState<number | null>(null);
  const [hoveredAppId, setHoveredAppId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; appId: string } | null>(null);
  const [isDockHovered, setIsDockHovered] = useState<boolean>(false);
  const [windowWidth, setWindowWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  const isTouch = useViewportStore((s) => s.isTouch);
  const safeBottom = useViewportStore((s) => s.safeArea.bottom);

  const dockRef = useRef<HTMLDivElement>(null);

  // Monitor screen width dynamically
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Combine pinned apps with any extra running apps
  const dockApps = useMemo(() => {
    return Array.from(new Set([...pinnedAppIds, ...runningAppIds]));
  }, [pinnedAppIds, runningAppIds]);

  // Minimized windows to show on the right of separator
  const minimizedWindows = windows.filter((w) => w.isMinimized);

  // Trash status
  const trashItems = getChildren(TRASH_ID);
  const isTrashEmpty = trashItems.length === 0;

  // Total items on the dock (apps + minimized windows + separator + trash)
  const totalItemsCount =
    dockApps.length +
    (minimizedWindows.length > 0 ? minimizedWindows.length + 1 : 0) +
    1; // Trash can

  // Maximum dock container width = windowWidth - 32px safe margin
  const maxAvailableWidth = Math.max(300, windowWidth - 36);

  // Auto-scale icon size so dock NEVER exceeds screen width, keeping a pristine macOS look:
  // Dock container padding (px-2.5 = 20px) + separator (12px) = 32px
  // Item gaps = (totalItemsCount - 1) * 6px
  const itemGapsTotal = (totalItemsCount - 1) * 6;
  const maxAllowedIconSize = Math.floor(
    (maxAvailableWidth - 36 - itemGapsTotal) / Math.max(1, totalItemsCount)
  );

  /* Effective icon size: respects the user's preference, but downscales to fit
     the screen and floors at the 44px hit target on touch. Without the floor a
     26px dock icon is a coin-sized target — technically tappable, unusable. */
  const minIconSize = isTouch ? 44 : 26;
  const effectiveDockSize = Math.max(minIconSize, Math.min(dockSize, maxAllowedIconSize));

  // Calculate fisheye magnification with boundary protection
  const getIconScale = (elX: number) => {
    if (!dockMagnification || mouseX === null || isTouch) return 1;
    const distance = Math.abs(mouseX - elX);
    const maxDistance = Math.min(130, effectiveDockSize * 2.5);
    if (distance > maxDistance) return 1;
    // Cosine ease for smooth bell-curve bulge
    const factor = Math.cos((distance / maxDistance) * (Math.PI / 2));
    // If screen is narrow or icons are downscaled, adjust bulge factor so it doesn't push offscreen
    const maxBulge = windowWidth < 900 || effectiveDockSize < 38 ? 0.22 : 0.38;
    return 1 + factor * maxBulge;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    /* Magnification is a cursor effect. Tracking a synthetic hover position on
       touch would leave one icon permanently enlarged. */
    if (isTouch) return;
    if (dockRef.current) {
      const rect = dockRef.current.getBoundingClientRect();
      setMouseX(e.clientX - rect.left);
    }
  };

  const handleMouseLeave = () => {
    setMouseX(null);
    setHoveredAppId(null);
  };

  const handleAppClick = (appId: string) => {
    sound.playDockClick();
    setContextMenu(null);
    const minWin = windows.find((w) => w.appId === appId && w.isMinimized);
    if (minWin) {
      restoreWindow(minWin.id);
    } else {
      openWindow(appId);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, appId: string) => {
    e.preventDefault();
    e.stopPropagation();
    sound.playClick();
    setContextMenu({
      x: Math.min(e.clientX, windowWidth - 190),
      y: Math.min(e.clientY - 90, window.innerHeight - 140),
      appId,
    });
  };

  const isAutoHidden = dockAutoHide && !isDockHovered && contextMenu === null;

  return (
    <>
      {/* Hitbox zone for autohide dock */}
      <div
        onMouseEnter={() => setIsDockHovered(true)}
        onMouseLeave={() => setIsDockHovered(false)}
        className="fixed bottom-0 left-0 right-0 z-[7000] flex justify-center pb-2 pt-6 pointer-events-auto"
      >
        <div
          ref={dockRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: isAutoHidden ? 'translateY(110%)' : 'translateY(0)',
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            maxWidth: 'calc(100vw - 20px)',
            /* Lifted clear of the home indicator so the dock never sits under
               the gesture bar on a notched device. */
            marginBottom: safeBottom > 0 ? `${safeBottom}px` : undefined,
          }}
          className="relative flex items-end gap-1.5 rounded-[24px] border border-white/30 dark:border-white/15 bg-white/30 dark:bg-[#1a1a20]/75 px-3 py-2.5 shadow-[0_25px_60px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.2)] backdrop-blur-3xl backdrop-saturate-200"
        >
          {/* Main App Icons */}
          {dockApps.map((appId, idx) => {
            const manifest = APP_REGISTRY[appId];
            if (!manifest) return null;
            const Icon = manifest.icon;
            const isRunning = runningAppIds.includes(appId) || windows.some((w) => w.appId === appId);
            const hasMinimized = windows.some((w) => w.appId === appId && w.isMinimized);
            const isBouncing = bouncingAppId === appId;
            const isHovered = hoveredAppId === appId;

            // Icon position estimate for magnification
            const iconOffset = idx * (effectiveDockSize + 6) + effectiveDockSize / 2;
            const scale = getIconScale(iconOffset);

            return (
              <div
                key={appId}
                id={`dock-icon-${appId}`}
                onMouseEnter={() => setHoveredAppId(appId)}
                onContextMenu={(e) => handleContextMenu(e, appId)}
                onClick={() => handleAppClick(appId)}
                style={{
                  width: `${effectiveDockSize * scale}px`,
                  height: `${effectiveDockSize * scale}px`,
                  transition: 'width 0.12s ease-out, height 0.12s ease-out',
                }}
                className={`group relative flex flex-col items-center justify-end cursor-pointer origin-bottom ${
                  isBouncing ? 'animate-dock-bounce' : ''
                }`}
              >
                {/* Tooltip Label */}
                {isHovered && mouseX !== null && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[8px] border border-white/20 bg-neutral-900/90 px-3 py-1 text-[12px] font-medium text-white shadow-2xl backdrop-blur-xl pointer-events-none animate-fade-in z-50">
                    {manifest.name}
                  </div>
                )}

                {/* SVG Icon */}
                <Icon size={Math.round(effectiveDockSize * scale)} className="h-full w-full object-contain filter drop-shadow-md" />

                {/* Authentic macOS Running Dot Indicator */}
                {isRunning && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
                    <div 
                      className={`h-[4.5px] w-[4.5px] rounded-full transition-all ${
                        hasMinimized
                          ? 'bg-neutral-800 dark:bg-white ring-2 ring-[var(--accent)]/60'
                          : 'bg-neutral-800 dark:bg-white shadow-[0_0_3px_rgba(255,255,255,0.85)]'
                      }`}
                      title={hasMinimized ? `${manifest.name} (Running in background / Minimized)` : `${manifest.name} (Running)`}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Separator Line */}
          <div className="mx-0.5 h-8 w-px bg-black/15 dark:bg-white/20 self-center shrink-0" />

          {/* Minimized Windows Thumbnails */}
          {minimizedWindows.map((win) => {
            const manifest = APP_REGISTRY[win.appId];
            const Icon = manifest?.icon;
            return (
              <div
                key={win.id}
                id={`dock-thumb-${win.id}`}
                onClick={() => restoreWindow(win.id)}
                className="group relative flex flex-col items-center justify-end cursor-pointer"
                title={`Restore ${win.title}`}
              >
                <div
                  style={{ width: `${Math.round(effectiveDockSize * 0.9)}px`, height: `${Math.round(effectiveDockSize * 0.9)}px` }}
                  className="rounded-xl border border-white/30 bg-neutral-800/85 p-1 shadow-lg flex flex-col items-center justify-center gap-0.5 hover:scale-115 transition-transform"
                >
                  {Icon && <Icon size={Math.round(effectiveDockSize * 0.48)} />}
                  <span className="text-[9px] text-white/90 truncate w-full text-center px-0.5 font-medium leading-tight">
                    {win.title}
                  </span>
                </div>
                <div className="absolute -bottom-1.5 h-1 w-1 rounded-full bg-amber-400 shadow-xs" />
              </div>
            );
          })}

          {/* Trash Can Icon */}
          <div
            onClick={() => openWindow('finder', 'Trash', { w: 740, h: 480 }, { folderId: TRASH_ID })}
            onMouseEnter={() => setHoveredAppId('trash')}
            style={{
              width: `${effectiveDockSize}px`,
              height: `${effectiveDockSize}px`,
              transition: 'width 0.12s ease-out, height 0.12s ease-out',
            }}
            className="group relative flex flex-col items-center justify-end cursor-pointer origin-bottom"
          >
            {hoveredAppId === 'trash' && (
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/20 bg-neutral-900/90 px-2.5 py-1 text-[11px] font-medium text-white shadow-xl backdrop-blur-md pointer-events-none z-50">
                Trash
              </div>
            )}
            <TrashIcon size={effectiveDockSize} isEmpty={isTrashEmpty} />
          </div>
        </div>
      </div>

      {/* Dock Icon Context Menu */}
      {contextMenu && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-[9999] w-44 rounded-xl border border-black/15 dark:border-white/15 bg-neutral-900/95 p-1.5 shadow-2xl glass-panel text-xs text-white animate-fade-in"
          onClick={() => setContextMenu(null)}
        >
          <button
            onClick={() => handleAppClick(contextMenu.appId)}
            className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-left hover:bg-[var(--accent)] cursor-pointer"
          >
            Open
          </button>
          <div className="my-1 h-px bg-white/10" />
          {pinnedAppIds.includes(contextMenu.appId) ? (
            <button
              onClick={() => unpinApp(contextMenu.appId)}
              className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-left hover:bg-[var(--accent)] cursor-pointer"
            >
              Remove from Dock
            </button>
          ) : (
            <button
              onClick={() => pinApp(contextMenu.appId)}
              className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-left hover:bg-[var(--accent)] cursor-pointer"
            >
              Keep in Dock
            </button>
          )}
          {runningAppIds.includes(contextMenu.appId) && (
            <>
              <div className="my-1 h-px bg-white/10" />
              <button
                onClick={() => quitApp(contextMenu.appId)}
                className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-red-400 hover:bg-red-500/20 cursor-pointer"
              >
                Quit
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
};
