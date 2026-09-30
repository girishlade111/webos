import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import type { FSNode, FSNodeType } from '../types/os';
import { useFSStore } from './fsStore';
import { useNotificationStore } from './notificationStore';
import { sound } from './sound';

/* ============================================================================
   Time Machine — local backup & restore service for the WebOS virtual volume.

   Design mirrors APFS local snapshots: every backup writes only the *tree*
   (names, parents, timestamps) while file payloads are content-addressed into
   a shared blob store. Unchanged files are therefore referenced by hash and
   never rewritten, which keeps snapshot cost proportional to what actually
   changed. Orphaned blobs are garbage-collected whenever a snapshot is pruned.
   ========================================================================== */

const SNAPSHOTS_KEY = 'webos_tm_snapshots_v1';
const BLOBS_KEY = 'webos_tm_blobs_v1';
const CONFIG_KEY = 'webos_tm_config_v1';
const FIRST_RUN_KEY = 'webos_tm_seeded_v1';

/** Node as stored inside a snapshot: the tree entry, with the payload replaced by a blob hash. */
export type SnapshotNode = Omit<FSNode, 'content'> & { contentHash?: string };

export type SnapshotReason = 'auto' | 'manual' | 'pre-restore' | 'seed';

export type TimeMachinePhase =
  | 'idle'
  | 'preparing'
  | 'backing-up'
  | 'restoring'
  | 'pruning';

export interface TimeMachineSnapshot {
  id: string;
  createdAt: number;
  reason: SnapshotReason;
  note: string;
  nodes: Record<string, SnapshotNode>;
  fileCount: number;
  folderCount: number;
  /** Sum of every file's byte length at capture time. */
  logicalSize: number;
  /** Wall-clock duration of the capture, in ms. */
  durationMs: number;
}

export interface TimeMachineConfig {
  enabled: boolean;
  /** Minutes between automatic backups. */
  intervalMinutes: number;
  /** Hard ceiling on retained snapshots, applied after age-based thinning. */
  maxSnapshots: number;
  /** Folder names excluded from every backup (matched against the node name). */
  excludedNames: string[];
  /** Human label for the backup destination shown in the UI. */
  destination: string;
  notifyOnBackup: boolean;
}

export const INTERVAL_PRESETS: { label: string; minutes: number }[] = [
  { label: 'Every 15 minutes', minutes: 15 },
  { label: 'Every 30 minutes', minutes: 30 },
  { label: 'Hourly', minutes: 60 },
  { label: 'Every 3 hours', minutes: 180 },
  { label: 'Every 6 hours', minutes: 360 },
  { label: 'Daily', minutes: 1440 },
  { label: 'Weekly', minutes: 10080 },
];

export const DEFAULT_CONFIG: TimeMachineConfig = {
  enabled: true,
  intervalMinutes: 60,
  maxSnapshots: 200,
  excludedNames: ['Trash'],
  destination: 'WebOS Local Snapshots',
  notifyOnBackup: true,
};

export interface DiffEntry {
  id: string;
  name: string;
  path: string;
  type: FSNodeType;
  size: number;
  previousSize: number;
}

export interface SnapshotDiff {
  added: DiffEntry[];
  removed: DiffEntry[];
  changed: DiffEntry[];
  moved: DiffEntry[];
  unchanged: number;
  totalBytes: number;
}

export interface RestoreResult {
  filesRestored: number;
  foldersRestored: number;
  bytesRestored: number;
}

/* ------------------------------- utilities ------------------------------- */

