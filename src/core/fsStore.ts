import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { FSNode } from '../types/os';
import { sound } from './sound';

const FS_STORAGE_KEY = 'webos_filesystem_v1';

// Seed initial virtual filesystem hierarchy
export const ROOT_ID = 'root';
export const USERS_ID = 'users';
export const USER_HOME_ID = 'home';
export const DESKTOP_ID = 'desktop';
export const DOCUMENTS_ID = 'documents';
export const DOWNLOADS_ID = 'downloads';
export const PICTURES_ID = 'pictures';
export const MUSIC_ID = 'music';
export const APPLICATIONS_ID = 'applications';
export const TRASH_ID = 'trash';

const INITIAL_NODES: Record<string, FSNode> = {
  [ROOT_ID]: {
    id: ROOT_ID,
    name: 'Macintosh HD',
    type: 'folder',
    parentId: null,
    createdAt: Date.now(),
    modifiedAt: Date.now(),
    size: 4096,
    isProtected: true,
  },
  [USERS_ID]: {
    id: USERS_ID,
    name: 'Users',
    type: 'folder',
    parentId: ROOT_ID,
    createdAt: Date.now(),
    modifiedAt: Date.now(),
    size: 4096,
    isProtected: true,
  },
  [USER_HOME_ID]: {
    id: USER_HOME_ID,
    name: 'LadeStack',
    type: 'folder',
    parentId: USERS_ID,
    createdAt: Date.now(),
    modifiedAt: Date.now(),
    size: 4096,
    isProtected: true,
  },
  [DESKTOP_ID]: {
    id: DESKTOP_ID,
    name: 'Desktop',
    type: 'folder',
    parentId: USER_HOME_ID,
    createdAt: Date.now(),
    modifiedAt: Date.now(),
    size: 4096,
    isProtected: true,
  },
  [DOCUMENTS_ID]: {
    id: DOCUMENTS_ID,
    name: 'Documents',
    type: 'folder',
    parentId: USER_HOME_ID,
    createdAt: Date.now(),
    modifiedAt: Date.now(),
    size: 4096,
    isProtected: true,
  },
  [DOWNLOADS_ID]: {
    id: DOWNLOADS_ID,
    name: 'Downloads',
    type: 'folder',
    parentId: USER_HOME_ID,
    createdAt: Date.now(),
    modifiedAt: Date.now(),
    size: 4096,
    isProtected: true,
  },
  [PICTURES_ID]: {
    id: PICTURES_ID,
    name: 'Pictures',
    type: 'folder',
    parentId: USER_HOME_ID,
    createdAt: Date.now(),
    modifiedAt: Date.now(),
    size: 4096,
    isProtected: true,
  },
  [MUSIC_ID]: {
    id: MUSIC_ID,
    name: 'Music',
    type: 'folder',
    parentId: USER_HOME_ID,
    createdAt: Date.now(),
    modifiedAt: Date.now(),
    size: 4096,
    isProtected: true,
  },
  [APPLICATIONS_ID]: {
    id: APPLICATIONS_ID,
    name: 'Applications',
    type: 'folder',
    parentId: ROOT_ID,
    createdAt: Date.now(),
    modifiedAt: Date.now(),
    size: 4096,
    isProtected: true,
  },
  [TRASH_ID]: {
    id: TRASH_ID,
    name: 'Trash',
    type: 'folder',
    parentId: ROOT_ID,
    createdAt: Date.now(),
    modifiedAt: Date.now(),
    size: 0,
    isProtected: true,
  },
  // Sample files on Desktop
  'file-welcome': {
    id: 'file-welcome',
    name: 'Welcome to WebOS.txt',
    type: 'file',
    mime: 'text/plain',
    parentId: DESKTOP_ID,
    createdAt: Date.now() - 3600000,
    modifiedAt: Date.now() - 3600000,
    size: 840,
    content: `Welcome to WebOS!

A fully client-side macOS-inspired operating system running directly in your browser.

✨ Highlights & Features:
- Smooth 60fps window manager with edge snapping, maximize, minimize, and focus stacking
- Dynamic Menu Bar that switches menus based on the active application
- Magnifying macOS-style Dock with running app indicators and right-click menus
- Spotlight search (Cmd/Ctrl + Space) for instant app launching and quick math
- Mission Control (F3 or Ctrl + Up) and Virtual Desktops (Spaces)
- Full Virtual File System backed by IndexedDB
- Bundled apps: Finder, Safari/Web Browser, Terminal, Notes, TextEdit, Calculator, Calendar, Photos, Music Player, Weather, System Settings, Activity Monitor

Enjoy exploring your new browser desktop!`,
  },
  'file-project-plan': {
    id: 'file-project-plan',
    name: 'Architecture Roadmap.md',
    type: 'file',
    mime: 'text/markdown',
    parentId: DOCUMENTS_ID,
    createdAt: Date.now() - 7200000,
    modifiedAt: Date.now() - 1800000,
    size: 620,
    content: `# WebOS Architecture Overview

## Core Subsystems
1. **Window Manager**: Handles bounds, drag/resize physics, z-index, snapping.
2. **Process Store**: Tracks open applications and their lifecycle.
3. **Virtual File System**: Hierarchical node tree persisted to IndexedDB.
4. **Theme & Audio**: Glassmorphism tokens and Web Audio synthesis.

## Performance Guarantees
- Zero layout thrash on dragging via transform3d
- Lazy-loaded app bundles
- Instant restore on session reload`,
  },
  'file-todo': {
    id: 'file-todo',
    name: 'Design Notes.txt',
    type: 'file',
    mime: 'text/plain',
    parentId: DOCUMENTS_ID,
    createdAt: Date.now() - 86400000,
    modifiedAt: Date.now() - 43200000,
    size: 290,
    content: `Design System Guidelines:
- Glassmorphism: backdrop-filter blur(24px)
- Corner radius: 12px windows, 22.37% squircles
- Typography: Inter with optical compensation
- Spring physics: stiffness 300, damping 30
- Zero-pill discipline on metadata`,
  },
};

