import React, { useState } from 'react';
import { Download, Check, Star, Sparkles, Shield, Rocket } from 'lucide-react';
import { useProcessStore } from '../../core/processStore';
import { sound } from '../../core/sound';

interface StoreApp {
  id: string;
  name: string;
  category: string;
  rating: number;
  description: string;
  iconBg: string;
  iconText: string;
}

const STORE_APPS: StoreApp[] = [
  { id: 'finder', name: 'Finder', category: 'System', rating: 4.9, description: 'Navigate files, folders, and external drives.', iconBg: 'bg-blue-500', iconText: '📁' },
  { id: 'browser', name: 'Web Browser', category: 'Internet', rating: 4.8, description: 'Explore websites and documentation securely.', iconBg: 'bg-sky-500', iconText: '🌐' },
  { id: 'terminal', name: 'Terminal', category: 'Developer Tools', rating: 5.0, description: 'Unix command line interface with file tools.', iconBg: 'bg-zinc-800', iconText: '>_' },
  { id: 'notes', name: 'Notes', category: 'Productivity', rating: 4.9, description: 'Quick note-taking with checklists and rich formatting.', iconBg: 'bg-amber-400', iconText: '📝' },
  { id: 'textedit', name: 'TextEdit', category: 'Productivity', rating: 4.7, description: 'Multi-tab plaintext and code editor.', iconBg: 'bg-slate-200', iconText: '📄' },
  { id: 'calculator', name: 'Calculator', category: 'Utilities', rating: 4.8, description: 'Standard and scientific mathematical calculations.', iconBg: 'bg-orange-500', iconText: '🔢' },
  { id: 'calendar', name: 'Calendar', category: 'Productivity', rating: 4.9, description: 'Schedule and manage appointments across dates.', iconBg: 'bg-rose-500', iconText: '📅' },
  { id: 'photos', name: 'Photos', category: 'Media', rating: 4.8, description: 'Organize and view picture albums and filters.', iconBg: 'bg-white', iconText: '🖼️' },
  { id: 'music', name: 'Music Player', category: 'Media', rating: 4.9, description: 'Procedural synthesized relaxing music generator.', iconBg: 'bg-red-500', iconText: '🎵' },
  { id: 'weather', name: 'Weather', category: 'Lifestyle', rating: 4.9, description: 'Live hourly and 7-day weather forecasts.', iconBg: 'bg-blue-600', iconText: '☀️' },
  { id: 'settings', name: 'System Settings', category: 'System', rating: 5.0, description: 'Personalize appearance, dock, and sounds.', iconBg: 'bg-gray-500', iconText: '⚙️' },
  { id: 'activity_monitor', name: 'Activity Monitor', category: 'Utilities', rating: 4.8, description: 'Monitor CPU and processes with Force Quit.', iconBg: 'bg-emerald-600', iconText: '📈' },
];

export const AppStoreApp: React.FC<{ windowId: string }> = () => {
  const { runningAppIds, openWindow, pinnedAppIds, pinApp } = useProcessStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Productivity', 'Utilities', 'Media', 'System', 'Developer Tools'];

  const filtered = selectedCategory === 'All'
    ? STORE_APPS
    : STORE_APPS.filter((a) => a.category === selectedCategory);

  return (
    <div className="flex h-full w-full flex-col bg-[var(--window-bg)] text-[var(--window-text)] select-none overflow-y-auto">
      {/* App Store Hero Banner */}
      <div className="p-6 border-b border-black/10 dark:border-white/10 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white flex items-center justify-between shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-200">
            <Sparkles size={14} />
            <span>FEATURED COLLECTION</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Essential WebOS Apps</h2>
          <p className="text-xs text-blue-100 max-w-md">
            Everything you need for productivity, web browsing, computing, and multimedia built natively into WebOS.
          </p>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 p-4 border-b border-black/10 dark:border-white/10 bg-[var(--window-header)] overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Apps Grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((app) => {
          const isRunning = runningAppIds.includes(app.id);
          const isPinned = pinnedAppIds.includes(app.id);

          return (
            <div
              key={app.id}
              className="flex items-center justify-between p-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-800/70 shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-xl shadow-sm ${app.iconBg}`}>
                  {app.iconText}
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-neutral-900 dark:text-white">{app.name}</h4>
                  <p className="text-[11px] text-neutral-400">{app.category}</p>
                  <div className="flex items-center gap-1 text-[10px] text-amber-500 mt-0.5">
                    <Star size={10} fill="currentColor" />
                    <span>{app.rating}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <button
                  onClick={() => openWindow(app.id)}
                  className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity"
                >
                  {isRunning ? 'Open' : 'Get'}
                </button>
                {!isPinned && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      pinApp(app.id);
                    }}
                    className="text-[10px] text-neutral-400 hover:text-[var(--accent)]"
                  >
                    + Add to Dock
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
