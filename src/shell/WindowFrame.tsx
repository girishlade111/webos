import React, { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { motion, Variants } from 'framer-motion';
import { Minus, Plus, X } from 'lucide-react';
import { WindowState } from '../types/os';
import { useProcessStore } from '../core/processStore';
import { useThemeStore } from '../core/themeStore';
import { APP_REGISTRY } from '../core/appRegistry';
import { sound } from '../core/sound';
import { eventBus } from '../core/eventBus';
import { useViewportStore } from '../core/viewportStore';

interface WindowFrameProps {
  window: WindowState;
}

interface CustomAnimationData {
  exitType: 'close' | 'minimize';
  dockTarget: { x: number; y: number };
  winX: number;
  winY: number;
  winWidth: number;
  winHeight: number;
  isRestoring: boolean;
  minimizeEffect: 'genie' | 'scale';
}

// Authentic macOS Window Variants: Scale-and-Fade Physics & Genie Minimization
const windowVariants: Variants = {
  initial: (data: CustomAnimationData) => {
    if (data.isRestoring) {
      // Genie Restore: emerges upward from the Dock icon
      const deltaX = data.dockTarget.x - (data.winX + data.winWidth / 2);
      const deltaY = data.dockTarget.y - (data.winY + data.winHeight / 2);
      return {
        x: deltaX,
        y: deltaY,
        scaleX: 0.04,
        scaleY: 0.02,
        opacity: 0,
        clipPath: 'polygon(45% 0%, 55% 0%, 52% 100%, 48% 100%)',
        transformOrigin: 'bottom center',
      };
    }
    // Standard macOS Scale-and-Fade Entrance
    return {
      x: 0,
      y: 12,
      scale: 0.92,
      scaleX: 1,
      scaleY: 1,
      opacity: 0,
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      transformOrigin: 'center center',
    };
  },
  animate: (data: CustomAnimationData) => {
    if (data.isRestoring) {
      // Expanding out of the Genie bottleneck
      return {
        x: 0,
        y: 0,
        scale: 1,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
        transformOrigin: 'bottom center',
        transition: {
          duration: 0.36,
          times: [0, 0.45, 1],
          ease: [0.16, 1, 0.3, 1], // macOS spring expansion
        },
      };
    }
    // Standard macOS Scale-and-Fade Entrance Pop
    return {
      x: 0,
      y: 0,
      scale: 1,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      transformOrigin: 'center center',
      transition: {
        duration: 0.28,
        ease: [0.16, 1, 0.3, 1],
      },
    };
  },
  exit: (data: CustomAnimationData) => {
    if (data.exitType === 'minimize') {
      const deltaX = data.dockTarget.x - (data.winX + data.winWidth / 2);
      const deltaY = data.dockTarget.y - (data.winY + data.winHeight / 2);

      if (data.minimizeEffect === 'scale') {
        // macOS Scale Minimization Effect
        return {
          x: deltaX,
          y: deltaY,
          scale: 0.08,
          opacity: 0,
          transformOrigin: 'bottom center',
          transition: {
            duration: 0.3,
            ease: [0.25, 0.1, 0.25, 1],
          },
        };
      }

      // Authentic macOS Genie Effect (Bottleneck Warp into Dock)
      return {
        x: [0, deltaX * 0.42, deltaX],
        y: [0, deltaY * 0.52, deltaY],
        scaleX: [1, 0.44, 0.04],
        scaleY: [1, 0.70, 0.02],
        opacity: [1, 0.92, 0],
        clipPath: [
          'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          'polygon(10% 0%, 90% 0%, 70% 100%, 30% 100%)',
          'polygon(45% 0%, 55% 0%, 52% 100%, 48% 100%)',
        ],
        transformOrigin: 'bottom center',
        transition: {
          duration: 0.38,
          times: [0, 0.55, 1],
          ease: [0.25, 1, 0.5, 1], // macOS authentic genie suction curve
        },
      };
    }

    // Authentic macOS Scale-and-Fade Close
    return {
      opacity: 0,
      scale: 0.88,
      y: 12,
      filter: 'blur(3px)',
      transformOrigin: 'center center',
      transition: {
        duration: 0.2,
        ease: [0.25, 0.1, 0.25, 1],
      },
    };
  },
};

export const WindowFrame: React.FC<WindowFrameProps> = ({ window: win }) => {
  const {
    focusWindow, closeWindow, minimizeWindow, toggleMaximize,
    updateWindowPosition, updateWindowSize, setSnapPreview, snapWindow
  } = useProcessStore();
  const { minimizeEffect } = useThemeStore();
  const isCompact = useViewportStore((s) => s.isCompact);
  const isTouch = useViewportStore((s) => s.isTouch);

  const [isHoveringControls, setIsHoveringControls] = useState<boolean>(false);
  const [isInteractive, setIsInteractive] = useState<boolean>(false); // whether actively dragged or resized
  const [exitType, setExitType] = useState<'close' | 'minimize'>('close');
  const [showTileMenu, setShowTileMenu] = useState<boolean>(false);

  const tileMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const snapTargetRef = useRef<'left' | 'right' | 'top' | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; winX: number; winY: number }>({ x: 0, y: 0, winX: 0, winY: 0 });
  const isResizingRef = useRef<string | null>(null);
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number; winX: number; winY: number }>({
    x: 0, y: 0, width: 0, height: 0, winX: 0, winY: 0
  });

  const manifest = APP_REGISTRY[win.appId];
  const AppComp = manifest?.component;
  const minW = manifest?.minSize?.w || 320;
  const minH = manifest?.minSize?.h || 240;

  // Audio cue on window entrance
  useEffect(() => {
    sound.playWindowOpen();
  }, []);

  // Title bar drag handlers
  const handleTitleBarMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // primary click only
    focusWindow(win.id);

    if (win.isMaximized) return; // do not drag when maximized

    isDraggingRef.current = true;
    setIsInteractive(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      winX: win.x,
      winY: win.y,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = moveEvent.clientX - dragStartRef.current.x;
      const dy = moveEvent.clientY - dragStartRef.current.y;
      const nextX = dragStartRef.current.winX + dx;
      const nextY = Math.max(28, dragStartRef.current.winY + dy);

      updateWindowPosition(win.id, nextX, nextY);

      // macOS Sequoia Edge Snapping Detection (Cursor or Window boundary hitting screen edge)
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      const edgeThreshold = 35;

      const isNearLeft = moveEvent.clientX <= edgeThreshold || nextX <= 5;
      const isNearRight = moveEvent.clientX >= screenW - edgeThreshold || (nextX + win.width) >= screenW - 5;
      const isNearTop = moveEvent.clientY <= 34 || nextY <= 30;

      if (isNearLeft) {
        snapTargetRef.current = 'left';
        setSnapPreview({
          x: 0,
          y: 28,
          width: Math.floor(screenW / 2),
          height: screenH - 28,
          type: 'left',
        });
      } else if (isNearRight) {
        snapTargetRef.current = 'right';
        setSnapPreview({
          x: Math.floor(screenW / 2),
          y: 28,
          width: Math.ceil(screenW / 2),
          height: screenH - 28,
          type: 'right',
        });
      } else if (isNearTop) {
        snapTargetRef.current = 'top';
        setSnapPreview({
          x: 0,
          y: 28,
          width: screenW,
          height: screenH - 28,
          type: 'top',
        });
      } else {
        snapTargetRef.current = null;
        setSnapPreview(null);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsInteractive(false);

        if (snapTargetRef.current) {
          snapWindow(win.id, snapTargetRef.current);
          snapTargetRef.current = null;
        }
        setSnapPreview(null);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 8-direction resize handler
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    focusWindow(win.id);
    isResizingRef.current = direction;
    setIsInteractive(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: win.width,
      height: win.height,
      winX: win.x,
      winY: win.y,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const dx = moveEvent.clientX - resizeStartRef.current.x;
      const dy = moveEvent.clientY - resizeStartRef.current.y;
      const dir = isResizingRef.current;

      let newW = resizeStartRef.current.width;
      let newH = resizeStartRef.current.height;
      let newX = resizeStartRef.current.winX;
      let newY = resizeStartRef.current.winY;

      if (dir.includes('e')) newW = Math.max(minW, resizeStartRef.current.width + dx);
      if (dir.includes('s')) newH = Math.max(minH, resizeStartRef.current.height + dy);
      if (dir.includes('w')) {
        const potentialW = resizeStartRef.current.width - dx;
        if (potentialW >= minW) {
          newW = potentialW;
          newX = resizeStartRef.current.winX + dx;
        }
      }
      if (dir.includes('n')) {
        const potentialH = resizeStartRef.current.height - dy;
        if (potentialH >= minH) {
          newH = potentialH;
          newY = Math.max(28, resizeStartRef.current.winY + dy);
        }
      }

      updateWindowSize(win.id, newW, newH, newX, newY);
    };

    const handleMouseUp = () => {
      isResizingRef.current = null;
      setIsInteractive(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Close handler: sets exitType to 'close' (triggers scale-and-fade exit)
  const handleClose = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExitType('close');
    sound.playWindowClose();
    closeWindow(win.id);
  }, [closeWindow, win.id]);

  // Minimize handler: sets exitType to 'minimize' (triggers Genie effect)
  const handleMinimize = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExitType('minimize');
    sound.playWindowMinimize();
    minimizeWindow(win.id);
  }, [minimizeWindow, win.id]);

  // Maximize / Zoom handler
  const handleToggleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTileMenu(false);
    sound.playWindowMaximize();
    toggleMaximize(win.id);
  };

  const handleGreenMouseEnter = () => {
    tileMenuTimeoutRef.current = setTimeout(() => {
      setShowTileMenu(true);
    }, 450);
  };

  const handleGreenMouseLeave = () => {
    if (tileMenuTimeoutRef.current) {
      clearTimeout(tileMenuTimeoutRef.current);
    }
    tileMenuTimeoutRef.current = setTimeout(() => {
      setShowTileMenu(false);
    }, 300);
  };

  // Listen for global keyboard shortcuts via eventBus
  useEffect(() => {
    const unsubClose = eventBus.on('request-close-window', (targetId: string) => {
      if (targetId === win.id) handleClose();
    });
    const unsubMinimize = eventBus.on('request-minimize-window', (targetId: string) => {
      if (targetId === win.id) handleMinimize();
    });
    return () => {
      unsubClose();
      unsubMinimize();
    };
  }, [win.id, handleClose, handleMinimize]);

  // Dynamically calculate dock target coordinates for the Genie suction
  const getDockTarget = useCallback(() => {
    if (typeof window === 'undefined') return { x: 720, y: 880 };
    const iconEl =
      document.getElementById(`dock-icon-${win.appId}`) ||
      document.getElementById(`dock-thumb-${win.id}`) ||
      document.getElementById('dock-trash');
    if (iconEl) {
      const rect = iconEl.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight - 30,
    };
  }, [win.appId, win.id]);

  const customData: CustomAnimationData = {
    exitType,
    dockTarget: getDockTarget(),
    winX: win.x,
    winY: win.y,
    winWidth: win.width,
    winHeight: win.height,
    isRestoring: win.isRestoring || false,
    minimizeEffect: minimizeEffect || 'genie',
  };

  return (
    <motion.div
      key={win.id}
      custom={customData}
      variants={windowVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      onMouseDown={() => focusWindow(win.id)}
      style={{
        position: 'fixed',
        left: `${win.x}px`,
        top: `${win.y}px`,
        width: `${win.width}px`,
        height: `${win.height}px`,
        zIndex: win.zIndex,
        boxShadow: win.isFocused
          ? '0 25px 65px -12px rgba(0, 0, 0, 0.58), 0 0 0 1px rgba(255, 255, 255, 0.12) inset, 0 1px 0 0 rgba(255, 255, 255, 0.2) inset'
          : '0 15px 40px -10px rgba(0, 0, 0, 0.38), 0 0 0 1px rgba(255, 255, 255, 0.08) inset',
        transition: isInteractive
          ? 'none'
          : 'width 0.32s cubic-bezier(0.16, 1, 0.3, 1), height 0.32s cubic-bezier(0.16, 1, 0.3, 1), left 0.32s cubic-bezier(0.16, 1, 0.3, 1), top 0.32s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-radius 0.2s ease',
      }}
      className={`flex flex-col ${
        win.isMaximized ? 'rounded-none' : 'rounded-[11px]'
      } border border-black/20 dark:border-white/15 bg-[var(--window-bg)] overflow-hidden select-none will-change-transform ${
        win.isFocused ? 'ring-1 ring-black/10 dark:ring-white/10' : 'opacity-[0.98]'
      }`}
    >
      {/* Title Bar
          On touch the traffic lights grow to full-size hit targets and stop
          revealing hover glyphs — there is no hover, and a 12px dot is far below
          the 44px minimum a finger needs. */}
      <div
        onMouseDown={handleTitleBarMouseDown}
        onDoubleClick={handleToggleMaximize}
        className={`flex shrink-0 select-none items-center justify-between border-b border-black/10 bg-[var(--window-header)] dark:border-white/10 ${
          isTouch ? 'h-[48px] px-2' : 'h-[38px] px-3'
        } ${isCompact ? '' : 'cursor-default'}`}
      >
        {/* macOS Traffic Light Buttons */}
        <div
          onMouseEnter={() => setIsHoveringControls(true)}
          onMouseLeave={() => setIsHoveringControls(false)}
          className={`flex items-center ${isTouch ? '-ml-1 gap-0' : 'gap-[7.5px]'}`}
        >
          {/* Close (Red) */}
          <button
            onClick={handleClose}
            aria-label="Close window"
            className={`flex items-center justify-center rounded-full bg-[#ff5f56] border border-[#e0443e] active:brightness-75 transition-all text-neutral-900 cursor-pointer shadow-xs ${
              isTouch ? 'h-11 w-11' : 'h-3 w-3'
            }`}
            title="Close (⌘W)"
          >
            {isHoveringControls && !isTouch && (
              <svg width="6" height="6" viewBox="0 0 6 6" fill="none" className="opacity-90">
                <path d="M0.75 0.75L5.25 5.25M5.25 0.75L0.75 5.25" stroke="#4c0000" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            )}
          </button>

          {/* Minimize (Yellow) */}
          <button
            onClick={handleMinimize}
            aria-label="Minimize window"
            className={`flex items-center justify-center rounded-full bg-[#ffbd2e] border border-[#dea123] active:brightness-75 transition-all text-neutral-900 cursor-pointer shadow-xs ${
              isTouch ? 'h-11 w-11' : 'h-3 w-3'
            }`}
            title="Minimize (⌘M)"
          >
            {isHoveringControls && !isTouch && (
              <svg width="6" height="2" viewBox="0 0 6 2" fill="none" className="opacity-90">
                <path d="M0.5 1H5.5" stroke="#5c3800" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            )}
          </button>

          {/* Zoom / Fullscreen (Green) with macOS Sequoia Tiling Popover */}
          <div
            className="relative flex items-center"
            onMouseEnter={handleGreenMouseEnter}
            onMouseLeave={handleGreenMouseLeave}
          >
            <button
              onClick={handleToggleMaximize}
              aria-label="Zoom window"
              className={`flex items-center justify-center rounded-full bg-[#27c93f] border border-[#1aab29] active:brightness-75 transition-all text-neutral-900 cursor-pointer shadow-xs ${
                isTouch ? 'h-11 w-11' : 'h-3 w-3'
              }`}
              title="Zoom / Fullscreen (Hold for Tiling Options)"
            >
              {isHoveringControls && !isTouch && (
                <svg width="6" height="6" viewBox="0 0 6 6" fill="none" className="opacity-90">
                  <path d="M1 5L5 1M5 1H2M5 1V4" stroke="#003e00" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            {/* macOS Sequoia Window Tiling Popover */}
            {showTileMenu && (
              <div
                onMouseEnter={() => {
                  if (tileMenuTimeoutRef.current) clearTimeout(tileMenuTimeoutRef.current);
                  setShowTileMenu(true);
                }}
                onMouseLeave={handleGreenMouseLeave}
                className="absolute top-6 left-0 z-[9999] w-48 rounded-xl border border-black/15 dark:border-white/15 bg-neutral-900/95 p-1.5 shadow-2xl glass-panel text-white text-xs flex flex-col gap-0.5 animate-scale-in"
              >
                <div className="px-2 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Move & Resize
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTileMenu(false);
                    snapWindow(win.id, 'left');
                  }}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--accent)] text-left cursor-pointer transition-colors"
                >
                  <span className="text-sm">◧</span>
                  <span>Tile Left Half</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTileMenu(false);
                    snapWindow(win.id, 'right');
                  }}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--accent)] text-left cursor-pointer transition-colors"
                >
                  <span className="text-sm">◨</span>
                  <span>Tile Right Half</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTileMenu(false);
                    toggleMaximize(win.id);
                  }}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--accent)] text-left cursor-pointer transition-colors"
                >
                  <span className="text-sm">□</span>
                  <span>{win.isMaximized ? 'Restore Window' : 'Full Screen'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Window Title — pinned to the leading edge on touch, where the
            traffic-light cluster is wide and a centred title would collide. */}
        <span
          className={`pointer-events-none truncate font-medium tracking-tight text-neutral-800 drop-shadow-xs dark:text-neutral-200 ${
            isTouch ? 'max-w-[45%] text-left text-sm' : 'max-w-sm text-center text-[13px]'
          }`}
        >
          {win.title}
        </span>

        {/* Right spacing balance — matches the traffic-light cluster width so the
            title stays optically centred on pointer devices. */}
        <div className={isTouch ? 'w-4' : 'w-12'} />
      </div>

      {/* App Component Container with Suspense Lazy Loader */}
      <div className="flex-1 overflow-hidden relative">
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400 font-medium">
              Loading application...
            </div>
          }
        >
          {AppComp ? (
            <AppComp windowId={win.id} initialParams={win.initialParams} />
          ) : (
            <div className="p-4 text-xs">App not found</div>
          )}
        </Suspense>
      </div>

      {/* 8-Directional Resize Grips (Active when not maximized)
          Hidden on compact viewports: windows there are full-bleed, and a
          one-pixel drag target is unusable with a finger anyway. */}
      {!win.isMaximized && !isCompact && (
        <>
          <div onMouseDown={(e) => handleResizeStart(e, 'n')} className="absolute top-0 left-2 right-2 h-1 cursor-n-resize" />
          <div onMouseDown={(e) => handleResizeStart(e, 's')} className="absolute bottom-0 left-2 right-2 h-1.5 cursor-s-resize" />
          <div onMouseDown={(e) => handleResizeStart(e, 'w')} className="absolute top-2 bottom-2 left-0 w-1.5 cursor-w-resize" />
          <div onMouseDown={(e) => handleResizeStart(e, 'e')} className="absolute top-2 bottom-2 right-0 w-1.5 cursor-e-resize" />
          <div onMouseDown={(e) => handleResizeStart(e, 'nw')} className="absolute top-0 left-0 h-3 w-3 cursor-nw-resize" />
          <div onMouseDown={(e) => handleResizeStart(e, 'ne')} className="absolute top-0 right-0 h-3 w-3 cursor-ne-resize" />
          <div onMouseDown={(e) => handleResizeStart(e, 'sw')} className="absolute bottom-0 left-0 h-3 w-3 cursor-sw-resize" />
          <div onMouseDown={(e) => handleResizeStart(e, 'se')} className="absolute bottom-0 right-0 h-3 w-3 cursor-se-resize" />
        </>
      )}
    </motion.div>
  );
};