export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'Zero bytes';
  if (bytes < 1000) return `${bytes} bytes`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1000;
  let i = 0;
  while (value >= 1000 && i < units.length - 1) {
    value /= 1000;
    i += 1;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[i]}`;
};

/** FNV-1a over the payload — fast, stable, and good enough for local dedup keys. */
const hashContent = (input: string): string => {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i += 1) {
    const code = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 16777619) >>> 0;
    h2 = Math.imul(h2 + code + i, 2654435761) >>> 0;
  }
  return `${h1.toString(36)}${h2.toString(36)}`;
};

const isExcluded = (node: FSNode, excluded: string[]): boolean =>
  node.type === 'folder' && excluded.some((name) => node.name === name);

const buildPath = (nodes: Record<string, SnapshotNode | FSNode>, id: string): string => {
  let node = nodes[id];
  if (!node) return '/';
  const parts: string[] = [node.name];
  const guard = new Set<string>([id]);
  while (node.parentId && nodes[node.parentId] && !guard.has(node.parentId)) {
    guard.add(node.parentId);
    node = nodes[node.parentId] as SnapshotNode;
    parts.unshift(node.name);
  }
  return '/' + parts.join('/');
};

/* --------------------------- persistence layer --------------------------- */

/** Blob payloads live outside the store so React never re-renders on bulk writes. */
let blobCache: Record<string, string> | null = null;

const loadBlobs = async (): Promise<Record<string, string>> => {
  if (blobCache) return blobCache;
  try {
    const stored = await idbGet(BLOBS_KEY);
    blobCache = stored && typeof stored === 'object' ? (stored as Record<string, string>) : {};
  } catch {
    blobCache = {};
  }
  return blobCache;
};

const persistBlobs = async (blobs: Record<string, string>) => {
  blobCache = blobs;
  try {
    await idbSet(BLOBS_KEY, blobs);
  } catch {}
};

const loadConfig = (): TimeMachineConfig => {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_CONFIG };
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<TimeMachineConfig>) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
};

const persistConfig = (config: TimeMachineConfig) => {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {}
};

const parseSnapshots = (raw: unknown): TimeMachineSnapshot[] => {
  if (!raw || typeof raw !== 'object') return [];
  const record = raw as Record<string, TimeMachineSnapshot>;
  return Object.values(record)
    .filter((s) => s && typeof s.createdAt === 'number' && s.nodes)
    .sort((a, b) => a.createdAt - b.createdAt);
};

/* ------------------------------ retention ------------------------------ */

const DAY = 86_400_000;

/**
 * macOS-style thinning: keep every snapshot from the last day, thin to one per
 * day for the past week, then one per week. Manual snapshots are never thinned.
 */
const selectForRetention = (
  snapshots: TimeMachineSnapshot[],
  config: TimeMachineConfig,
  now: number
): TimeMachineSnapshot[] => {
  const kept: TimeMachineSnapshot[] = [];
  const lastSeenDay = new Map<string, number>();
  const lastSeenWeek = new Map<string, number>();

  for (let i = snapshots.length - 1; i >= 0; i -= 1) {
    const snap = snapshots[i];
    const age = now - snap.createdAt;

    if (snap.reason !== 'auto' || i === snapshots.length - 1) {
      kept.push(snap);
      continue;
    }
    if (age < DAY) {
      kept.push(snap);
      continue;
    }

    const dayKey = String(Math.floor(snap.createdAt / DAY));
    if (age < DAY * 7) {
      if (!lastSeenDay.has(dayKey)) {
        lastSeenDay.set(dayKey, snap.createdAt);
        kept.push(snap);
      }
      continue;
    }
    const weekKey = String(Math.floor(snap.createdAt / (DAY * 7)));
    if (!lastSeenWeek.has(weekKey)) {
      lastSeenWeek.set(weekKey, snap.createdAt);
      kept.push(snap);
    }
  }

  kept.sort((a, b) => a.createdAt - b.createdAt);
  return kept.slice(-Math.max(1, config.maxSnapshots));
};

const garbageCollect = async (snapshots: TimeMachineSnapshot[]): Promise<number> => {
  const blobs = await loadBlobs();
  const live = new Set<string>();
  snapshots.forEach((snap) => {
    Object.values(snap.nodes).forEach((node) => {
      if (node.contentHash) live.add(node.contentHash);
    });
  });
  const next: Record<string, string> = {};
  let removed = 0;
  Object.keys(blobs).forEach((hash) => {
    if (live.has(hash)) next[hash] = blobs[hash];
    else removed += 1;
  });
  if (removed > 0) await persistBlobs(next);
  return removed;
};

/* -------------------------------- store -------------------------------- */

interface TimeMachineState {
  snapshots: TimeMachineSnapshot[];
  config: TimeMachineConfig;
  phase: TimeMachinePhase;
  progress: number;
  lastError: string | null;
  lastBackupAt: number | null;
  lastPrunedAt: number | null;
  /** Bumped after every capture/restore so panels can invalidate caches. */
  revision: number;
  isLoaded: boolean;

  initialize: () => Promise<void>;
  backUpNow: (note?: string, reason?: SnapshotReason) => Promise<TimeMachineSnapshot | null>;
  restoreVolume: (snapshotId: string) => Promise<RestoreResult | null>;
  restoreItems: (snapshotId: string, nodeIds: string[]) => Promise<RestoreResult | null>;
  diffSnapshot: (snapshotId: string) => SnapshotDiff | null;
  deleteSnapshot: (snapshotId: string) => Promise<void>;
  deleteAllSnapshots: () => Promise<void>;
  pruneStorage: () => Promise<number>;
  updateConfig: (patch: Partial<TimeMachineConfig>) => void;
}

export const useTimeMachineStore = create<TimeMachineState>((set, get) => ({
  snapshots: [],
  config: DEFAULT_CONFIG,
  phase: 'idle',
  progress: 0,
  lastError: null,
  lastBackupAt: null,
  lastPrunedAt: null,
  revision: 0,
  isLoaded: false,

  initialize: async () => {
    if (get().isLoaded) return;
    const config = loadConfig();
    let snapshots: TimeMachineSnapshot[] = [];
    try {
      snapshots = parseSnapshots(await idbGet(SNAPSHOTS_KEY));
    } catch {
      snapshots = [];
    }
    await loadBlobs();

    const hasSeeded =
      typeof localStorage !== 'undefined' && localStorage.getItem(FIRST_RUN_KEY) === '1';

    set({
      config,
      snapshots,
      isLoaded: true,
      lastBackupAt: snapshots.length ? snapshots[snapshots.length - 1].createdAt : null,
    });

    // First launch: capture the pristine volume so there is always a restore point.
    if (!hasSeeded && snapshots.length === 0) {
      try {
        localStorage.setItem(FIRST_RUN_KEY, '1');
      } catch {}
      await get().backUpNow('Initial volume snapshot', 'seed');
    }
  },

  backUpNow: async (note, reasonOverride) => {    const { config, phase, snapshots } = get();
    if (phase !== 'idle' && phase !== 'preparing') return null;

    set({ phase: 'preparing', progress: 0, lastError: null });
    await new Promise((r) => setTimeout(r, 90));

    try {
      const source = useFSStore.getState().nodes;
      const blobs = await loadBlobs();
      const startedAt = performance.now();

      const nodes: Record<string, SnapshotNode> = {};
      const nextBlobs: Record<string, string> = { ...blobs };
      let fileCount = 0;
      let folderCount = 0;
      let logicalSize = 0;

      const ids = Object.keys(source);
      for (let i = 0; i < ids.length; i += 1) {
        const node = source[ids[i]];
        if (!node || isExcluded(node, config.excludedNames)) continue;

        if (node.type === 'folder') {
          folderCount += 1;
          const { content: _content, ...rest } = node;
          nodes[node.id] = rest;
        } else {
          fileCount += 1;
          logicalSize += node.size || 0;
          const payload = node.content ?? '';
          const hash = hashContent(payload);
          if (!(hash in nextBlobs)) nextBlobs[hash] = payload;
          const { content: _content, ...rest } = node;
          nodes[node.id] = { ...rest, contentHash: hash };
        }

        if (i % 12 === 0) {
          set({ progress: Math.min(0.85, (i / Math.max(1, ids.length)) * 0.85) });
        }
      }

      const changed = countChangedFiles(snapshots[snapshots.length - 1], nodes);
      if (changed === 0 && reasonOverride === undefined && snapshots.length > 0) {
        set({ phase: 'idle', progress: 0 });
        return null;
      }

      await persistBlobs(nextBlobs);
      set({ phase: 'backing-up', progress: 0.9 });

      const now = Date.now();
      const snapshot: TimeMachineSnapshot = {
        id: `tm-${now}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: now,
        reason: (reasonOverride as SnapshotReason) ?? 'auto',
        note:
          note ||
          (reasonOverride === 'auto' ? 'Scheduled backup' : 'Manual backup'),
        nodes,
        fileCount,
        folderCount,
        logicalSize,
        durationMs: Math.max(1, Math.round(performance.now() - startedAt)),
      };

      const merged = [...snapshots, snapshot];
      const retained = selectForRetention(merged, config, now);
      const pruned = merged.length - retained.length;

      await persistSnapshotRecord(retained);
      if (pruned > 0) {
        set({ phase: 'pruning', progress: 0.96 });
        await garbageCollect(retained);
      }

      set({
        snapshots: retained,
        phase: 'idle',
        progress: 0,
        lastBackupAt: now,
        lastPrunedAt: pruned > 0 ? now : get().lastPrunedAt,
        revision: get().revision + 1,
      });

      if (config.notifyOnBackup && reasonOverride !== 'auto') {
        useNotificationStore.getState().addNotification({
          title: 'Time Machine',
          message: `Backed up ${fileCount} file${fileCount === 1 ? '' : 's'} (${formatBytes(
            logicalSize
          )}) to ${config.destination}.`,
          appId: 'timemachine',
          appName: 'Time Machine',
        });
      }
      sound.playShutter();
      return snapshot;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ phase: 'idle', progress: 0, lastError: message });
      useNotificationStore.getState().addNotification({
        title: 'Time Machine — Backup Failed',
        message,
        appId: 'timemachine',
        appName: 'Time Machine',
      });
      sound.playError();
      return null;
    }
  },

  restoreVolume: async (snapshotId) => {
    const { phase, snapshots } = get();
    if (phase !== 'idle') return null;
    const snapshot = snapshots.find((s) => s.id === snapshotId);
    if (!snapshot) return null;

    set({ phase: 'restoring', progress: 0.05, lastError: null });

    try {
      // Safety net: never restore without a pre-restore checkpoint on disk.
      await get().backUpNow('Before restore', 'pre-restore');
      set({ phase: 'restoring', progress: 0.25 });

      const blobs = await loadBlobs();
      const restored: Record<string, FSNode> = {};
      let filesRestored = 0;
      let foldersRestored = 0;
      let bytesRestored = 0;

      const ids = Object.keys(snapshot.nodes);
      for (let i = 0; i < ids.length; i += 1) {
        const entry = snapshot.nodes[ids[i]];
        if (entry.type === 'folder') {
          foldersRestored += 1;
          restored[entry.id] = {
            id: entry.id,
            name: entry.name,
            type: 'folder',
            parentId: entry.parentId,
            createdAt: entry.createdAt,
            modifiedAt: entry.modifiedAt,
            size: entry.size,
            isProtected: entry.isProtected,
          };
        } else {
          const content = entry.contentHash ? blobs[entry.contentHash] ?? '' : '';
          filesRestored += 1;
          bytesRestored += entry.size || 0;
          restored[entry.id] = {
            id: entry.id,
            name: entry.name,
            type: 'file',
            mime: entry.mime,
            content,
            parentId: entry.parentId,
            createdAt: entry.createdAt,
            modifiedAt: entry.modifiedAt,
            size: entry.size || content.length,
            isProtected: entry.isProtected,
          };
        }
        if (i % 16 === 0) {
          set({ progress: 0.25 + (i / Math.max(1, ids.length)) * 0.7 });
        }
      }

      useFSStore.getState().replaceAllNodes(restored);
      set({ phase: 'idle', progress: 0, revision: get().revision + 1 });
      sound.playWindowSnap();
      useNotificationStore.getState().addNotification({
        title: 'Time Machine',
        message: `Restored ${formatBytes(
          snapshot.logicalSize
        )} from the ${new Date(snapshot.createdAt).toLocaleString()} backup.`,
        appId: 'timemachine',
        appName: 'Time Machine',
      });
      return { filesRestored, foldersRestored, bytesRestored };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ phase: 'idle', progress: 0, lastError: message });
      sound.playError();
      return null;
    }
  },

  restoreItems: async (snapshotId, nodeIds) => {
    const { phase, snapshots } = get();
    if (phase !== 'idle') return null;
    const snapshot = snapshots.find((s) => s.id === snapshotId);
    if (!snapshot || nodeIds.length === 0) return null;

    set({ phase: 'restoring', progress: 0.15, lastError: null });

    try {
      await get().backUpNow('Before restore', 'pre-restore');
      const blobs = await loadBlobs();
      const restored: Record<string, FSNode> = {};
      let filesRestored = 0;
      let foldersRestored = 0;
      let bytesRestored = 0;

      // Pull in every descendant of each requested node so folders arrive whole.
      const wanted = new Set<string>();
      const collect = (id: string) => {
        if (wanted.has(id) || !snapshot.nodes[id]) return;
        wanted.add(id);
        Object.values(snapshot.nodes).forEach((n) => {
          if (n.parentId === id) collect(n.id);
        });
      };
      nodeIds.forEach(collect);

      wanted.forEach((id) => {
        const entry = snapshot.nodes[id];
        if (!entry) return;
        if (entry.type === 'folder') {
          foldersRestored += 1;
          restored[entry.id] = {
            id: entry.id,
            name: entry.name,
            type: 'folder',
            parentId: entry.parentId,
            createdAt: entry.createdAt,
            modifiedAt: entry.modifiedAt,
            size: entry.size,
            isProtected: entry.isProtected,
          };
        } else {
          const content = entry.contentHash ? blobs[entry.contentHash] ?? '' : '';
          filesRestored += 1;
          bytesRestored += entry.size || 0;
          restored[entry.id] = {
            id: entry.id,
            name: entry.name,
            type: 'file',
            mime: entry.mime,
            content,
            parentId: entry.parentId,
            createdAt: entry.createdAt,
            modifiedAt: entry.modifiedAt,
            size: entry.size || content.length,
            isProtected: entry.isProtected,
          };
        }
      });

      useFSStore.getState().mergeNodes(restored);
      set({ phase: 'idle', progress: 0, revision: get().revision + 1 });
      sound.playClick();
      return { filesRestored, foldersRestored, bytesRestored };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ phase: 'idle', progress: 0, lastError: message });
      sound.playError();
      return null;
    }
  },

  diffSnapshot: (snapshotId) => {
    const snapshot = get().snapshots.find((s) => s.id === snapshotId);
    if (!snapshot) return null;
    return computeDiff(snapshot, useFSStore.getState().nodes);
  },

  deleteSnapshot: async (snapshotId) => {
    const remaining = get().snapshots.filter((s) => s.id !== snapshotId);
    await persistSnapshotRecord(remaining);
    await garbageCollect(remaining);
    set({
      snapshots: remaining,
      lastBackupAt: remaining.length ? remaining[remaining.length - 1].createdAt : null,
      revision: get().revision + 1,
    });
  },

  deleteAllSnapshots: async () => {
    await persistSnapshotRecord([]);
    await persistBlobs({});
    set({
      snapshots: [],
      lastBackupAt: null,
      phase: 'idle',
      progress: 0,
      revision: get().revision + 1,
    });
    sound.playTrash();
  },

  pruneStorage: async () => {
    set({ phase: 'pruning', progress: 0.4 });
    const removed = await garbageCollect(get().snapshots);
    set({ phase: 'idle', progress: 0, lastPrunedAt: Date.now(), revision: get().revision + 1 });
    return removed;
  },

  updateConfig: (patch) => {    const config = { ...get().config, ...patch };
    persistConfig(config);
    set({ config });
  },
}));

