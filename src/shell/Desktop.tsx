import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  HardDrive, Folder, FileText, Image as ImageIcon, Check, 
  Sparkles, X, Search, Monitor, RefreshCw, Sliders, Eye, Sun, Moon
} from 'lucide-react';
import { useThemeStore, ACCENT_MAP } from '../core/themeStore';
import { useFSStore, DESKTOP_ID, ROOT_ID } from '../core/fsStore';
import { useProcessStore } from '../core/processStore';
import { APP_REGISTRY } from '../core/appRegistry';
import { WALLPAPERS } from '../assets/wallpapers';
import { FSNode } from '../types/os';
import { sound } from '../core/sound';
import { useWidgetStore } from '../core/widgetStore';
import { useViewportStore } from '../core/viewportStore';
import { UnifiedWidgetRenderer } from './MacOSWidgets';
import {
  ContextMenu,
  menuItem,
  menuSeparator,
  menuSubmenu,
  useContextMenu,
  MenuNode,
} from './ContextMenu';

interface DesktopIconItem {
  id: string;
  type: 'drive' | 'app' | 'folder' | 'file';
  name: string;
  appId?: string;
  fileNode?: FSNode;
  iconComponent?: React.ReactNode;
}

interface Point {
  x: number;
  y: number;
}

interface DesktopViewOptions {
  iconSize: number; // 40 (S), 52 (M), 68 (L), 84 (XL)
  gridSpacing: number; // 0.9 to 1.5
  labelPosition: 'bottom' | 'right';
  showItemInfo: boolean;
  viewStyle: 'grid' | 'list';
}

const DESKTOP_POSITIONS_KEY = 'webos_desktop_icon_positions_v4';
const DESKTOP_APPS_KEY = 'webos_desktop_apps_v4';
const SNAP_TO_GRID_KEY = 'webos_desktop_snap_grid_v3';
const DESKTOP_VIEW_OPTIONS_KEY = 'webos_desktop_view_options_v2';

const DEFAULT_VIEW_OPTIONS: DesktopViewOptions = {
  iconSize: 52,
  gridSpacing: 1.0,
  labelPosition: 'bottom',
  showItemInfo: true,
  viewStyle: 'grid',
};

const DEFAULT_DESKTOP_APPS = ['browser', 'terminal', 'notes', 'photos', 'settings', 'appstore'];

const TOP_MARGIN = 44; // Below 28px menu bar + padding
const RIGHT_MARGIN = 24;
const BOTTOM_MARGIN = 110; // Above dock
const LEFT_MARGIN = 24;

