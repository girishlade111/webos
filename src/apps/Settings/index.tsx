import React, { useState } from 'react';
import { 
  Palette, Image as WallpaperIcon, LayoutTemplate, Monitor, 
  Volume2, VolumeX, Volume1, Play, Bell, Speaker, User, Wifi, Info, RotateCcw, Check, Sparkles,
  MonitorPlay, Lock, PlayCircle, Keyboard
} from 'lucide-react';
import { useThemeStore, ACCENT_MAP } from '../../core/themeStore';
import { WALLPAPERS } from '../../assets/wallpapers';
import { AccentColor } from '../../types/os';
import { sound } from '../../core/sound';
import { useFSStore } from '../../core/fsStore';
import { WebOSLogo } from '../../assets/appIcons';
import {
  IDLE_DELAY_PRESETS,
  SCREEN_SAVER_VARIANTS,
  useScreenSaverStore,
} from '../../core/screenSaverStore';
import { KeyboardShortcutsPane } from './KeyboardShortcuts';

type SettingsPane = 'appearance' | 'wallpaper' | 'dock' | 'displays' | 'screen' | 'keyboard' | 'sound' | 'users' | 'network' | 'general';

/**
 * Static, CSS-only stand-in for a saver style. It mirrors the real artwork's
 * dominant colours and motion so the picker reads correctly without spinning
 * four live canvases behind a settings window.
 */
const SaverThumbnail: React.FC<{ variantId: string }> = ({ variantId }) => {
  const backdrop: React.CSSProperties =
    variantId === 'starfield'
      ? { background: '#000' }
      : variantId === 'ripple'
        ? {
            background:
              'radial-gradient(circle at 50% 55%, color-mix(in srgb, var(--accent) 40%, transparent) 0%, #000 68%)',
          }
        : variantId === 'aurora'
          ? {
              background:
                'linear-gradient(135deg, color-mix(in srgb, var(--accent) 55%, #000) 0%, #7c3aed 38%, #db2777 70%, #000 100%)',
              filter: 'saturate(1.15)',
            }
          : {
              background:
                'radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--accent) 30%, transparent) 0%, #05070c 70%)',
            };

  return (
    <div className="relative h-[54px] w-full overflow-hidden" style={backdrop} aria-hidden>
      {variantId === 'starfield' && (
        <>
          {[
            [8, 18, 1],
            [22, 52, 1.4],
            [34, 12, 0.8],
            [46, 66, 1.1],
            [58, 26, 0.9],
            [70, 74, 1.3],
            [82, 42, 1],
            [92, 20, 0.8],
            [64, 10, 1.2],
            [16, 82, 1],
          ].map(([x, y, s], i) => (
            <span
              key={i}
              className="absolute rounded-full bg-white"
              style={{ left: `${x}%`, top: `${y}%`, width: s, height: s, opacity: 0.85 }}
            />
          ))}
        </>
      )}

      {variantId === 'aurora' && (
        <>
          <span
            className="absolute -left-4 -top-4 h-16 w-24 rounded-full opacity-70"
            style={{ background: 'color-mix(in srgb, var(--accent) 80%, transparent)', filter: 'blur(10px)' }}
          />
          <span
            className="absolute -bottom-6 right-2 h-16 w-28 rounded-full opacity-60"
            style={{ background: '#22d3ee', filter: 'blur(12px)' }}
          />
        </>
      )}

      {variantId === 'ripple' &&
        [0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 h-14 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{
              borderColor: 'color-mix(in srgb, var(--accent) 55%, white 45%)',
              opacity: 0.5 - i * 0.14,
              transform: `translate(-50%, -50%) scale(${1 + i * 0.22})`,
            }}
          />
        ))}

      {/* The mark, centred in every style */}
      <div className="absolute inset-0 flex items-center justify-center">
        <WebOSLogo size={variantId === 'logo' ? 30 : 24} className="rounded-[7px] shadow-md" />
      </div>
    </div>
  );
};