/* ----------------------------- store helpers ----------------------------- */

const persistSnapshotRecord = async (snapshots: TimeMachineSnapshot[]) => {
  const record: Record<string, TimeMachineSnapshot> = {};
  snapshots.forEach((snap) => {
    record[snap.id] = snap;
  });
  try {
    await idbSet(SNAPSHOTS_KEY, record);
  } catch {}
};

/** Number of files whose payload differs from the previous snapshot. */
const countChangedFiles = (
  previous: TimeMachineSnapshot | undefined,
  nodes: Record<string, SnapshotNode>
): number => {
  if (!previous) return Object.keys(nodes).length;
  let changed = 0;
  Object.values(nodes).forEach((node) => {
    const before = previous.nodes[node.id];
    if (!before) {
      changed += 1;
      return;
    }
    if (node.type === 'file' && before.contentHash !== node.contentHash) changed += 1;
    else if (before.name !== node.name || before.parentId !== node.parentId) changed += 1;
  });
  return changed;
};

export const computeDiff = (
  snapshot: TimeMachineSnapshot,
  current: Record<string, FSNode>
): SnapshotDiff => {
  const added: DiffEntry[] = [];
  const removed: DiffEntry[] = [];
  const changed: DiffEntry[] = [];
  const moved: DiffEntry[] = [];
  let unchanged = 0;
  let totalBytes = 0;

  const makeEntry = (
    id: string,
    name: string,
    type: FSNodeType,
    size: number,
    path: string
  ): DiffEntry => ({ id, name, type, size, previousSize: size, path });

  Object.values(snapshot.nodes).forEach((entry) => {
    totalBytes += entry.size || 0;
    const now = current[entry.id];
    if (!now) {
      removed.push(
        makeEntry(
          entry.id,
          entry.name,
          entry.type,
          entry.size || 0,
          buildPath(snapshot.nodes, entry.id)
        )
      );
      return;
    }
    if (entry.type === 'file') {
      const liveHash = hashContent(now.content ?? '');
      if (liveHash !== entry.contentHash) {
        changed.push({
          id: entry.id,
          name: entry.name,
          type: 'file',
          size: now.size || 0,
          previousSize: entry.size || 0,
          path: buildPath(snapshot.nodes, entry.id),
        });
        return;
      }
    }
    if (now.name !== entry.name || now.parentId !== entry.parentId) {
      moved.push({
        id: entry.id,
        name: entry.name,
        type: entry.type,
        size: now.size || 0,
        previousSize: entry.size || 0,
        path: buildPath(snapshot.nodes, entry.id),
      });
      return;
    }
    unchanged += 1;
  });

  Object.values(current).forEach((node) => {
    if (snapshot.nodes[node.id]) return;
    if (node.name === 'Trash') return;
    added.push({
      id: node.id,
      name: node.name,
      type: node.type,
      size: node.size || 0,
      previousSize: 0,
      path: buildPath(current, node.id),
    });
  });

  return { added, removed, changed, moved, unchanged, totalBytes };
};

