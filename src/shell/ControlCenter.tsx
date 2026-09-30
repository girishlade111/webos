import React from 'react';
import { 
  Wifi, Bluetooth, Moon, BellOff, Sun, Volume2, VolumeX,
  Music, Play, Pause, SkipForward, Sliders 
} from 'lucide-react';
import { useThemeStore } from '../core/themeStore';
import { useProcessStore } from '../core/processStore';
import { sound } from '../core/sound';

export const ControlCenter: React.FC = () => {
  const {
    isControlCenterOpen, setControlCenterOpen,
    wifiEnabled, setWifiEnabled,
    bluetoothEnabled, setBluetoothEnabled,
    doNotDisturb, setDoNotDisturb,
    mode, toggleMode,
    brightness, setBrightness,
    volume, setVolume,
    soundEnabled, setSoundEnabled,
    username, userAvatar,
  } = useThemeStore();
  const { openWindow } = useProcessStore();

  if (!isControlCenterOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[8900] select-none pointer-events-auto"
      onClick={() => setControlCenterOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute top-9 right-3 w-80 rounded-2xl border border-black/15 dark:border-white/20 bg-neutral-100/80 dark:bg-neutral-900/80 p-3.5 shadow-2xl glass-panel space-y-3 animate-fade-in text-neutral-800 dark:text-neutral-100 text-xs"
      >
        {/* User Profile Card */}
        <div
          onClick={() => {
            sound.playClick();
            setControlCenterOpen(false);
            openWindow('settings');
          }}
          className="flex items-center gap-3 p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-sm ring-1 ring-white/30 overflow-hidden shrink-0">
            {userAvatar?.startsWith('http') || userAvatar?.startsWith('/') || userAvatar?.startsWith('data:') ? (
              <img src={userAvatar} alt={username} className="h-full w-full object-cover" />
            ) : (
              <span className="text-base">{userAvatar || '👤'}</span>
            )}
          </div>
          <div className="truncate flex-1">
            <div className="font-semibold text-xs truncate">{username}</div>
            <div className="text-[10px] text-neutral-400">Settings & Preferences</div>
          </div>
        </div>
        {/* Top 2x2 Toggle Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Connectivity Box */}
          <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-neutral-800/70 p-2.5 shadow-sm space-y-2">
            {/* Wi-Fi */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  sound.playClick();
                  setWifiEnabled(!wifiEnabled);
                }}
                className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                  wifiEnabled ? 'bg-[var(--accent)] text-white' : 'bg-black/10 dark:bg-white/10 text-neutral-400'
                }`}
              >
                <Wifi size={14} />
              </button>
              <div className="truncate">
                <div className="font-semibold text-[11px]">Wi-Fi</div>
                <div className="text-[10px] text-neutral-400 truncate">
                  {wifiEnabled ? 'WebOS-5G' : 'Off'}
                </div>
              </div>
            </div>

            {/* Bluetooth */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  sound.playClick();
                  setBluetoothEnabled(!bluetoothEnabled);
                }}
                className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                  bluetoothEnabled ? 'bg-[var(--accent)] text-white' : 'bg-black/10 dark:bg-white/10 text-neutral-400'
                }`}
              >
                <Bluetooth size={14} />
              </button>
              <div className="truncate">
                <div className="font-semibold text-[11px]">Bluetooth</div>
                <div className="text-[10px] text-neutral-400 truncate">
                  {bluetoothEnabled ? 'On' : 'Off'}
                </div>
              </div>
            </div>
          </div>

          {/* Mode & Do Not Disturb */}
          <div className="grid grid-rows-2 gap-2.5">
            {/* Dark Mode */}
            <button
              onClick={() => {
                sound.playClick();
                toggleMode();
              }}
              className={`flex items-center gap-2.5 rounded-xl border border-black/5 dark:border-white/10 p-2 text-left shadow-sm transition-colors ${
                mode === 'dark' ? 'bg-indigo-600 text-white' : 'bg-white/70 dark:bg-neutral-800/70'
              }`}
            >
              <Moon size={14} className={mode === 'dark' ? 'text-white' : 'text-neutral-500'} />
              <span className="font-semibold text-[11px]">Dark Mode</span>
            </button>

            {/* Do Not Disturb */}
            <button
              onClick={() => {
                sound.playClick();
                setDoNotDisturb(!doNotDisturb);
              }}
              className={`flex items-center gap-2.5 rounded-xl border border-black/5 dark:border-white/10 p-2 text-left shadow-sm transition-colors ${
                doNotDisturb ? 'bg-purple-600 text-white' : 'bg-white/70 dark:bg-neutral-800/70'
              }`}
            >
              <BellOff size={14} className={doNotDisturb ? 'text-white' : 'text-neutral-500'} />
              <span className="font-semibold text-[11px]">Do Not Disturb</span>
            </button>
          </div>
        </div>

        {/* Display Brightness Slider */}
        <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-neutral-800/70 p-3 shadow-sm space-y-1.5">
          <div className="flex justify-between items-center text-[11px] font-semibold">
            <span className="flex items-center gap-1.5">
              <Sun size={13} className="text-amber-500" />
              <span>Display</span>
            </span>
            <span className="tabular-nums text-neutral-400 font-mono text-[10px]">{brightness}%</span>
          </div>
          <input
            type="range"
            min="30"
            max="100"
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
          />
        </div>

        {/* Sound Volume Slider with Mute Toggle */}
        <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-neutral-800/70 p-3 shadow-sm space-y-1.5">
          <div className="flex justify-between items-center text-[11px] font-semibold">
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) sound.playDockClick();
              }}
              className="flex items-center gap-1.5 hover:opacity-80 transition-opacity text-left"
              title={soundEnabled ? 'Click to Mute' : 'Click to Unmute'}
            >
              {soundEnabled ? (
                <Volume2 size={13} className="text-blue-500" />
              ) : (
                <VolumeX size={13} className="text-neutral-400" />
              )}
              <span>Sound {soundEnabled ? '' : '(Muted)'}</span>
            </button>
            <span className="tabular-nums text-neutral-400 font-mono text-[10px]">{volume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            disabled={!soundEnabled}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--accent)] disabled:opacity-40"
          />
        </div>

        {/* Now Playing Widget */}
        <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-neutral-800/70 p-3 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate pr-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-pink-500 to-rose-600 text-white shadow-xs">
              <Music size={16} />
            </div>
            <div className="truncate">
              <div className="font-semibold text-xs truncate">Solar Wind Ambient</div>
              <div className="text-[10px] text-neutral-400 truncate">WebOS Soundscapes</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => sound.playClick()}
              className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
            >
              <Play size={14} className="ml-0.5" />
            </button>
            <button
              onClick={() => sound.playClick()}
              className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
            >
              <SkipForward size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
