import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Trash2, Pin, Bold, Italic, List, CheckSquare, 
  Heading1, Heading2, Strikethrough, FileText, Share 
} from 'lucide-react';
import { sound } from '../../core/sound';
import { useViewportStore } from '../../core/viewportStore';

interface Note {
  id: string;
  title: string;
  body: string;
  updatedAt: number;
  isPinned: boolean;
  folder: string;
}

const DEFAULT_NOTES: Note[] = [
  {
    id: 'note-1',
    title: 'Project Ideas & Architecture',
    body: `### WebOS Roadmap
- [x] Complete Window Manager with snapping
- [x] Build Virtual File System with IndexedDB
- [ ] Add offline PWA service worker
- [ ] Implement audio visualizer for Music player

Remember to keep glassmorphism blur high and animations at 60fps!`,
    updatedAt: Date.now() - 1000 * 60 * 12,
    isPinned: true,
    folder: 'Notes',
  },
  {
    id: 'note-2',
    title: 'Meeting Notes: Design Review',
    body: `Design guidelines discussed:
- Use Inter font everywhere
- Squircles must follow macOS 22.37% curvature math
- Avoid candy pill tags on metadata
- Ensure high contrast in both dark and light modes`,
    updatedAt: Date.now() - 1000 * 60 * 60 * 3,
    isPinned: false,
    folder: 'Work',
  },
  {
    id: 'note-3',
    title: 'Quick Checklist',
    body: `- [x] Buy fresh coffee beans
- [ ] Prepare presentation slides
- [ ] Read through new Web Standards documentation
- [ ] Review performance profiling in Safari`,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24,
    isPinned: false,
    folder: 'Personal',
  },
];

