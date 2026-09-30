import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useThemeStore } from '../core/themeStore';
import { useProcessStore } from '../core/processStore';
import { APP_REGISTRY } from '../core/appRegistry';
import { sound } from '../core/sound';

const APPS_PER_PAGE = 14; // 7 columns x 2 rows standard macOS layout

const pageVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 160 : -160,
    opacity: 0,
    scale: 0.96,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.28,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -160 : 160,
    opacity: 0,
    scale: 0.96,
    transition: {
      duration: 0.22,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  }),
};

export const Launchpad: React.FC = () => {
  const { isLaunchpadOpen, setLaunchpadOpen } = useThemeStore();
  const { openWindow } = useProcessStore();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [slideDirection, setSlideDirection] = useState<number>(0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const lastWheelTimeRef = useRef<number>(0);

  // All applications from registry (excluding launchpad itself)
  const allApps = useMemo(() => {
    return Object.values(APP_REGISTRY).filter((app) => app.id !== 'launchpad');
  }, []);

  // Filtered apps based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allApps.filter(
      (app) => app.name.toLowerCase().includes(q) || app.id.toLowerCase().includes(q)
    );
  }, [allApps, searchQuery]);

  const isSearchActive = searchQuery.trim().length > 0;
  const totalPages = Math.max(1, Math.ceil(allApps.length / APPS_PER_PAGE));

  // Current page apps slice
  const currentPageApps = useMemo(() => {
    const start = currentPage * APPS_PER_PAGE;
    return allApps.slice(start, start + APPS_PER_PAGE);
  }, [allApps, currentPage]);

  // Reset search and page on open
  useEffect(() => {
    if (isLaunchpadOpen) {
      sound.playWindowOpen();
      setCurrentPage(0);
      setSearchQuery('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isLaunchpadOpen]);

  // Page navigation handlers
  const goToPage = (pageIndex: number) => {
    if (pageIndex < 0 || pageIndex >= totalPages || pageIndex === currentPage) return;
    sound.playClick();
    setSlideDirection(pageIndex > currentPage ? 1 : -1);
    setCurrentPage(pageIndex);
  };

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      goToPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      goToPage(currentPage - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isLaunchpadOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        sound.playClick();
        setLaunchpadOpen(false);
        return;
      }

      // Page switching when search input is empty or using PageUp/Down
      if (!isSearchActive) {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
          nextPage();
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          prevPage();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLaunchpadOpen, isSearchActive, currentPage, totalPages]);

  // Trackpad / Mouse wheel horizontal scroll navigation
  const handleWheel = (e: React.WheelEvent) => {
    if (isSearchActive) return;
    const now = Date.now();
    if (now - lastWheelTimeRef.current < 350) return;

    if (e.deltaX > 25 || e.deltaY > 35) {
      lastWheelTimeRef.current = now;
      nextPage();
    } else if (e.deltaX < -25 || e.deltaY < -35) {
      lastWheelTimeRef.current = now;
      prevPage();
    }
  };

  const handleLaunchApp = (appId: string) => {
    sound.playClick();
    setLaunchpadOpen(false);
    setSearchQuery('');
    openWindow(appId);
  };

  return (
    <AnimatePresence>
      {isLaunchpadOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1, transition: { duration: 0.26, ease: [0.16, 1, 0.3, 1] } }}
          exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] } }}
          onWheel={handleWheel}
          onClick={() => {
            sound.playClick();
            setLaunchpadOpen(false);
          }}
          className="fixed inset-0 z-[8970] flex flex-col items-center justify-between p-6 sm:p-10 bg-black/60 dark:bg-black/75 backdrop-blur-3xl text-white select-none pointer-events-auto"
        >
          {/* Top Bar: Live Search Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center w-full max-w-2xl mt-4 z-10"
          >
            <div className="relative w-80 max-w-[85vw]">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Applications"
                className="w-full rounded-2xl border border-white/25 bg-white/15 py-2 pl-10 pr-9 text-xs font-medium text-white placeholder-white/50 backdrop-blur-xl outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-white/80 hover:bg-white/30 text-[10px] cursor-pointer"
                  title="Clear search"
                >
                  <X size={11} strokeWidth={2.5} />
                </button>
              )}
            </div>

            {isSearchActive && (
              <p className="mt-2 text-[11px] text-white/60">
                Found {searchResults.length} {searchResults.length === 1 ? 'application' : 'applications'}
              </p>
            )}
          </div>

          {/* Left Navigation Chevron */}
          {!isSearchActive && currentPage > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevPage();
              }}
              className="absolute left-6 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white backdrop-blur-xl transition-all shadow-xl z-20 cursor-pointer"
              title="Previous page (Left arrow)"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Right Navigation Chevron */}
          {!isSearchActive && currentPage < totalPages - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextPage();
              }}
              className="absolute right-6 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white backdrop-blur-xl transition-all shadow-xl z-20 cursor-pointer"
              title="Next page (Right arrow)"
            >
              <ChevronRight size={24} />
            </button>
          )}

          {/* Main App Grid View */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl my-auto px-4 overflow-hidden relative flex items-center justify-center min-h-[360px]"
          >
            {isSearchActive ? (
              // Search Results Grid
              searchResults.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-y-10 gap-x-6 sm:gap-x-10 p-4 transition-all max-h-[70vh] overflow-y-auto">
                  {searchResults.map((app) => {
                    const Icon = app.icon;
                    return (
                      <div
                        key={app.id}
                        onClick={() => handleLaunchApp(app.id)}
                        className="group flex flex-col items-center gap-2.5 cursor-pointer text-center select-none hover:scale-110 active:scale-95 transition-transform duration-150"
                      >
                        <div className="relative h-18 w-18 flex items-center justify-center filter drop-shadow-2xl">
                          <Icon size={72} />
                        </div>
                        <span className="text-xs font-medium text-white/95 drop-shadow truncate w-24">
                          {app.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white/40 mb-3">
                    <Search size={28} />
                  </div>
                  <p className="text-sm font-semibold text-white/80">No Applications Found</p>
                  <p className="text-xs text-white/50 mt-1">No apps match &ldquo;{searchQuery}&rdquo;</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs text-white font-medium transition-all"
                  >
                    Clear Search
                  </button>
                </div>
              )
            ) : (
              // Paged View with Framer Motion slide
              <AnimatePresence mode="wait" custom={slideDirection}>
                <motion.div
                  key={currentPage}
                  custom={slideDirection}
                  variants={pageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-y-10 gap-x-6 sm:gap-x-10 p-4 w-full"
                >
                  {currentPageApps.map((app) => {
                    const Icon = app.icon;
                    return (
                      <div
                        key={app.id}
                        onClick={() => handleLaunchApp(app.id)}
                        className="group flex flex-col items-center gap-2.5 cursor-pointer text-center select-none hover:scale-110 active:scale-95 transition-transform duration-150"
                      >
                        <div className="relative h-18 w-18 flex items-center justify-center filter drop-shadow-2xl">
                          <Icon size={72} />
                        </div>
                        <span className="text-xs font-medium text-white/95 drop-shadow truncate w-24">
                          {app.name}
                        </span>
                      </div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Bottom Pagination Dots */}
          {!isSearchActive && totalPages > 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2.5 mb-4 z-10"
            >
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToPage(idx)}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    currentPage === idx
                      ? 'w-7 bg-white shadow-[0_0_8px_rgba(255,255,255,0.85)]'
                      : 'w-2.5 bg-white/35 hover:bg-white/60'
                  }`}
                  title={`Page ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Subtle Close Hint */}
          <div className="text-[11px] text-white/40 mb-1 z-10 pointer-events-none">
            Click anywhere or press Esc to close
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
