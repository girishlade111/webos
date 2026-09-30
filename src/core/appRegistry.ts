import React, { lazy } from 'react';
import { AppManifest } from '../types/os';
import { 
  FinderIcon, BrowserIcon, TerminalIcon, NotesIcon, TextEditIcon, 
  CalculatorIcon, CalendarIcon, PhotosIcon, MusicIcon, WeatherIcon, 
  SettingsIcon, ActivityMonitorIcon, AppStoreIcon,
  ClockIcon, RemindersIcon, PhotoBoothIcon, DiskUtilityIcon, StickiesIcon,
  LaunchpadIcon, TimeMachineIcon
} from '../assets/appIcons';
import { useProcessStore } from './processStore';
import { useTimeMachineStore } from './timeMachineStore';

// Lazy loaded app components for optimal performance
const FinderComponent = lazy(() => import('../apps/Finder').then((m) => ({ default: m.FinderApp })));
const WebBrowserComponent = lazy(() => import('../apps/WebBrowser').then((m) => ({ default: m.WebBrowserApp })));
const TerminalComponent = lazy(() => import('../apps/Terminal').then((m) => ({ default: m.TerminalApp })));
const NotesComponent = lazy(() => import('../apps/Notes').then((m) => ({ default: m.NotesApp })));
const TextEditComponent = lazy(() => import('../apps/TextEdit').then((m) => ({ default: m.TextEditApp })));
const CalculatorComponent = lazy(() => import('../apps/Calculator').then((m) => ({ default: m.CalculatorApp })));
const CalendarComponent = lazy(() => import('../apps/Calendar').then((m) => ({ default: m.CalendarApp })));
const PhotosComponent = lazy(() => import('../apps/Photos').then((m) => ({ default: m.PhotosApp })));
const MusicComponent = lazy(() => import('../apps/Music').then((m) => ({ default: m.MusicApp })));
const WeatherComponent = lazy(() => import('../apps/Weather').then((m) => ({ default: m.WeatherApp })));
const SettingsComponent = lazy(() => import('../apps/Settings').then((m) => ({ default: m.SettingsApp })));
const ActivityMonitorComponent = lazy(() => import('../apps/ActivityMonitor').then((m) => ({ default: m.ActivityMonitorApp })));
const AppStoreComponent = lazy(() => import('../apps/AppStore').then((m) => ({ default: m.AppStoreApp })));
const ClockComponent = lazy(() => import('../apps/Clock').then((m) => ({ default: m.ClockApp })));
const RemindersComponent = lazy(() => import('../apps/Reminders').then((m) => ({ default: m.RemindersApp })));
const PhotoBoothComponent = lazy(() => import('../apps/PhotoBooth').then((m) => ({ default: m.PhotoBoothApp })));
const DiskUtilityComponent = lazy(() => import('../apps/DiskUtility').then((m) => ({ default: m.DiskUtilityApp })));
const StickiesComponent = lazy(() => import('../apps/Stickies').then((m) => ({ default: m.StickiesApp })));
const LaunchpadComponent = lazy(() => Promise.resolve({ default: (() => null) as React.FC<any> }));