interface FSState {
  nodes: Record<string, FSNode>;
  selectedNodeIds: string[];
  clipboard: { nodeIds: string[]; isCut: boolean } | null;
  isLoaded: boolean;

  // Actions
  initializeFS: () => Promise<void>;
  createFolder: (name: string, parentId: string) => string;
  createFile: (name: string, parentId: string, content?: string, mime?: string) => string;
  updateFileContent: (id: string, content: string) => void;
  renameNode: (id: string, newName: string) => boolean;
  moveNode: (id: string, newParentId: string) => boolean;
  copyNodes: (nodeIds: string[], targetParentId: string) => string[];
  moveToTrash: (id: string) => void;
  restoreFromTrash: (id: string) => void;
  emptyTrash: () => void;
  deletePermanently: (id: string) => void;
  duplicateNode: (id: string) => string | null;
  setSelectedNodes: (ids: string[]) => void;
  setClipboard: (nodeIds: string[], isCut?: boolean) => void;
  pasteClipboard: (targetParentId: string) => void;
  getChildren: (parentId: string) => FSNode[];
  getNode: (id: string) => FSNode | undefined;
  getNodePath: (id: string) => string;
  exportFile: (id: string) => void;
  importFile: (file: File, targetParentId: string) => Promise<string>;
  resetFS: () => Promise<void>;
}

