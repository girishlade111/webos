import React from 'react';

export type OSState = 'booting' | 'locked' | 'desktop' | 'sleeping' | 'shutdown';

export type AccentColor = 'blue' | 'purple' | 'pink' | 'red' | 'orange' | 'yellow' | 'green' | 'graphite';

/** Physical/logical destination the system audio is routed to. */
export type AudioOutputKind = 'speakers' | 'headphones' | 'display' | 'airplay';

export interface AudioOutputDevice {
  id: string;
  name: string;
  kind: AudioOutputKind;
  /** Default level applied the first time this device becomes active. */
  defaultVolume: number;
  /** Marks devices that are connected rather than merely available. */
  connected: boolean;
}

export interface ThemeSettings {
  mode: 'dark' | 'light';
  accentColor: AccentColor;
  wallpaperId: string;
  customWallpaperUrl?: string;
  dockSize: number; // 48 - 84
  dockMagnification: boolean;
  dockAutoHide: boolean;
  soundEnabled: boolean;
  brightness: number; // 0 - 100
  volume: number; // 0 - 100
  /** Currently selected audio output device id. */
  outputDeviceId: string;
  /** macOS remembers a separate master level per output device. */
  volumeByDevice: Record<string, number>;
  username: string;
  userAvatar: string;
  minimizeEffect?: 'genie' | 'scale';
}

export interface MenuItem {
  id: string;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  divider?: boolean;
  action?: () => void;
  items?: MenuItem[];
}

export interface MenuDefinition {
  title: string;
  items: MenuItem[];
}

export interface WindowState {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  prevBounds?: { x: number; y: number; width: number; height: number };
  isMinimized: boolean;
  isRestoring?: boolean;
  isMaximized: boolean;
  isFocused: boolean;
  zIndex: number;
  spaceId: string;
  initialParams?: any;
}

export interface AppProps {
  windowId: string;
  initialParams?: any;
}

export interface AppManifest {
  id: string;
  name: string;
  icon: React.FC<{ size?: number; className?: string }>;
  component: React.LazyExoticComponent<React.FC<AppProps>>;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  singleInstance?: boolean;
  menus: (windowState?: WindowState) => MenuDefinition[];
  fileTypes?: string[];
  description?: string;
}

export type FSNodeType = 'file' | 'folder';

export interface FSNode {
  id: string;
  name: string;
  type: FSNodeType;
  mime?: string;
  content?: string; // UTF-8 text or Base64 / data URL
  parentId: string | null;
  createdAt: number;
  modifiedAt: number;
  size: number;
  isProtected?: boolean; // system folders
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  appId?: string;
  appName?: string;
  actions?: { label: string; action: () => void }[];
}

export interface VirtualSpace {
  id: string;
  name: string;
}
