import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Palette, Check } from 'lucide-react';
import { sound } from '../../core/sound';

interface StickyNote {
  id: string;
  content: string;
  color: 'yellow' | 'blue' | 'green' | 'pink' | 'purple';
  isCollapsed: boolean;
  createdAt: number;
}

const COLOR_MAP = {
  yellow: { bg: '#fef08a', text: '#713f12', header: '#fde047', border: '#eab308' },
  blue: { bg: '#bfdbfe', text: '#1e3a8a', header: '#93c5fd', border: '#3b82f6' },
  green: { bg: '#bbf7d0', text: '#14532d', header: '#86efac', border: '#22c55e' },
  pink: { bg: '#fbcfe8', text: '#831843', header: '#f472b6', border: '#ec4899' },
  purple: { bg: '#e9d5ff', text: '#581c87', header: '#c084fc', border: '#a855f7' },
};

const DEFAULT_STICKIES: StickyNote[] = [
  {
    id: 's-1',
    content: '🚀 Welcome to WebOS Stickies!\n\n• Double click title bar to collapse\n• Pick different pastel colors\n• Changes save automatically',
    color: 'yellow',
    isCollapsed: false,
    createdAt: Date.now(),
  },
  {
    id: 's-2',
    content: '📝 Meeting Notes:\n- Polish window genie & zoom\n- Check dock indicator dot\n- Add new system apps!',
    color: 'blue',
    isCollapsed: false,
    createdAt: Date.now() - 10000,
  },
];

export const StickiesApp: React.FC<{ windowId: string }> = () => {
  const [stickies, setStickies] = useState<StickyNote[]>(() => {
    try {
      const saved = localStorage.getItem('webos_stickies_data');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_STICKIES;
  });

  const saveStickies = (data: StickyNote[]) => {
    setStickies(data);
    try {
      localStorage.setItem('webos_stickies_data', JSON.stringify(data));
    } catch {}
  };

  const handleAddNote = (color: StickyNote['color'] = 'yellow') => {
    sound.playClick();
    const newNote: StickyNote = {
      id: `sticky-${Date.now()}`,
      content: '',
      color,
      isCollapsed: false,
      createdAt: Date.now(),
    };
    saveStickies([newNote, ...stickies]);
  };

  const handleUpdateContent = (id: string, text: string) => {
    const updated = stickies.map((s) => (s.id === id ? { ...s, content: text } : s));
    saveStickies(updated);
  };

  const handleChangeColor = (id: string, color: StickyNote['color']) => {
    sound.playClick();
    const updated = stickies.map((s) => (s.id === id ? { ...s, color } : s));
    saveStickies(updated);
  };

  const handleToggleCollapse = (id: string) => {
    sound.playClick();
    const updated = stickies.map((s) => (s.id === id ? { ...s, isCollapsed: !s.isCollapsed } : s));
    saveStickies(updated);
  };

  const handleDelete = (id: string) => {
    sound.playClick();
    const updated = stickies.filter((s) => s.id !== id);
    saveStickies(updated);
  };

  return (
    <div className="flex h-full w-full flex-col bg-neutral-900 select-none overflow-hidden text-xs">
      {/* Top action bar */}
      <div className="flex items-center justify-between p-3 border-b border-white/10 bg-neutral-900/80">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">Stickies</span>
          <span className="text-white/40 text-[11px]">{stickies.length} notes</span>
        </div>

        <div className="flex items-center gap-1.5">
          {(Object.keys(COLOR_MAP) as Array<StickyNote['color']>).map((col) => (
            <button
              key={col}
              onClick={() => handleAddNote(col)}
              style={{ backgroundColor: COLOR_MAP[col].header }}
              className="h-5 w-5 rounded-full hover:scale-110 active:scale-95 transition-transform shadow-xs"
              title={`New ${col} sticky`}
            />
          ))}
          <button
            onClick={() => handleAddNote('yellow')}
            className="flex items-center gap-1 ml-2 px-3 py-1 bg-[var(--accent)] text-white rounded-lg font-medium hover:brightness-110 transition-all shadow-xs"
          >
            <Plus size={13} /> New Note
          </button>
        </div>
      </div>

      {/* Stickies Canvas Grid */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 auto-rows-max bg-neutral-950">
        {stickies.map((note) => {
          const colTheme = COLOR_MAP[note.color] || COLOR_MAP.yellow;

          return (
            <div
              key={note.id}
              style={{ backgroundColor: colTheme.bg, color: colTheme.text, borderColor: colTheme.border }}
              className="flex flex-col rounded-xl border shadow-lg overflow-hidden transition-all duration-200"
            >
              {/* Header Bar */}
              <div
                style={{ backgroundColor: colTheme.header }}
                className="flex items-center justify-between px-3 py-1.5 cursor-grab active:cursor-grabbing border-b border-black/10 select-none"
              >
                <div className="flex items-center gap-1">
                  {(Object.keys(COLOR_MAP) as Array<StickyNote['color']>).map((c) => (
                    <button
                      key={c}
                      onClick={() => handleChangeColor(note.id, c)}
                      style={{ backgroundColor: COLOR_MAP[c].header }}
                      className={`h-3 w-3 rounded-full border border-black/20 ${
                        note.color === c ? 'ring-1 ring-black' : ''
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleCollapse(note.id)}
                    className="p-1 hover:bg-black/10 rounded"
                    title={note.isCollapsed ? 'Expand' : 'Collapse'}
                  >
                    {note.isCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="p-1 hover:bg-black/10 rounded text-red-700"
                    title="Delete Note"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Note Content */}
              {!note.isCollapsed && (
                <textarea
                  value={note.content}
                  onChange={(e) => handleUpdateContent(note.id, e.target.value)}
                  placeholder="Type a note..."
                  style={{ color: colTheme.text }}
                  className="w-full h-36 bg-transparent p-3 text-xs leading-relaxed outline-none resize-none font-sans font-medium"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
