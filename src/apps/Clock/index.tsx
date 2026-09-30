import React, { useState, useEffect, useRef } from 'react';
import { Globe, Bell, Timer, Clock as ClockIcon, Play, Pause, RotateCcw, Plus, Trash2, Check, X } from 'lucide-react';
import { sound } from '../../core/sound';

type Tab = 'world' | 'alarm' | 'stopwatch' | 'timer';

interface WorldCity {
  id: string;
  name: string;
  country: string;
  timezone: string;
  utcOffset: number; // in hours
}

const DEFAULT_CITIES: WorldCity[] = [
  { id: 'cupertino', name: 'Cupertino', country: 'United States', timezone: 'America/Los_Angeles', utcOffset: -7 },
  { id: 'newyork', name: 'New York', country: 'United States', timezone: 'America/New_York', utcOffset: -4 },
  { id: 'london', name: 'London', country: 'United Kingdom', timezone: 'Europe/London', utcOffset: 1 },
  { id: 'mumbai', name: 'Mumbai', country: 'India', timezone: 'Asia/Kolkata', utcOffset: 5.5 },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo', utcOffset: 9 },
  { id: 'paris', name: 'Paris', country: 'France', timezone: 'Europe/Paris', utcOffset: 2 },
];

interface AlarmItem {
  id: string;
  time: string; // HH:mm
  label: string;
  enabled: boolean;
}