export const SettingsApp: React.FC<{ windowId: string }> = () => {
  const [activePane, setActivePane] = useState<SettingsPane>('appearance');
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const [selectedAlertSound, setSelectedAlertSound] = useState<'glass' | 'swell' | 'snap' | 'tap' | 'boot'>('glass');

  const {
    mode, setMode,
    accentColor, setAccentColor,
    wallpaperId, setWallpaperId, customWallpaperUrl, setCustomWallpaperUrl,
    dockSize, setDockSize,
    dockMagnification, setDockMagnification,
    dockAutoHide, setDockAutoHide,
    soundEnabled, setSoundEnabled,
    brightness, setBrightness,
    volume, setVolume,
    username, userAvatar, setUserInfo,
    wifiEnabled, setWifiEnabled,
    resetAllSettings,
  } = useThemeStore();

  const { resetFS } = useFSStore();

  const {
    enabled: saverEnabled,
    idleDelayMs,
    variant: saverVariant,
    showClock: saverShowClock,
    lockOnWake: saverLockOnWake,
    setSettings: setSaverSettings,
    resetSettings: resetSaverSettings,
  } = useScreenSaverStore();

  const handleCustomWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCustomWallpaperUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetOS = async () => {
    if (confirm('Are you sure you want to reset WebOS to factory defaults? All files and customized settings will be erased.')) {
      await resetFS();
      resetAllSettings();
      window.location.reload();
    }
  };

  return (
    <div className="flex h-full w-full bg-[var(--window-bg)] text-[var(--window-text)] select-none">
      {/* Settings Navigation Sidebar
          On a compact width the 208px column would leave the pane almost no
          room, so it collapses to a horizontal scrolling rail of the same
          categories — the pane keeps its full width. */}
      <div
        className={`shrink-0 border-black/10 bg-[var(--window-sidebar)] dark:border-white/10 ${
          isCompact
            ? 'flex w-full flex-col border-b'
            : 'flex w-52 flex-col justify-between border-r p-3'
        }`}
      >
        <div className={isCompact ? 'flex gap-1 overflow-x-auto p-2' : 'space-y-1'}>
          {[
            { id: 'appearance', label: 'Appearance', icon: Palette, color: 'text-indigo-500' },
            { id: 'wallpaper', label: 'Wallpaper', icon: WallpaperIcon, color: 'text-pink-500' },
            { id: 'dock', label: 'Desktop & Dock', icon: LayoutTemplate, color: 'text-blue-500' },
            { id: 'displays', label: 'Displays', icon: Monitor, color: 'text-cyan-500' },
            { id: 'screen', label: 'Screen Saver', icon: MonitorPlay, color: 'text-teal-500' },
            { id: 'keyboard', label: 'Keyboard', icon: Keyboard, color: 'text-slate-500' },
            { id: 'sound', label: 'Sound', icon: Volume2, color: 'text-red-500' },
            { id: 'users', label: 'Users & Accounts', icon: User, color: 'text-amber-500' },
            { id: 'network', label: 'Network & Wi-Fi', icon: Wifi, color: 'text-blue-600' },
            { id: 'general', label: 'General / About', icon: Info, color: 'text-neutral-500' },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activePane === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  sound.playClick();
                  setActivePane(item.id as SettingsPane);
                }}
                className={`flex shrink-0 items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10'
                } ${isCompact ? 'whitespace-nowrap' : 'w-full'}`}
              >
                <Icon size={14} className={isActive ? 'text-white' : item.color} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* User Card footer */}
        <div className="flex items-center gap-2.5 rounded-xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 p-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-white text-sm shadow-sm font-semibold overflow-hidden shrink-0">
            {userAvatar?.startsWith('http') || userAvatar?.startsWith('/') || userAvatar?.startsWith('data:') ? (
              <img src={userAvatar} alt={username} className="h-full w-full object-cover" />
            ) : (
              userAvatar || '👤'
            )}
          </div>
          <div className="truncate text-xs">
            <p className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">{username}</p>
            <p className="text-[10px] text-neutral-400">Administrator</p>
          </div>
        </div>
      </div>

      {/* Pane Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Appearance */}
        {activePane === 'appearance' && (
          <div className="max-w-xl space-y-6">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">Appearance</h2>
              <p className="text-xs text-neutral-400">Choose how WebOS looks on your display.</p>
            </div>

            {/* Theme Mode Selection */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Theme Mode</label>
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => setMode('light')}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 cursor-pointer transition-all ${
                    mode === 'light'
                      ? 'border-[var(--accent)] bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-[var(--accent)] shadow-md'
                      : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="h-16 w-full rounded-lg bg-neutral-100 border border-neutral-300 shadow-inner p-2 flex flex-col justify-between">
                    <div className="h-2 w-12 bg-neutral-300 rounded" />
                    <div className="h-5 w-full bg-white rounded shadow-xs" />
                  </div>
                  <span className="text-xs font-medium">Light</span>
                </div>

                <div
                  onClick={() => setMode('dark')}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 cursor-pointer transition-all ${
                    mode === 'dark'
                      ? 'border-[var(--accent)] bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-[var(--accent)] shadow-md'
                      : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="h-16 w-full rounded-lg bg-neutral-900 border border-neutral-700 shadow-inner p-2 flex flex-col justify-between">
                    <div className="h-2 w-12 bg-neutral-700 rounded" />
                    <div className="h-5 w-full bg-neutral-800 rounded shadow-xs" />
                  </div>
                  <span className="text-xs font-medium">Dark</span>
                </div>
              </div>
            </div>

            {/* Accent Color Selection */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Accent Color</label>
              <div className="flex items-center gap-3">
                {(Object.keys(ACCENT_MAP) as AccentColor[]).map((col) => {
                  const info = ACCENT_MAP[col];
                  const isSelected = accentColor === col;
                  return (
                    <button
                      key={col}
                      onClick={() => setAccentColor(col)}
                      style={{ backgroundColor: info.hex }}
                      className={`flex h-7 w-7 items-center justify-center rounded-full shadow-sm transition-transform hover:scale-110 ${
                        isSelected ? 'ring-2 ring-offset-2 ring-neutral-400 dark:ring-offset-neutral-900' : ''
                      }`}
                      title={info.name}
                    >
                      {isSelected && <Check size={14} className="text-white drop-shadow-sm" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Wallpaper */}
        {activePane === 'wallpaper' && (
          <div className="max-w-xl space-y-6">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">Wallpaper</h2>
              <p className="text-xs text-neutral-400">Select a procedural gradient mesh or upload a custom backdrop.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {WALLPAPERS.map((wp) => {
                const isSelected = wallpaperId === wp.id && !customWallpaperUrl;
                return (
                  <div
                    key={wp.id}
                    onClick={() => setWallpaperId(wp.id)}
                    className={`group relative flex flex-col rounded-xl border p-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[var(--accent)] ring-2 ring-[var(--accent)] shadow-md'
                        : 'border-black/10 dark:border-white/10 hover:scale-[1.02]'
                    }`}
                  >
                    <div
                      style={{ background: wp.thumbnailColor }}
                      className="h-24 w-full rounded-lg shadow-sm mb-2"
                    />
                    <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      {wp.name}
                    </span>
                    <span className="text-[10px] text-neutral-400">Dynamic light & dark mesh</span>
                  </div>
                );
              })}
            </div>

            {/* Custom upload */}
            <div className="pt-2">
              <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-black/20 dark:border-white/20 p-4 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
                <span>Upload Custom Wallpaper Image</span>
                <input type="file" accept="image/*" onChange={handleCustomWallpaperUpload} className="hidden" />
              </label>
            </div>
          </div>
        )}

        {/* Desktop & Dock */}
        {activePane === 'dock' && (
          <div className="max-w-xl space-y-6">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">Desktop & Dock</h2>
              <p className="text-xs text-neutral-400">Configure dock magnification and animation physics.</p>
            </div>

            <div className="space-y-4 rounded-xl border border-black/10 dark:border-white/10 p-4 bg-black/5 dark:bg-white/5">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">Dock Icon Size</span>
                  <span className="tabular-nums text-neutral-400">{dockSize}px</span>
                </div>
                <input
                  type="range"
                  min="44"
                  max="80"
                  value={dockSize}
                  onChange={(e) => setDockSize(Number(e.target.value))}
                  className="w-full h-1 bg-black/15 dark:bg-white/15 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                <div>
                  <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Magnification</h4>
                  <p className="text-[11px] text-neutral-400">Magnify icons smoothly on cursor proximity</p>
                </div>
                <input
                  type="checkbox"
                  checked={dockMagnification}
                  onChange={(e) => setDockMagnification(e.target.checked)}
                  className="h-4 w-4 rounded accent-[var(--accent)] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                <div>
                  <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Automatically Hide Dock</h4>
                  <p className="text-[11px] text-neutral-400">Reveal dock when hovering cursor at bottom edge</p>
                </div>
                <input
                  type="checkbox"
                  checked={dockAutoHide}
                  onChange={(e) => setDockAutoHide(e.target.checked)}
                  className="h-4 w-4 rounded accent-[var(--accent)] cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Displays */}
        {activePane === 'displays' && (
          <div className="max-w-xl space-y-6">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">Displays</h2>
              <p className="text-xs text-neutral-400">Adjust screen brightness and display settings.</p>
            </div>

            <div className="space-y-4 rounded-xl border border-black/10 dark:border-white/10 p-4 bg-black/5 dark:bg-white/5">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">Screen Brightness</span>
                  <span className="tabular-nums text-neutral-400">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full h-1 bg-black/15 dark:bg-white/15 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Screen Saver */}
        {activePane === 'screen' && (
          <div className="max-w-xl space-y-4">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">Screen Saver</h2>
              <p className="text-xs text-neutral-400">
                WebOS dims the display and starts the saver after the Mac has been idle.
              </p>
            </div>

            {/* Start / Preview */}
            <div className="flex items-center justify-between rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-4 py-3">
              <div>
                <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Start Screen Saver
                </h4>
                <p className="text-[11px] text-neutral-400">
                  Preview now. Move the mouse or press any key to dismiss.
                </p>
              </div>
              <button
                onClick={() => useScreenSaverStore.getState().engage(true)}
                className="ml-4 flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
              >
                <PlayCircle size={13} />
                Start
              </button>
            </div>

            {/* Wait-until dropdown */}
            <div className="space-y-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-4 py-3">
              <label
                htmlFor="saver-delay"
                className="text-xs font-semibold text-neutral-800 dark:text-neutral-200"
              >
                Wait until
              </label>
              <select
                id="saver-delay"
                value={Number.isFinite(idleDelayMs) ? idleDelayMs : 'never'}
                onChange={(e) => {
                  sound.playClick();
                  setSaverSettings({
                    idleDelayMs: e.target.value === 'never' ? Number.POSITIVE_INFINITY : Number(e.target.value),
                  });
                }}
                disabled={!saverEnabled}
                className="mt-1 w-full cursor-pointer rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-800 px-2.5 py-1.5 text-xs text-neutral-800 dark:text-neutral-200 outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-40"
              >
                {IDLE_DELAY_PRESETS.map((preset) => (
                  <option
                    key={preset.label}
                    value={Number.isFinite(preset.value) ? preset.value : 'never'}
                  >
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Style picker */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Style</span>
              <div className="grid grid-cols-2 gap-3">
                {SCREEN_SAVER_VARIANTS.map((item) => {
                  const isActive = saverVariant === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        sound.playClick();
                        setSaverSettings({ variant: item.id });
                      }}
                      aria-pressed={isActive}
                      className={`group overflow-hidden rounded-xl border text-left transition-all ${
                        isActive
                          ? 'border-[var(--accent)] ring-2 ring-[var(--accent)] shadow-md'
                          : 'border-black/10 dark:border-white/10 hover:border-black/25 dark:hover:border-white/25'
                      }`}
                    >
                      <SaverThumbnail variantId={item.id} />
                      <div className="px-2.5 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200">
                            {item.name}
                          </span>
                          {isActive && <Check size={11} className="text-[var(--accent)]" />}
                        </div>
                        <p className="text-[10px] leading-tight text-neutral-400">{item.hint}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    Enable Screen Saver
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Start automatically after the selected idle delay.
                  </p>
                </div>
                <label className="relative ml-4 inline-flex shrink-0 cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={saverEnabled}
                    onChange={(e) => setSaverSettings({ enabled: e.target.checked })}
                    className="peer sr-only"
                  />
                  <div className="peer-checked:bg-[var(--accent)] peer-focus:outline-none h-6 w-11 rounded-full bg-neutral-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full dark:bg-neutral-700" />
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    Show clock on screen
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Large time and date, styled like the macOS lock screen.
                  </p>
                </div>
                <label className="relative ml-4 inline-flex shrink-0 cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={saverShowClock}
                    onChange={(e) => setSaverSettings({ showClock: e.target.checked })}
                    className="peer sr-only"
                  />
                  <div className="peer-checked:bg-[var(--accent)] peer-focus:outline-none h-6 w-11 rounded-full bg-neutral-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full dark:bg-neutral-700" />
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    Require password
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Return to the login screen when the saver is dismissed.
                  </p>
                </div>
                <label className="relative ml-4 inline-flex shrink-0 cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={saverLockOnWake}
                    onChange={(e) => setSaverSettings({ lockOnWake: e.target.checked })}
                    className="peer sr-only"
                  />
                  <div className="peer-checked:bg-[var(--accent)] peer-focus:outline-none h-6 w-11 rounded-full bg-neutral-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full dark:bg-neutral-700" />
                </label>
              </div>

              <div className="flex items-center justify-between border-t border-black/10 pt-3 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Lock size={13} className="text-neutral-400" />
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Auto-start after 5 minutes of inactivity
                  </span>
                </div>
                <button
                  onClick={() => {
                    sound.playClick();
                    resetSaverSettings();
                  }}
                  className="shrink-0 text-[11px] font-medium text-[var(--accent)] hover:underline"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts */}
        {activePane === 'keyboard' && (
          <div className="flex h-full flex-col">
            <div className="mb-3 shrink-0">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Keyboard Shortcuts
              </h2>
              <p className="text-xs text-neutral-400">
                Click any shortcut to record a new key combination.
              </p>
            </div>
            <div className="min-h-0 flex-1">
              <KeyboardShortcutsPane />
            </div>
          </div>
        )}

        {/* Sound Pane */}
        {activePane === 'sound' && (
          <div className="max-w-xl space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-neutral-900 dark:text-white">Sound</h2>
                  <p className="text-xs text-neutral-400">
                    Configure system audio, master volume level, and sound effects.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
                      soundEnabled
                        ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                        : 'bg-neutral-500/15 text-neutral-400 border border-neutral-500/30'
                    }`}
                  >
                    {soundEnabled ? 'Enabled' : 'Muted'}
                  </span>
                </div>
              </div>
            </div>

            {/* Main Master Volume & Preview Card */}
            <div className="space-y-4 rounded-xl border border-black/10 dark:border-white/10 p-4 bg-black/5 dark:bg-white/5">
              {/* Master Volume Slider with Preview Button */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <Speaker size={14} className="text-[var(--accent)]" />
                    <span>Master Output Volume</span>
                  </span>
                  <span className="tabular-nums text-neutral-400 font-mono text-[11px] font-medium">{volume}%</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (volume > 0) setVolume(0);
                      else setVolume(80);
                    }}
                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                    title={volume === 0 ? 'Unmute' : 'Mute'}
                  >
                    {volume === 0 || !soundEnabled ? <VolumeX size={16} /> : volume < 50 ? <Volume1 size={16} /> : <Volume2 size={16} />}
                  </button>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => {
                      const newVol = Number(e.target.value);
                      setVolume(newVol);
                      sound.setVolume(newVol);
                    }}
                    className="flex-1 h-2 bg-black/15 dark:bg-white/15 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                  />

                  {/* Primary Sound Preview Button */}
                  <button
                    onClick={() => {
                      setIsPlayingPreview(true);
                      // Ensure audio context is ready
                      const prevMute = sound.getMuted();
                      sound.setMuted(false);
                      sound.setVolume(volume);

                      if (selectedAlertSound === 'glass') sound.playNotification();
                      else if (selectedAlertSound === 'swell') sound.playWindowOpen();
                      else if (selectedAlertSound === 'snap') sound.playWindowSnap();
                      else if (selectedAlertSound === 'tap') sound.playDockClick();
                      else if (selectedAlertSound === 'boot') sound.playBootChime();

                      setTimeout(() => {
                        setIsPlayingPreview(false);
                        if (!soundEnabled) {
                          sound.setMuted(true);
                        }
                      }, selectedAlertSound === 'boot' ? 2400 : 700);
                    }}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-xs transition-all ${
                      isPlayingPreview
                        ? 'bg-emerald-600 text-white scale-95 ring-2 ring-emerald-400'
                        : 'bg-[var(--accent)] text-white hover:opacity-90 active:scale-95'
                    }`}
                    title="Click to play sound preview at current master volume"
                  >
                    <Play size={12} className={isPlayingPreview ? 'animate-spin' : ''} fill="currentColor" />
                    <span>{isPlayingPreview ? 'Playing...' : 'Preview Sound'}</span>
                  </button>
                </div>
              </div>

              {/* Toggle System Sounds Switch */}
              <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/5">
                <div>
                  <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <Bell size={13} className="text-amber-500" />
                    <span>Play User Interface Sound Effects</span>
                  </h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Audio clips for window opening, minimizing, closing, dock taps, and notifications.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setSoundEnabled(enabled);
                      if (enabled) {
                        setTimeout(() => sound.playDockClick(), 50);
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-300 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]" />
                </label>
              </div>
            </div>

            {/* Alert & Sound Clip Selection */}
            <div className="space-y-3 rounded-xl border border-black/10 dark:border-white/10 p-4 bg-black/5 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    System Alert & Interaction Sounds
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Select a sound to test with the preview button above.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {[
                  { id: 'glass', name: 'Glass Chime', desc: 'Notification sound (E6 → A6)', action: () => sound.playNotification() },
                  { id: 'swell', name: 'Window Swell', desc: 'Airy window launch whoosh', action: () => sound.playWindowOpen() },
                  { id: 'snap', name: 'Magnetic Snap', desc: 'Tactile window split-screen click', action: () => sound.playWindowSnap() },
                  { id: 'tap', name: 'Dock Tap', desc: 'Rounded wooden icon click', action: () => sound.playDockClick() },
                  { id: 'boot', name: 'Boot Chime', desc: 'F# major 9th harmonic swell', action: () => sound.playBootChime() },
                ].map((item) => {
                  const isSelected = selectedAlertSound === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedAlertSound(item.id as any);
                        // Temporarily test clip
                        sound.setMuted(false);
                        item.action();
                        if (!soundEnabled) {
                          setTimeout(() => sound.setMuted(true), 800);
                        }
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[var(--accent)] bg-blue-50/60 dark:bg-blue-950/30 ring-1 ring-[var(--accent)]'
                          : 'border-black/5 dark:border-white/5 bg-white/40 dark:bg-neutral-800/40 hover:bg-black/5 dark:hover:bg-white/10'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="font-semibold text-xs text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5">
                          {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />}
                          <span>{item.name}</span>
                        </div>
                        <div className="text-[10px] text-neutral-400 truncate">{item.desc}</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAlertSound(item.id as any);
                          sound.setMuted(false);
                          item.action();
                          if (!soundEnabled) {
                            setTimeout(() => sound.setMuted(true), 800);
                          }
                        }}
                        className="rounded-md p-1.5 text-neutral-400 hover:text-[var(--accent)] hover:bg-black/5 dark:hover:bg-white/10"
                        title={`Test ${item.name}`}
                      >
                        <Play size={12} fill="currentColor" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Users & Accounts */}
        {activePane === 'users' && (
          <div className="max-w-xl space-y-6">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">Users & Accounts</h2>
              <p className="text-xs text-neutral-400">Configure your username and profile picture.</p>
            </div>

            <div className="space-y-5 rounded-xl border border-black/10 dark:border-white/10 p-5 bg-black/5 dark:bg-white/5 text-xs">
              {/* Profile Avatar Card */}
              <div className="flex items-center gap-4 pb-2 border-b border-black/10 dark:border-white/10">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)] text-white text-2xl shadow-lg ring-2 ring-white/20 overflow-hidden shrink-0">
                  {userAvatar?.startsWith('http') || userAvatar?.startsWith('/') || userAvatar?.startsWith('data:') ? (
                    <img src={userAvatar} alt={username} className="h-full w-full object-cover" />
                  ) : (
                    <span>{userAvatar || '👤'}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{username}</h3>
                  <p className="text-neutral-400 text-[11px]">Administrator • Local Account</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-700 dark:text-neutral-300">Full Name / Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUserInfo(e.target.value, userAvatar)}
                  className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-800 p-2 text-neutral-800 dark:text-neutral-200 outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-700 dark:text-neutral-300">Profile Image URL</label>
                <input
                  type="text"
                  value={userAvatar?.startsWith('http') || userAvatar?.startsWith('data:') ? userAvatar : ''}
                  onChange={(e) => setUserInfo(username, e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-800 p-2 text-neutral-800 dark:text-neutral-200 outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-700 dark:text-neutral-300">Or choose an Avatar Emoji</label>
                <div className="flex gap-2">
                  {['👤', '🦊', '🚀', '⚡', '☕', '💻', '🎨'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setUserInfo(username, emoji)}
                      className={`h-9 w-9 rounded-lg border text-base flex items-center justify-center transition-all ${
                        userAvatar === emoji ? 'border-[var(--accent)] ring-2 ring-[var(--accent)] bg-black/10' : 'border-black/10 dark:border-white/10'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Network & Wi-Fi */}
        {activePane === 'network' && (
          <div className="max-w-xl space-y-6">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">Network & Wi-Fi</h2>
              <p className="text-xs text-neutral-400">Manage wireless connections and simulated adapters.</p>
            </div>

            <div className="space-y-4 rounded-xl border border-black/10 dark:border-white/10 p-4 bg-black/5 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Wi-Fi</h4>
                  <p className="text-[11px] text-neutral-400">{wifiEnabled ? 'Connected to WebOS-HighSpeed' : 'Off'}</p>
                </div>
                <input
                  type="checkbox"
                  checked={wifiEnabled}
                  onChange={(e) => setWifiEnabled(e.target.checked)}
                  className="h-4 w-4 rounded accent-[var(--accent)] cursor-pointer"
                />
              </div>

              {wifiEnabled && (
                <div className="space-y-2 pt-2 border-t border-black/5 dark:border-white/5 text-xs">
                  <div className="flex justify-between py-1 font-medium">
                    <span className="flex items-center gap-2">
                      <Wifi size={14} className="text-blue-500" />
                      <span>WebOS-HighSpeed (5GHz)</span>
                    </span>
                    <span className="text-emerald-500">Connected</span>
                  </div>
                  <div className="flex justify-between py-1 text-neutral-400">
                    <span className="flex items-center gap-2">
                      <Wifi size={14} />
                      <span>CoffeeShop-Guest</span>
                    </span>
                    <span>Unlocked</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* General / About WebOS */}
        {activePane === 'general' && (
          <div className="max-w-xl space-y-6">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">About WebOS</h2>
              <p className="text-xs text-neutral-400">System architecture, hardware specifications, and reset.</p>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-black/10 dark:border-white/10 p-4 bg-black/5 dark:bg-white/5">
              <WebOSLogo size={56} />
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">WebOS Pro</h3>
                <p className="text-xs text-neutral-500">Version 1.0.4 (Build 24E507)</p>
                <p className="text-[11px] text-neutral-400 mt-1">
                  12-Core Virtual Apple Silicon Processor · 16 GB Memory
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-black/5 dark:border-white/5">
                <span className="text-neutral-400">Display Resolution:</span>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {window.innerWidth} × {window.innerHeight} @ 60Hz
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-black/5 dark:border-white/5">
                <span className="text-neutral-400">Storage:</span>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">IndexedDB Persistent Tree</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-black/5 dark:border-white/5">
                <span className="text-neutral-400">Audio Engine:</span>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">Web Audio API Synth</span>
              </div>
            </div>

            {/* Factory Reset Danger Zone */}
            <div className="pt-4 border-t border-black/10 dark:border-white/10">
              <button
                onClick={handleResetOS}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-500/20 transition-colors"
              >
                <RotateCcw size={14} />
                <span>Reset WebOS to Factory Settings</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