export const Desktop: React.FC = () => {
  const { 
    wallpaperId, setWallpaperId, mode, setMode, 
    customWallpaperUrl, accentColor, setAccentColor,
    brightness, setBrightness 
  } = useThemeStore();

  // CRITICAL: Destructure 'nodes' to ensure component re-renders when files/folders are created or deleted!
  const { nodes, getChildren, createFolder, createFile, moveToTrash, duplicateNode, renameNode, initializeFS } = useFSStore();
  const { openWindow } = useProcessStore();
  const { desktopWidgets, toggleDesktopWidget, setWidgetGalleryOpen } = useWidgetStore();
  const isTouch = useViewportStore((s) => s.isTouch);
  const isCompact = useViewportStore((s) => s.isCompact);
  const viewportHeight = useViewportStore((s) => s.height);
  /* A vertical widget column needs ~600px of height. Below that it is a
     horizontal scroller instead. Derived from the live viewport so a rotation
     or a split-screen resize re-evaluates it. */
  const isShortViewport = isCompact || viewportHeight < 620;

  // Desktop View Options
  const [viewOptions, setViewOptions] = useState<DesktopViewOptions>(() => {
    try {
      const saved = localStorage.getItem(DESKTOP_VIEW_OPTIONS_KEY);
      if (saved) return { ...DEFAULT_VIEW_OPTIONS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_VIEW_OPTIONS;
  });

  // Desktop item positions
  const [positions, setPositions] = useState<Record<string, Point>>(() => {
    try {
      const saved = localStorage.getItem(DESKTOP_POSITIONS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  // Pinned desktop app shortcut IDs
  const [desktopAppIds, setDesktopAppIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(DESKTOP_APPS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_DESKTOP_APPS;
  });

  // Snap to grid setting
  const [snapToGrid, setSnapToGrid] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SNAP_TO_GRID_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Selection & Drag state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggedIds, setDraggedIds] = useState<string[]>([]);
  const dragStartPointerRef = useRef<Point>({ x: 0, y: 0 });
  const dragStartPositionsRef = useRef<Record<string, Point>>({});
  const hasMovedBeyondThresholdRef = useRef<boolean>(false);
  /** Set when a long press opened the icon menu, so the click handler can skip opening. */
  const longPressFiredRef = useRef<boolean>(false);

  // Rubber-band selection state
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);

  // Context menus (right-click) — rendered by the shared macOS ContextMenu
  const desktopMenu = useContextMenu();
  const iconMenu = useContextMenu();
  const [iconMenuTarget, setIconMenuTarget] = useState<DesktopIconItem | null>(null);

  // Inline rename state (macOS "Rename" on a desktop item)
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState<string>('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Modals
  const [isAddAppModalOpen, setIsAddAppModalOpen] = useState<boolean>(false);
  const [appSearchQuery, setAppSearchQuery] = useState<string>('');
  
  // macOS Feature Modals
  const [isViewOptionsOpen, setIsViewOptionsOpen] = useState<boolean>(false);
  const [isDisplaySettingsOpen, setIsDisplaySettingsOpen] = useState<boolean>(false);
  const [getInfoItem, setGetInfoItem] = useState<DesktopIconItem | null>(null);
  const [quickLookItem, setQuickLookItem] = useState<DesktopIconItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const desktopRef = useRef<HTMLDivElement>(null);

  // Compute generous, non-overlapping cell dimensions based on icon size & grid spacing
  const cellWidth = useMemo(() => {
    if (viewOptions.labelPosition === 'right' || viewOptions.viewStyle === 'list') {
      return Math.max(160, Math.round(viewOptions.iconSize * 3.4 * viewOptions.gridSpacing));
    }
    return Math.max(96, Math.round(viewOptions.iconSize * 1.9 * viewOptions.gridSpacing));
  }, [viewOptions.iconSize, viewOptions.gridSpacing, viewOptions.labelPosition, viewOptions.viewStyle]);

  const cellHeight = useMemo(() => {
    if (viewOptions.labelPosition === 'right' || viewOptions.viewStyle === 'list') {
      return Math.max(68, Math.round((viewOptions.iconSize + 28) * viewOptions.gridSpacing));
    }
    // High-fidelity spacing: icon height + title (32px) + item info (16px) + breathing gap (36px) = iconSize + 84px!
    // This completely prevents text from overlapping any icons below it!
    return Math.max(126, Math.round((viewOptions.iconSize + 80) * viewOptions.gridSpacing));
  }, [viewOptions.iconSize, viewOptions.gridSpacing, viewOptions.labelPosition, viewOptions.viewStyle]);

  // Initialize virtual filesystem
  useEffect(() => {
    initializeFS();
  }, [initializeFS]);

  // Persist viewOptions
  useEffect(() => {
    try {
      localStorage.setItem(DESKTOP_VIEW_OPTIONS_KEY, JSON.stringify(viewOptions));
    } catch {}
  }, [viewOptions]);

  // Persist snapToGrid
  useEffect(() => {
    try {
      localStorage.setItem(SNAP_TO_GRID_KEY, JSON.stringify(snapToGrid));
    } catch {}
  }, [snapToGrid]);

  // Persist desktopAppIds
  useEffect(() => {
    try {
      localStorage.setItem(DESKTOP_APPS_KEY, JSON.stringify(desktopAppIds));
    } catch {}
  }, [desktopAppIds]);

  // Persist positions
  const savePositions = useCallback((newPositions: Record<string, Point>) => {
    setPositions(newPositions);
    try {
      localStorage.setItem(DESKTOP_POSITIONS_KEY, JSON.stringify(newPositions));
    } catch {}
  }, []);

  // Assemble all desktop items (Macintosh HD + Desktop FS items + Desktop App shortcuts)
  // Reactive to 'nodes' changes!
  const desktopFSItems = useMemo(() => {
    return Object.values(nodes).filter((n) => n.parentId === DESKTOP_ID);
  }, [nodes]);

  const desktopItems: DesktopIconItem[] = useMemo(() => {
    const items: DesktopIconItem[] = [
      {
        id: 'macintosh-hd',
        type: 'drive',
        name: 'Macintosh HD',
      },
    ];

    // Add app shortcuts
    desktopAppIds.forEach((appId) => {
      const manifest = APP_REGISTRY[appId];
      if (manifest) {
        const IconComp = manifest.icon;
        items.push({
          id: `app-${appId}`,
          type: 'app',
          name: manifest.name,
          appId: appId,
          iconComponent: <IconComp size={viewOptions.iconSize} className="drop-shadow-lg" />,
        });
      }
    });

    // Add files & folders from filesystem
    desktopFSItems.forEach((node) => {
      items.push({
        id: node.id,
        type: node.type,
        name: node.name,
        fileNode: node,
      });
    });

    return items;
  }, [desktopAppIds, desktopFSItems, viewOptions.iconSize]);

  // Helper to calculate standard macOS auto-layout positions (top-right vertical columns, zero collision)
  const calculateDefaultPositions = useCallback(
    (itemsToLayout: DesktopIconItem[], customCellW?: number, customCellH?: number): Record<string, Point> => {
      const winW = typeof window !== 'undefined' ? window.innerWidth : 1440;
      const winH = typeof window !== 'undefined' ? window.innerHeight : 900;
      const cW = customCellW || cellWidth;
      const cH = customCellH || cellHeight;
      const maxColHeight = winH - BOTTOM_MARGIN - TOP_MARGIN;
      const rowsPerCol = Math.max(1, Math.floor(maxColHeight / cH));

      const layout: Record<string, Point> = {};

      itemsToLayout.forEach((item, index) => {
        const col = Math.floor(index / rowsPerCol);
        const row = index % rowsPerCol;
        // In macOS, icons start from rightmost column going downwards, then next column to the left
        const x = Math.max(LEFT_MARGIN, winW - RIGHT_MARGIN - cW - col * cW);
        const y = TOP_MARGIN + row * cH;
        layout[item.id] = { x, y };
      });

      return layout;
    },
    [cellWidth, cellHeight]
  );

  // Snap a coordinate to the nearest desktop grid cell
  const snapCoordinateToGrid = useCallback(
    (pos: Point, winW: number, winH: number): Point => {
      const offsetFromRight = winW - RIGHT_MARGIN - cellWidth;
      const colIndex = Math.max(0, Math.round((offsetFromRight - pos.x) / cellWidth));
      const snappedX = Math.max(LEFT_MARGIN, Math.min(winW - RIGHT_MARGIN - cellWidth, offsetFromRight - colIndex * cellWidth));

      const rowIndex = Math.max(0, Math.round((pos.y - TOP_MARGIN) / cellHeight));
      const snappedY = Math.max(TOP_MARGIN, Math.min(winH - BOTTOM_MARGIN, TOP_MARGIN + rowIndex * cellHeight));

      return { x: snappedX, y: snappedY };
    },
    [cellWidth, cellHeight]
  );

  // Synchronize positions and eliminate any existing vertical overlaps from stale saved data
  useEffect(() => {
    let hasChanges = false;
    const updatedPositions = { ...positions };
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    // Check if current stored positions have vertical collisions (distance < cellHeight - 15)
    let hasCollisions = false;
    const itemsList = desktopItems;

    for (let i = 0; i < itemsList.length; i++) {
      for (let j = i + 1; j < itemsList.length; j++) {
        const p1 = updatedPositions[itemsList[i].id];
        const p2 = updatedPositions[itemsList[j].id];
        if (p1 && p2) {
          const dx = Math.abs(p1.x - p2.x);
          const dy = Math.abs(p1.y - p2.y);
          // If in roughly same column and vertical gap is smaller than cellHeight - 20, they are colliding!
          if (dx < cellWidth * 0.7 && dy < cellHeight - 20) {
            hasCollisions = true;
            break;
          }
        }
      }
      if (hasCollisions) break;
    }

    // If collisions detected or empty positions, re-layout cleanly
    if (hasCollisions || Object.keys(updatedPositions).length === 0) {
      const cleanLayout = calculateDefaultPositions(desktopItems);
      savePositions(cleanLayout);
      return;
    }

    // Remove deleted items and assign missing items to clean slots
    const occupiedSlots = new Set<string>();
    Object.entries(updatedPositions).forEach(([id, pos]) => {
      if (desktopItems.some((item) => item.id === id)) {
        occupiedSlots.add(`${Math.round(pos.x)},${Math.round(pos.y)}`);
      } else {
        delete updatedPositions[id];
        hasChanges = true;
      }
    });

    const defaultLayout = calculateDefaultPositions(desktopItems);

    desktopItems.forEach((item) => {
      if (!updatedPositions[item.id]) {
        const ideal = defaultLayout[item.id] || { x: winW - RIGHT_MARGIN - cellWidth, y: TOP_MARGIN };
        let candidate = { ...ideal };

        let slotKey = `${Math.round(candidate.x)},${Math.round(candidate.y)}`;
        let step = 0;
        while (occupiedSlots.has(slotKey) && step < 100) {
          step++;
          candidate.y += cellHeight;
          if (candidate.y > winH - BOTTOM_MARGIN) {
            candidate.y = TOP_MARGIN;
            candidate.x -= cellWidth;
          }
          slotKey = `${Math.round(candidate.x)},${Math.round(candidate.y)}`;
        }

        updatedPositions[item.id] = candidate;
        occupiedSlots.add(slotKey);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      savePositions(updatedPositions);
    }
  }, [desktopItems, positions, calculateDefaultPositions, savePositions, cellWidth, cellHeight]);

  // Window resize handler: clamp within boundaries
  useEffect(() => {
    const handleResize = () => {
      const winW = window.innerWidth;
      const winH = window.innerHeight;
      let changed = false;
      const clamped: Record<string, Point> = {};

      Object.entries(positions).forEach(([id, pos]) => {
        const newX = Math.max(LEFT_MARGIN, Math.min(winW - RIGHT_MARGIN - cellWidth, pos.x));
        const newY = Math.max(TOP_MARGIN, Math.min(winH - BOTTOM_MARGIN, pos.y));
        if (newX !== pos.x || newY !== pos.y) {
          changed = true;
        }
        clamped[id] = { x: newX, y: newY };
      });

      if (changed) {
        savePositions(clamped);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [positions, savePositions, cellWidth]);

  // Launch / Open desktop item
  const handleItemOpen = useCallback(
    (item: DesktopIconItem) => {
      sound.playClick();

      if (item.type === 'drive') {
        openWindow('finder', 'Macintosh HD', { w: 780, h: 480 }, { folderId: ROOT_ID });
        return;
      }

      if (item.type === 'app' && item.appId) {
        openWindow(item.appId);
        return;
      }

      if (item.fileNode) {
        const node = item.fileNode;
        if (node.type === 'folder') {
          openWindow('finder', node.name, { w: 760, h: 480 }, { folderId: node.id });
        } else {
          const lower = node.name.toLowerCase();
          if (lower.endsWith('.txt') || lower.endsWith('.md') || lower.endsWith('.json')) {
            openWindow('textedit', node.name, { w: 720, h: 500 }, { fileId: node.id });
          } else if (lower.endsWith('.png') || lower.endsWith('.jpg')) {
            openWindow('photos', node.name, { w: 760, h: 520 }, { fileId: node.id });
          } else {
            openWindow('finder', 'Finder', { w: 760, h: 480 }, { folderId: DESKTOP_ID });
          }
        }
      }
    },
    [openWindow]
  );

  // ---------------------------------------------------------------------
  // Inline rename (macOS "Rename" — the label becomes an editable field)
  // ---------------------------------------------------------------------

  /**
   * Enter inline-rename mode for a node id.
   * Reads through `getState()` because it is also called immediately after a
   * folder/file is created, before this render's `nodes` snapshot catches up.
   */
  const beginRename = useCallback((id: string, seedName?: string) => {
    const name = seedName ?? useFSStore.getState().nodes[id]?.name;
    if (!name) return;
    setRenamingId(id);
    setRenameDraft(name);
  }, []);

  const cancelRename = useCallback(() => {
    setRenamingId(null);
    setRenameDraft('');
  }, []);

  const commitRename = useCallback(() => {
    if (renamingId) {
      const next = renameDraft.trim();
      const current = desktopItems.find((item) => item.id === renamingId)?.fileNode?.name;
      if (next && next !== current) {
        sound.playClick();
        renameNode(renamingId, next);
      }
    }
    cancelRename();
  }, [renamingId, renameDraft, desktopItems, renameNode, cancelRename]);

  // Select the whole basename once the rename field appears.
  useEffect(() => {
    if (!renamingId) return;
    const input = renameInputRef.current;
    if (!input) return;
    input.focus();
    const dot = input.value.lastIndexOf('.');
    input.setSelectionRange(0, dot > 0 ? dot : input.value.length);
  }, [renamingId]);

  // Pointer Down on an Icon (initiates selection or drag)
  const handleIconPointerDown = (e: React.PointerEvent, item: DesktopIconItem) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    desktopMenu.close();
    iconMenu.close();

    const isShiftOrCmd = e.metaKey || e.ctrlKey || e.shiftKey;
    let targetSelectedIds = [...selectedIds];

    if (isShiftOrCmd) {
      if (targetSelectedIds.includes(item.id)) {
        targetSelectedIds = targetSelectedIds.filter((id) => id !== item.id);
      } else {
        targetSelectedIds.push(item.id);
      }
    } else {
      if (!targetSelectedIds.includes(item.id)) {
        targetSelectedIds = [item.id];
      }
    }

    setSelectedIds(targetSelectedIds);
    setDraggedIds(targetSelectedIds);

    const snapshot: Record<string, Point> = {};
    targetSelectedIds.forEach((id) => {
      snapshot[id] = positions[id] || { x: 0, y: 0 };
    });

    dragStartPositionsRef.current = snapshot;
    dragStartPointerRef.current = { x: e.clientX, y: e.clientY };
    hasMovedBeyondThresholdRef.current = false;

    /* Touch has no right-click, so a long press is the only route to an icon's
       context menu. 500ms is the iOS convention — long enough not to fire on a
       deliberate tap, short enough not to feel unresponsive. */
    const longPressTimer =
      isTouch && e.pointerType !== 'mouse'
        ? window.setTimeout(() => {
            if (hasMovedBeyondThresholdRef.current) return;
            longPressFiredRef.current = true;
            sound.playClick();
            if (!selectedIds.includes(item.id)) setSelectedIds([item.id]);
            setIconMenuTarget(item);
            iconMenu.open({
              clientX: e.clientX,
              clientY: e.clientY,
            });
          }, 500)
        : null;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - dragStartPointerRef.current.x;
      const deltaY = moveEvent.clientY - dragStartPointerRef.current.y;
      const distance = Math.hypot(deltaX, deltaY);

      if (!hasMovedBeyondThresholdRef.current) {
        if (distance > 4) {
          // Movement cancels the pending long press — this is a drag, not a hold.
          if (longPressTimer !== null) window.clearTimeout(longPressTimer);
          hasMovedBeyondThresholdRef.current = true;
          setIsDragging(true);
          sound.playClick();
        } else {
          return;
        }
      }

      const winW = window.innerWidth;
      const winH = window.innerHeight;

      setPositions((prev) => {
        const next = { ...prev };
        targetSelectedIds.forEach((id) => {
          const origin = dragStartPositionsRef.current[id];
          if (origin) {
            const rawX = origin.x + deltaX;
            const rawY = origin.y + deltaY;
            next[id] = {
              x: Math.max(LEFT_MARGIN, Math.min(winW - RIGHT_MARGIN - cellWidth, rawX)),
              y: Math.max(TOP_MARGIN, Math.min(winH - BOTTOM_MARGIN, rawY)),
            };
          }
        });
        return next;
      });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      if (longPressTimer !== null) window.clearTimeout(longPressTimer);

      if (hasMovedBeyondThresholdRef.current) {
        setIsDragging(false);
        setDraggedIds([]);

        const winW = window.innerWidth;
        const winH = window.innerHeight;

        setPositions((currentPositions) => {
          const finalPositions = { ...currentPositions };

          if (snapToGrid) {
            targetSelectedIds.forEach((id) => {
              const currentPos = finalPositions[id];
              if (currentPos) {
                finalPositions[id] = snapCoordinateToGrid(currentPos, winW, winH);
              }
            });
            sound.playWindowSnap();
          } else {
            sound.playClick();
          }

          savePositions(finalPositions);
          return finalPositions;
        });
      } else {
        setIsDragging(false);
        setDraggedIds([]);
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Rubber-band drag selection on desktop canvas
  // CRITICAL FIX: Do NOT cancel context menus or start selection if clicking on menus, buttons, or dialogs!
  const handleDesktopPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;

    // Check if click is inside an active menu, modal, inspector, or button
    const targetEl = e.target as HTMLElement;
    if (
      targetEl.closest('.desktop-menu') ||
      targetEl.closest('.glass-panel') ||
      targetEl.closest('.desktop-icon') ||
      targetEl.closest('button') ||
      targetEl.closest('input')
    ) {
      return; // Do nothing, let the clicked control handle its event!
    }

    desktopMenu.close();
    iconMenu.close();
    setIconMenuTarget(null);

    if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
      setSelectedIds([]);
    }

    setSelectionBox({
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
    });

    const handlePointerMove = (moveEvent: PointerEvent) => {
      setSelectionBox((prev) => {
        if (!prev) return null;
        const box = {
          ...prev,
          currentX: moveEvent.clientX,
          currentY: moveEvent.clientY,
        };

        const rectLeft = Math.min(box.startX, box.currentX);
        const rectTop = Math.min(box.startY, box.currentY);
        const rectRight = Math.max(box.startX, box.currentX);
        const rectBottom = Math.max(box.startY, box.currentY);

        const intersectedIds: string[] = [];
        desktopItems.forEach((item) => {
          const pos = positions[item.id];
          if (pos) {
            const iconLeft = pos.x;
            const iconTop = pos.y;
            const iconRight = pos.x + cellWidth;
            const iconBottom = pos.y + cellHeight;

            const isIntersecting =
              rectLeft <= iconRight &&
              rectRight >= iconLeft &&
              rectTop <= iconBottom &&
              rectBottom >= iconTop;

            if (isIntersecting) {
              intersectedIds.push(item.id);
            }
          }
        });

        setSelectedIds(intersectedIds);
        return box;
      });
    };

    const handlePointerUp = () => {
      setSelectionBox(null);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // ---------------------------------------------------------------------
  // Right-click entry points
  // ---------------------------------------------------------------------

  /** Right-click on empty desktop canvas. */
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    sound.playClick();
    setIconMenuTarget(null);
    iconMenu.close();
    desktopMenu.open(e);
  };

  /** Right-click on a desktop icon. */
  const handleIconContextMenu = (e: React.MouseEvent, item: DesktopIconItem) => {
    e.preventDefault();
    e.stopPropagation();
    sound.playClick();
    desktopMenu.close();

    if (!selectedIds.includes(item.id)) {
      setSelectedIds([item.id]);
    }

    setIconMenuTarget(item);
    iconMenu.open(e);
  };

  // ---------------------------------------------------------------------
  // Context menu actions
  // ---------------------------------------------------------------------

  /** New Folder — creates one and drops straight into rename, like macOS. */
  const handleCreateFolder = useCallback(() => {
    sound.playClick();
    const id = createFolder('untitled folder', DESKTOP_ID);
    if (id) beginRename(id, 'untitled folder');
  }, [createFolder, beginRename]);

  /** Arrange → Clean Up: snap every icon into macOS right-to-left columns. */
  const handleCleanUp = useCallback(() => {
    sound.playWindowSnap();
    savePositions(calculateDefaultPositions(desktopItems));
  }, [desktopItems, calculateDefaultPositions, savePositions]);

  /** Refresh: re-read the virtual filesystem and re-tile the desktop. */
  const handleRefreshDesktop = useCallback(async () => {
    if (isRefreshing) return;
    sound.playClick();
    setIsRefreshing(true);
    await initializeFS();
    window.setTimeout(() => {
      savePositions(calculateDefaultPositions(desktopItems));
      setIsRefreshing(false);
      sound.playWindowSnap();
    }, 420);
  }, [isRefreshing, initializeFS, desktopItems, calculateDefaultPositions, savePositions]);

  /** Arrange → Sort By. */
  const handleSortBy = useCallback(
    (criteria: 'name-asc' | 'name-desc' | 'kind' | 'size' | 'date') => {
      sound.playWindowSnap();
      const rank: Record<DesktopIconItem['type'], number> = { drive: 0, app: 1, folder: 2, file: 3 };
      const sorted = [...desktopItems].sort((a, b) => {
        switch (criteria) {
          case 'name-desc':
            return b.name.localeCompare(a.name);
          case 'kind':
            return rank[a.type] - rank[b.type] || a.name.localeCompare(b.name);
          case 'size':
            return (b.fileNode?.size ?? 0) - (a.fileNode?.size ?? 0);
          case 'date':
            return (b.fileNode?.modifiedAt ?? 0) - (a.fileNode?.modifiedAt ?? 0);
          default:
            return a.name.localeCompare(b.name);
        }
      });
      savePositions(calculateDefaultPositions(sorted));
    },
    [desktopItems, calculateDefaultPositions, savePositions]
  );

  /** Quick icon resizing helper (S, M, L, XL) used by View Options. */
  const handleSetIconSize = (size: number) => {
    sound.playClick();
    setViewOptions((prev) => ({ ...prev, iconSize: size }));
    const newCH = Math.max(126, Math.round((size + 80) * viewOptions.gridSpacing));
    const newCW = Math.max(96, Math.round(size * 1.9 * viewOptions.gridSpacing));
    savePositions(calculateDefaultPositions(desktopItems, newCW, newCH));
  };

  const handleAddAppShortcut = (appId: string) => {
    sound.playClick();
    if (!desktopAppIds.includes(appId)) {
      setDesktopAppIds((prev) => [...prev, appId]);
    }
    setIsAddAppModalOpen(false);
  };

  const handleRemoveAppShortcut = (appId: string) => {
    sound.playClick();
    setDesktopAppIds((prev) => prev.filter((id) => id !== appId));
  };

  const handleDeleteItem = (nodeId: string) => {
    sound.playTrash();
    moveToTrash(nodeId);
  };

  const handleDuplicateItem = (nodeId: string) => {
    sound.playClick();
    duplicateNode(nodeId);
  };

  /** New Text Document — mirrors "New Folder" behaviour and enters rename mode. */
  const handleCreateTextFile = useCallback(() => {
    sound.playClick();
    const id = createFile('Untitled.txt', DESKTOP_ID, 'Welcome to your new document.\n');
    if (id) beginRename(id, 'Untitled.txt');
  }, [createFile, beginRename]);

  // Keyboard shortcuts — Space Quick Look, ⌘I Info, ⌘J View Options,
  // ⇧⌘N New Folder, ⇧⌘O Clean Up, ⌘R Refresh.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const mod = e.metaKey || e.ctrlKey;

      /* Quick Look is a *bare* Space. Without the modifier guard this also
         matched ⌘Space and opened Quick Look alongside Spotlight. */
      if (!mod && !e.altKey && !e.shiftKey && e.code === 'Space' && selectedIds.length > 0) {
        e.preventDefault();
        const selectedItem = desktopItems.find((item) => item.id === selectedIds[0]);
        if (selectedItem) {
          sound.playClick();
          setQuickLookItem((prev) => (prev ? null : selectedItem));
        }
        return;
      }

      if (mod && e.key.toLowerCase() === 'i' && selectedIds.length > 0) {
        e.preventDefault();
        const selectedItem = desktopItems.find((item) => item.id === selectedIds[0]);
        if (selectedItem) {
          sound.playClick();
          setGetInfoItem(selectedItem);
        }
        return;
      }

      if (mod && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        sound.playClick();
        setIsViewOptionsOpen((prev) => !prev);
        return;
      }

      if (mod && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleCreateFolder();
        return;
      }

      if (mod && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleCleanUp();
        return;
      }

      if (mod && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        void handleRefreshDesktop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, desktopItems, handleCreateFolder, handleCleanUp, handleRefreshDesktop]);

  // ---------------------------------------------------------------------
  // Menu definitions — ordered to match macOS Sonoma exactly
  // ---------------------------------------------------------------------

  const desktopMenuItems = useMemo<MenuNode[]>(
    () => [
      menuItem('New Folder', handleCreateFolder, { shortcut: '⇧⌘N' }),
      menuItem('New Text Document', handleCreateTextFile),
      menuSeparator(),
      menuItem('Get Info', () => {
        sound.playClick();
        setGetInfoItem({
          id: DESKTOP_ID,
          type: 'folder',
          name: 'Desktop',
        });
      }, { shortcut: '⌘I' }),
      menuSeparator(),
      menuSubmenu('Sort By', [
        menuItem('Name', () => handleSortBy('name-asc')),
        menuItem('Kind', () => handleSortBy('kind')),
        menuItem('Date Modified', () => handleSortBy('date')),
        menuItem('Size', () => handleSortBy('size')),
        menuSeparator(),
        menuItem('None', handleCleanUp),
      ]),
      menuItem('Clean Up', handleCleanUp, { shortcut: '⇧⌘O' }),
      menuSeparator(),
      menuItem('Change Desktop Background…', () => {
        sound.playClick();
        setIsDisplaySettingsOpen(true);
      }),
      menuItem('Edit Widgets…', () => {
        sound.playClick();
        setWidgetGalleryOpen(true);
      }),
      menuSeparator(),
      menuItem('Show View Options', () => {
        sound.playClick();
        setIsViewOptionsOpen(true);
      }, { shortcut: '⌘J' }),
    ],
    [
      handleCreateFolder,
      handleCreateTextFile,
      handleSortBy,
      handleCleanUp,
      setWidgetGalleryOpen,
    ]
  );

  const iconMenuItems = useMemo<MenuNode[]>(() => {
    const item = iconMenuTarget;
    if (!item) return [];

    const isAppShortcut = item.type === 'app' && Boolean(item.appId);
    const node = item.fileNode;

    const head: MenuNode[] = [
      menuItem('Open', () => handleItemOpen(item)),
    ];

    if (node?.type === 'file') {
      head.push(
        menuItem('Open in TextEdit', () => openWindow('textedit', node.name, { w: 720, h: 500 }, { fileId: node.id })),
        menuItem('Open in Finder', () =>
          openWindow('finder', 'Finder', { w: 760, h: 480 }, { folderId: node.parentId || DESKTOP_ID })
        )
      );
    } else if (node?.type === 'folder') {
      head.push(
        menuItem('Open in New Window', () =>
          openWindow('finder', `${node.name} copy`, { w: 760, h: 480 }, { folderId: node.id })
        )
      );
    }

    head.push(
      menuItem('Quick Look', () => setQuickLookItem(item), { shortcut: 'Space' }),
      menuSeparator()
    );

    if (node) {
      head.push(
        menuItem('Rename', () => beginRename(node.id)),
        menuItem('Duplicate', () => handleDuplicateItem(node.id), { shortcut: '⌘D' }),
        menuSeparator(),
        menuItem('Move to Trash', () => handleDeleteItem(node.id), {
          shortcut: '⌘⌫',
          destructive: true,
        })
      );
    } else if (isAppShortcut && item.appId) {
      const appId = item.appId;
      head.push(
        menuItem('Remove from Desktop', () => handleRemoveAppShortcut(appId), { destructive: true })
      );
    }

    head.push(menuSeparator(), menuItem('Get Info', () => setGetInfoItem(item), { shortcut: '⌘I' }));

    return head;
  }, [iconMenuTarget, handleItemOpen, beginRename, handleDuplicateItem, handleDeleteItem, handleRemoveAppShortcut, openWindow]);

  // Wallpaper definition
  const wallpaperDef = WALLPAPERS.find((w) => w.id === wallpaperId) || WALLPAPERS[0];
  const wallpaperStyle = customWallpaperUrl
    ? `url(${customWallpaperUrl}) center/cover no-repeat`
    : mode === 'dark'
    ? wallpaperDef.darkStyle
    : wallpaperDef.lightStyle;

  return (
    <div
      ref={desktopRef}
      onPointerDown={handleDesktopPointerDown}
      onContextMenu={handleContextMenu}
      style={{
        background: wallpaperStyle,
        backgroundSize: customWallpaperUrl ? 'cover' : 'auto',
        /* On touch, long-press is the only way to reach a context menu, so the
           browser must not claim the gesture for scrolling/zoom. */
        touchAction: isTouch ? 'none' : undefined,
      }}
      className="fixed inset-0 z-0 h-full w-full select-none overflow-hidden"
    >
      {/* Rubber-band Drag Selection Rectangle */}
      {selectionBox && (
        <div
          style={{
            left: `${Math.min(selectionBox.startX, selectionBox.currentX)}px`,
            top: `${Math.min(selectionBox.startY, selectionBox.currentY)}px`,
            width: `${Math.abs(selectionBox.currentX - selectionBox.startX)}px`,
            height: `${Math.abs(selectionBox.currentY - selectionBox.startY)}px`,
          }}
          className="fixed z-20 rounded border border-[var(--accent)] bg-[var(--accent)]/15 pointer-events-none transition-none shadow-sm backdrop-blur-[1px]"
        />
      )}

      {/* Refresh progress indicator (triggered from the desktop context menu) */}
      {isRefreshing && (
        <div
          className="pointer-events-none fixed top-1/2 left-1/2 z-[9990] -translate-x-1/2 -translate-y-1/2 animate-fade-in"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2.5 rounded-full border border-white/15 bg-neutral-900/80 px-4 py-2.5 text-[13px] font-medium text-white shadow-2xl backdrop-blur-xl">
            <RefreshCw size={14} className="animate-spin text-[var(--accent)]" />
            Refreshing…
          </div>
        </div>
      )}

      {/* macOS Sonoma / Sequoia Desktop Widgets Layer

          A vertical column of 64px-wide cards overflows the moment the viewport
          gets short (phone landscape, split-screen), so below `sm` — and on any
          viewport too short to hold a full column — the stack becomes a
          horizontally scrolling row. Same widgets, no clipping. */}
      {desktopWidgets.length > 0 && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className={`pointer-events-auto fixed left-6 top-12 z-[6] select-none opacity-90 transition-opacity hover:opacity-100 ${
            isShortViewport
              ? 'flex w-[calc(100vw-3rem)] flex-row gap-3 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
              : 'hidden w-64 flex-col gap-3.5 sm:flex'
          }`}
        >
          {desktopWidgets.map((wId) => (
            <div key={wId} className="group relative w-64 shrink-0">
              <UnifiedWidgetRenderer id={wId} compact />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playClick();
                  toggleDesktopWidget(wId);
                }}
                /* Always visible on touch — a hover-revealed 20px control is
                   unreachable without a pointer. */
                className={`absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full border border-white/20 bg-neutral-900/90 text-[10px] text-white/70 shadow-md transition-opacity hover:text-white ${
                  isTouch ? 'h-7 w-7 opacity-90' : 'h-5 w-5 cursor-pointer opacity-0 group-hover:opacity-100'
                }`}
                aria-label={`Remove ${wId} widget from desktop`}
                title="Remove widget from desktop"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Interactive, Resizable, Non-Overlapping Desktop Icons */}
      {desktopItems.map((item) => {
        const pos = positions[item.id] || { x: -999, y: -999 };
        const isSelected = selectedIds.includes(item.id);
        const isCurrentlyDragged = isDragging && draggedIds.includes(item.id);
        const isHorizontal = viewOptions.labelPosition === 'right' || viewOptions.viewStyle === 'list';
        const isRenaming = renamingId === item.id;

        // Item metadata string (Show Item Info)
        let itemInfo = '';
        if (viewOptions.showItemInfo) {
          if (item.type === 'drive') itemInfo = 'Macintosh HD';
          else if (item.type === 'app') itemInfo = 'Application';
          else if (item.type === 'folder') {
            const count = getChildren(item.fileNode?.id || '').length;
            itemInfo = `${count} ${count === 1 ? 'item' : 'items'}`;
          } else if (item.fileNode) {
            const kb = Math.max(1, Math.round((item.fileNode.size || 0) / 1024));
            itemInfo = `${kb} KB`;
          }
        }

        return (
          <div
            key={item.id}
            onPointerDown={(e) => handleIconPointerDown(e, item)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              handleItemOpen(item);
            }}
            onClick={(e) => {
              /* No double-click on touch, so a completed tap opens the item.
                 `handleIconPointerDown` already consumed the drag case, and the
                 click only fires when the pointer stayed down and lifted. A long
                 press must not also open the app, though. */
              if (!isTouch) return;
              e.stopPropagation();
              if (longPressFiredRef.current) {
                longPressFiredRef.current = false;
                return;
              }
              if (isCurrentlyDragged) return;
              handleItemOpen(item);
            }}
            onContextMenu={(e) => handleIconContextMenu(e, item)}
            style={{
              transform: `translate3d(${pos.x}px, ${pos.y}px, 0px) ${
                isCurrentlyDragged ? 'scale(1.08) rotate(1.2deg)' : 'scale(1)'
              }`,
              width: `${cellWidth}px`,
              height: `${cellHeight}px`, // Explicit height matching the grid cell!
              transition: isCurrentlyDragged
                ? 'none'
                : 'transform 0.28s cubic-bezier(0.18, 0.89, 0.32, 1.15), filter 0.2s ease',
              zIndex: isCurrentlyDragged ? 45 : isSelected ? 30 : 10,
              /* Grow the tappable area past the visual cell on touch without
                 changing the layout, so a 40px icon is still a 44px target. */
              ...(isTouch ? { touchAction: 'manipulation' } : {}),
            }}
            className={`desktop-icon absolute top-0 left-0 flex ${
              isHorizontal ? 'flex-row items-center gap-2.5 px-2 py-1.5' : 'flex-col items-center justify-start p-2'
            } rounded-xl cursor-default select-none group ${
              isCurrentlyDragged
                ? 'cursor-grabbing desktop-icon-lift opacity-95'
                : 'cursor-pointer hover:bg-white/10 active:scale-95'
            } ${
              isSelected
                ? 'bg-[var(--accent)]/30 ring-1 ring-white/50 backdrop-blur-xs shadow-md'
                : ''
            }`}
          >
            {/* Icon Graphic */}
            <div 
              style={{ width: `${viewOptions.iconSize}px`, height: `${viewOptions.iconSize}px` }}
              className="relative flex items-center justify-center shrink-0 pointer-events-none"
            >
              {item.type === 'drive' ? (
                <div 
                  style={{ width: `${viewOptions.iconSize}px`, height: `${viewOptions.iconSize}px` }}
                  className="flex items-center justify-center rounded-2xl bg-gradient-to-b from-neutral-200 to-neutral-400 p-2 shadow-lg drop-shadow-md"
                >
                  <HardDrive size={Math.round(viewOptions.iconSize * 0.65)} className="text-neutral-800" />
                </div>
              ) : item.type === 'app' ? (
                <div className="flex items-center justify-center drop-shadow-lg w-full h-full">
                  {item.iconComponent}
                </div>
              ) : item.type === 'folder' ? (
                <svg width={viewOptions.iconSize} height={viewOptions.iconSize} viewBox="0 0 64 64" fill="none" className="drop-shadow-md">
                  <path d="M6 16C6 11.58 9.58 8 14 8H26C28.5 8 30.5 9.5 32 12L35 16H50C54.42 16 58 19.58 58 24V48C58 52.42 54.42 56 50 56H14C9.58 56 6 52.42 6 48V16Z" fill="#38bdf8" />
                  <path d="M6 24H58V48C58 52.42 54.42 56 50 56H14C9.58 56 6 52.42 6 48V24Z" fill="#0284c7" />
                  <path d="M6 20C6 17.79 7.79 16 10 16H54C56.21 16 58 17.79 58 20V24H6V20Z" fill="#7dd3fc" />
                </svg>
              ) : item.name.toLowerCase().endsWith('.png') || item.name.toLowerCase().endsWith('.jpg') ? (
                <div 
                  style={{ width: `${viewOptions.iconSize}px`, height: `${viewOptions.iconSize}px` }}
                  className="flex items-center justify-center rounded-xl bg-neutral-800/40 border border-white/20 p-1"
                >
                  <ImageIcon size={Math.round(viewOptions.iconSize * 0.65)} className="text-emerald-400 drop-shadow-sm" />
                </div>
              ) : (
                <div 
                  style={{ width: `${viewOptions.iconSize}px`, height: `${viewOptions.iconSize}px` }}
                  className="flex items-center justify-center rounded-xl bg-white/20 border border-white/30 p-1"
                >
                  <FileText size={Math.round(viewOptions.iconSize * 0.65)} className="text-blue-200 drop-shadow-sm" />
                </div>
              )}

              {/* App Shortcut Badge */}
              {item.type === 'app' && (
                <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-900/80 text-[9px] text-white border border-white/20 shadow-xs">
                  <Sparkles size={9} className="text-[var(--accent)]" />
                </div>
              )}
            </div>

            {/* Icon Label & Item Info — or the inline rename field */}
            <div className={`flex flex-col ${isHorizontal ? 'items-start text-left truncate flex-1' : 'items-center text-center mt-1'} pointer-events-none w-full px-1`}>
              {isRenaming ? (
                <input
                  ref={renameInputRef}
                  value={renameDraft}
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onPointerDown={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      commitRename();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      cancelRename();
                    }
                  }}
                  onBlur={commitRename}
                  spellCheck={false}
                  autoFocus
                  aria-label="Rename item"
                  className="pointer-events-auto w-full max-w-full rounded-[5px] border border-[var(--accent)] bg-white px-1.5 py-0.5 text-center font-medium text-neutral-900 outline-none ring-2 ring-[var(--accent)]/40"
                  style={{
                    fontSize: `${Math.max(11, Math.min(13, Math.round(viewOptions.iconSize * 0.22)))}px`,
                  }}
                />
              ) : (
                <span
                  style={{ fontSize: `${Math.max(10, Math.min(12, Math.round(viewOptions.iconSize * 0.2)))}px` }}
                  className={`font-medium leading-snug px-1.5 py-0.5 rounded break-words transition-colors ${
                    isHorizontal ? 'truncate w-full' : 'max-w-full line-clamp-2'
                  } ${
                    isSelected
                      ? 'bg-[var(--accent)] text-white shadow-xs'
                      : 'text-white drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.9)] group-hover:bg-black/30'
                  }`}
                >
                  {item.name}
                </span>
              )}

              {viewOptions.showItemInfo && itemInfo && (
                <span className="text-[9px] text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] leading-none mt-0.5 px-1 truncate max-w-full">
                  {itemInfo}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Desktop canvas context menu (right-click on empty desktop) */}
      {desktopMenu.isOpen && (
        <ContextMenu
          x={desktopMenu.anchor!.x}
          y={desktopMenu.anchor!.y}
          items={desktopMenuItems}
          onClose={desktopMenu.close}
        />
      )}

      {/* Desktop icon context menu (right-click on an icon) */}
      {iconMenu.isOpen && iconMenuTarget && (
        <ContextMenu
          x={iconMenu.anchor!.x}
          y={iconMenu.anchor!.y}
          items={iconMenuItems}
          onClose={iconMenu.close}
          minWidth={164}
        />
      )}

      {/* macOS "Show View Options" Inspector Dialog (⌘J) */}
      {isViewOptionsOpen && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="fixed top-12 right-6 z-[9500] w-76 rounded-2xl border border-white/20 bg-neutral-900/95 glass-panel p-4 shadow-2xl text-white flex flex-col gap-4 animate-scale-in text-xs"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Sliders size={16} className="text-[var(--accent)]" />
              <span>Desktop View Options</span>
            </div>
            <button
              onClick={() => setIsViewOptionsOpen(false)}
              className="rounded-full p-1 hover:bg-white/10 text-white/60 hover:text-white cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {/* Icon Size Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/80 font-medium">Icon size:</span>
              <span className="text-white/60 font-mono text-[11px]">{viewOptions.iconSize} × {viewOptions.iconSize}</span>
            </div>
            <input
              type="range"
              min="38"
              max="92"
              value={viewOptions.iconSize}
              onChange={(e) => handleSetIconSize(Number(e.target.value))}
              className="w-full accent-[var(--accent)] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-white/40">
              <span>Small (38px)</span>
              <span>Medium (52px)</span>
              <span>Large (92px)</span>
            </div>
          </div>

          {/* Grid Spacing Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/80 font-medium">Grid spacing:</span>
              <span className="text-white/60 font-mono text-[11px]">{Math.round(viewOptions.gridSpacing * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.9"
              max="1.5"
              step="0.05"
              value={viewOptions.gridSpacing}
              onChange={(e) => {
                const sp = Number(e.target.value);
                setViewOptions((prev) => ({ ...prev, gridSpacing: sp }));
                const newCH = Math.max(126, Math.round((viewOptions.iconSize + 80) * sp));
                const newCW = Math.max(96, Math.round(viewOptions.iconSize * 1.9 * sp));
                const nextPositions = calculateDefaultPositions(desktopItems, newCW, newCH);
                savePositions(nextPositions);
              }}
              className="w-full accent-[var(--accent)] cursor-pointer"
            />
          </div>

          {/* Label Position */}
          <div className="space-y-1.5">
            <span className="text-white/80 font-medium">Label position:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setViewOptions((prev) => ({ ...prev, labelPosition: 'bottom' }))}
                className={`py-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                  viewOptions.labelPosition === 'bottom'
                    ? 'border-[var(--accent)] bg-[var(--accent)]/30 text-white font-medium'
                    : 'border-white/10 hover:bg-white/5 text-white/70'
                }`}
              >
                Bottom
              </button>
              <button
                onClick={() => setViewOptions((prev) => ({ ...prev, labelPosition: 'right' }))}
                className={`py-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                  viewOptions.labelPosition === 'right'
                    ? 'border-[var(--accent)] bg-[var(--accent)]/30 text-white font-medium'
                    : 'border-white/10 hover:bg-white/5 text-white/70'
                }`}
              >
                Right
              </button>
            </div>
          </div>

          {/* Show Item Info Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer select-none py-1">
            <input
              type="checkbox"
              checked={viewOptions.showItemInfo}
              onChange={(e) => setViewOptions((prev) => ({ ...prev, showItemInfo: e.target.checked }))}
              className="rounded accent-[var(--accent)] cursor-pointer"
            />
            <span className="text-white/80">Show item info (size & item count)</span>
          </label>

          {/* Reset button */}
          <div className="pt-1 border-t border-white/10 flex items-center justify-between gap-2">
            <button
              onClick={() => {
                sound.playClick();
                setIsViewOptionsOpen(false);
                setIsAddAppModalOpen(true);
              }}
              className="px-3 py-1 rounded-lg text-[var(--accent)] hover:bg-white/10 text-xs cursor-pointer"
            >
              Add App Shortcut…
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setViewOptions(DEFAULT_VIEW_OPTIONS);
                const nextPositions = calculateDefaultPositions(desktopItems);
                savePositions(nextPositions);
              }}
              className="px-3 py-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 text-xs cursor-pointer"
            >
              Restore Defaults
            </button>
          </div>
        </div>
      )}

      {/* macOS Desktop & Display Settings Quick Panel */}
      {isDisplaySettingsOpen && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="fixed top-12 left-1/2 -translate-x-1/2 z-[9500] w-96 rounded-2xl border border-white/20 bg-neutral-900/95 glass-panel p-5 shadow-2xl text-white flex flex-col gap-4 animate-scale-in text-xs"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Monitor size={16} className="text-[var(--accent)]" />
              <span>Desktop & Display Settings</span>
            </div>
            <button
              onClick={() => setIsDisplaySettingsOpen(false)}
              className="rounded-full p-1 hover:bg-white/10 text-white/60 hover:text-white cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {/* Wallpaper Quick Switcher */}
          <div className="space-y-2">
            <span className="text-white/80 font-semibold text-xs">Wallpapers:</span>
            <div className="grid grid-cols-5 gap-2">
              {WALLPAPERS.map((wp) => (
                <button
                  key={wp.id}
                  onClick={() => {
                    sound.playClick();
                    setWallpaperId(wp.id);
                  }}
                  className={`group relative h-12 rounded-xl overflow-hidden border transition-all cursor-pointer ${
                    wallpaperId === wp.id ? 'border-white ring-2 ring-[var(--accent)]' : 'border-white/20 hover:scale-105'
                  }`}
                  style={{ background: wp.thumbnailColor }}
                  title={wp.name}
                >
                  {wallpaperId === wp.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Mode & Brightness */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-white/80 font-medium">Appearance Theme:</span>
              <div className="flex gap-1.5 bg-white/10 p-1 rounded-xl">
                <button
                  onClick={() => {
                    sound.playClick();
                    setMode('light');
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    mode === 'light' ? 'bg-white text-neutral-900 shadow-sm font-semibold' : 'text-white/70 hover:text-white'
                  }`}
                >
                  <Sun size={12} /> Light
                </button>
                <button
                  onClick={() => {
                    sound.playClick();
                    setMode('dark');
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    mode === 'dark' ? 'bg-neutral-800 text-white shadow-sm font-semibold' : 'text-white/70 hover:text-white'
                  }`}
                >
                  <Moon size={12} /> Dark
                </button>
              </div>
            </div>

            {/* Accent Color */}
            <div className="flex items-center justify-between">
              <span className="text-white/80 font-medium">Accent Color:</span>
              <div className="flex items-center gap-1.5">
                {(Object.keys(ACCENT_MAP) as Array<keyof typeof ACCENT_MAP>).map((acc) => (
                  <button
                    key={acc}
                    onClick={() => {
                      sound.playClick();
                      setAccentColor(acc);
                    }}
                    style={{ backgroundColor: ACCENT_MAP[acc].hex }}
                    className={`h-5 w-5 rounded-full transition-transform cursor-pointer ${
                      accentColor === acc ? 'scale-125 ring-2 ring-white shadow-md' : 'opacity-80 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Brightness Slider */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/80 font-medium">Display Brightness:</span>
                <span className="text-white/60 font-mono text-[11px]">{brightness}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full accent-[var(--accent)] cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* macOS "Get Info" Modal (⌘I) */}
      {getInfoItem && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in"
          onClick={() => setGetInfoItem(null)}
        >
          <div
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-white/20 bg-neutral-900/95 glass-panel p-5 shadow-2xl text-white flex flex-col gap-4 animate-scale-in text-xs"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-white/10 p-2 shadow-md shrink-0">
                  {getInfoItem.type === 'drive' ? (
                    <HardDrive size={32} className="text-neutral-300" />
                  ) : getInfoItem.type === 'app' ? (
                    getInfoItem.iconComponent
                  ) : getInfoItem.type === 'folder' ? (
                    <Folder size={32} className="text-sky-400" />
                  ) : (
                    <FileText size={32} className="text-blue-300" />
                  )}
                </div>
                <div className="truncate">
                  <h3 className="font-bold text-sm truncate">{getInfoItem.name} Info</h3>
                  <p className="text-[11px] text-white/50 capitalize">{getInfoItem.type}</p>
                </div>
              </div>
              <button
                onClick={() => setGetInfoItem(null)}
                className="rounded-full p-1.5 hover:bg-white/10 text-white/60 hover:text-white cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Info details */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-white/50">Kind:</span>
                <span className="font-medium text-white/90 capitalize">{getInfoItem.type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-white/50">Size:</span>
                <span className="font-mono text-white/90">
                  {getInfoItem.fileNode?.size ? `${Math.round(getInfoItem.fileNode.size / 1024)} KB` : '4 KB on disk'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-white/50">Where:</span>
                <span className="font-mono text-white/90 truncate max-w-[200px]">/Macintosh HD/Users/LadeStack/Desktop</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-white/50">Created:</span>
                <span className="text-white/90">
                  {getInfoItem.fileNode?.createdAt ? new Date(getInfoItem.fileNode.createdAt).toLocaleDateString() : 'Today'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-white/50">Modified:</span>
                <span className="text-white/90">
                  {getInfoItem.fileNode?.modifiedAt ? new Date(getInfoItem.fileNode.modifiedAt).toLocaleTimeString() : 'Just now'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-white/50">Permissions:</span>
                <span className="text-emerald-400 font-medium">Read & Write (You)</span>
              </div>
            </div>

            <button
              onClick={() => {
                handleItemOpen(getInfoItem);
                setGetInfoItem(null);
              }}
              className="w-full py-2 bg-[var(--accent)] hover:brightness-110 text-white font-medium rounded-xl transition-all shadow-md mt-1 cursor-pointer"
            >
              Open {getInfoItem.name}
            </button>
          </div>
        </div>
      )}

      {/* macOS Quick Look Preview Modal (Spacebar) */}
      {quickLookItem && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-6 animate-fade-in"
          onClick={() => setQuickLookItem(null)}
        >
          <div
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl max-h-[80vh] rounded-2xl border border-white/20 bg-neutral-900/90 glass-panel p-6 shadow-2xl text-white flex flex-col gap-4 animate-scale-in"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-[var(--accent)]" />
                <h3 className="font-semibold text-sm truncate">{quickLookItem.name}</h3>
              </div>
              <button
                onClick={() => setQuickLookItem(null)}
                className="rounded-full p-1.5 hover:bg-white/10 text-white/60 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Look Content */}
            <div className="flex-1 overflow-y-auto min-h-[220px] rounded-xl bg-black/40 border border-white/10 p-4">
              {quickLookItem.fileNode?.content ? (
                <pre className="font-mono text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed select-text">
                  {quickLookItem.fileNode.content}
                </pre>
              ) : quickLookItem.type === 'app' ? (
                <div className="flex flex-col items-center justify-center gap-3 py-8">
                  <div className="h-16 w-16 drop-shadow-xl">{quickLookItem.iconComponent}</div>
                  <h4 className="font-bold text-base">{quickLookItem.name}</h4>
                  <p className="text-xs text-white/60">macOS Application for WebOS</p>
                </div>
              ) : quickLookItem.type === 'folder' ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8">
                  <Folder size={64} className="text-sky-400 drop-shadow-md" />
                  <p className="font-semibold text-sm">{quickLookItem.name}</p>
                  <p className="text-xs text-white/50">
                    {getChildren(quickLookItem.fileNode?.id || '').length} items inside
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white/50 text-xs">
                  No preview available
                </div>
              )}
            </div>

            {/* Footer action */}
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setQuickLookItem(null)}
                className="px-4 py-1.5 rounded-xl border border-white/20 hover:bg-white/10 text-xs text-white/80 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleItemOpen(quickLookItem);
                  setQuickLookItem(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-[var(--accent)] hover:brightness-110 text-xs text-white font-medium cursor-pointer"
              >
                Open with App
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "Add App Shortcut to Desktop" Modal Dialog */}
      {isAddAppModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setIsAddAppModalOpen(false)}
        >
          <div
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-white/20 bg-neutral-900/95 glass-panel p-6 shadow-2xl text-white flex flex-col gap-4 animate-scale-in"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Add App to Home Screen</h3>
                <p className="text-xs text-white/60">Choose an application to pin directly onto your Desktop</p>
              </div>
              <button
                onClick={() => setIsAddAppModalOpen(false)}
                className="rounded-full p-1.5 hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={appSearchQuery}
                onChange={(e) => setAppSearchQuery(e.target.value)}
                placeholder="Search applications..."
                className="w-full rounded-xl border border-white/15 bg-white/10 py-1.5 pl-9 pr-3 text-xs text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-[var(--accent)]"
                autoFocus
              />
            </div>

            {/* App Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
              {Object.values(APP_REGISTRY)
                .filter((app) => app.name.toLowerCase().includes(appSearchQuery.toLowerCase()))
                .map((app) => {
                  const Icon = app.icon;
                  const isAlreadyPinned = desktopAppIds.includes(app.id);

                  return (
                    <button
                      key={app.id}
                      onClick={() => handleAddAppShortcut(app.id)}
                      className="group flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-[var(--accent)]/20 hover:border-[var(--accent)]/50 transition-all text-center cursor-pointer"
                    >
                      <div className="relative h-12 w-12 drop-shadow-md group-hover:scale-105 transition-transform">
                        <Icon size={48} />
                        {isAlreadyPinned && (
                          <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">
                            ✓
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-medium text-white truncate w-full">
                        {app.name}
                      </span>
                      <span className="text-[10px] text-white/50">
                        {isAlreadyPinned ? 'Pinned' : '+ Add'}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
