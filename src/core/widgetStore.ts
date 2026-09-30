import { create } from 'zustand';

export type WidgetId = 
  | 'weather' 
  | 'calendar' 
  | 'battery' 
  | 'worldclock' 
  | 'reminders' 
  | 'music' 
  | 'stocks' 
  | 'system' 
  | 'screentime';

export interface WidgetDefinition {
  id: WidgetId;
  name: string;
  category: 'System' | 'Productivity' | 'Media' | 'Finance';
  size: 'small' | 'medium' | 'large';
  description: string;
}

export const AVAILABLE_WIDGETS: WidgetDefinition[] = [
  {
    id: 'weather',
    name: 'Weather',
    category: 'System',
    size: 'medium',
    description: 'Current temperature, condition, and hourly forecast.',
  },
  {
    id: 'calendar',
    name: 'Calendar',
    category: 'Productivity',
    size: 'medium',
    description: 'Today’s schedule, date, and mini monthly calendar.',
  },
  {
    id: 'battery',
    name: 'Batteries',
    category: 'System',
    size: 'small',
    description: 'Battery percentage rings for Mac, AirPods, and accessories.',
  },
  {
    id: 'worldclock',
    name: 'World Clock',
    category: 'Productivity',
    size: 'medium',
    description: 'Analog and digital clocks for world financial capitals.',
  },
  {
    id: 'reminders',
    name: 'Reminders',
    category: 'Productivity',
    size: 'medium',
    description: 'Interactive checklist for today’s to-dos.',
  },
  {
    id: 'music',
    name: 'Now Playing',
    category: 'Media',
    size: 'medium',
    description: 'Live album art, playback controls, and sound visualizer.',
  },
  {
    id: 'stocks',
    name: 'Stocks',
    category: 'Finance',
    size: 'medium',
    description: 'Market performance with sparklines for AAPL, NVDA, and TSLA.',
  },
  {
    id: 'system',
    name: 'Activity Monitor',
    category: 'System',
    size: 'small',
    description: 'Real-time CPU and memory usage on Apple Silicon.',
  },
  {
    id: 'screentime',
    name: 'Screen Time',
    category: 'Productivity',
    size: 'small',
    description: 'Daily app usage breakdown across categories.',
  },
];

interface WidgetState {
  desktopWidgets: WidgetId[];
  notificationWidgets: WidgetId[];
  isWidgetGalleryOpen: boolean;

  toggleDesktopWidget: (id: WidgetId) => void;
  toggleNotificationWidget: (id: WidgetId) => void;
  setWidgetGalleryOpen: (open: boolean) => void;
  resetDefaultWidgets: () => void;
}

const DESKTOP_WIDGETS_KEY = 'webos_desktop_widgets_v1';
const NOTIF_WIDGETS_KEY = 'webos_notif_widgets_v1';

const DEFAULT_DESKTOP_WIDGETS: WidgetId[] = ['calendar', 'weather', 'battery', 'stocks'];
const DEFAULT_NOTIF_WIDGETS: WidgetId[] = ['weather', 'calendar', 'battery', 'music', 'worldclock', 'reminders'];

export const useWidgetStore = create<WidgetState>((set) => ({
  desktopWidgets: (() => {
    try {
      const saved = localStorage.getItem(DESKTOP_WIDGETS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_DESKTOP_WIDGETS;
  })(),

  notificationWidgets: (() => {
    try {
      const saved = localStorage.getItem(NOTIF_WIDGETS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_NOTIF_WIDGETS;
  })(),

  isWidgetGalleryOpen: false,

  toggleDesktopWidget: (id: WidgetId) =>
    set((state) => {
      const exists = state.desktopWidgets.includes(id);
      const next = exists
        ? state.desktopWidgets.filter((w) => w !== id)
        : [...state.desktopWidgets, id];
      try {
        localStorage.setItem(DESKTOP_WIDGETS_KEY, JSON.stringify(next));
      } catch {}
      return { desktopWidgets: next };
    }),

  toggleNotificationWidget: (id: WidgetId) =>
    set((state) => {
      const exists = state.notificationWidgets.includes(id);
      const next = exists
        ? state.notificationWidgets.filter((w) => w !== id)
        : [...state.notificationWidgets, id];
      try {
        localStorage.setItem(NOTIF_WIDGETS_KEY, JSON.stringify(next));
      } catch {}
      return { notificationWidgets: next };
    }),

  setWidgetGalleryOpen: (open: boolean) => set({ isWidgetGalleryOpen: open }),

  resetDefaultWidgets: () => {
    try {
      localStorage.setItem(DESKTOP_WIDGETS_KEY, JSON.stringify(DEFAULT_DESKTOP_WIDGETS));
      localStorage.setItem(NOTIF_WIDGETS_KEY, JSON.stringify(DEFAULT_NOTIF_WIDGETS));
    } catch {}
    set({
      desktopWidgets: DEFAULT_DESKTOP_WIDGETS,
      notificationWidgets: DEFAULT_NOTIF_WIDGETS,
    });
  },
}));
