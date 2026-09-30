import React, { useEffect, useRef, useState } from 'react';
import { 
  Wifi, Bluetooth, Moon, BellOff, Sun,
  Music, Play, SkipForward, Sliders, Check, ChevronDown
} from 'lucide-react';
import { useThemeStore, AUDIO_OUTPUT_DEVICES, getAudioOutputDevice } from '../core/themeStore';
import { useProcessStore } from '../core/processStore';
import { sound } from '../core/sound';
import { MacSlider, VolumeGlyph } from './VolumeSlider';
import { OUTPUT_DEVICE_ICONS } from './VolumeHUD';

/* ------------------------------------------------------------------ *
 * Sound — macOS audio output manager
 * ------------------------------------------------------------------ */

const AudioOutputModule: React.FC = () => {
  const {
    volume,
    soundEnabled,
    setMasterVolume,
    setSoundEnabled,
    outputDeviceId,
    setOutputDevice,
  } = useThemeStore();

  const [isDeviceListOpen, setIsDeviceListOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const device = getAudioOutputDevice(outputDeviceId);
  const DeviceIcon = OUTPUT_DEVICE_ICONS[device.kind];

  /* Close the output popover on outside press or Escape, like AppKit popovers. */
  useEffect(() => {
    if (!isDeviceListOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setIsDeviceListOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDeviceListOpen(false);
    };

    window.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isDeviceListOpen]);

  return (
    <div
      ref={wrapRef}
      className="relative rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-neutral-800/70 p-3 shadow-sm space-y-2"
    >
      {/* Header: mute toggle · label · output device popover button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setSoundEnabled(!soundEnabled);
            if (!soundEnabled) sound.playDockClick();
          }}
          aria-label={soundEnabled ? 'Mute output' : 'Unmute output'}
          aria-pressed={!soundEnabled}
          title={soundEnabled ? 'Mute' : 'Unmute'}
          className={`shrink-0 rounded-md p-0.5 transition-colors hover:bg-black/8 dark:hover:bg-white/10 ${
            soundEnabled ? '' : 'opacity-55'
          }`}
        >
          <VolumeGlyph volume={volume} muted={!soundEnabled} size={16} />
        </button>

        <span className="flex-1 truncate text-[12px] font-semibold">Sound</span>

        <button
          onClick={() => {
            sound.playClick();
            setIsDeviceListOpen((open) => !open);
          }}
          aria-haspopup="listbox"
          aria-expanded={isDeviceListOpen}
          aria-label={`Output device: ${device.name}`}
          title="Choose output device"
          className={`flex min-w-0 max-w-[132px] items-center gap-1.5 rounded-full py-0.5 pl-1.5 pr-1 transition-colors ${
            isDeviceListOpen
              ? 'bg-black/12 dark:bg-white/18'
              : 'hover:bg-black/8 dark:hover:bg-white/10'
          }`}
        >
          <DeviceIcon size={12} className="shrink-0 opacity-60" />
          <span className="min-w-0 flex-1 truncate text-[10px] font-medium leading-tight text-right">
            {device.name}
          </span>
          <ChevronDown size={11} strokeWidth={2.5} className="shrink-0 opacity-45" />
        </button>
      </div>

      {/* Master output level */}
      <MacSlider
        value={volume}
        min={0}
        max={100}
        onChange={setMasterVolume}
        disabled={false}
        ariaLabel="Output volume"
      />

      {/* Output device list */}
      {isDeviceListOpen && (
        <div
          role="listbox"
          aria-label="Output devices"
          className="mac-popover absolute right-3 top-[calc(100%-2px)] z-30 w-[248px]"
        >
          {AUDIO_OUTPUT_DEVICES.map((candidate) => {
            const CandidateIcon = OUTPUT_DEVICE_ICONS[candidate.kind];
            const isActive = candidate.id === outputDeviceId;

            return (
              <button
                key={candidate.id}
                role="option"
                aria-selected={isActive}
                disabled={!candidate.connected}
                data-highlighted={isActive || undefined}
                data-disabled={!candidate.connected || undefined}
                onClick={() => {
                  sound.playClick();
                  setOutputDevice(candidate.id);
                  setIsDeviceListOpen(false);
                }}
                className="macos-menu-item w-full"
              >
                <span className="macos-menu-icon">
                  <CandidateIcon size={15} />
                </span>
                <span className="macos-menu-label flex flex-col items-start leading-tight">
                  <span>{candidate.name}</span>
                  {!candidate.connected && (
                    <span className="text-[10px] opacity-55">Not Connected</span>
                  )}
                </span>
                {isActive && <Check size={13} strokeWidth={2.6} className="shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ *
 * Control Center
 * ------------------------------------------------------------------ */

export const ControlCenter: React.FC = () => {
  const {
    isControlCenterOpen, setControlCenterOpen,
    wifiEnabled, setWifiEnabled,
    bluetoothEnabled, setBluetoothEnabled,
    doNotDisturb, setDoNotDisturb,
    mode, toggleMode,
    brightness, setBrightness,
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
          <MacSlider
            value={brightness}
            min={30}
            max={100}
            onChange={setBrightness}
            ariaLabel="Display brightness"
          />
        </div>

        {/* Sound — master output level + output device manager */}
        <AudioOutputModule />

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
