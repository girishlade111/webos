import { create } from 'zustand';
import { NotificationItem } from '../types/os';
import { sound } from './sound';

interface NotificationState {
  notifications: NotificationItem[];
  activeBanner: NotificationItem | null;
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp'>) => void;
  dismissBanner: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [
    {
      id: 'notif-1',
      title: 'Welcome to WebOS',
      message: 'Explore your desktop, launch apps from the dock, or press Cmd/Ctrl + Space for Spotlight.',
      timestamp: Date.now() - 1000 * 60 * 5,
      appName: 'System',
    },
    {
      id: 'notif-2',
      title: 'Battery & Network',
      message: 'Wi-Fi connected. Running smoothly at 60fps.',
      timestamp: Date.now() - 1000 * 60 * 2,
      appName: 'System',
    }
  ],
  activeBanner: null,

  addNotification: (notif) => {
    const item: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
    };

    set((state) => ({
      notifications: [item, ...state.notifications],
      activeBanner: item,
    }));

    sound.playNotification();

    // Auto dismiss active banner after 4.5s
    setTimeout(() => {
      if (get().activeBanner?.id === item.id) {
        set({ activeBanner: null });
      }
    }, 4500);
  },

  dismissBanner: () => set({ activeBanner: null }),

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      activeBanner: state.activeBanner?.id === id ? null : state.activeBanner,
    }));
  },

  clearAll: () => set({ notifications: [], activeBanner: null }),
}));
