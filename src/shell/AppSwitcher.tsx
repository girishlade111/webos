import React from 'react';
import { useProcessStore } from '../core/processStore';
import { APP_REGISTRY } from '../core/appRegistry';

export const AppSwitcher: React.FC = () => {
  const { isAppSwitcherOpen, appSwitcherIndex, runningAppIds } = useProcessStore();

  if (!isAppSwitcherOpen || runningAppIds.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[9500] flex items-center justify-center pointer-events-none select-none">
      <div className="flex items-center gap-4 rounded-3xl border border-white/20 bg-neutral-900/80 p-5 shadow-2xl backdrop-blur-2xl glass-panel animate-fade-in">
        {runningAppIds.map((appId, idx) => {
          const manifest = APP_REGISTRY[appId];
          if (!manifest) return null;
          const Icon = manifest.icon;
          const isSelected = idx === appSwitcherIndex;

          return (
            <div
              key={appId}
              className={`flex flex-col items-center gap-2 rounded-2xl p-3 transition-all ${
                isSelected
                  ? 'bg-white/20 ring-2 ring-[var(--accent)] scale-110 shadow-lg'
                  : 'opacity-70 scale-95'
              }`}
            >
              <div className="h-16 w-16">
                <Icon size={64} />
              </div>
              <span className="text-xs font-semibold text-white truncate max-w-[80px] text-center">
                {manifest.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