export const NotesApp: React.FC<{ windowId: string }> = () => {
  const isCompact = useViewportStore((s) => s.isCompact);
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem('webos_notes_data');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_NOTES;
  });

  const [activeNoteId, setActiveNoteId] = useState<string>(notes[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('webos_notes_data', JSON.stringify(notes));
  }, [notes]);

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0];

  const handleCreateNote = () => {
    sound.playClick();
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: 'New Note',
      body: '',
      updatedAt: Date.now(),
      isPinned: false,
      folder: 'Notes',
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playTrash();
    const remaining = notes.filter((n) => n.id !== id);
    setNotes(remaining);
    if (activeNoteId === id && remaining.length > 0) {
      setActiveNoteId(remaining[0].id);
    }
  };

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    setNotes(
      notes.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n))
    );
  };

  const handleUpdateActiveBody = (val: string) => {
    const lines = val.split('\n');
    const firstLine = lines[0]?.replace(/^[#\-\*\s]+/, '').trim() || 'Untitled Note';

    setNotes((prev) =>
      prev.map((n) =>
        n.id === activeNoteId
          ? {
              ...n,
              body: val,
              title: firstLine.slice(0, 40),
              updatedAt: Date.now(),
            }
          : n
      )
    );
  };

  const insertFormatting = (prefix: string, suffix: string = '') => {
    if (!activeNote) return;
    const nextBody = activeNote.body ? `${activeNote.body}\n${prefix}${suffix}` : `${prefix}${suffix}`;
    handleUpdateActiveBody(nextBody);
  };

  const filteredNotes = notes
    .filter(
      (n) =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.body.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.updatedAt - a.updatedAt);

  return (
    <div className="flex h-full w-full bg-[var(--window-bg)] text-[var(--window-text)] select-none">
      {/* Sidebar List — hidden on compact so the editor keeps the full width. */}
      {!isCompact && (
      <div className="w-64 shrink-0 border-r border-black/10 dark:border-white/10 bg-[var(--window-sidebar)] flex flex-col">
        {/* Search & New */}
        <div className="flex items-center gap-2 p-2.5 border-b border-black/10 dark:border-white/10">
          <div className="relative flex-1">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Notes"
              className="w-full rounded-md border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-800/80 py-1 pl-7 pr-2 text-xs text-neutral-800 dark:text-neutral-200 outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <button
            onClick={handleCreateNote}
            className="rounded-md p-1.5 text-neutral-700 dark:text-neutral-300 hover:bg-black/10 dark:hover:bg-white/10"
            title="Create Note"
          >
            <Plus size={15} />
          </button>
        </div>

        {/* Notes Items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredNotes.map((note) => {
            const isActive = note.id === activeNoteId;
            return (
              <div
                key={note.id}
                onClick={() => setActiveNoteId(note.id)}
                className={`group relative rounded-lg p-2.5 cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'hover:bg-black/5 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold truncate pr-6">{note.title}</h4>
                  {note.isPinned && <Pin size={10} className={isActive ? 'text-white' : 'text-amber-500'} />}
                </div>

                <div className="flex items-center gap-2 text-[10px] mt-1 opacity-70">
                  <span className="tabular-nums">
                    {new Date(note.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="truncate">
                    {note.body.replace(/[#\*\-]/g, '').trim().slice(0, 30) || 'No additional text'}
                  </span>
                </div>

                {/* Hover actions */}
                <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1">
                  <button
                    onClick={(e) => handleTogglePin(note.id, e)}
                    className="p-1 hover:opacity-80"
                    title={note.isPinned ? 'Unpin' : 'Pin'}
                  >
                    <Pin size={11} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteNote(note.id, e)}
                    className="p-1 hover:text-red-400"
                    title="Delete Note"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Editor Main Pane */}
      <div className="flex flex-1 flex-col overflow-hidden bg-white dark:bg-neutral-900/40">
        {/* Editor Toolbar */}
        <div className="flex h-10 items-center justify-between border-b border-black/10 dark:border-white/10 px-4 bg-[var(--window-header)] gap-2">
          <div className="flex items-center gap-1 text-neutral-600 dark:text-neutral-300">
            <button
              onClick={() => insertFormatting('# ')}
              className="rounded p-1 hover:bg-black/10 dark:hover:bg-white/10"
              title="Heading 1"
            >
              <Heading1 size={14} />
            </button>
            <button
              onClick={() => insertFormatting('## ')}
              className="rounded p-1 hover:bg-black/10 dark:hover:bg-white/10"
              title="Heading 2"
            >
              <Heading2 size={14} />
            </button>
            <div className="h-4 w-px bg-black/10 dark:bg-white/10 mx-1" />
            <button
              onClick={() => insertFormatting('**', '**')}
              className="rounded p-1 hover:bg-black/10 dark:hover:bg-white/10"
              title="Bold"
            >
              <Bold size={14} />
            </button>
            <button
              onClick={() => insertFormatting('*', '*')}
              className="rounded p-1 hover:bg-black/10 dark:hover:bg-white/10"
              title="Italic"
            >
              <Italic size={14} />
            </button>
            <button
              onClick={() => insertFormatting('~~', '~~')}
              className="rounded p-1 hover:bg-black/10 dark:hover:bg-white/10"
              title="Strikethrough"
            >
              <Strikethrough size={14} />
            </button>
            <div className="h-4 w-px bg-black/10 dark:bg-white/10 mx-1" />
            <button
              onClick={() => insertFormatting('- ')}
              className="rounded p-1 hover:bg-black/10 dark:hover:bg-white/10"
              title="Bullet list"
            >
              <List size={14} />
            </button>
            <button
              onClick={() => insertFormatting('- [ ] ')}
              className="rounded p-1 hover:bg-black/10 dark:hover:bg-white/10"
              title="Checklist item"
            >
              <CheckSquare size={14} />
            </button>
          </div>

          <div className="text-[11px] text-neutral-400 tabular-nums">
            {activeNote ? new Date(activeNote.updatedAt).toLocaleString() : ''}
          </div>
        </div>

        {/* Text Area */}
        <div className="flex-1 overflow-auto p-6">
          {activeNote ? (
            <textarea
              value={activeNote.body}
              onChange={(e) => handleUpdateActiveBody(e.target.value)}
              placeholder="Start typing your note here..."
              className="h-full w-full resize-none border-none bg-transparent font-sans text-sm text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 outline-none leading-relaxed select-text"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-neutral-400">
              Select or create a note
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