/* ------------------------------- scheduler ------------------------------- */

let schedulerTimer: ReturnType<typeof setInterval> | null = null;
let schedulerTick = 0;
const TICK_MS = 20_000;

/** Bytes introduced by each snapshot, walking forward so repeats count once. */
export const snapshotIncrementalSizes = (
  snapshots: TimeMachineSnapshot[]
): Record<string, number> => {
  const seen = new Set<string>();
  const result: Record<string, number> = {};
  snapshots.forEach((snap) => {
    let bytes = 0;
    Object.values(snap.nodes).forEach((node) => {
      if (!node.contentHash) return;
      if (seen.has(node.contentHash)) return;
      seen.add(node.contentHash);
      bytes += node.size || 0;
    });
    result[snap.id] = bytes;
  });
  return result;
};

export const timeMachineStats = (snapshots: TimeMachineSnapshot[]) => {
  const unique = new Set<string>();
  let payloadBytes = 0;
  snapshots.forEach((snap) => {
    Object.values(snap.nodes).forEach((node) => {
      if (!node.contentHash || unique.has(node.contentHash)) return;
      unique.add(node.contentHash);
      payloadBytes += node.size || 0;
    });
  });
  const newest = snapshots.length ? snapshots[snapshots.length - 1] : undefined;
  return {
    snapshotCount: snapshots.length,
    fileCount: newest ? newest.fileCount : 0,
    folderCount: newest ? newest.folderCount : 0,
    logicalSize: newest ? newest.logicalSize : 0,
    uniquePayloadBytes: payloadBytes,
    uniqueBlobCount: unique.size,
  };
};

