import React, { useState, useEffect, useRef } from 'react'; 
import { 
  Wifi, Search, Sliders, Moon, RotateCcw, 
  Power, Lock, Settings as SettingsIcon, Info 
} from 'lucide-react';
import { AppleLogo, TimeMachineIcon, TimeMachineGlyph } from '../assets/appIcons';
import { AboutMacDialog } from './AboutMacDialog';
import { BatteryGlyph } from './BatteryGlyph';
import { BatteryPopover } from './BatteryPopover';
import { VolumeGlyph } from './VolumeSlider';
import { useThemeStore } from '../core/themeStore';
import { useBatteryStore } from '../core/batteryStore';
import { useProcessStore } from '../core/processStore';
import { APP_REGISTRY } from '../core/appRegistry';
import { sound } from '../core/sound';
import { MenuItem } from '../types/os';
import {
  formatBytes,
  msUntilNextBackup,
  timeMachineStats,
  useTimeMachineStore,
} from '../core/timeMachineStore';
import { startScreenSaverNow } from './ScreenSaver';
import { useViewportStore } from '../core/viewportStore';

export const MenuBar: React.FC = () => {
  const isCompact = useViewportStore((s) => s.isCompact);
  const safeArea = useViewportStore((s) => s.safeArea);
  const {
    activeMenuDropdown, setActiveMenuDropdown,
    toggleSpotlight, toggleControlCenter, toggleNotificationCenter,
    wifiEnabled, setWifiEnabled, setOSState,
    volume, soundEnabled, setControlCenterOpen
  } = useThemeStore();

  const { windows, focusedWindowId, openWindow, closeWindow, quitApp } = useProcessStore();

  const [clockStr, setClockStr] = useState<string>('');
  const [isWifiPopoverOpen, setIsWifiPopoverOpen] = useState<boolean>(false);
  const [isBatteryPopoverOpen, setIsBatteryPopoverOpen] = useState<boolean>(false);
  const [isAboutMacOpen, setIsAboutMacOpen] = useState<boolean>(false);
  const [isTimeMachineOpen, setIsTimeMachineOpen] = useState<boolean>(false);

  // Time Machine status item: live countdown to the next scheduled backup.
  const tmSnapshots = useTimeMachineStore((s) => s.snapshots);
  const tmConfig = useTimeMachineStore((s) => s.config);
  const tmPhase = useTimeMachineStore((s) => s.phase);
  const backUpNow = useTimeMachineStore((s) => s.backUpNow);
  const [tmNow, setTmNow] = useState<number>(Date.now());

  useEffect(() => {
    if (!isTimeMachineOpen) return;
    const id = setInterval(() => setTmNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isTimeMachineOpen]);

  const tmStats = timeMachineStats(tmSnapshots);
  const tmLastBackup = tmSnapshots.length ? tmSnapshots[tmSnapshots.length - 1].createdAt : null;
  const tmNextIn = msUntilNextBackup(tmConfig, tmLastBackup, tmNow);
  const tmBusy = tmPhase !== 'idle';
  const tmCountdown =
    tmNextIn === null
      ? 'Off'
      : tmNextIn < 60_000
        ? `Next in ${Math.max(0, Math.round(tmNextIn / 1000))}s`
        : `Next in ${Math.round(tmNextIn / 60_000)}m`;

  const menuBarRef = useRef<HTMLDivElement>(null);

  // Update clock. Compact keeps time only: the full "Thu 1 Oct 13:01"
  // string is too wide next to the status cluster on a phone.
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      const str = isCompact
        ? time
        : now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + '  ' + time;
      setClockStr(str);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [isCompact]);

  // Track the real system battery via the Battery Status API
  const { level: batteryLevel, charging: isCharging, hasBattery, showPercentage, attach } = useBatteryStore();
  const batteryPercent = Math.round(batteryLevel * 100);

  useEffect(() => attach(), [attach]);

  // Close menus on outside click or Escape
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setActiveMenuDropdown(null);
        setIsWifiPopoverOpen(false);
        setIsBatteryPopoverOpen(false);
        setIsTimeMachineOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenuDropdown(null);
        setIsWifiPopoverOpen(false);
        setIsBatteryPopoverOpen(false);
        setIsTimeMachineOpen(false);
      }
    };
    window.addEventListener('mousedown', handleGlobalClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleGlobalClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setActiveMenuDropdown]);

  // Identify active application
  const focusedWin = windows.find((w) => w.id === focusedWindowId && !w.isMinimized);
  const activeAppManifest = focusedWin ? APP_REGISTRY[focusedWin.appId] : APP_REGISTRY.finder;
  const activeAppName = activeAppManifest?.name || 'Finder';

  // System Apple menu items
  const systemMenuItems: MenuItem[] = [
    {
      id: 'sys-about',
      label: 'About This Mac',
      action: () => setIsAboutMacOpen(true),
    },
    { id: 'sys-div-1', label: '', divider: true },
    {
      id: 'sys-settings',
      label: 'System Settings...',
      shortcut: '⌘,',
      action: () => openWindow('settings'),
    },
    {
      id: 'sys-appstore',
      label: 'App Store...',
      action: () => openWindow('appstore'),
    },
    {
      id: 'sys-timemachine',
      label: 'Time Machine...',
      action: () => openWindow('timemachine'),
    },
    { id: 'sys-div-2', label: '', divider: true },
    {
      id: 'sys-saver',
      label: 'Start Screen Saver',
      action: startScreenSaverNow,
    },
    {
      id: 'sys-saver-settings',
      label: 'Screen Saver Settings...',
      action: () => openWindow('settings'),
    },
    { id: 'sys-div-3', label: '', divider: true },
    {
      id: 'sys-sleep',
      label: 'Sleep',
      action: () => setOSState('sleeping'),
    },
    {
      id: 'sys-restart',
      label: 'Restart...',
      action: () => setOSState('booting'),
    },
    {
      id: 'sys-shutdown',
      label: 'Shut Down...',
      action: () => setOSState('shutdown'),
    },
    { id: 'sys-div-4', label: '', divider: true },
    {
      id: 'sys-lock',
      label: 'Lock Screen',
      shortcut: '⌃⌘Q',
      action: () => setOSState('locked'),
    },
  ];

  // Active app specific menu
  const appMenus = activeAppManifest?.menus(focusedWin) || [];

  const handleMenuClick = (menuId: string) => {
    sound.playClick();
    if (activeMenuDropdown === menuId) {
      setActiveMenuDropdown(null);
    } else {
      setActiveMenuDropdown(menuId);
      setIsWifiPopoverOpen(false);
      setIsBatteryPopoverOpen(false);
    }
  };

  const handleMenuHover = (menuId: string) => {
    if (activeMenuDropdown !== null && activeMenuDropdown !== menuId) {
      setActiveMenuDropdown(menuId);
    }
  };

  const handleItemAction = (item: MenuItem) => {
    if (item.disabled || item.divider) return;
    sound.playClick();
    setActiveMenuDropdown(null);
    if (item.action) {
      item.action();
    }
  };

  return (
    <div
      ref={menuBarRef}
      style={{
        /* Sit below the notch/status area rather than under it. */
        paddingTop: safeArea.top > 0 ? `${safeArea.top}px` : undefined,
        height: safeArea.top > 0 ? `${28 + safeArea.top}px` : undefined,
        paddingLeft: safeArea.left > 0 ? `calc(12px + ${safeArea.left}px)` : undefined,
        paddingRight: safeArea.right > 0 ? `calc(12px + ${safeArea.right}px)` : undefined,
      }}
      className="fixed top-0 left-0 right-0 z-[8000] flex h-7 select-none items-center justify-between border-b border-[var(--menu-bar-border)] bg-[var(--menu-bar-bg)] px-3 text-xs text-[var(--menu-bar-text)] glass-bar"
    >
      {/* Left Menu Items */}
      <div className={`flex items-center font-medium ${isCompact ? 'gap-0' : 'gap-1'}`}>
        {/* System Logo Menu */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('system')}
            onMouseEnter={() => handleMenuHover('system')}
            className={`flex h-6 w-7 items-center justify-center rounded transition-colors ${
              activeMenuDropdown === 'system' ? 'bg-black/15 dark:bg-white/15' : 'hover:bg-black/10 dark:hover:bg-white/10'
            }`}
          >
            <AppleLogo size={14} />
          </button>

          {activeMenuDropdown === 'system' && (
            <div className="absolute top-7 left-0 z-50 w-56 rounded-lg border border-[var(--menu-dropdown-border)] bg-[var(--menu-dropdown-bg)] p-1 shadow-2xl glass-panel text-xs animate-fade-in">
              {systemMenuItems.map((item) =>
                item.divider ? (
                  <div key={item.id} className="my-1 h-px bg-black/10 dark:bg-white/10" />
                ) : (
                  <button
                    key={item.id}
                    onClick={() => handleItemAction(item)}
                    className="flex w-full items-center justify-between rounded-md px-2.5 py-1 text-left hover:bg-[var(--accent)] hover:text-white transition-colors"
                  >
                    <span>{item.label}</span>
                    {item.shortcut && <span className="text-[10px] opacity-60">{item.shortcut}</span>}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Active App Name (Bold) */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('app_main')}
            onMouseEnter={() => handleMenuHover('app_main')}
            className={`rounded px-2 py-0.5 font-bold transition-colors ${
              activeMenuDropdown === 'app_main' ? 'bg-black/15 dark:bg-white/15' : 'hover:bg-black/10 dark:hover:bg-white/10'
            }`}
          >
            {activeAppName}
          </button>

          {activeMenuDropdown === 'app_main' && (
            <div className="absolute top-7 left-0 z-50 w-52 rounded-lg border border-[var(--menu-dropdown-border)] bg-[var(--menu-dropdown-bg)] p-1 shadow-2xl glass-panel text-xs animate-fade-in">
              <button
                onClick={() => {
                  sound.playClick();
                  openWindow(activeAppManifest.id);
                  setActiveMenuDropdown(null);
                }}
                className="flex w-full items-center justify-between rounded-md px-2.5 py-1 text-left hover:bg-[var(--accent)] hover:text-white"
              >
                <span>About {activeAppName}</span>
              </button>
              <div className="my-1 h-px bg-black/10 dark:bg-white/10" />
              <button
                onClick={() => {
                  sound.playClick();
                  quitApp(activeAppManifest.id);
                  setActiveMenuDropdown(null);
                }}
                className="flex w-full items-center justify-between rounded-md px-2.5 py-1 text-left hover:bg-[var(--accent)] hover:text-white"
              >
                <span>Quit {activeAppName}</span>
                <span className="text-[10px] opacity-60">⌘Q</span>
              </button>
            </div>
          )}
        </div>

        {/* Dynamic App Menus (File, Edit, View, etc.)

            On a compact width the per-app menus are dropped: the frontmost
            window is full-bleed there, so the bar has to hold the system menu,
            the app name and the status cluster in 28px of height without
            wrapping. The Apple menu still carries the system-level actions. */}
        {(isCompact ? [] : appMenus).map((menuDef) => {
          const menuKey = `menu_${menuDef.title.toLowerCase()}`;
          const isOpen = activeMenuDropdown === menuKey;

          return (
            <div key={menuDef.title} className="relative">
              <button
                onClick={() => handleMenuClick(menuKey)}
                onMouseEnter={() => handleMenuHover(menuKey)}
                className={`rounded px-2 py-0.5 font-normal transition-colors ${
                  isOpen ? 'bg-black/15 dark:bg-white/15' : 'hover:bg-black/10 dark:hover:bg-white/10'
                }`}
              >
                {menuDef.title}
              </button>

              {isOpen && (
                <div className="absolute top-7 left-0 z-50 min-w-48 rounded-lg border border-[var(--menu-dropdown-border)] bg-[var(--menu-dropdown-bg)] p-1 shadow-2xl glass-panel text-xs animate-fade-in">
                  {menuDef.items.map((item) =>
                    item.divider ? (
                      <div key={item.id} className="my-1 h-px bg-black/10 dark:bg-white/10" />
                    ) : (
                      <button
                        key={item.id}
                        disabled={item.disabled}
                        onClick={() => handleItemAction(item)}
                        className={`flex w-full items-center justify-between rounded-md px-2.5 py-1 text-left transition-colors ${
                          item.disabled
                            ? 'opacity-40 cursor-not-allowed'
                            : 'hover:bg-[var(--accent)] hover:text-white'
                        }`}
                      >
                        <span>{item.label}</span>
                        {item.shortcut && <span className="text-[10px] opacity-60 ml-4">{item.shortcut}</span>}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Right Status Controls.
          Compact keeps only essentials: Time Machine, Wi-Fi, and the volume
          glyph move behind Control Center, which already exposes them. */}
      <div className="flex items-center gap-1">
        {/* Time Machine Status -> opens popover with backup summary */}
        {!isCompact && (
        <div className="relative">
          <button
            onClick={() => {
              sound.playClick();
              setIsTimeMachineOpen(!isTimeMachineOpen);
              setIsWifiPopoverOpen(false);
              setIsBatteryPopoverOpen(false);
              setActiveMenuDropdown(null);
            }}
            aria-haspopup="dialog"
            aria-expanded={isTimeMachineOpen}
            aria-label={`Time Machine, ${tmCountdown}`}
            title="Time Machine"
            className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${
              isTimeMachineOpen ? 'bg-black/15 dark:bg-white/15' : 'hover:bg-black/10 dark:hover:bg-white/10'
            }`}
          >
            <TimeMachineGlyph
              size={15}
              className={`${tmConfig.enabled ? 'opacity-95' : 'opacity-40'} ${
                tmBusy ? 'tm-glyph-spin' : ''
              }`}
            />
          </button>

          {isTimeMachineOpen && (
            <div className="absolute top-7 right-0 z-50 w-72 animate-fade-in overflow-hidden rounded-xl border border-[var(--menu-dropdown-border)] bg-[var(--menu-dropdown-bg)] p-3 shadow-2xl glass-panel text-xs space-y-2.5">
              <div className="flex items-center gap-2.5">
                <TimeMachineIcon size={30} className="shrink-0 rounded-[8px]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold tracking-tight">Time Machine</p>
                  <p className="truncate text-[11px] opacity-55">
                    {tmBusy
                      ? tmPhase === 'restoring'
                        ? 'Restoring…'
                        : 'Backing up…'
                      : tmConfig.enabled
                        ? tmCountdown
                        : 'Automatic backup is off'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center">
                {[
                  { k: 'Backups', v: String(tmStats.snapshotCount) },
                  { k: 'Files', v: String(tmStats.fileCount) },
                  { k: 'Size', v: formatBytes(tmStats.uniquePayloadBytes) },
                ].map((m) => (
                  <div key={m.k} className="rounded-lg border border-black/8 bg-black/4 px-1 py-1.5 dark:border-white/8 dark:bg-white/6">
                    <p className="truncate text-[12px] font-semibold tabular-nums tracking-tight">{m.v}</p>
                    <p className="text-[9.5px] uppercase tracking-wide opacity-45">{m.k}</p>
                  </div>
                ))}
              </div>

              {tmLastBackup && (
                <p className="text-[11px] leading-[1.45] opacity-60">
                  Last backup {new Date(tmLastBackup).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              )}

              <div className="flex gap-1.5 pt-0.5">
                <button
                  onClick={() => {
                    setIsTimeMachineOpen(false);
                    openWindow('timemachine');
                  }}
                  className="flex-1 rounded-md bg-[var(--accent)] px-2 py-1 text-[11.5px] font-medium tracking-tight text-white transition-[filter] hover:brightness-110"
                >
                  Open Time Machine
                </button>
                <button
                  onClick={() => void backUpNow('Manual backup', 'manual')}
                  disabled={tmBusy}
                  className="flex-1 rounded-md border border-black/12 bg-white/60 px-2 py-1 text-[11.5px] font-medium tracking-tight transition-colors hover:bg-white/90 disabled:opacity-40 dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/20"
                >
                  {tmBusy ? 'Working…' : 'Back Up Now'}
                </button>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Battery Indicator -> Click opens Battery popover */}
        {hasBattery && (
          <div className="relative">
            <button
              onClick={() => {
                sound.playClick();
                setIsBatteryPopoverOpen(!isBatteryPopoverOpen);
                setIsWifiPopoverOpen(false);
                setActiveMenuDropdown(null);
              }}
              aria-haspopup="dialog"
              aria-expanded={isBatteryPopoverOpen}
              aria-label={`Battery ${batteryPercent} percent${isCharging ? ', charging' : ''}`}
              title={`Battery ${batteryPercent}%${isCharging ? ' (Charging)' : ''}`}
              className={`flex h-6 items-center gap-1 rounded px-1.5 transition-colors ${
                isBatteryPopoverOpen
                  ? 'bg-black/15 dark:bg-white/15'
                  : 'hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              {showPercentage && !isCompact && (
                <span className="text-[11px] font-medium leading-none tabular-nums">
                  {batteryPercent}%
                </span>
              )}
              <BatteryGlyph level={batteryLevel} charging={isCharging} size={11} />
            </button>

            {isBatteryPopoverOpen && (
              <BatteryPopover onClose={() => setIsBatteryPopoverOpen(false)} />
            )}
          </div>
        )}

        {/* Wi-Fi Popover Toggle */}
        {!isCompact && (
        <div className="relative">
          <button
            onClick={() => {
              setIsWifiPopoverOpen(!isWifiPopoverOpen);
              setIsBatteryPopoverOpen(false);
              setActiveMenuDropdown(null);
            }}
            className="flex h-6 items-center justify-center rounded px-1.5 hover:bg-black/10 dark:hover:bg-white/10"
            title="Wi-Fi"
          >
            <Wifi size={14} className={wifiEnabled ? 'opacity-90' : 'opacity-40'} />
          </button>

          {isWifiPopoverOpen && (
            <div className="absolute top-7 right-0 z-50 w-64 rounded-xl border border-[var(--menu-dropdown-border)] bg-[var(--menu-dropdown-bg)] p-3 shadow-2xl glass-panel text-xs animate-fade-in space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
                <span className="font-semibold">Wi-Fi</span>
                <input
                  type="checkbox"
                  checked={wifiEnabled}
                  onChange={(e) => setWifiEnabled(e.target.checked)}
                  className="accent-[var(--accent)] h-4 w-4"
                />
              </div>
              <div className="text-neutral-500 text-[11px]">
                {wifiEnabled ? 'Connected to WebOS-HighSpeed (5GHz)' : 'Wi-Fi is turned off'}
              </div>
            </div>
          )}
        </div>
        )}

        {/* Output Volume Glyph -> opens Control Center, scroll/pad to adjust */}
        {!isCompact && (
        <button
          onClick={() => setControlCenterOpen(true)}
          onWheel={(e) => {
            const { adjustVolume, showVolumeHud } = useThemeStore.getState();
            adjustVolume(e.deltaY < 0 ? 6 : -6);
            showVolumeHud();
          }}
          aria-label={`Output volume ${volume} percent${soundEnabled ? '' : ', muted'}`}
          title={`Volume: ${volume}%${soundEnabled ? '' : ' (Muted)'} — F11 / F12 to adjust`}
          className="flex h-6 w-6 items-center justify-center rounded hover:bg-black/10 dark:hover:bg-white/10"
        >
          <VolumeGlyph
            volume={volume}
            muted={!soundEnabled}
            size={14}
            className={soundEnabled ? 'opacity-90' : 'opacity-40'}
          />
        </button>
        )}

        {/* Control Center Toggle */}
        <button
          onClick={toggleControlCenter}
          className="flex h-6 w-6 items-center justify-center rounded hover:bg-black/10 dark:hover:bg-white/10"
          title="Control Center"
        >
          <Sliders size={13} />
        </button>

        {/* Spotlight Icon */}
        <button
          onClick={toggleSpotlight}
          className="flex h-6 w-6 items-center justify-center rounded hover:bg-black/10 dark:hover:bg-white/10"
          title="Spotlight Search (Cmd+Space)"
        >
          <Search size={13} />
        </button>

        {/* Live Clock -> Click opens Notification Center */}
        <button
          onClick={toggleNotificationCenter}
          className="rounded px-2 py-0.5 text-xs font-medium tabular-nums hover:bg-black/10 dark:hover:bg-white/10"
          title="Notification Center"
        >
          {clockStr}
        </button>
      </div>

      {/* About This Mac Dialog */}
      <AboutMacDialog isOpen={isAboutMacOpen} onClose={() => setIsAboutMacOpen(false)} />
    </div>
  );
};