export const ClockApp: React.FC<{ windowId: string }> = () => {
  const [activeTab, setActiveTab] = useState<Tab>('world');
  const [now, setNow] = useState<Date>(new Date());

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- World Clock State ---
  const [cities, setCities] = useState<WorldCity[]>(() => {
    try {
      const saved = localStorage.getItem('webos_clock_cities');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_CITIES;
  });
  const [isAddCityOpen, setIsAddCityOpen] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [newCityOffset, setNewCityOffset] = useState('0');

  // --- Alarms State ---
  const [alarms, setAlarms] = useState<AlarmItem[]>(() => {
    try {
      const saved = localStorage.getItem('webos_clock_alarms');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 'alarm-1', time: '07:00', label: 'Morning Wakeup', enabled: true },
      { id: 'alarm-2', time: '09:30', label: 'Standup Meeting', enabled: false },
    ];
  });

  const toggleAlarm = (id: string) => {
    sound.playClick();
    setAlarms((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a));
      localStorage.setItem('webos_clock_alarms', JSON.stringify(next));
      return next;
    });
  };

  const addAlarm = () => {
    sound.playClick();
    const newAlarm: AlarmItem = {
      id: `alarm-${Date.now()}`,
      time: '08:00',
      label: 'New Alarm',
      enabled: true,
    };
    const next = [...alarms, newAlarm];
    setAlarms(next);
    localStorage.setItem('webos_clock_alarms', JSON.stringify(next));
  };

  const deleteAlarm = (id: string) => {
    sound.playClick();
    const next = alarms.filter((a) => a.id !== id);
    setAlarms(next);
    localStorage.setItem('webos_clock_alarms', JSON.stringify(next));
  };

  // --- Stopwatch State ---
  const [stopwatchRunning, setStopwatchRunning] = useState<boolean>(false);
  const [stopwatchTime, setStopwatchTime] = useState<number>(0);
  const [laps, setLaps] = useState<number[]>([]);
  const stopwatchRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (stopwatchRunning) {
      const startTime = Date.now() - stopwatchTime;
      stopwatchRef.current = setInterval(() => {
        setStopwatchTime(Date.now() - startTime);
      }, 10);
    } else {
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
    }
    return () => {
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
    };
  }, [stopwatchRunning]);

  const handleLap = () => {
    sound.playClick();
    setLaps((prev) => [stopwatchTime, ...prev]);
  };

  const handleResetStopwatch = () => {
    sound.playClick();
    setStopwatchRunning(false);
    setStopwatchTime(0);
    setLaps([]);
  };

  const formatStopwatch = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
  };

  // --- Timer State ---
  const [timerMinutes, setTimerMinutes] = useState<number>(5);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [timerRemaining, setTimerRemaining] = useState<number>(300);
  const [timerTotal, setTimerTotal] = useState<number>(300);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerRunning && timerRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            sound.playWindowFocus();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerRunning, timerRemaining]);

  const startTimer = () => {
    sound.playClick();
    const total = timerMinutes * 60 + timerSeconds;
    if (total <= 0) return;
    setTimerTotal(total);
    setTimerRemaining(total);
    setTimerRunning(true);
  };

  const formatTimerTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Helper for analog clock hands angles
  const getHandAngles = (cityOffset: number) => {
    const utcHours = now.getUTCHours() + cityOffset;
    const hours = (utcHours % 12 + 12) % 12;
    const minutes = now.getUTCMinutes();
    const seconds = now.getUTCSeconds();

    return {
      hour: (hours + minutes / 60) * 30,
      minute: (minutes + seconds / 60) * 6,
      second: seconds * 6,
    };
  };

  return (
    <div className="flex h-full w-full flex-col bg-neutral-900 text-white select-none overflow-hidden">
      {/* Top Segmented Controls / Tabs */}
      <div className="flex items-center justify-center p-3 border-b border-white/10 bg-neutral-900/80 backdrop-blur-md">
        <div className="flex gap-1 rounded-xl bg-white/10 p-1">
          {[
            { id: 'world', label: 'World Clock', icon: Globe },
            { id: 'alarm', label: 'Alarms', icon: Bell },
            { id: 'stopwatch', label: 'Stopwatch', icon: ClockIcon },
            { id: 'timer', label: 'Timer', icon: Timer },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sound.playClick();
                  setActiveTab(tab.id as Tab);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-[var(--accent)]' : ''} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* WORLD CLOCK */}
        {activeTab === 'world' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">World Clocks</h2>
              <button
                onClick={() => setIsAddCityOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors"
              >
                <Plus size={14} /> Add City
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cities.map((city) => {
                const angles = getHandAngles(city.utcOffset);
                const localDiff = city.utcOffset - (-7); // relative to PDT
                const diffStr = localDiff === 0 ? 'Same time' : localDiff > 0 ? `+${localDiff} hrs` : `${localDiff} hrs`;
                const utcHours = Math.floor(now.getUTCHours() + city.utcOffset);
                const digitalHours = String(((utcHours % 24) + 24) % 24).padStart(2, '0');
                const digitalMins = String(now.getUTCMinutes()).padStart(2, '0');

                return (
                  <div
                    key={city.id}
                    className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all shadow-md"
                  >
                    <div>
                      <h3 className="text-base font-bold text-white">{city.name}</h3>
                      <p className="text-xs text-white/50">{city.country} • {diffStr}</p>
                      <p className="text-2xl font-light text-white/90 mt-1 tabular-nums font-mono">
                        {digitalHours}:{digitalMins}
                      </p>
                    </div>

                    {/* Analog Clock Face */}
                    <div className="relative h-16 w-16 rounded-full border-2 border-white/30 bg-neutral-800 flex items-center justify-center shrink-0 shadow-inner">
                      {/* Hour hand */}
                      <div
                        style={{ transform: `rotate(${angles.hour}deg)` }}
                        className="absolute w-1 h-5 bg-white rounded-full origin-bottom bottom-1/2 left-[calc(50%-2px)]"
                      />
                      {/* Minute hand */}
                      <div
                        style={{ transform: `rotate(${angles.minute}deg)` }}
                        className="absolute w-0.5 h-6 bg-white/80 rounded-full origin-bottom bottom-1/2 left-[calc(50%-1px)]"
                      />
                      {/* Second hand */}
                      <div
                        style={{ transform: `rotate(${angles.second}deg)` }}
                        className="absolute w-0.5 h-7 bg-orange-500 rounded-full origin-bottom bottom-1/2 left-[calc(50%-1px)]"
                      />
                      {/* Center pin */}
                      <div className="h-1.5 w-1.5 rounded-full bg-orange-500 z-10" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ALARMS */}
        {activeTab === 'alarm' && (
          <div className="space-y-4 max-w-lg mx-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">Alarms</h2>
              <button
                onClick={addAlarm}
                className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors"
              >
                <Plus size={14} /> Add Alarm
              </button>
            </div>

            <div className="space-y-3">
              {alarms.map((alarm) => (
                <div
                  key={alarm.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10"
                >
                  <div>
                    <span className="text-3xl font-light tabular-nums font-mono text-white">
                      {alarm.time}
                    </span>
                    <p className="text-xs text-white/60">{alarm.label}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleAlarm(alarm.id)}
                      className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                        alarm.enabled ? 'bg-emerald-500' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`h-5 w-5 rounded-full bg-white transition-transform ${
                          alarm.enabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => deleteAlarm(alarm.id)}
                      className="text-white/40 hover:text-red-400 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STOPWATCH */}
        {activeTab === 'stopwatch' && (
          <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-6 pt-4">
            <div className="text-6xl font-extralight tracking-tight tabular-nums font-mono text-white drop-shadow-md">
              {formatStopwatch(stopwatchTime)}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  sound.playClick();
                  setStopwatchRunning(!stopwatchRunning);
                }}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-lg ${
                  stopwatchRunning ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
              >
                {stopwatchRunning ? <Pause size={16} /> : <Play size={16} />}
                <span>{stopwatchRunning ? 'Stop' : 'Start'}</span>
              </button>

              <button
                onClick={stopwatchRunning ? handleLap : handleResetStopwatch}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 text-white transition-all shadow-md"
              >
                <RotateCcw size={16} />
                <span>{stopwatchRunning ? 'Lap' : 'Reset'}</span>
              </button>
            </div>

            {/* Laps List */}
            {laps.length > 0 && (
              <div className="w-full max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-3 space-y-2 text-xs">
                {laps.map((lapTime, idx) => (
                  <div key={idx} className="flex justify-between py-1 border-b border-white/5 last:border-none">
                    <span className="text-white/60">Lap {laps.length - idx}</span>
                    <span className="font-mono text-white/90">{formatStopwatch(lapTime)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TIMER */}
        {activeTab === 'timer' && (
          <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-6 pt-2">
            {/* Countdown Ring */}
            <div className="relative h-48 w-48 flex items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="4"
                  strokeDasharray={283}
                  strokeDashoffset={283 - (283 * (timerRemaining / (timerTotal || 1)))}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute text-4xl font-light font-mono tabular-nums text-white">
                {formatTimerTime(timerRemaining)}
              </div>
            </div>

            {!timerRunning && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={timerMinutes}
                    onChange={(e) => setTimerMinutes(Number(e.target.value))}
                    className="w-14 rounded-lg bg-white/10 p-1.5 text-center text-sm font-mono outline-none"
                  />
                  <span className="text-xs text-white/50">min</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={timerSeconds}
                    onChange={(e) => setTimerSeconds(Number(e.target.value))}
                    className="w-14 rounded-lg bg-white/10 p-1.5 text-center text-sm font-mono outline-none"
                  />
                  <span className="text-xs text-white/50">sec</span>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={timerRunning ? () => setTimerRunning(false) : startTimer}
                className={`flex items-center gap-2 px-8 py-2.5 rounded-full text-sm font-semibold transition-all shadow-lg ${
                  timerRunning ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
              >
                {timerRunning ? <Pause size={16} /> : <Play size={16} />}
                <span>{timerRunning ? 'Pause' : 'Start'}</span>
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setTimerRunning(false);
                  setTimerRemaining(timerTotal);
                }}
                className="px-6 py-2.5 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 text-white transition-all shadow-md"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add City Modal */}
      {isAddCityOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-80 rounded-2xl bg-neutral-800 border border-white/20 p-5 space-y-4 shadow-2xl text-xs">
            <h3 className="text-sm font-bold text-white">Add World Clock City</h3>
            <div className="space-y-1">
              <label className="text-white/60">City Name</label>
              <input
                type="text"
                placeholder="e.g. Berlin"
                value={newCityName}
                onChange={(e) => setNewCityName(e.target.value)}
                className="w-full rounded-lg bg-white/10 p-2 text-white outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-white/60">UTC Offset (hours, e.g. +1, -5)</label>
              <input
                type="number"
                value={newCityOffset}
                onChange={(e) => setNewCityOffset(e.target.value)}
                className="w-full rounded-lg bg-white/10 p-2 text-white outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddCityOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-white/20 text-white/80"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newCityName.trim()) {
                    const newCity: WorldCity = {
                      id: `city-${Date.now()}`,
                      name: newCityName.trim(),
                      country: 'Global',
                      timezone: 'UTC',
                      utcOffset: Number(newCityOffset) || 0,
                    };
                    const next = [...cities, newCity];
                    setCities(next);
                    localStorage.setItem('webos_clock_cities', JSON.stringify(next));
                    setNewCityName('');
                    setIsAddCityOpen(false);
                    sound.playClick();
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white font-medium"
              >
                Add City
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
