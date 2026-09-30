import React, { useState, useEffect } from 'react';
import { ArrowRight, RotateCcw, Power, Moon, Volume2, VolumeX, Unlock } from 'lucide-react';
import { useThemeStore } from '../core/themeStore';
import { sound } from '../core/sound';

export const LoginScreen: React.FC = () => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  const { username, userAvatar, setOSState, soundEnabled, setSoundEnabled } = useThemeStore();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
      setDateStr(
        now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleUnlock = () => {
    sound.playClick();
    setOSState('desktop');
  };

  // Keyboard shortcut listener: Enter or Space anywhere unlocks immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        handleUnlock();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      onClick={handleUnlock}
      className="fixed inset-0 z-[99990] flex flex-col justify-between items-center p-8 backdrop-blur-2xl bg-black/40 text-white select-none transition-all duration-500 cursor-default"
    >
      {/* Top Controls: Sound Toggle */}
      <div className="absolute top-6 right-6 flex items-center z-10" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            if (next) sound.playDockClick();
          }}
          className="flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-3 py-1 text-xs text-white/80 backdrop-blur-md transition-colors cursor-pointer"
          title={soundEnabled ? 'Sound is Enabled (click to mute)' : 'Sound is Muted (click to unmute)'}
        >
          {soundEnabled ? <Volume2 size={13} className="text-emerald-400" /> : <VolumeX size={13} className="text-white/50" />}
          <span className="text-[11px]">{soundEnabled ? 'Sound On' : 'Muted'}</span>
        </button>
      </div>

      {/* Top Lock Screen Clock & Date */}
      <div className="flex flex-col items-center mt-12 space-y-1 text-center">
        <h1 className="text-7xl font-extralight tracking-tight drop-shadow-lg tabular-nums">
          {timeStr}
        </h1>
        <p className="text-base font-medium text-white/90 drop-shadow-md">
          {dateStr}
        </p>
      </div>

      {/* Center User Authentication Card (Password field removed as requested) */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          handleUnlock();
        }}
        className="flex flex-col items-center space-y-4 group cursor-pointer"
      >
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-700 shadow-2xl ring-4 ring-white/30 group-hover:ring-white/50 group-hover:scale-105 transition-all overflow-hidden">
          {userAvatar?.startsWith('http') || userAvatar?.startsWith('/') || userAvatar?.startsWith('data:') ? (
            <img src={userAvatar} alt={username} className="h-full w-full object-cover" />
          ) : (
            <span className="text-4xl">{userAvatar || '👤'}</span>
          )}
          {/* Subtle hover unlock overlay */}
          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Unlock size={24} className="text-white drop-shadow" />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-lg font-semibold drop-shadow-md tracking-tight">{username}</h2>
        </div>

        {/* Clean One-Click Unlock Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleUnlock();
          }}
          className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 border border-white/25 text-xs font-medium text-white backdrop-blur-xl shadow-lg transition-all cursor-pointer"
        >
          <span>Click to Unlock</span>
          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </button>

        <p className="text-[11px] text-white/60 tracking-wide">
          Press Enter, Space, or click anywhere to unlock
        </p>
      </div>

      {/* Bottom Power Options */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-8 mb-4 text-white/70 z-10"
      >
        <button
          onClick={() => setOSState('sleeping')}
          className="flex flex-col items-center gap-1 hover:text-white text-xs transition-colors cursor-pointer"
        >
          <Moon size={18} />
          <span className="text-[10px]">Sleep</span>
        </button>
        <button
          onClick={() => setOSState('booting')}
          className="flex flex-col items-center gap-1 hover:text-white text-xs transition-colors cursor-pointer"
        >
          <RotateCcw size={18} />
          <span className="text-[10px]">Restart</span>
        </button>
        <button
          onClick={() => setOSState('shutdown')}
          className="flex flex-col items-center gap-1 hover:text-white text-xs transition-colors cursor-pointer"
        >
          <Power size={18} />
          <span className="text-[10px]">Shut Down</span>
        </button>
      </div>
    </div>
  );
};
