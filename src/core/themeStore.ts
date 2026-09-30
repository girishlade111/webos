import { create } from 'zustand';
import { AccentColor, OSState, ThemeSettings } from '../types/os';
import { sound } from './sound';

export const ACCENT_MAP: Record<AccentColor, { hex: string; hover: string; rgb: string; name: string }> = {
  blue: { hex: '#007aff', hover: '#0062cc', rgb: '0, 122, 255', name: 'Blue' },
  purple: { hex: '#af52de', hover: '#9534c5', rgb: '175, 82, 222', name: 'Purple' },
  pink: { hex: '#ff2d55', hover: '#e01640', rgb: '255, 45, 85', name: 'Pink' },
  red: { hex: '#ff3b30', hover: '#d7281f', rgb: '255, 59, 48', name: 'Red' },
  orange: { hex: '#ff9500', hover: '#d87e00', rgb: '255, 149, 0', name: 'Orange' },
  yellow: { hex: '#ffcc00', hover: '#d6ab00', rgb: '255, 204, 0', name: 'Yellow' },
  green: { hex: '#34c759', hover: '#28a745', rgb: '52, 199, 89', name: 'Green' },
  graphite: { hex: '#8e8e93', hover: '#757579', rgb: '142, 142, 147', name: 'Graphite' },
};

interface ThemeStoreState extends ThemeSettings {
  osState: OSState;
  wifiEnabled: boolean;
  bluetoothEnabled: boolean;
  doNotDisturb: boolean;
  /** Monotonic token bumped whenever the volume HUD should reappear. */
  volumeHudNonce: number;
  activeMenuDropdown: string | null;
  isSpotlightOpen: boolean;
  isControlCenterOpen: boolean;
  isNotificationCenterOpen: boolean;
  isLaunchpadOpen: boolean;
  isMissionControlOpen: boolean;
  activeSpaceIndex: number;
  spacesCount: number;

  // Actions
  setOSState: (state: OSState) => void;
  setMode: (mode: 'dark' | 'light') => void;
  toggleMode: () => void;
  setAccentColor: (accent: AccentColor) => void;
  setWallpaperId: (id: string) => void;
  setCustomWallpaperUrl: (url: string | undefined) => void;
  setDockSize: (size: number) => void;
  setDockMagnification: (enabled: boolean) => void;
  setDockAutoHide: (enabled: boolean) => void;
  setMinimizeEffect: (effect: 'genie' | 'scale') => void;
  setSoundEnabled: (enabled: boolean) => void;
  toggleSound: () => void;
  setBrightness: (brightness: number) => void;
  setVolume: (volume: number) => void;
  setMasterVolume: (volume: number) => void;
  adjustVolume: (delta: number) => void;
  setOutputDevice: (id: string) => void;
  showVolumeHud: () => void;
  setUserInfo: (username: string, avatar?: string) => void;
  setWifiEnabled: (enabled: boolean) => void;
  setBluetoothEnabled: (enabled: boolean) => void;
  setDoNotDisturb: (enabled: boolean) => void;
  setActiveMenuDropdown: (id: string | null) => void;
  setSpotlightOpen: (open: boolean) => void;
  toggleSpotlight: () => void;
  setControlCenterOpen: (open: boolean) => void;
  toggleControlCenter: () => void;
  setNotificationCenterOpen: (open: boolean) => void;
  toggleNotificationCenter: () => void;
  setLaunchpadOpen: (open: boolean) => void;
  toggleLaunchpad: () => void;
  setMissionControlOpen: (open: boolean) => void;
  toggleMissionControl: () => void;
  setActiveSpaceIndex: (index: number) => void;
  addSpace: () => void;
  removeSpace: (index: number) => void;
  closeAllOverlays: () => void;
  resetAllSettings: () => void;
}

export const DEFAULT_USER_NAME = 'LadeStack';
export const DEFAULT_USER_AVATAR = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjZYOJGlAskor9ZFc1YLcKg2G3w5EzDy8oVuJhyphenhyphen4pWvFCfE86GPVOd77WY-etz1Sq5yiqmooDeqTQfi_3dOwlaUxefqEOxYmF-fPbhoRXDsAAyzEF78C39Gy52POflEfwI3m4RwQPvLEwB0bTSLG5NqHGnjbnrOHB7kJmG_y8CELkfH4GdQ9R-lvaiRG2U/s1024/file_00000000924471fabb67f3d7736ab96b%20(2).png';