/** Milliseconds until the next automatic backup, or null when paused. */
export const msUntilNextBackup = (
  config: TimeMachineConfig,
  lastBackupAt: number | null,
  now: number
): number | null => {
  if (!config.enabled) return null;
  const base = lastBackupAt ?? now;
  const due = base + config.intervalMinutes * 60_000;
  return Math.max(0, due - now);
};

const runScheduledBackup = async () => {
  const { config, isLoaded, lastBackupAt, phase } = useTimeMachineStore.getState();
  if (!isLoaded || !config.enabled) return;
  if (phase !== 'idle') return;

  const intervalMs = config.intervalMinutes * 60_000;
  const base = lastBackupAt ?? Date.now();
  if (Date.now() - base < intervalMs) return;

  await useTimeMachineStore.getState().backUpNow('Scheduled backup', 'auto');
};

/** Starts the periodic capture loop. Safe to call more than once. */
export const startTimeMachineService = (): void => {
  if (schedulerTimer) return;
  useTimeMachineStore.getState().initialize();
  schedulerTimer = setInterval(() => {
    schedulerTick += 1;
    // Re-check every 20s, but only re-read config when the tick rolls over.
    if (schedulerTick % 3 === 0) {
      const stored = loadConfig();
      if (JSON.stringify(stored) !== JSON.stringify(useTimeMachineStore.getState().config)) {
        useTimeMachineStore.getState().updateConfig(stored);
      }
    }
    void runScheduledBackup();
  }, TICK_MS);
};

