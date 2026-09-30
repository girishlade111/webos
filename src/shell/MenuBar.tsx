import React, { useState, useEffect, useRef } from 'react';
import { 
  Wifi, Battery, Search, Sliders, Moon, RotateCcw, 
  Power, Lock, Settings as SettingsIcon, Info 
} from 'lucide-react';
import { AppleLogo } from '../assets/appIcons';
import { AboutMacDialog } from './AboutMacDialog';
import { useThemeStore } from '../core/themeStore';
import { useProcessStore } from '../core/processStore';
import { APP_REGISTRY } from '../core/appRegistry';
import { sound } from '../core/sound';
import { MenuItem } from '../types/os';

export const MenuBar: React.FC = () => {
  const {
    activeMenuDropdown, setActiveMenuDropdown,
    toggleSpotlight, toggleControlCenter, toggleNotificationCenter,
    wifiEnabled, setWifiEnabled, setOSState
  } = useThemeStore();

  const { windows, focusedWindowId, openWindow, closeWindow, quitApp } = useProcessStore();

  const [clockStr, setClockStr] = useState<string>('');
  const [batteryLevel, setBatteryLevel] = useState<number>(98);
  const [isCharging, setIsCharging] = useState<boolean>(true);
  const [isWifiPopoverOpen, setIsWifiPopoverOpen] = useState<boolean>(false);
  const [isAboutMacOpen, setIsAboutMacOpen] = useState<boolean>(false);

  const menuBarRef = useRef<HTMLDivElement>(null);

  // Update clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const str = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) +
        '  ' +
        now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      setClockStr(str);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Try real Battery API if present
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        setIsCharging(battery.charging);
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
        battery.addEventListener('chargingchange', () => {
          setIsCharging(battery.charging);
        });
      }).catch(() => {});
    }
  }, []);

  // Close menus on outside click or Escape
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setActiveMenuDropdown(null);
        setIsWifiPopoverOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenuDropdown(null);
        setIsWifiPopoverOpen(false);
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
    { id: 'sys-div-2', label: '', divider: true },
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
    { id: 'sys-div-3', label: '', divider: true },
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
      className="fixed top-0 left-0 right-0 z-[8000] flex h-7 select-none items-center justify-between border-b border-[var(--menu-bar-border)] bg-[var(--menu-bar-bg)] px-3 text-xs text-[var(--menu-bar-text)] glass-bar"
    >
      {/* Left Menu Items */}
      <div className="flex items-center gap-1 font-medium">
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

        {/* Dynamic App Menus (File, Edit, View, etc.) */}
        {appMenus.map((menuDef) => {
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

      {/* Right Status Controls */}
      <div className="flex items-center gap-1">
        {/* Wi-Fi Popover Toggle */}
        <div className="relative">
          <button
            onClick={() => {
              setIsWifiPopoverOpen(!isWifiPopoverOpen);
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

        {/* Battery */}
        <div className="flex items-center gap-1 px-1.5 text-[11px] tabular-nums font-mono opacity-80" title={`${batteryLevel}% ${isCharging ? 'Charging' : ''}`}>
          <span>{batteryLevel}%</span>
          <Battery size={14} />
        </div>

        {/* Spotlight Icon */}
        <button
          onClick={toggleSpotlight}
          className="flex h-6 w-6 items-center justify-center rounded hover:bg-black/10 dark:hover:bg-white/10"
          title="Spotlight Search (Cmd+Space)"
        >
          <Search size={13} />
        </button>

        {/* Control Center Toggle */}
        <button
          onClick={toggleControlCenter}
          className="flex h-6 w-6 items-center justify-center rounded hover:bg-black/10 dark:hover:bg-white/10"
          title="Control Center"
        >
          <Sliders size={13} />
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
