import React, { useState, useEffect } from 'react';
import { 
  Cloud, Sun, CloudRain, Calendar, CheckCircle2, Circle, 
  Play, Pause, SkipForward, TrendingUp, TrendingDown, 
  Cpu, HardDrive, Battery, BatteryCharging, Clock, X, Plus, Trash2, Check,
  Music, Volume2
} from 'lucide-react';
import { useWidgetStore, WidgetId, AVAILABLE_WIDGETS } from '../core/widgetStore';
import { sound } from '../core/sound';

// 1. macOS Weather Widget (with hourly timeline & gradient)
export const WeatherWidget: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const hourly = [
    { time: 'Now', temp: '72°', icon: Sun },
    { time: '12 PM', temp: '75°', icon: Sun },
    { time: '1 PM', temp: '78°', icon: Cloud },
    { time: '2 PM', temp: '76°', icon: Cloud },
    { time: '3 PM', temp: '73°', icon: CloudRain },
  ];

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-white/25 bg-gradient-to-br from-[#2563eb] via-[#3b82f6] to-[#60a5fa] p-4 text-white shadow-lg backdrop-blur-xl select-none group">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[12px] font-semibold text-white/90">Cupertino</span>
          <div className="text-3xl font-light tracking-tight mt-0.5">72°</div>
        </div>
        <div className="flex flex-col items-end">
          <Sun size={28} className="text-amber-300 drop-shadow-md animate-pulse" />
          <span className="text-[11px] font-medium text-white/90 mt-1">Sunny</span>
        </div>
      </div>

      <div className="mt-2 text-[11px] text-white/80 font-medium">
        H: 78° · L: 54° · Air Quality: 28 (Good)
      </div>

      {!compact && (
        <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between">
          {hourly.map((h, i) => {
            const Icon = h.icon;
            return (
              <div key={i} className="flex flex-col items-center gap-1 text-center">
                <span className="text-[10px] text-white/75">{h.time}</span>
                <Icon size={14} className="text-white/95" />
                <span className="text-[11px] font-medium text-white">{h.temp}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// 2. macOS Calendar Widget (with signature red header & schedule)
export const CalendarWidget: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const today = new Date();
  const dayName = today.toLocaleDateString([], { weekday: 'short' }).toUpperCase();
  const dayNum = today.getDate();
  const monthName = today.toLocaleDateString([], { month: 'long' });

  const events = [
    { time: '11:00 AM', title: 'macOS Sequoia Review', tag: 'bg-blue-500' },
    { time: '2:30 PM', title: 'Design System Architecture', tag: 'bg-purple-500' },
    { time: '5:00 PM', title: 'Silicon Kernel Sync', tag: 'bg-emerald-500' },
  ];

  return (
    <div className="rounded-[22px] border border-black/10 dark:border-white/15 bg-white/85 dark:bg-neutral-900/85 p-4 text-neutral-800 dark:text-neutral-100 shadow-lg backdrop-blur-2xl select-none">
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-red-500 text-white shadow-md shrink-0">
          <span className="text-[9px] font-bold tracking-wider">{dayName}</span>
          <span className="text-xl font-bold leading-tight -mt-0.5">{dayNum}</span>
        </div>
        <div className="truncate">
          <div className="text-[11px] font-semibold text-red-500 uppercase tracking-wide">
            {monthName} {today.getFullYear()}
          </div>
          <div className="text-xs font-semibold truncate text-neutral-700 dark:text-neutral-200">
            3 events scheduled today
          </div>
        </div>
      </div>

      {!compact && (
        <div className="mt-3.5 space-y-2 border-t border-black/5 dark:border-white/10 pt-2.5">
          {events.map((ev, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div className={`h-2 w-2 rounded-full ${ev.tag} shrink-0`} />
              <span className="text-[11px] font-medium text-neutral-400 shrink-0">{ev.time}</span>
              <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 truncate">
                {ev.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 3. macOS Battery Ring Gauges Widget
export const BatteryWidget: React.FC = () => {
  const devices = [
    { name: 'MacBook Pro', percent: 98, isCharging: true, color: '#34c759' },
    { name: 'AirPods Pro', percent: 85, isCharging: false, color: '#007aff' },
    { name: 'Magic Trackpad', percent: 92, isCharging: false, color: '#af52de' },
    { name: 'Apple Watch', percent: 78, isCharging: false, color: '#30b0c7' },
  ];

  return (
    <div className="rounded-[22px] border border-black/10 dark:border-white/15 bg-white/85 dark:bg-neutral-900/85 p-3.5 text-neutral-800 dark:text-neutral-100 shadow-lg backdrop-blur-2xl select-none">
      <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
        <span>Batteries</span>
        <BatteryCharging size={13} className="text-emerald-500" />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {devices.map((dev, i) => {
          const radius = 17;
          const circum = 2 * Math.PI * radius;
          const strokeDash = (dev.percent / 100) * circum;

          return (
            <div key={i} className="flex items-center gap-2.5 p-1.5 rounded-xl bg-black/5 dark:bg-white/5">
              <div className="relative h-10 w-10 shrink-0 flex items-center justify-center">
                <svg className="h-10 w-10 -rotate-90" viewBox="0 0 40 40">
                  <circle
                    cx="20"
                    cy="20"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="3.5"
                    className="text-neutral-200 dark:text-neutral-800"
                    fill="none"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r={radius}
                    stroke={dev.color}
                    strokeWidth="3.5"
                    strokeDasharray={circum}
                    strokeDashoffset={circum - strokeDash}
                    strokeLinecap="round"
                    fill="none"
                    className="transition-all duration-1000"
                  />
                </svg>
                <span className="absolute text-[10px] font-bold">{dev.percent}%</span>
              </div>
              <div className="truncate">
                <div className="text-[11px] font-semibold truncate leading-tight">{dev.name}</div>
                <div className="text-[9px] text-neutral-400">
                  {dev.isCharging ? 'Charging' : 'Connected'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 4. macOS World Clock Widget
export const WorldClockWidget: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const cities = [
    { name: 'Cupertino', tz: 'America/Los_Angeles', diff: '-12.5HRS' },
    { name: 'London', tz: 'Europe/London', diff: '-4.5HRS' },
    { name: 'Tokyo', tz: 'Asia/Tokyo', diff: '+3.5HRS' },
    { name: 'Mumbai', tz: 'Asia/Kolkata', diff: 'LOCAL' },
  ];

  return (
    <div className="rounded-[22px] border border-black/10 dark:border-white/15 bg-white/85 dark:bg-neutral-900/85 p-3.5 text-neutral-800 dark:text-neutral-100 shadow-lg backdrop-blur-2xl select-none">
      <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center justify-between">
        <span>World Clock</span>
        <Clock size={13} className="text-blue-500" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {cities.map((city, i) => {
          let timeString = '';
          try {
            timeString = time.toLocaleTimeString([], {
              timeZone: city.tz,
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            });
          } catch {
            timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
          }

          return (
            <div key={i} className="flex flex-col p-2 rounded-xl bg-black/5 dark:bg-white/5">
              <span className="text-[11px] font-semibold truncate">{city.name}</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-base font-light tabular-nums tracking-tight">{timeString}</span>
                <span className="text-[9px] text-neutral-400 font-medium">{city.diff}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 5. macOS Interactive Reminders Widget
export const RemindersWidget: React.FC = () => {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Review macOS Sequoia release notes', done: false },
    { id: 2, text: 'Prepare Xcode developer build', done: true },
    { id: 3, text: 'Configure Apple Silicon neural engine', done: false },
    { id: 4, text: 'Backup files to Time Machine', done: false },
  ]);

  const toggleTask = (id: number) => {
    sound.playClick();
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  return (
    <div className="rounded-[22px] border border-black/10 dark:border-white/15 bg-white/85 dark:bg-neutral-900/85 p-3.5 text-neutral-800 dark:text-neutral-100 shadow-lg backdrop-blur-2xl select-none">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-orange-500 uppercase tracking-wider">
          Reminders · Today
        </span>
        <span className="text-[10px] font-semibold text-neutral-400">
          {tasks.filter((t) => !t.done).length} remaining
        </span>
      </div>

      <div className="space-y-1.5">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
          >
            {task.done ? (
              <CheckCircle2 size={16} className="text-orange-500 shrink-0" />
            ) : (
              <Circle size={16} className="text-neutral-400 shrink-0 hover:text-orange-400" />
            )}
            <span
              className={`text-xs truncate transition-all ${
                task.done ? 'line-through text-neutral-400 opacity-60' : 'font-medium'
              }`}
            >
              {task.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 6. macOS Now Playing Music Widget
export const MusicWidget: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  return (
    <div className="rounded-[22px] border border-black/10 dark:border-white/15 bg-gradient-to-br from-rose-950/80 via-neutral-900/85 to-neutral-900/85 p-3.5 text-white shadow-lg backdrop-blur-2xl select-none">
      <div className="flex items-center gap-3">
        {/* Album Cover Art */}
        <div className="relative h-14 w-14 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 shadow-lg overflow-hidden shrink-0 flex items-center justify-center">
          <Music size={24} className="text-white drop-shadow" />
          {isPlaying && (
            <div className="absolute bottom-1 right-1 flex items-end gap-0.5 h-3">
              <span className="w-0.5 bg-white h-2 animate-bounce" />
              <span className="w-0.5 bg-white h-3 animate-bounce [animation-delay:0.15s]" />
              <span className="w-0.5 bg-white h-1.5 animate-bounce [animation-delay:0.3s]" />
            </div>
          )}
        </div>

        <div className="truncate flex-1">
          <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider">
            Apple Music
          </span>
          <div className="text-xs font-bold truncate">Starboy (feat. Daft Punk)</div>
          <div className="text-[11px] text-white/70 truncate">The Weeknd</div>
        </div>
      </div>

      {/* Progress & Controls */}
      <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/10">
        <div className="flex items-center gap-2">
          <Volume2 size={13} className="text-white/60" />
          <div className="h-1 w-20 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full w-2/3 bg-white rounded-full" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playClick();
              setIsPlaying(!isPlaying);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-neutral-900 hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            {isPlaying ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" className="ml-0.5" />}
          </button>
          <button
            onClick={() => sound.playClick()}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer"
          >
            <SkipForward size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

// 7. macOS Stocks & Market Performance Widget
export const StocksWidget: React.FC = () => {
  const stocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: '$228.40', change: '+1.45%', isUp: true },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: '$125.80', change: '+2.85%', isUp: true },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: '$254.20', change: '-0.65%', isUp: false },
  ];

  return (
    <div className="rounded-[22px] border border-black/10 dark:border-white/15 bg-white/85 dark:bg-neutral-900/85 p-3.5 text-neutral-800 dark:text-neutral-100 shadow-lg backdrop-blur-2xl select-none">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
          Stocks · NASDAQ
        </span>
        <TrendingUp size={13} className="text-emerald-500" />
      </div>

      <div className="space-y-2">
        {stocks.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="truncate">
              <span className="font-bold text-[12px]">{s.symbol}</span>
              <span className="text-[10px] text-neutral-400 ml-1.5 truncate">{s.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium tabular-nums">{s.price}</span>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md tabular-nums ${
                  s.isUp
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-red-500/15 text-red-600 dark:text-red-400'
                }`}
              >
                {s.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 8. macOS System / Activity Monitor Widget
export const SystemWidget: React.FC = () => {
  return (
    <div className="rounded-[22px] border border-black/10 dark:border-white/15 bg-white/85 dark:bg-neutral-900/85 p-3.5 text-neutral-800 dark:text-neutral-100 shadow-lg backdrop-blur-2xl select-none">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
          Apple M3 Max
        </span>
        <Cpu size={13} className="text-indigo-500" />
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-neutral-500 dark:text-neutral-400">CPU Usage</span>
            <span className="font-semibold">18%</span>
          </div>
          <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
            <div className="h-full w-[18%] bg-blue-500 rounded-full" />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-neutral-500 dark:text-neutral-400">Unified Memory</span>
            <span className="font-semibold">14.2 / 64 GB</span>
          </div>
          <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
            <div className="h-full w-[22%] bg-purple-500 rounded-full" />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-neutral-500 dark:text-neutral-400">Macintosh HD</span>
            <span className="font-semibold">184 / 1000 GB</span>
          </div>
          <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
            <div className="h-full w-[18%] bg-emerald-500 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

// 9. macOS Screen Time Widget
export const ScreenTimeWidget: React.FC = () => {
  return (
    <div className="rounded-[22px] border border-black/10 dark:border-white/15 bg-white/85 dark:bg-neutral-900/85 p-3.5 text-neutral-800 dark:text-neutral-100 shadow-lg backdrop-blur-2xl select-none">
      <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
        Screen Time
      </div>
      <div className="text-2xl font-light tracking-tight">4h 28m</div>
      <div className="text-[10px] text-emerald-500 font-semibold mb-2">↓ 12% from last week</div>

      {/* Stacked bar */}
      <div className="h-2 rounded-full overflow-hidden flex gap-0.5 bg-black/10 dark:bg-white/10">
        <div className="h-full w-[45%] bg-blue-500" title="Productivity: 2h 00m" />
        <div className="h-full w-[30%] bg-purple-500" title="Social: 1h 20m" />
        <div className="h-full w-[25%] bg-amber-500" title="Entertainment: 1h 08m" />
      </div>

      <div className="flex justify-between text-[9px] text-neutral-400 mt-1.5">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Productivity
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-500" /> Social
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Media
        </span>
      </div>
    </div>
  );
};

// Unified Widget Renderer
export const UnifiedWidgetRenderer: React.FC<{ id: WidgetId; compact?: boolean }> = ({ id, compact }) => {
  switch (id) {
    case 'weather':
      return <WeatherWidget compact={compact} />;
    case 'calendar':
      return <CalendarWidget compact={compact} />;
    case 'battery':
      return <BatteryWidget />;
    case 'worldclock':
      return <WorldClockWidget />;
    case 'reminders':
      return <RemindersWidget />;
    case 'music':
      return <MusicWidget />;
    case 'stocks':
      return <StocksWidget />;
    case 'system':
      return <SystemWidget />;
    case 'screentime':
      return <ScreenTimeWidget />;
    default:
      return null;
  }
};

// 10. macOS "Edit Widgets..." Gallery Modal (matches Sonoma / Sequoia Widget Gallery)
export const WidgetGalleryModal: React.FC = () => {
  const { 
    isWidgetGalleryOpen, setWidgetGalleryOpen, 
    desktopWidgets, toggleDesktopWidget,
    notificationWidgets, toggleNotificationWidget,
    resetDefaultWidgets
  } = useWidgetStore();

  const [filterCategory, setFilterCategory] = useState<string>('All');

  if (!isWidgetGalleryOpen) return null;

  const categories = ['All', 'System', 'Productivity', 'Media', 'Finance'];
  const filtered = filterCategory === 'All' 
    ? AVAILABLE_WIDGETS 
    : AVAILABLE_WIDGETS.filter((w) => w.category === filterCategory);

  return (
    <div
      onClick={() => setWidgetGalleryOpen(false)}
      className="fixed inset-0 z-[9500] flex items-center justify-center p-4 bg-black/55 backdrop-blur-2xl animate-fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-[24px] border border-white/20 bg-neutral-900/90 glass-panel shadow-2xl p-6 text-white flex flex-col gap-5 max-h-[85vh] animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-lg font-bold tracking-tight">macOS Widget Gallery</h3>
            <p className="text-xs text-white/60">
              Customize widgets for your Desktop and Notification Center
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playClick();
                resetDefaultWidgets();
              }}
              className="text-xs text-white/60 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              Reset to Default
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setWidgetGalleryOpen(false);
              }}
              className="rounded-full p-1.5 hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                sound.playClick();
                setFilterCategory(cat);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterCategory === cat
                  ? 'bg-white text-neutral-900 shadow-md'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-1 max-h-[50vh]">
          {filtered.map((widget) => {
            const isPinnedOnDesktop = desktopWidgets.includes(widget.id);
            const isPinnedInNotif = notificationWidgets.includes(widget.id);

            return (
              <div
                key={widget.id}
                className="flex flex-col rounded-2xl border border-white/15 bg-white/5 p-4 gap-3 hover:border-white/30 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm">{widget.name}</h4>
                    <p className="text-xs text-white/60 mt-0.5">{widget.description}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/10">
                    {widget.category}
                  </span>
                </div>

                {/* Widget Live Mini Preview */}
                <div className="pointer-events-none transform scale-95 origin-top-left -my-1">
                  <UnifiedWidgetRenderer id={widget.id} compact />
                </div>

                {/* Toggles */}
                <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                  <button
                    onClick={() => {
                      sound.playClick();
                      toggleDesktopWidget(widget.id);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
                      isPinnedOnDesktop
                        ? 'bg-[var(--accent)] text-white shadow'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {isPinnedOnDesktop && <Check size={12} />}
                    <span>{isPinnedOnDesktop ? 'On Desktop' : '+ Add to Desktop'}</span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playClick();
                      toggleNotificationWidget(widget.id);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
                      isPinnedInNotif
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {isPinnedInNotif && <Check size={12} />}
                    <span>{isPinnedInNotif ? 'In Notif Center' : '+ Add to Notifs'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