export const stopTimeMachineService = (): void => {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
};

/** Read a single file's payload out of a snapshot — used by the preview pane. */
export const readSnapshotFile = async (
  snapshot: TimeMachineSnapshot,
  nodeId: string
): Promise<string | null> => {
  const entry = snapshot.nodes[nodeId];
  if (!entry || entry.type !== 'file') return null;
  const blobs = await loadBlobs();
  return entry.contentHash ? blobs[entry.contentHash] ?? '' : '';
};

/** Roll a file back to its most recent version at or before `before`. */
export const restoreLatestVersionBefore = async (
  fileId: string,
  before: number
): Promise<boolean> => {
  const { snapshots, phase } = useTimeMachineStore.getState();
  if (phase !== 'idle') return false;
  const target = [...snapshots]
    .reverse()
    .find((s) => s.createdAt <= before && s.nodes[fileId]);
  if (!target) return false;
  const result = await useTimeMachineStore
    .getState()
    .restoreItems(target.id, [fileId]);
  return result !== null;
};

/** Every distinct revision of a file across the retained snapshot history. */
export const fileVersionHistory = (
  snapshots: TimeMachineSnapshot[],
  fileId: string
): { snapshot: TimeMachineSnapshot; hash?: string; size: number }[] => {
  const out: { snapshot: TimeMachineSnapshot; hash?: string; size: number }[] = [];
  snapshots.forEach((snap) => {
    const entry = snap.nodes[fileId];
    if (!entry) return;
    out.push({ snapshot: snap, hash: entry.contentHash, size: entry.size || 0 });
  });
  return out;
};
