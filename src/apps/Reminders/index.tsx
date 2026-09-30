import React, { useState, useEffect } from 'react';
import { 
  Calendar, CheckCircle, Flag, Clock, Plus, Search, Trash2, 
  Tag, List, Check, AlertCircle, Sparkles 
} from 'lucide-react';
import { sound } from '../../core/sound';

interface ReminderItem {
  id: string;
  title: string;
  notes?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  isFlagged?: boolean;
  isCompleted: boolean;
  listId: string;
}

interface ReminderList {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

const DEFAULT_LISTS: ReminderList[] = [
  { id: 'general', name: 'Reminders', color: '#3b82f6' },
  { id: 'work', name: 'Work & Projects', color: '#f97316' },
  { id: 'personal', name: 'Personal', color: '#10b981' },
  { id: 'groceries', name: 'Groceries', color: '#8b5cf6' },
];

const DEFAULT_REMINDERS: ReminderItem[] = [
  { id: 'r1', title: 'Review pull request for WebOS', notes: 'Check window animations and dock indicator', isCompleted: false, priority: 'high', isFlagged: true, listId: 'work' },
  { id: 'r2', title: 'Organize desktop screenshots', isCompleted: false, priority: 'medium', isFlagged: false, listId: 'personal' },
  { id: 'r3', title: 'Buy fresh coffee beans', isCompleted: false, priority: 'low', isFlagged: false, listId: 'groceries' },
  { id: 'r4', title: 'Upgrade to macOS Sequoia beta', isCompleted: true, priority: 'medium', isFlagged: true, listId: 'general' },
];

export const RemindersApp: React.FC<{ windowId: string }> = () => {
  const [lists, setLists] = useState<ReminderList[]>(() => {
    try {
      const saved = localStorage.getItem('webos_reminders_lists');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_LISTS;
  });

  const [reminders, setReminders] = useState<ReminderItem[]>(() => {
    try {
      const saved = localStorage.getItem('webos_reminders_items');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_REMINDERS;
  });

  const [selectedSmartCategory, setSelectedSmartCategory] = useState<string | null>('all');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [newReminderTitle, setNewReminderTitle] = useState<string>('');

  // Persist
  const saveReminders = (newItems: ReminderItem[]) => {
    setReminders(newItems);
    try {
      localStorage.setItem('webos_reminders_items', JSON.stringify(newItems));
    } catch {}
  };

  const toggleComplete = (id: string) => {
    sound.playClick();
    const updated = reminders.map((r) =>
      r.id === id ? { ...r, isCompleted: !r.isCompleted } : r
    );
    saveReminders(updated);
  };

  const toggleFlag = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    const updated = reminders.map((r) =>
      r.id === id ? { ...r, isFlagged: !r.isFlagged } : r
    );
    saveReminders(updated);
  };

  const deleteReminder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    const updated = reminders.filter((r) => r.id !== id);
    saveReminders(updated);
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle.trim()) return;

    sound.playClick();
    const targetListId = selectedListId || 'general';
    const newRem: ReminderItem = {
      id: `rem-${Date.now()}`,
      title: newReminderTitle.trim(),
      isCompleted: false,
      listId: targetListId,
      isFlagged: false,
      priority: 'medium',
    };

    saveReminders([...reminders, newRem]);
    setNewReminderTitle('');
  };