export const useFSStore = create<FSState>((set, get) => ({
  nodes: INITIAL_NODES,
  selectedNodeIds: [],
  clipboard: null,
  isLoaded: false,

  initializeFS: async () => {
    try {
      const stored = await idbGet(FS_STORAGE_KEY);
      if (stored && typeof stored === 'object' && Object.keys(stored).length > 0) {
        const storedNodes = stored as Record<string, FSNode>;
        if (storedNodes[USER_HOME_ID] && storedNodes[USER_HOME_ID].name === 'Alex Morgan') {
          storedNodes[USER_HOME_ID].name = 'LadeStack';
          await idbSet(FS_STORAGE_KEY, storedNodes);
        }
        set({ nodes: storedNodes, isLoaded: true });
        return;
      }
    } catch {}
    // Seed default
    await idbSet(FS_STORAGE_KEY, INITIAL_NODES);
    set({ nodes: INITIAL_NODES, isLoaded: true });
  },

  createFolder: (name, parentId) => {
    const id = `folder-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const folder: FSNode = {
      id,
      name: name.trim() || 'untitled folder',
      type: 'folder',
      parentId,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      size: 4096,
    };

    set((state) => {
      const next = { ...state.nodes, [id]: folder };
      idbSet(FS_STORAGE_KEY, next);
      return { nodes: next };
    });
    sound.playClick();
    return id;
  },

  createFile: (name, parentId, content = '', mime = 'text/plain') => {
    const id = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const file: FSNode = {
      id,
      name: name.trim() || 'untitled.txt',
      type: 'file',
      mime,
      parentId,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      size: new Blob([content]).size,
      content,
    };

    set((state) => {
      const next = { ...state.nodes, [id]: file };
      idbSet(FS_STORAGE_KEY, next);
      return { nodes: next };
    });
    sound.playClick();
    return id;
  },

  updateFileContent: (id, content) => {
    set((state) => {
      const existing = state.nodes[id];
      if (!existing || existing.type !== 'file') return state;
      const updated: FSNode = {
        ...existing,
        content,
        modifiedAt: Date.now(),
        size: new Blob([content]).size,
      };
      const next = { ...state.nodes, [id]: updated };
      idbSet(FS_STORAGE_KEY, next);
      return { nodes: next };
    });
  },

  renameNode: (id, newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return false;
    const existing = get().nodes[id];
    if (!existing || existing.isProtected) return false;

    set((state) => {
      const updated: FSNode = {
        ...existing,
        name: trimmed,
        modifiedAt: Date.now(),
      };
      const next = { ...state.nodes, [id]: updated };
      idbSet(FS_STORAGE_KEY, next);
      return { nodes: next };
    });
    return true;
  },

  moveNode: (id, newParentId) => {
    const existing = get().nodes[id];
    if (!existing || existing.isProtected) return false;
    if (existing.parentId === newParentId) return true;

    set((state) => {
      const updated: FSNode = {
        ...existing,
        parentId: newParentId,
        modifiedAt: Date.now(),
      };
      const next = { ...state.nodes, [id]: updated };
      idbSet(FS_STORAGE_KEY, next);
      return { nodes: next };
    });
    return true;
  },

  copyNodes: (nodeIds, targetParentId) => {
    const newIds: string[] = [];
    set((state) => {
      const next = { ...state.nodes };
      nodeIds.forEach((id) => {
        const item = state.nodes[id];
        if (!item) return;
        const newId = `${item.type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        next[newId] = {
          ...item,
          id: newId,
          name: `${item.name} copy`,
          parentId: targetParentId,
          createdAt: Date.now(),
          modifiedAt: Date.now(),
          isProtected: false,
        };
        newIds.push(newId);
      });
      idbSet(FS_STORAGE_KEY, next);
      return { nodes: next };
    });
    return newIds;
  },

  moveToTrash: (id) => {
    const existing = get().nodes[id];
    if (!existing || existing.isProtected) return;
    set((state) => {
      const updated: FSNode = {
        ...existing,
        parentId: TRASH_ID,
        modifiedAt: Date.now(),
      };
      const next = { ...state.nodes, [id]: updated };
      idbSet(FS_STORAGE_KEY, next);
      return { nodes: next };
    });
    sound.playTrash();
  },

  restoreFromTrash: (id) => {
    const existing = get().nodes[id];
    if (!existing) return;
    set((state) => {
      const updated: FSNode = {
        ...existing,
        parentId: DESKTOP_ID,
        modifiedAt: Date.now(),
      };
      const next = { ...state.nodes, [id]: updated };
      idbSet(FS_STORAGE_KEY, next);
      return { nodes: next };
    });
    sound.playClick();
  },

  emptyTrash: () => {
    set((state) => {
      const next = { ...state.nodes };
      Object.keys(next).forEach((key) => {
        if (next[key].parentId === TRASH_ID) {
          delete next[key];
        }
      });
      idbSet(FS_STORAGE_KEY, next);
      return { nodes: next };
    });
    sound.playTrash();
  },

  deletePermanently: (id) => {
    const existing = get().nodes[id];
    if (!existing || existing.isProtected) return;
    set((state) => {
      const next = { ...state.nodes };
      delete next[id];
      idbSet(FS_STORAGE_KEY, next);
      return { nodes: next };
    });
  },

  duplicateNode: (id) => {
    const existing = get().nodes[id];
    if (!existing || existing.isProtected) return null;
    const newId = `${existing.type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const copy: FSNode = {
      ...existing,
      id: newId,
      name: `${existing.name} copy`,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      isProtected: false,
    };
    set((state) => {
      const next = { ...state.nodes, [newId]: copy };
      idbSet(FS_STORAGE_KEY, next);
      return { nodes: next };
    });
    sound.playClick();
    return newId;
  },

  setSelectedNodes: (selectedNodeIds) => set({ selectedNodeIds }),

  setClipboard: (nodeIds, isCut = false) => {
    set({ clipboard: { nodeIds, isCut } });
  },

  pasteClipboard: (targetParentId) => {
    const cb = get().clipboard;
    if (!cb || cb.nodeIds.length === 0) return;
    if (cb.isCut) {
      cb.nodeIds.forEach((id) => get().moveNode(id, targetParentId));
      set({ clipboard: null });
    } else {
      get().copyNodes(cb.nodeIds, targetParentId);
    }
  },

  getChildren: (parentId) => {
    const nodes = get().nodes;
    return Object.values(nodes).filter((n) => n.parentId === parentId);
  },

  getNode: (id) => get().nodes[id],

  getNodePath: (id) => {
    const nodes = get().nodes;
    let curr = nodes[id];
    if (!curr) return '/';
    const parts: string[] = [curr.name];
    while (curr && curr.parentId && nodes[curr.parentId]) {
      curr = nodes[curr.parentId];
      parts.unshift(curr.name);
    }
    return '/' + parts.join('/');
  },

  exportFile: (id) => {
    const file = get().nodes[id];
    if (!file || file.type !== 'file' || !file.content) return;
    const blob = new Blob([file.content], { type: file.mime || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importFile: async (file, targetParentId) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const isText = file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.json') || file.name.endsWith('.js') || file.name.endsWith('.ts');

      reader.onload = () => {
        const content = reader.result as string;
        const newId = get().createFile(file.name, targetParentId, content, file.type || 'application/octet-stream');
        resolve(newId);
      };
      reader.onerror = reject;

      if (isText) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    });
  },

  resetFS: async () => {
    await idbSet(FS_STORAGE_KEY, INITIAL_NODES);
    set({ nodes: INITIAL_NODES, selectedNodeIds: [], clipboard: null });
  },
}));