const DEFAULT_SETTINGS: ThemeSettings = {
  mode: 'dark',
  accentColor: 'blue',
  wallpaperId: 'sequoia',
  dockSize: 58,
  dockMagnification: true,
  dockAutoHide: false,
  soundEnabled: false, // Muted by default per specification
  brightness: 100,
  volume: 80,
  outputDeviceId: 'macbook-speakers',
  volumeByDevice: {},
  username: DEFAULT_USER_NAME,
  userAvatar: DEFAULT_USER_AVATAR,
  minimizeEffect: 'genie',
};

/**
 * Audio output destinations shown in Control Center. macOS lists built-in
 * speakers first, then connected accessories, then AirPlay targets.
 */
export const AUDIO_OUTPUT_DEVICES: AudioOutputDevice[] = [
  {
    id: 'macbook-speakers',
    name: 'MacBook Pro Speakers',
    kind: 'speakers',
    defaultVolume: 80,
    connected: true,
  },
  {
    id: 'airpods-pro',
    name: 'AirPods Pro',
    kind: 'headphones',
    defaultVolume: 55,
    connected: true,
  },
  {
    id: 'studio-display',
    name: 'Studio Display',
    kind: 'display',
    defaultVolume: 65,
    connected: true,
  },
  {
    id: 'kitchen-homepod',
    name: 'HomePod — Kitchen',
    kind: 'airplay',
    defaultVolume: 45,
    connected: false,
  },
];

export const getAudioOutputDevice = (id: string): AudioOutputDevice =>
  AUDIO_OUTPUT_DEVICES.find((d) => d.id === id) ?? AUDIO_OUTPUT_DEVICES[0];


const loadInitialState = (): ThemeSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem('webos_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate mock data to user's specified profile
      if (parsed.username === 'Alex Morgan' || !parsed.username) {
        parsed.username = DEFAULT_USER_NAME;
      }
      if (parsed.userAvatar === '👤' || !parsed.userAvatar) {
        parsed.userAvatar = DEFAULT_USER_AVATAR;
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {}
  return DEFAULT_SETTINGS;
};

const saveState = (state: ThemeSettings) => {
  if (typeof window === 'undefined') return;
  try {
    const toSave: ThemeSettings = {
      mode: state.mode,
      accentColor: state.accentColor,
      wallpaperId: state.wallpaperId,
      customWallpaperUrl: state.customWallpaperUrl,
      dockSize: state.dockSize,
      dockMagnification: state.dockMagnification,
      dockAutoHide: state.dockAutoHide,
      soundEnabled: state.soundEnabled,
      brightness: state.brightness,
      volume: state.volume,
      outputDeviceId: state.outputDeviceId,
      volumeByDevice: state.volumeByDevice,
      username: state.username,
      userAvatar: state.userAvatar,
    };
    localStorage.setItem('webos_settings', JSON.stringify(toSave));
  } catch {}
};

const applyDOMTheme = (mode: 'dark' | 'light', accent: AccentColor) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  const accentInfo = ACCENT_MAP[accent] || ACCENT_MAP.blue;
  root.style.setProperty('--accent', accentInfo.hex);
  root.style.setProperty('--accent-hover', accentInfo.hover);
  root.style.setProperty('--accent-rgb', accentInfo.rgb);
};

const initialSettings = loadInitialState();
applyDOMTheme(initialSettings.mode, initialSettings.accentColor);
sound.setMuted(!initialSettings.soundEnabled);
sound.setVolume(initialSettings.volume);

