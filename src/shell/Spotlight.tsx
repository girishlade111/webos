import React, { useState, useEffect, useRef } from 'react';
import { Search, Calculator, FileText, Folder, AppWindow, ArrowRight } from 'lucide-react';
import { useThemeStore } from '../core/themeStore';
import { useProcessStore } from '../core/processStore';
import { useFSStore } from '../core/fsStore';
import { APP_REGISTRY } from '../core/appRegistry';
import { sound } from '../core/sound';

export const Spotlight: React.FC = () => {
  const { isSpotlightOpen, setSpotlightOpen } = useThemeStore();
  const { openWindow } = useProcessStore();
  const { nodes } = useFSStore();

  const [query, setQuery] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSpotlightOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSpotlightOpen]);

  if (!isSpotlightOpen) return null;

  // Check if query is math calculation
  let mathResult: string | null = null;
  if (/^[0-9+\-*/().\s^%]+$/.test(query.trim()) && /[0-9]/.test(query) && /[+\-*/^%]/.test(query)) {
    try {
      const sanitized = query.replace(/\^/g, '**');
      // eslint-disable-next-line no-new-func
      const calc = new Function(`return (${sanitized})`)();
      if (typeof calc === 'number' && !isNaN(calc) && isFinite(calc)) {
        mathResult = `= ${calc}`;
      }
    } catch {}
  }

  // Filter apps
  const matchedApps = Object.values(APP_REGISTRY).filter((app) =>
    app.name.toLowerCase().includes(query.toLowerCase()) ||
    app.id.toLowerCase().includes(query.toLowerCase())
  );

  // Filter files & folders
  const matchedFiles = Object.values(nodes).filter((n) =>
    !n.isProtected && n.name.toLowerCase().includes(query.toLowerCase())
  );

  const results: Array<{ id: string; type: 'calc' | 'app' | 'file'; title: string; subtitle: string; action: () => void }> = [];

  if (mathResult) {
    results.push({
      id: 'calc-result',
      type: 'calc',
      title: mathResult,
      subtitle: `Calculation: ${query}`,
      action: () => {},
    });
  }

  matchedApps.forEach((app) => {
    results.push({
      id: `app-${app.id}`,
      type: 'app',
      title: app.name,
      subtitle: 'Application',
      action: () => {
        openWindow(app.id, app.name);
        setSpotlightOpen(false);
      },
    });
  });

  matchedFiles.slice(0, 5).forEach((file) => {
    results.push({
      id: `file-${file.id}`,
      type: 'file',
      title: file.name,
      subtitle: file.type === 'folder' ? 'Folder' : `${file.mime || 'Document'} · ${(file.size / 1024).toFixed(1)} KB`,
      action: () => {
        if (file.type === 'folder') {
          openWindow('finder', file.name, { w: 760, h: 480 }, { folderId: file.id });
        } else {
          openWindow('textedit', file.name, { w: 720, h: 500 }, { fileId: file.id });
        }
        setSpotlightOpen(false);
      },
    });
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        results[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      setSpotlightOpen(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-start justify-center pt-28 bg-black/30 backdrop-blur-xs select-none"
      onClick={() => setSpotlightOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[620px] max-w-[92vw] overflow-hidden rounded-2xl border border-black/15 dark:border-white/20 bg-white/85 dark:bg-neutral-900/90 shadow-2xl glass-panel animate-fade-in"
      >
        {/* Search Input Bar */}
        <div className="flex h-14 items-center gap-3 px-4 border-b border-black/10 dark:border-white/10">
          <Search size={22} className="text-neutral-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Spotlight Search or math calculation..."
            className="flex-1 bg-transparent text-lg font-normal text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 outline-none"
          />
        </div>

        {/* Results List */}
        {results.length > 0 ? (
          <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
            {results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[var(--accent)] text-white'
                      : 'hover:bg-black/5 dark:hover:bg-white/5 text-neutral-800 dark:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10 text-neutral-500'
                      }`}
                    >
                      {item.type === 'calc' ? (
                        <Calculator size={18} />
                      ) : item.type === 'app' ? (
                        <AppWindow size={18} />
                      ) : (
                        <FileText size={18} />
                      )}
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-sm truncate">{item.title}</div>
                      <div className={`text-xs ${isSelected ? 'text-white/80' : 'text-neutral-400'}`}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <ArrowRight size={14} className={isSelected ? 'text-white' : 'text-neutral-400 opacity-0 group-hover:opacity-100'} />
                </div>
              );
            })}
          </div>
        ) : query.trim() ? (
          <div className="py-8 text-center text-xs text-neutral-400">
            No matching applications or documents found
          </div>
        ) : null}
      </div>
    </div>
  );
};
