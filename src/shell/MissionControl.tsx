import React from 'react';
import { Plus, X, Monitor } from 'lucide-react';
import { useProcessStore } from '../core/processStore';
import { useThemeStore } from '../core/themeStore';
import { APP_REGISTRY } from '../core/appRegistry';
import { sound } from '../core/sound';

export const MissionControl: React.FC = () => {
  const { isMissionControlOpen, setMissionControlOpen, activeSpaceIndex, setActiveSpaceIndex, spacesCount, addSpace, removeSpace } = useThemeStore();
  const { windows, focusWindow } = useProcessStore();

  if (!isMissionControlOpen) return null;

  const visibleWindows = windows.filter((w) => !w.isMinimized);

  const handleSelectWindow = (id: string) => {
    sound.playClick();
    focusWindow(id);
    setMissionControlOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[8950] flex flex-col justify-between bg-black/60 backdrop-blur-xl p-6 text-white select-none animate-fade-in"
      onClick={() => setMissionControlOpen(false)}
    >
      {/* Top Spaces Strip */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-center gap-4 py-2"
      >
        <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-neutral-900/80 p-2 shadow-2xl glass-panel">
          {Array.from({ length: spacesCount }).map((_, idx) => {
            const isActive = idx === activeSpaceIndex;
            return (
              <div
                key={idx}
                onClick={() => {
                  sound.playClick();
                  setActiveSpaceIndex(idx);
                }}
                className={`group relative flex h-20 w-32 flex-col items-center justify-between rounded-xl border p-2 cursor-pointer transition-all ${
                  isActive
                    ? 'border-[var(--accent)] ring-2 ring-[var(--accent)] bg-white/10 scale-105'
                    : 'border-white/10 hover:border-white/30 bg-black/40'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-white/80">
                  <Monitor size={12} />
                  <span>Desktop {idx + 1}</span>
                </div>

                <div className="h-8 w-14 rounded-md border border-white/15 bg-white/5 shadow-inner" />

                {spacesCount > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSpace(idx);
                    }}
                    className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white shadow-sm"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            );
          })}

          {spacesCount < 6 && (
            <button
              onClick={() => {
                sound.playClick();
                addSpace();
              }}
              className="flex h-20 w-12 items-center justify-center rounded-xl border border-dashed border-white/20 hover:border-white/50 text-white/60 hover:text-white transition-colors"
              title="Add New Space"
            >
              <Plus size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Center Exposé Windows Tiling Grid */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex-1 flex items-center justify-center p-8 overflow-auto"
      >
        {visibleWindows.length === 0 ? (
          <div className="text-center text-sm font-medium text-white/50">
            No active windows open in this space
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-5xl">
            {visibleWindows.map((win) => {
              const manifest = APP_REGISTRY[win.appId];
              const Icon = manifest?.icon;
              return (
                <div
                  key={win.id}
                  onClick={() => handleSelectWindow(win.id)}
                  className="group relative flex flex-col rounded-2xl border border-white/20 bg-neutral-900/80 p-3 shadow-2xl hover:scale-105 hover:ring-2 hover:ring-[var(--accent)] transition-all cursor-pointer glass-panel aspect-4/3 justify-between"
                >
                  <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                    {Icon && <Icon size={16} />}
                    <span className="font-semibold text-xs text-white truncate">{win.title}</span>
                  </div>

                  {/* Window thumbnail preview mock */}
                  <div className="flex-1 my-2 rounded-lg border border-white/10 bg-black/40 p-2 flex flex-col justify-between overflow-hidden text-[10px] text-white/40">
                    <div className="h-2 w-16 bg-white/10 rounded" />
                    <div className="text-center font-mono opacity-40">Active Window Preview</div>
                    <div className="h-2 w-24 bg-white/10 rounded" />
                  </div>

                  <div className="text-right text-[10px] text-white/60">
                    Click to Focus
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Hint */}
      <div className="text-center text-xs text-white/40 pb-2">
        Press Esc or click anywhere to exit Mission Control
      </div>
    </div>
  );
};
