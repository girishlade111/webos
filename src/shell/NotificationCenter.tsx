import React from 'react';
import { Bell, Trash2, X, Sliders } from 'lucide-react';
import { useThemeStore } from '../core/themeStore';
import { useNotificationStore } from '../core/notificationStore';
import { useWidgetStore } from '../core/widgetStore';
import { UnifiedWidgetRenderer, WidgetGalleryModal } from './MacOSWidgets';
import { sound } from '../core/sound';

export const NotificationCenter: React.FC = () => {
  const { isNotificationCenterOpen, setNotificationCenterOpen } = useThemeStore();
  const { notifications, activeBanner, dismissBanner, removeNotification, clearAll } = useNotificationStore();
  const { notificationWidgets, setWidgetGalleryOpen } = useWidgetStore();

  return (
    <>
      {/* Top Right Floating Banner Toast */}
      {activeBanner && (
        <div className="fixed top-9 right-4 z-[9900] w-80 rounded-2xl border border-black/15 dark:border-white/20 bg-white/90 dark:bg-neutral-900/90 p-3.5 shadow-2xl glass-panel animate-fade-in text-neutral-800 dark:text-neutral-100 text-xs flex items-start justify-between gap-3 select-none">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-[11px] text-neutral-400 uppercase tracking-wider">
              <Bell size={11} className="text-[var(--accent)]" />
              <span>{activeBanner.appName || 'System'}</span>
            </div>
            <h4 className="font-bold text-xs">{activeBanner.title}</h4>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-snug">
              {activeBanner.message}
            </p>
          </div>
          <button
            onClick={dismissBanner}
            className="rounded-full p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Slide-in Notification Center Drawer */}
      {isNotificationCenterOpen && (
        <div
          className="fixed inset-0 z-[8800] select-none"
          onClick={() => setNotificationCenterOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-7 right-0 bottom-0 w-88 border-l border-black/15 dark:border-white/20 bg-neutral-100/80 dark:bg-neutral-900/80 p-4 shadow-2xl glass-panel overflow-y-auto space-y-4 animate-fade-in text-xs text-neutral-800 dark:text-neutral-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
              <span className="font-bold text-sm tracking-tight">Notification Center</span>
              {notifications.length > 0 && (
                <button
                  onClick={() => {
                    sound.playTrash();
                    clearAll();
                  }}
                  className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                >
                  <Trash2 size={11} />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {/* macOS Widgets Section */}
            <div className="space-y-3">
              {notificationWidgets.map((wId) => (
                <UnifiedWidgetRenderer key={wId} id={wId} />
              ))}

              {/* Edit Widgets Button */}
              <button
                onClick={() => {
                  sound.playClick();
                  setWidgetGalleryOpen(true);
                }}
                className="w-full py-2.5 rounded-xl border border-dashed border-neutral-300 dark:border-white/20 hover:border-[var(--accent)] text-neutral-500 dark:text-neutral-400 hover:text-[var(--accent)] text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-white/40 dark:bg-white/5"
              >
                <Sliders size={13} />
                <span>Edit Widgets...</span>
              </button>
            </div>

            {/* Notifications Feed */}
            <div className="space-y-2 pt-2 border-t border-black/10 dark:border-white/10">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Recent Notifications ({notifications.length})
              </span>

              {notifications.length === 0 ? (
                <div className="text-center py-6 text-neutral-400 text-xs">
                  No new notifications
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="group relative rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-neutral-800/70 p-3 shadow-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[11px] text-[var(--accent)]">{n.title}</span>
                      <button
                        onClick={() => removeNotification(n.id)}
                        className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                      >
                        <X size={11} />
                      </button>
                    </div>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-snug">
                      {n.message}
                    </p>
                    <span className="text-[10px] text-neutral-400 block pt-1 font-mono">
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global macOS Widget Gallery Modal */}
      <WidgetGalleryModal />
    </>
  );
};