  // Filter items
  const filteredReminders = reminders.filter((r) => {
    if (searchQuery.trim()) {
      return (
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedSmartCategory === 'today') {
      return !r.isCompleted;
    }
    if (selectedSmartCategory === 'scheduled') {
      return Boolean(r.dueDate) && !r.isCompleted;
    }
    if (selectedSmartCategory === 'all') {
      return !r.isCompleted;
    }
    if (selectedSmartCategory === 'flagged') {
      return r.isFlagged && !r.isCompleted;
    }
    if (selectedSmartCategory === 'completed') {
      return r.isCompleted;
    }
    if (selectedListId) {
      return r.listId === selectedListId;
    }
    return true;
  });

  // Smart categories counts
  const todayCount = reminders.filter((r) => !r.isCompleted).length;
  const flaggedCount = reminders.filter((r) => r.isFlagged && !r.isCompleted).length;
  const allCount = reminders.filter((r) => !r.isCompleted).length;
  const completedCount = reminders.filter((r) => r.isCompleted).length;

  return (
    <div className="flex h-full w-full bg-neutral-900 text-white select-none overflow-hidden text-xs">
      {/* Sidebar */}
      <div className="w-56 border-r border-white/10 bg-neutral-900/90 flex flex-col p-3 space-y-4 shrink-0">
        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg bg-white/10 py-1.5 pl-7 pr-2.5 text-xs text-white placeholder-white/40 outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>

        {/* 2x2 Smart Cards Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Today */}
          <div
            onClick={() => {
              setSelectedSmartCategory('today');
              setSelectedListId(null);
            }}
            className={`p-2 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
              selectedSmartCategory === 'today'
                ? 'bg-blue-600/30 border-blue-500'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white">
                <Clock size={12} />
              </div>
              <span className="text-base font-bold tabular-nums">{todayCount}</span>
            </div>
            <span className="font-semibold text-[11px] text-white/80 mt-1">Today</span>
          </div>

          {/* Scheduled */}
          <div
            onClick={() => {
              setSelectedSmartCategory('scheduled');
              setSelectedListId(null);
            }}
            className={`p-2 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
              selectedSmartCategory === 'scheduled'
                ? 'bg-red-600/30 border-red-500'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center text-white">
                <Calendar size={12} />
              </div>
              <span className="text-base font-bold tabular-nums">0</span>
            </div>
            <span className="font-semibold text-[11px] text-white/80 mt-1">Scheduled</span>
          </div>

          {/* All */}
          <div
            onClick={() => {
              setSelectedSmartCategory('all');
              setSelectedListId(null);
            }}
            className={`p-2 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
              selectedSmartCategory === 'all'
                ? 'bg-neutral-600/30 border-neutral-500'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="h-6 w-6 rounded-full bg-neutral-600 flex items-center justify-center text-white">
                <List size={12} />
              </div>
              <span className="text-base font-bold tabular-nums">{allCount}</span>
            </div>
            <span className="font-semibold text-[11px] text-white/80 mt-1">All</span>
          </div>

          {/* Flagged */}
          <div
            onClick={() => {
              setSelectedSmartCategory('flagged');
              setSelectedListId(null);
            }}
            className={`p-2 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
              selectedSmartCategory === 'flagged'
                ? 'bg-orange-600/30 border-orange-500'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center text-white">
                <Flag size={12} />
              </div>
              <span className="text-base font-bold tabular-nums">{flaggedCount}</span>
            </div>
            <span className="font-semibold text-[11px] text-white/80 mt-1">Flagged</span>
          </div>
        </div>

        {/* Completed list */}
        <div
          onClick={() => {
            setSelectedSmartCategory('completed');
            setSelectedListId(null);
          }}
          className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
            selectedSmartCategory === 'completed'
              ? 'bg-emerald-600/30 border-emerald-500'
              : 'bg-white/5 border-white/10 hover:bg-white/10'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-emerald-400" />
            <span className="font-medium text-[11px]">Completed</span>
          </div>
          <span className="font-bold tabular-nums">{completedCount}</span>
        </div>

        {/* Custom Lists section */}
        <div className="flex-1 overflow-y-auto pt-2 space-y-1">
          <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider px-2">
            My Lists
          </div>
          {lists.map((l) => {
            const count = reminders.filter((r) => r.listId === l.id && !r.isCompleted).length;
            const isSelected = selectedListId === l.id && selectedSmartCategory === null;

            return (
              <div
                key={l.id}
                onClick={() => {
                  setSelectedListId(l.id);
                  setSelectedSmartCategory(null);
                }}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  isSelected ? 'bg-white/15 text-white font-semibold' : 'text-white/70 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                  <span className="truncate">{l.name}</span>
                </div>
                <span className="text-[11px] text-white/40 tabular-nums">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col bg-neutral-950 p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white capitalize">
              {selectedSmartCategory || lists.find((l) => l.id === selectedListId)?.name || 'Reminders'}
            </h2>
            <p className="text-white/40 text-[11px]">
              {filteredReminders.length} {filteredReminders.length === 1 ? 'task' : 'tasks'}
            </p>
          </div>
        </div>

        {/* Reminders List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredReminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-white/40 text-xs">
              <CheckCircle size={32} className="mb-2 opacity-30" />
              <span>No reminders in this view</span>
            </div>
          ) : (
            filteredReminders.map((rem) => (
              <div
                key={rem.id}
                onClick={() => toggleComplete(rem.id)}
                className={`group flex items-start gap-3 p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer ${
                  rem.isCompleted ? 'opacity-50' : ''
                }`}
              >
                {/* Circular checkbox */}
                <div
                  className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                    rem.isCompleted
                      ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                      : 'border-white/40 hover:border-white'
                  }`}
                >
                  {rem.isCompleted && <Check size={10} strokeWidth={3} />}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium text-xs text-white leading-snug break-words ${
                      rem.isCompleted ? 'line-through text-white/40' : ''
                    }`}
                  >
                    {rem.title}
                  </p>
                  {rem.notes && (
                    <p className="text-[11px] text-white/50 mt-0.5 leading-snug break-words">
                      {rem.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {rem.isFlagged && <Flag size={13} className="text-orange-400 fill-orange-400" />}
                  <button
                    onClick={(e) => toggleFlag(rem.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-orange-400 transition-opacity p-1"
                    title="Toggle Flag"
                  >
                    <Flag size={13} />
                  </button>
                  <button
                    onClick={(e) => deleteReminder(rem.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 transition-opacity p-1"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add reminder input footer */}
        <form onSubmit={handleAddReminder} className="pt-3 border-t border-white/10 flex items-center gap-2">
          <Plus size={16} className="text-[var(--accent)] shrink-0" />
          <input
            type="text"
            placeholder="Add a new reminder..."
            value={newReminderTitle}
            onChange={(e) => setNewReminderTitle(e.target.value)}
            className="flex-1 bg-transparent text-xs text-white placeholder-white/40 outline-none"
          />
          <button
            type="submit"
            className="px-3 py-1 rounded-lg bg-[var(--accent)] hover:brightness-110 text-white font-medium text-xs transition-all shadow-xs"
          >
            Add
          </button>
        </form>
      </div>
    </div>
  );
};
