import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, Tag, Trash2, Calendar as CalIcon } from 'lucide-react';
import { sound } from '../../core/sound';

interface CalEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "10:00 AM"
  category: 'work' | 'personal' | 'important';
  notes?: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  work: { bg: 'bg-blue-500/15', text: 'text-blue-500', dot: '#3b82f6' },
  personal: { bg: 'bg-emerald-500/15', text: 'text-emerald-500', dot: '#10b981' },
  important: { bg: 'bg-red-500/15', text: 'text-red-500', dot: '#ef4444' },
};

const INITIAL_EVENTS: CalEvent[] = [
  {
    id: 'evt-1',
    title: 'WebOS Product Launch Review',
    date: new Date().toISOString().split('T')[0],
    time: '11:00 AM',
    category: 'important',
    notes: 'Verify 60fps window drag and responsive dock magnification.',
  },
  {
    id: 'evt-2',
    title: 'Design Critique & Accessibility Audit',
    date: new Date().toISOString().split('T')[0],
    time: '02:30 PM',
    category: 'work',
  },
  {
    id: 'evt-3',
    title: 'Team Coffee & Standup',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '09:30 AM',
    category: 'personal',
  },
];

export const CalendarApp: React.FC<{ windowId: string }> = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalEvent[]>(() => {
    try {
      const saved = localStorage.getItem('webos_calendar_events');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_EVENTS;
  });
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newTime, setNewTime] = useState<string>('10:00 AM');
  const [newCategory, setNewCategory] = useState<'work' | 'personal' | 'important'>('work');
  const [newNotes, setNewNotes] = useState<string>('');

  const saveEvents = (list: CalEvent[]) => {
    setEvents(list);
    localStorage.setItem('webos_calendar_events', JSON.stringify(list));
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    sound.playClick();
    const newEvt: CalEvent = {
      id: `evt-${Date.now()}`,
      title: newTitle.trim(),
      date: selectedDate,
      time: newTime,
      category: newCategory,
      notes: newNotes.trim() || undefined,
    };
    saveEvents([...events, newEvt]);
    setShowNewModal(false);
    setNewTitle('');
    setNewNotes('');
  };

  const handleDeleteEvent = (id: string) => {
    sound.playTrash();
    saveEvents(events.filter((e) => e.id !== id));
  };

  // Month days computation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const firstDayIdx = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const daysGrid: Array<{ dayNum: number; dateStr: string; isCurrentMonth: boolean }> = [];

  // Trailing days from prev month
  for (let i = firstDayIdx - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const dateObj = new Date(year, month - 1, day);
    daysGrid.push({
      dayNum: day,
      dateStr: dateObj.toISOString().split('T')[0],
      isCurrentMonth: false,
    });
  }

  // Days in current month
  for (let d = 1; d <= totalDays; d++) {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    daysGrid.push({
      dayNum: d,
      dateStr: `${year}-${monthStr}-${dayStr}`,
      isCurrentMonth: true,
    });
  }

  // Remaining days to fill 42 cells (6 rows)
  const remaining = 42 - daysGrid.length;
  for (let d = 1; d <= remaining; d++) {
    const dateObj = new Date(year, month + 1, d);
    daysGrid.push({
      dayNum: d,
      dateStr: dateObj.toISOString().split('T')[0],
      isCurrentMonth: false,
    });
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const selectedDateEvents = events.filter((e) => e.date === selectedDate);

  return (
    <div className="flex h-full w-full bg-[var(--window-bg)] text-[var(--window-text)] select-none">
      {/* Sidebar: Mini Calendar and Selected Date's Agenda */}
      <div className="w-64 shrink-0 border-r border-black/10 dark:border-white/10 bg-[var(--window-sidebar)] flex flex-col p-3 gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
          <span className="font-semibold text-xs text-neutral-800 dark:text-neutral-200">Agenda</span>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1 rounded-md bg-[var(--accent)] px-2 py-1 text-xs font-medium text-white shadow-sm hover:opacity-90"
          >
            <Plus size={12} />
            <span>New Event</span>
          </button>
        </div>

        {/* Selected Date Summary */}
        <div className="rounded-lg border border-black/5 dark:border-white/5 bg-white/70 dark:bg-neutral-800/70 p-3 shadow-sm">
          <div className="text-[11px] font-semibold text-[var(--accent)] uppercase tracking-wider">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long' })}
          </div>
          <div className="text-xl font-bold text-neutral-900 dark:text-white">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>

        {/* Events list for selected date */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {selectedDateEvents.length === 0 ? (
            <div className="text-center py-8 text-neutral-400 text-xs">
              No events scheduled for this day
            </div>
          ) : (
            selectedDateEvents.map((evt) => {
              const cat = CATEGORY_COLORS[evt.category] || CATEGORY_COLORS.work;
              return (
                <div
                  key={evt.id}
                  className={`group relative rounded-lg p-2.5 ${cat.bg} border border-black/5 dark:border-white/5 shadow-sm text-xs space-y-1`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${cat.text} truncate pr-4`}>{evt.title}</span>
                    <button
                      onClick={() => handleDeleteEvent(evt.id)}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-500 text-neutral-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                    <Clock size={11} />
                    <span className="tabular-nums">{evt.time}</span>
                  </div>
                  {evt.notes && (
                    <p className="text-[10px] text-neutral-600 dark:text-neutral-300 pt-0.5 line-clamp-2">
                      {evt.notes}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Month Grid View */}
      <div className="flex flex-1 flex-col overflow-hidden bg-white dark:bg-neutral-900">
        {/* Calendar Nav Header */}
        <div className="flex h-11 items-center justify-between border-b border-black/10 dark:border-white/10 px-4 bg-[var(--window-header)]">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{monthName}</h2>
            <button
              onClick={handleToday}
              className="rounded-md border border-black/10 dark:border-white/10 px-2 py-0.5 text-xs text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10"
            >
              Today
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="rounded p-1 text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNextMonth}
              className="rounded p-1 text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 border-b border-black/5 dark:border-white/5 py-1.5 text-center text-xs font-semibold text-neutral-400">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Grid Cells */}
        <div className="grid flex-1 grid-cols-7 grid-rows-6 divide-x divide-y divide-black/5 dark:divide-white/5 overflow-hidden">
          {daysGrid.map((item, idx) => {
            const isToday = item.dateStr === todayStr;
            const isSelected = item.dateStr === selectedDate;
            const dayEvents = events.filter((e) => e.date === item.dateStr);

            return (
              <div
                key={idx}
                onClick={() => setSelectedDate(item.dateStr)}
                className={`group flex flex-col p-1.5 cursor-pointer transition-colors overflow-hidden ${
                  !item.isCurrentMonth ? 'opacity-30 bg-black/[0.02] dark:bg-white/[0.02]' : ''
                } ${isSelected ? 'bg-blue-50/50 dark:bg-blue-950/20' : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.03]'}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-xs tabular-nums font-medium ${
                      isToday
                        ? 'bg-red-500 text-white font-bold'
                        : isSelected
                        ? 'bg-[var(--accent)] text-white font-semibold'
                        : 'text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {item.dayNum}
                  </span>
                </div>

                {/* Day events pills */}
                <div className="mt-1 space-y-0.5 overflow-hidden">
                  {dayEvents.slice(0, 3).map((e) => (
                    <div
                      key={e.id}
                      className="truncate rounded px-1 py-0.5 text-[10px] font-medium leading-none text-white shadow-xs"
                      style={{ backgroundColor: CATEGORY_COLORS[e.category]?.dot || '#3b82f6' }}
                    >
                      {e.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[9px] text-neutral-400 font-medium pl-1">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Event Modal */}
      {showNewModal && (
        <div 
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowNewModal(false)}
        >
          <form 
            onSubmit={handleAddEvent}
            className="w-[380px] rounded-xl border border-black/10 dark:border-white/20 bg-white dark:bg-neutral-900 p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-2">
              <h3 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100">Add New Event</h3>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="text-xs text-neutral-400 hover:text-neutral-600"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-500 pb-1">Event Title</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Design review"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-800 p-2 text-neutral-800 dark:text-neutral-100 outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-500 pb-1">Time</label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="10:00 AM"
                    className="w-full rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-800 p-2 text-neutral-800 dark:text-neutral-100 outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 pb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-800 p-2 text-neutral-800 dark:text-neutral-100 outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  >
                    <option value="work">Work (Blue)</option>
                    <option value="personal">Personal (Green)</option>
                    <option value="important">Important (Red)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 pb-1">Notes (Optional)</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Additional context or location"
                  rows={2}
                  className="w-full rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-800 p-2 text-neutral-800 dark:text-neutral-100 outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                className="rounded-lg bg-[var(--accent)] px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:opacity-90"
              >
                Create Event
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