export const useThemeStore = create<ThemeStoreState>((set, get) => ({
  ...initialSettings,
  osState: 'booting',
  wifiEnabled: true,
  bluetoothEnabled: true,
  doNotDisturb: false,
  activeMenuDropdown: null,
  isSpotlightOpen: false,
  isControlCenterOpen: false,
  isNotificationCenterOpen: false,
  isLaunchpadOpen: false,
  isMissionControlOpen: false,
  activeSpaceIndex: 0,
  spacesCount: 2,

  setOSState: (osState) => {
    set({ osState, activeMenuDropdown: null, isSpotlightOpen: false, isControlCenterOpen: false });
  },

  setMode: (mode) => {
    set((state) => {
      applyDOMTheme(mode, state.accentColor);
      const updated = { ...state, mode };
      saveState(updated);
      return { mode };
    });
  },

  toggleMode: () => {
    const next = get().mode === 'dark' ? 'light' : 'dark';
    get().setMode(next);
  },

  setAccentColor: (accentColor) => {
    set((state) => {
      applyDOMTheme(state.mode, accentColor);
      const updated = { ...state, accentColor };
      saveState(updated);
      return { accentColor };
    });
  },

  setWallpaperId: (wallpaperId) => {
    set((state) => {
      const updated = { ...state, wallpaperId, customWallpaperUrl: undefined };
      saveState(updated);
      return { wallpaperId, customWallpaperUrl: undefined };
    });
  },

  setCustomWallpaperUrl: (customWallpaperUrl) => {
    set((state) => {
      const updated = { ...state, customWallpaperUrl };
      saveState(updated);
      return { customWallpaperUrl };
    });
  },

  setDockSize: (dockSize) => {
    set((state) => {
      const updated = { ...state, dockSize };
      saveState(updated);
      return { dockSize };
    });
  },

  setDockMagnification: (dockMagnification) => {
    set((state) => {
      const updated = { ...state, dockMagnification };
      saveState(updated);
      return { dockMagnification };
    });
  },

  setDockAutoHide: (dockAutoHide) => {
    set((state) => {
      const updated = { ...state, dockAutoHide };
      saveState(updated);
      return { dockAutoHide };
    });
  },

  setMinimizeEffect: (minimizeEffect) => {
    set((state) => {
      const updated = { ...state, minimizeEffect };
      saveState(updated);
      return { minimizeEffect };
    });
  },

  setSoundEnabled: (soundEnabled) => {
    sound.setMuted(!soundEnabled);
    set((state) => {
      const updated = { ...state, soundEnabled };
      saveState(updated);
      return { soundEnabled };
    });
  },

  toggleSound: () => {
    const next = !get().soundEnabled;
    get().setSoundEnabled(next);
  },

  setBrightness: (brightness) => {
    set((state) => {
      const updated = { ...state, brightness };
      saveState(updated);
      return { brightness };
    });
  },

  setVolume: (volume) => {
    get().setMasterVolume(volume);
  },

  /**
   * Master output level. Mirrors macOS semantics:
   * dragging to 0 mutes, raising above 0 unmutes, and the level is remembered
   * separately for every output device.
   */
  setMasterVolume: (volume) => {
    const clamped = Math.round(Math.max(0, Math.min(100, volume)));

    set((state) => {
      const soundEnabled = clamped === 0 ? false : state.soundEnabled || clamped > 0;

      if (soundEnabled !== state.soundEnabled) {
        sound.setMuted(!soundEnabled);
      }
      sound.setVolume(clamped);

      const updated: ThemeSettings = {
        ...state,
        volume: clamped,
        soundEnabled,
        volumeByDevice: { ...state.volumeByDevice, [state.outputDeviceId]: clamped },
      };
      saveState(updated);
      return { volume: clamped, soundEnabled, volumeByDevice: updated.volumeByDevice };
    });
  },

  adjustVolume: (delta) => {
    const { volume, setMasterVolume, volumeHudNonce } = get();
    setMasterVolume(volume + delta);
    set({ volumeHudNonce: volumeHudNonce + 1 });
  },

  /** Route audio to another device, restoring that device's remembered level. */
  setOutputDevice: (id) => {
    const device = getAudioOutputDevice(id);
    if (device.id === get().outputDeviceId) return;

    set((state) => {
      // Remember the outgoing device's level before switching away.
      const volumeByDevice = {
        ...state.volumeByDevice,
        [state.outputDeviceId]: state.volume,
        [device.id]: state.volumeByDevice[device.id] ?? device.defaultVolume,
      };
      const volume = volumeByDevice[device.id];

      sound.setVolume(volume);

      const updated: ThemeSettings = { ...state, outputDeviceId: device.id, volume, volumeByDevice };
      saveState(updated);
      return { outputDeviceId: device.id, volume, volumeByDevice };
    });
  },

  showVolumeHud: () => set((state) => ({ volumeHudNonce: state.volumeHudNonce + 1 })),

  setUserInfo: (username, avatar) => {
    set((state) => {
      const updated = { ...state, username, userAvatar: avatar || state.userAvatar };
      saveState(updated);
      return { username, userAvatar: avatar || state.userAvatar };
    });
  },

  setWifiEnabled: (wifiEnabled) => set({ wifiEnabled }),
  setBluetoothEnabled: (bluetoothEnabled) => set({ bluetoothEnabled }),
  setDoNotDisturb: (doNotDisturb) => set({ doNotDisturb }),

  setActiveMenuDropdown: (activeMenuDropdown) => set({ activeMenuDropdown }),

  setSpotlightOpen: (isSpotlightOpen) => {
    if (isSpotlightOpen) {
      set({
        isSpotlightOpen: true,
        isControlCenterOpen: false,
        isNotificationCenterOpen: false,
        isLaunchpadOpen: false,
        activeMenuDropdown: null,
      });
    } else {
      set({ isSpotlightOpen: false });
    }
  },

  toggleSpotlight: () => {
    const next = !get().isSpotlightOpen;
    get().setSpotlightOpen(next);
  },

  setControlCenterOpen: (isControlCenterOpen) => {
    if (isControlCenterOpen) {
      set({
        isControlCenterOpen: true,
        isSpotlightOpen: false,
        isNotificationCenterOpen: false,
        activeMenuDropdown: null,
      });
    } else {
      set({ isControlCenterOpen: false });
    }
  },

  toggleControlCenter: () => {
    const next = !get().isControlCenterOpen;
    get().setControlCenterOpen(next);
  },

  setNotificationCenterOpen: (isNotificationCenterOpen) => {
    if (isNotificationCenterOpen) {
      set({
        isNotificationCenterOpen: true,
        isSpotlightOpen: false,
        isControlCenterOpen: false,
        activeMenuDropdown: null,
      });
    } else {
      set({ isNotificationCenterOpen: false });
    }
  },

  toggleNotificationCenter: () => {
    const next = !get().isNotificationCenterOpen;
    get().setNotificationCenterOpen(next);
  },

  setLaunchpadOpen: (isLaunchpadOpen) => {
    set({
      isLaunchpadOpen,
      isSpotlightOpen: false,
      isControlCenterOpen: false,
      isNotificationCenterOpen: false,
      activeMenuDropdown: null,
    });
  },

  toggleLaunchpad: () => {
    const next = !get().isLaunchpadOpen;
    get().setLaunchpadOpen(next);
  },

  setMissionControlOpen: (isMissionControlOpen) => {
    set({
      isMissionControlOpen,
      isSpotlightOpen: false,
      isControlCenterOpen: false,
      isNotificationCenterOpen: false,
      isLaunchpadOpen: false,
      activeMenuDropdown: null,
    });
  },

  toggleMissionControl: () => {
    const next = !get().isMissionControlOpen;
    get().setMissionControlOpen(next);
  },

  setActiveSpaceIndex: (activeSpaceIndex) => set({ activeSpaceIndex }),

  addSpace: () => {
    set((state) => ({ spacesCount: Math.min(6, state.spacesCount + 1) }));
  },

  removeSpace: (index) => {
    set((state) => {
      if (state.spacesCount <= 1) return state;
      const newIndex = Math.min(state.activeSpaceIndex, state.spacesCount - 2);
      return {
        spacesCount: state.spacesCount - 1,
        activeSpaceIndex: Math.max(0, newIndex),
      };
    });
  },

  closeAllOverlays: () => {
    set({
      activeMenuDropdown: null,
      isSpotlightOpen: false,
      isControlCenterOpen: false,
      isNotificationCenterOpen: false,
      isLaunchpadOpen: false,
      isMissionControlOpen: false,
    });
  },

  resetAllSettings: () => {
    localStorage.removeItem('webos_settings');
    set(DEFAULT_SETTINGS);
    applyDOMTheme(DEFAULT_SETTINGS.mode, DEFAULT_SETTINGS.accentColor);
  },
}));
