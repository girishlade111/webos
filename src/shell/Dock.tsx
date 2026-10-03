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
  const isCompact = useViewportStore((s) => s.isCompact);
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

  /* Icon size.
     Pointer: honour the user's preference, downscalling only as far as needed
     to fit the screen.

     Touch: floor at the 44px hit target and let the dock scroll instead. Twelve
     44px icons need ~570px, which no phone has — so shrinking to fit would
     produce 23px-wide targets, which is exactly the coin-sized problem the floor
     exists to prevent. Scrolling keeps every target usable. */
  const minIconSize = isTouch ? 44 : 26;
  const effectiveDockSize = isTouch
    ? 44
    : Math.max(minIconSize, Math.min(dockSize, maxAllowedIconSize));
  const dockScrolls = isTouch && totalItemsCount * (effectiveDockSize + 6) > maxAvailableWidth;

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
    setTouchDockRevealed(false);
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

  /* Compact windows are full-bleed, so the Dock would sit on top of window
     content (e.g. Finder's status bar). iPadOS/macOS hide the Dock in a
     full-screen app, so mirror that until every window is minimized. */
  const compactFullScreenApp = isCompact && windows.some((w) => !w.isMinimized);

  /* There is no hover on touch, so an upward swipe from the bottom edge
     reveals the Dock the way iPadOS does. */
  const [touchDockRevealed, setTouchDockRevealed] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const touchHideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!compactFullScreenApp) setTouchDockRevealed(false);
  }, [compactFullScreenApp]);

  useEffect(
    () => () => {
      if (touchHideTimerRef.current) window.clearTimeout(touchHideTimerRef.current);
    },
    []
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!compactFullScreenApp || touchDockRevealed) return;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const startY = touchStartYRef.current;
    if (startY === null) return;
    touchStartYRef.current = null;
    if (e.touches[0].clientY - startY < -24) {
      setTouchDockRevealed(true);
      if (touchHideTimerRef.current) window.clearTimeout(touchHideTimerRef.current);
      touchHideTimerRef.current = window.setTimeout(() => setTouchDockRevealed(false), 2600);
    }
  };

  const dockVisibleByTouch = compactFullScreenApp && touchDockRevealed;

  const isAutoHidden =
    (dockAutoHide || compactFullScreenApp) &&
    !isDockHovered &&
    !dockVisibleByTouch &&
    contextMenu === null;

  /* The reveal hitbox must not swallow taps meant for the window underneath. */
  const hitboxInteractive = !compactFullScreenApp || isDockHovered || dockVisibleByTouch;

  return (
    <>
      {/* Bottom-edge swipe zone: the only Dock-affecting gesture over window
          content, so it is kept as thin as the home indicator. */}
      {compactFullScreenApp && (
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          style={{ touchAction: 'pan-y' }}
          data-dock-swipe-zone
          className="fixed bottom-0 left-0 right-0 z-[7000] h-[18px]"
        />
      )}

      {/* Hitbox zone for autohide dock */}
      <div
        onMouseEnter={() => setIsDockHovered(true)}
        onMouseLeave={() => setIsDockHovered(false)}
        className={`fixed bottom-0 left-0 right-0 z-[7000] flex justify-center pb-2 pt-6 ${
          hitboxInteractive ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <div
          ref={dockRef}
          data-dock-surface
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
          className={`relative flex items-end rounded-[24px] border border-white/30 dark:border-white/15 bg-white/30 px-3 py-2.5 shadow-[0_25px_60px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.2)] backdrop-blur-3xl backdrop-saturate-200 dark:bg-[#1a1a20]/75 ${
            /* When the dock scrolls, snap icon-to-icon so a flick lands cleanly
               on an app rather than between two. */
            dockScrolls
              ? 'gap-1.5 overflow-x-auto overscroll-x-contain [scroll-snap-type:x_proximity] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
              : 'gap-1.5'
          }`}
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
                  /* A scrolling dock must not let flex squeeze its children
                     back below the hit target. */
                  flex: dockScrolls ? '0 0 auto' : undefined,
                  scrollSnapAlign: dockScrolls ? 'center' : undefined,
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