export const APP_REGISTRY: Record<string, AppManifest> = {
  finder: {
    id: 'finder',
    name: 'Finder',
    icon: FinderIcon,
    component: FinderComponent,
    defaultSize: { w: 780, h: 480 },
    minSize: { w: 520, h: 360 },
    menus: (win) => [
      {
        title: 'File',
        items: [
          { id: 'f-new-win', label: 'New Finder Window', shortcut: '⌘N', action: () => useProcessStore.getState().openWindow('finder') },
          { id: 'f-new-folder', label: 'New Folder', shortcut: '⇧⌘N' },
          { id: 'f-div-1', label: '', divider: true },
          { id: 'f-close', label: 'Close Window', shortcut: '⌘W', action: () => win && useProcessStore.getState().closeWindow(win.id) },
        ],
      },
      {
        title: 'Edit',
        items: [
          { id: 'e-undo', label: 'Undo', shortcut: '⌘Z' },
          { id: 'e-redo', label: 'Redo', shortcut: '⇧⌘Z' },
          { id: 'e-div-1', label: '', divider: true },
          { id: 'e-cut', label: 'Cut', shortcut: '⌘X' },
          { id: 'e-copy', label: 'Copy', shortcut: '⌘C' },
          { id: 'e-paste', label: 'Paste', shortcut: '⌘V' },
          { id: 'e-sel-all', label: 'Select All', shortcut: '⌘A' },
        ],
      },
      {
        title: 'View',
        items: [
          { id: 'v-as-icons', label: 'as Icons', shortcut: '⌘1' },
          { id: 'v-as-list', label: 'as List', shortcut: '⌘2' },
          { id: 'v-as-columns', label: 'as Columns', shortcut: '⌘3' },
        ],
      },
      {
        title: 'Help',
        items: [
          { id: 'h-mac-help', label: 'WebOS Help' },
        ],
      },
    ],
  },
  launchpad: {
    id: 'launchpad',
    name: 'Launchpad',
    icon: LaunchpadIcon,
    component: LaunchpadComponent,
    defaultSize: { w: 0, h: 0 },
    minSize: { w: 0, h: 0 },
    menus: () => [],
  },
  browser: {
    id: 'browser',
    name: 'Web Browser',
    icon: BrowserIcon,
    component: WebBrowserComponent,
    defaultSize: { w: 860, h: 560 },
    minSize: { w: 500, h: 380 },
    menus: (win) => [
      {
        title: 'File',
        items: [
          { id: 'b-new-tab', label: 'New Tab', shortcut: '⌘T' },
          { id: 'b-new-win', label: 'New Window', shortcut: '⌘N', action: () => useProcessStore.getState().openWindow('browser') },
          { id: 'b-close', label: 'Close Window', shortcut: '⌘W', action: () => win && useProcessStore.getState().closeWindow(win.id) },
        ],
      },
      {
        title: 'View',
        items: [
          { id: 'b-reload', label: 'Reload Page', shortcut: '⌘R' },
          { id: 'b-zoom-in', label: 'Zoom In', shortcut: '⌘+' },
          { id: 'b-zoom-out', label: 'Zoom Out', shortcut: '⌘-' },
        ],
      },
      {
        title: 'Bookmarks',
        items: [
          { id: 'b-add-bm', label: 'Add Bookmark...', shortcut: '⌘D' },
          { id: 'b-show-bm', label: 'Show All Bookmarks', shortcut: '⌥⌘B' },
        ],
      },
    ],
  },
  terminal: {
    id: 'terminal',
    name: 'Terminal',
    icon: TerminalIcon,
    component: TerminalComponent,
    defaultSize: { w: 680, h: 420 },
    minSize: { w: 420, h: 280 },
    menus: (win) => [
      {
        title: 'Shell',
        items: [
          { id: 't-new-win', label: 'New Window', shortcut: '⌘N', action: () => useProcessStore.getState().openWindow('terminal') },
          { id: 't-close', label: 'Close', shortcut: '⌘W', action: () => win && useProcessStore.getState().closeWindow(win.id) },
        ],
      },
      {
        title: 'Edit',
        items: [
          { id: 't-copy', label: 'Copy', shortcut: '⌘C' },
          { id: 't-paste', label: 'Paste', shortcut: '⌘V' },
          { id: 't-clear', label: 'Clear Scrollback', shortcut: '⌘K' },
        ],
      },
    ],
  },
  notes: {
    id: 'notes',
    name: 'Notes',
    icon: NotesIcon,
    component: NotesComponent,
    defaultSize: { w: 760, h: 480 },
    minSize: { w: 480, h: 320 },
    menus: (win) => [
      {
        title: 'File',
        items: [
          { id: 'n-new-note', label: 'New Note', shortcut: '⌘N' },
          { id: 'n-close', label: 'Close Window', shortcut: '⌘W', action: () => win && useProcessStore.getState().closeWindow(win.id) },
        ],
      },
      {
        title: 'Format',
        items: [
          { id: 'n-bold', label: 'Bold', shortcut: '⌘B' },
          { id: 'n-italic', label: 'Italic', shortcut: '⌘I' },
          { id: 'n-checklist', label: 'Checklist', shortcut: '⇧⌘L' },
        ],
      },
    ],
  },
  textedit: {
    id: 'textedit',
    name: 'TextEdit',
    icon: TextEditIcon,
    component: TextEditComponent,
    defaultSize: { w: 720, h: 500 },
    minSize: { w: 460, h: 320 },
    menus: (win) => [
      {
        title: 'File',
        items: [
          { id: 'te-new', label: 'New Document', shortcut: '⌘N' },
          { id: 'te-save', label: 'Save', shortcut: '⌘S' },
          { id: 'te-close', label: 'Close', shortcut: '⌘W', action: () => win && useProcessStore.getState().closeWindow(win.id) },
        ],
      },
    ],
  },
  calculator: {
    id: 'calculator',
    name: 'Calculator',
    icon: CalculatorIcon,
    component: CalculatorComponent,
    defaultSize: { w: 320, h: 460 },
    minSize: { w: 280, h: 420 },
    singleInstance: true,
    menus: (win) => [
      {
        title: 'View',
        items: [
          { id: 'c-basic', label: 'Basic' },
          { id: 'c-scientific', label: 'Scientific' },
        ],
      },
    ],
  },
  calendar: {
    id: 'calendar',
    name: 'Calendar',
    icon: CalendarIcon,
    component: CalendarComponent,
    defaultSize: { w: 840, h: 540 },
    minSize: { w: 560, h: 400 },
    singleInstance: true,
    menus: (win) => [
      {
        title: 'File',
        items: [
          { id: 'cal-new', label: 'New Event', shortcut: '⌘N' },
        ],
      },
    ],
  },
  photos: {
    id: 'photos',
    name: 'Photos',
    icon: PhotosIcon,
    component: PhotosComponent,
    defaultSize: { w: 800, h: 540 },
    minSize: { w: 520, h: 380 },
    menus: (win) => [
      {
        title: 'File',
        items: [
          { id: 'p-import', label: 'Import Photos...', shortcut: '⌘I' },
        ],
      },
    ],
  },
  music: {
    id: 'music',
    name: 'Music',
    icon: MusicIcon,
    component: MusicComponent,
    defaultSize: { w: 720, h: 490 },
    minSize: { w: 520, h: 380 },
    singleInstance: true,
    menus: (win) => [
      {
        title: 'Controls',
        items: [
          { id: 'm-play', label: 'Play / Pause', shortcut: 'Space' },
          { id: 'm-next', label: 'Next', shortcut: '⌘→' },
          { id: 'm-prev', label: 'Previous', shortcut: '⌘←' },
        ],
      },
    ],
  },
  weather: {
    id: 'weather',
    name: 'Weather',
    icon: WeatherIcon,
    component: WeatherComponent,
    defaultSize: { w: 640, h: 560 },
    minSize: { w: 460, h: 420 },
    singleInstance: true,
    menus: () => [],
  },
  settings: {
    id: 'settings',
    name: 'System Settings',
    icon: SettingsIcon,
    component: SettingsComponent,
    defaultSize: { w: 760, h: 540 },
    minSize: { w: 580, h: 420 },
    singleInstance: true,
    menus: () => [],
  },
  activity_monitor: {
    id: 'activity_monitor',
    name: 'Activity Monitor',
    icon: ActivityMonitorIcon,
    component: ActivityMonitorComponent,
    defaultSize: { w: 720, h: 460 },
    minSize: { w: 520, h: 340 },
    singleInstance: true,
    menus: () => [],
  },
  appstore: {
    id: 'appstore',
    name: 'App Store',
    icon: AppStoreIcon,
    component: AppStoreComponent,
    defaultSize: { w: 840, h: 560 },
    minSize: { w: 580, h: 420 },
    singleInstance: true,
    menus: () => [],
  },
  clock: {
    id: 'clock',
    name: 'Clock',
    icon: ClockIcon,
    component: ClockComponent,
    defaultSize: { w: 680, h: 520 },
    minSize: { w: 480, h: 380 },
    singleInstance: true,
    menus: () => [],
  },
  reminders: {
    id: 'reminders',
    name: 'Reminders',
    icon: RemindersIcon,
    component: RemindersComponent,
    defaultSize: { w: 760, h: 520 },
    minSize: { w: 540, h: 380 },
    singleInstance: true,
    menus: () => [],
  },
  photobooth: {
    id: 'photobooth',
    name: 'Photo Booth',
    icon: PhotoBoothIcon,
    component: PhotoBoothComponent,
    defaultSize: { w: 720, h: 540 },
    minSize: { w: 520, h: 420 },
    singleInstance: true,
    menus: () => [],
  },
  diskutility: {
    id: 'diskutility',
    name: 'Disk Utility',
    icon: DiskUtilityIcon,
    component: DiskUtilityComponent,
    defaultSize: { w: 780, h: 500 },
    minSize: { w: 560, h: 380 },
    singleInstance: true,
    menus: () => [],
  },
  stickies: {
    id: 'stickies',
    name: 'Stickies',
    icon: StickiesIcon,
    component: StickiesComponent,
    defaultSize: { w: 680, h: 460 },
    minSize: { w: 440, h: 320 },
    singleInstance: true,
    menus: () => [],
  },
};
