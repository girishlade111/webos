import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  History,
  List,
  Settings2,
  Plus,
  Play,
  RotateCcw,
  Trash2,
  HardDrive,
  Check,
  X,
  FileText,
  Folder,
  Archive,
  TriangleAlert,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import {
  INTERVAL_PRESETS,
  computeDiff,
  formatBytes,
  msUntilNextBackup,
  snapshotIncrementalSizes,
  timeMachineStats,
  useTimeMachineStore,
  type TimeMachineSnapshot,
} from '../../core/timeMachineStore';
import { useFSStore } from '../../core/fsStore';
import { TimeMachineIcon } from '../../assets/appIcons';
import { sound } from '../../core/sound';
import Starfield from './Starfield';
import Timeline from './Timeline';
import Tunnel from './Tunnel';

type Pane = 'browse' | 'snapshots' | 'options';

const DAY_MS = 86_400_000;

const dayLabel = (ts: number) => {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(Date.now() - DAY_MS);
  if (Math.floor(ts / DAY_MS) === Math.floor(today.getTime() / DAY_MS)) return 'Today';
  if (Math.floor(ts / DAY_MS) === Math.floor(yesterday.getTime() / DAY_MS)) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
};

const clockLabel = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });

const durationLabel = (ms: number) =>
  ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;

/* ----------------------------- macOS controls ----------------------------- */

const Segmented: React.FC<{
  value: Pane;
  onChange: (pane: Pane) => void;
  tone: 'overlay' | 'solid';
}> = ({ value, onChange, tone }) => (
  <div
    className={`inline-flex rounded-[7px] p-[2px] ${
      tone === 'overlay' ? 'bg-white/14 ring-1 ring-inset ring-white/15' : 'bg-black/8 dark:bg-white/12'
    }`}
    role="tablist"
  >
    {(
      [
        { id: 'browse', label: 'Time Machine', icon: History },
        { id: 'snapshots', label: 'Snapshots', icon: Archive },
        { id: 'options', label: 'Options', icon: Settings2 },
      ] as const
    ).map((item) => {
      const Icon = item.icon;
      const active = value === item.id;
      return (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => {
            sound.playClick();
            onChange(item.id);
          }}
          className={`flex items-center gap-1.5 rounded-[5px] px-2.5 py-[3px] text-[12px] font-medium tracking-tight transition-all ${
            active
              ? tone === 'overlay'
                ? 'bg-white/90 text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.35)]'
                : 'bg-white text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.18)] dark:bg-[#5c5c61] dark:text-white'
              : tone === 'overlay'
                ? 'text-white/75 hover:text-white'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white'
          }`}
        >
          <Icon size={12} strokeWidth={2.1} />
          {item.label}
        </button>
      );
    })}
  </div>
);

const Switch: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({
  checked,
  onChange,
  label,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => {
      sound.playClick();
      onChange(!checked);
    }}
    className={`relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors duration-200 ${
      checked ? 'bg-[var(--accent)]' : 'bg-neutral-300 dark:bg-neutral-600'
    }`}
  >
    <span
      className="absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-transform duration-200"
      style={{ transform: checked ? 'translateX(16px)' : 'translateX(2px)' }}
    />
  </button>
);

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({
  label,
  hint,
  children,
}) => (
  <div className="flex min-h-[38px] items-center justify-between gap-4 px-3.5 py-2.5">
    <div className="min-w-0">
      <p className="text-[12px] font-medium tracking-tight text-neutral-800 dark:text-neutral-100">
        {label}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">{hint}</p>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const Card: React.FC<{ title?: string; children: React.ReactNode; className?: string }> = ({
  title,
  children,
  className = '',
}) => (
  <section className={className}>
    {title && (
      <h3 className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.5px] text-neutral-500 dark:text-neutral-400">
        {title}
      </h3>
    )}
    <div className="divide-y divide-black/8 overflow-hidden rounded-[10px] border border-black/10 bg-white/60 dark:divide-white/8 dark:border-white/10 dark:bg-white/5">
      {children}
    </div>
  </section>
);

/** macOS-style modal alert, anchored inside the window. */
const Alert: React.FC<{
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ title, message, confirmLabel, destructive, onConfirm, onCancel }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.14 }}
    className="absolute inset-0 z-50 flex items-center justify-center bg-black/45 p-6 backdrop-blur-[3px]"
    onClick={onCancel}
  >
    <motion.div
      initial={{ scale: 0.92, opacity: 0, y: 8 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      onClick={(e) => e.stopPropagation()}
      role="alertdialog"
      aria-label={title}
      className="w-full max-w-[300px] rounded-[12px] border border-black/10 bg-[var(--window-bg)] p-4 text-center shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
    >
      <p className="text-[13px] font-semibold tracking-tight text-neutral-900 dark:text-white">{title}</p>
      <div className="mt-1.5 text-[11px] leading-[1.45] text-neutral-600 dark:text-neutral-300">
        {message}
      </div>
      <div className="mt-3.5 flex justify-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[6px] border border-black/12 bg-white/70 px-3.5 py-1 text-[12px] font-medium tracking-tight text-neutral-800 shadow-xs transition-colors hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-neutral-100 dark:hover:bg-white/20"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`rounded-[6px] px-3.5 py-1 text-[12px] font-medium tracking-tight text-white shadow-xs transition-[filter] hover:brightness-110 ${
            destructive ? 'bg-[#d0342c]' : 'bg-[var(--accent)]'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </motion.div>
  </motion.div>
);

/* ------------------------------- diff chips ------------------------------- */

const DiffChip: React.FC<{ tone: string; glyph: string; label: string }> = ({ tone, glyph, label }) => (
  <span
    className="inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[11px] font-medium tracking-tight"
    style={{ background: `${tone}22`, color: tone }}
  >
    <span className="w-[9px] text-center font-semibold">{glyph}</span>
    {label}
  </span>
);

/* --------------------------------- app ---------------------------------- */

export const TimeMachineApp: React.FC<{ windowId: string; initialParams?: any }> = ({
  initialParams,
}) => {
  const { snapshots, config, phase, progress, lastError, isLoaded, backUpNow, restoreVolume, restoreItems, deleteSnapshot, deleteAllSnapshots, pruneStorage, updateConfig } =
    useTimeMachineStore();
  const nodes = useFSStore((s) => s.nodes);

  const [pane, setPane] = useState<Pane>('browse');
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [showChanges, setShowChanges] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<TimeMachineSnapshot | null>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [confirmPrune, setConfirmPrune] = useState(false);
  const [exclusionDraft, setExclusionDraft] = useState('');
  const [checked, setChecked] = useState<string[]>([]);
  const [now, setNow] = useState(Date.now());
  const [reducedMotion, setReducedMotion] = useState(false);

  const browseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pane === 'browse') browseRef.current?.focus();
  }, [pane]);

  /* ------------------------------ reactions ------------------------------ */

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Keep the selection pinned to "now" as backups land, and honour deep links.
  const followsNow = useRef(true);
  useEffect(() => {
    if (snapshots.length === 0) {
      followsNow.current = true;
      setSelectedIndex(-1);
      return;
    }
    setSelectedIndex((prev) => {
      if (initialParams?.snapshotId) {
        const idx = snapshots.findIndex((s) => s.id === initialParams.snapshotId);
        if (idx >= 0) {
          followsNow.current = false;
          return idx;
        }
      }
      // Riding along with the newest backup unless the user scrubbed away.
      if (followsNow.current || prev < 0 || prev === snapshots.length - 1) {
        return snapshots.length - 1;
      }
      return Math.min(prev, snapshots.length - 1);
    });
  }, [snapshots.length, initialParams?.snapshotId]);

  const selectIndex = useCallback(
    (index: number) => {
      followsNow.current = index === snapshots.length - 1;
      setSelectedIndex(index);
    },
    [snapshots.length]
  );

  const selected = selectedIndex >= 0 ? snapshots[selectedIndex] : undefined;
  const isLive = !!selected && selectedIndex === snapshots.length - 1;

  const diff = useMemo(
    () => (selected ? computeDiff(selected, nodes) : null),
    [selected, nodes]
  );

  const stats = useMemo(() => timeMachineStats(snapshots), [snapshots]);
  const incremental = useMemo(() => snapshotIncrementalSizes(snapshots), [snapshots]);
  const nextIn = msUntilNextBackup(config, snapshots.length ? snapshots[snapshots.length - 1].createdAt : null, now);

  const busy = phase !== 'idle';

  useEffect(() => {
    setChecked([]);
  }, [selected?.id]);

  /* -------------------------------- actions ------------------------------- */

  const handleBackUp = useCallback(
    (note?: string) => {
      void backUpNow(note, note ? 'manual' : undefined);
    },
    [backUpNow]
  );

  const handleRestore = useCallback(
    (snap: TimeMachineSnapshot) => {
      void restoreVolume(snap.id);
    },
    [restoreVolume]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'r' && selected) {
        e.preventDefault();
        setRestoreTarget(selected);
        return;
      }
      if (e.key === 'ArrowLeft' && snapshots.length) {
        e.preventDefault();
        setPane('browse');
        selectIndex(Math.max(0, selectedIndex - 1));
      }
      if (e.key === 'ArrowRight' && snapshots.length) {
        e.preventDefault();
        setPane('browse');
        selectIndex(Math.min(snapshots.length - 1, selectedIndex + 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, selectedIndex, snapshots.length, selectIndex]);

  const addExclusion = () => {
    const name = exclusionDraft.trim();
    if (!name || config.excludedNames.includes(name)) {
      setExclusionDraft('');
      return;
    }
    updateConfig({ excludedNames: [...config.excludedNames, name] });
    setExclusionDraft('');
    sound.playClick();
  };

  const toggleChecked = (id: string) =>
    setChecked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const phaseLabel =
    phase === 'preparing'
      ? 'Preparing…'
      : phase === 'backing-up'
        ? 'Backing up…'
        : phase === 'pruning'
          ? 'Pruning old backups…'
          : phase === 'restoring'
            ? 'Restoring…'
            : null;

  /* --------------------------------- views -------------------------------- */

  const topBar = (tone: 'overlay' | 'solid') => (
    <div
      className={`relative z-30 flex items-center justify-between gap-3 px-3.5 ${
        tone === 'overlay' ? 'py-2.5' : 'h-11 border-b border-black/10 dark:border-white/10'
      }`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <TimeMachineIcon size={22} className="shrink-0 rounded-[6px] !shadow-sm" />
        <div className="min-w-0 leading-tight">
          <p
            className={`truncate text-[12.5px] font-semibold tracking-tight ${
              tone === 'overlay' ? 'text-white' : 'text-neutral-900 dark:text-white'
            }`}
          >
            {phaseLabel ?? (config.enabled ? 'Backing up automatically' : 'Automatic backup off')}
          </p>
          <p
            className={`truncate text-[10.5px] ${
              tone === 'overlay' ? 'text-white/50' : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            {stats.snapshotCount} backup{stats.snapshotCount === 1 ? '' : 's'} ·{' '}
            {formatBytes(stats.uniquePayloadBytes)} stored
            {nextIn !== null && !busy ? ` · next in ${formatCountdown(nextIn)}` : ''}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Segmented value={pane} onChange={setPane} tone={tone} />
        <button
          type="button"
          onClick={() => handleBackUp()}
          disabled={busy}
          title="Back Up Now (⌘B)"
          className="flex items-center gap-1.5 rounded-[6px] bg-[var(--accent)] px-2.5 py-[5px] text-[12px] font-medium tracking-tight text-white shadow-[0_1px_2px_rgba(0,0,0,0.25)] transition-[filter,opacity] hover:brightness-110 active:brightness-95 disabled:opacity-45"
        >
          {busy ? <Clock size={12} className="animate-spin" /> : <Play size={11} fill="currentColor" />}
          {busy ? 'Working' : 'Back Up Now'}
        </button>
      </div>
    </div>
  );

  const progressBar = busy && (
    <div className="absolute inset-x-0 top-0 z-40 h-[2px] bg-black/25">
      <motion.div
        className="h-full bg-[var(--accent)]"
        animate={{ width: `${Math.max(4, progress * 100)}%` }}
        transition={{ ease: 'easeOut', duration: 0.2 }}
      />
    </div>
  );

  /* ------------------------------- browse pane ----------------------------- */

  const browsePane = (
    <div ref={browseRef} className="relative h-full w-full overflow-hidden bg-[#01020a]">
      <Starfield />

      <div className="absolute inset-x-0 top-0">{topBar('overlay')}</div>

      {/* Changes inspector */}
      <AnimatePresence>
        {showChanges && selected && diff && (
          <motion.aside
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 18 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="absolute right-3 top-[54px] bottom-[86px] z-20 flex w-[264px] flex-col overflow-hidden rounded-[12px] border border-white/15 bg-black/55 shadow-[0_18px_44px_-14px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
          >
            <header className="flex items-center justify-between border-b border-white/12 px-3 py-2">
              <p className="text-[12px] font-semibold tracking-tight text-white">Changes since this backup</p>
              <button
                type="button"
                onClick={() => setShowChanges(false)}
                aria-label="Close changes"
                className="rounded p-0.5 text-white/50 hover:bg-white/12 hover:text-white"
              >
                <X size={13} />
              </button>
            </header>

            <div className="flex flex-wrap gap-1.5 border-b border-white/10 px-3 py-2.5">
              <DiffChip tone="#30d158" glyph="+" label={`${diff.added.length} added`} />
              <DiffChip tone="#ffd60a" glyph="~" label={`${diff.changed.length} changed`} />
              <DiffChip tone="#ff6961" glyph="−" label={`${diff.removed.length} removed`} />
              {diff.moved.length > 0 && (
                <DiffChip tone="#64d2ff" glyph="↔" label={`${diff.moved.length} moved`} />
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-1.5 py-1.5">
              {[
                { key: 'changed', title: 'Changed', rows: diff.changed, tone: '#ffd60a' },
                { key: 'added', title: 'Added', rows: diff.added, tone: '#30d158' },
                { key: 'removed', title: 'Removed', rows: diff.removed, tone: '#ff6961' },
                { key: 'moved', title: 'Moved', rows: diff.moved, tone: '#64d2ff' },
              ]
                .filter((group) => group.rows.length > 0)
                .map((group) => (
                  <div key={group.key} className="mb-1.5">
                    <p className="px-1.5 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.4px] text-white/35">
                      {group.title}
                    </p>
                    {group.rows.map((row) => (
                      <button
                        key={`${group.key}-${row.id}`}
                        type="button"
                        onClick={() => toggleChecked(row.id)}
                        className="flex w-full items-center gap-1.5 rounded-[5px] px-1.5 py-[3px] text-left transition-colors hover:bg-white/10"
                      >
                        <span
                          className="flex h-[13px] w-[13px] shrink-0 items-center justify-center rounded-[3px] border transition-colors"
                          style={{
                            borderColor: checked.includes(row.id) ? group.tone : 'rgba(255,255,255,0.3)',
                            background: checked.includes(row.id) ? group.tone : 'transparent',
                          }}
                        >
                          {checked.includes(row.id) && <Check size={9} strokeWidth={3.5} color="#0b0b0f" />}
                        </span>
                        {row.type === 'folder' ? (
                          <Folder size={11} className="shrink-0 text-sky-300/80" />
                        ) : (
                          <FileText size={11} className="shrink-0 text-white/40" />
                        )}
                        <span className="min-w-0 flex-1 truncate text-[11px] text-white/80">{row.name}</span>
                        {row.type === 'file' && (
                          <span className="shrink-0 text-[10px] tabular-nums text-white/35">
                            {formatBytes(row.size)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ))}

              {diff.added.length + diff.changed.length + diff.removed.length + diff.moved.length === 0 && (
                <p className="px-2 py-6 text-center text-[11px] italic text-white/35">
                  This backup matches the current volume.
                </p>
              )}
            </div>

            <footer className="border-t border-white/12 px-2.5 py-2">
              <button
                type="button"
                disabled={checked.length === 0 || busy}
                onClick={() => {
                  void restoreItems(selected.id, checked);
                  setChecked([]);
                }}
                className="flex w-full items-center justify-center gap-1.5 rounded-[6px] bg-white/90 px-2 py-1.5 text-[11.5px] font-medium tracking-tight text-neutral-900 transition-[filter,opacity] hover:brightness-95 disabled:opacity-35"
              >
                <RotateCcw size={11} />
                {checked.length ? `Restore ${checked.length} item${checked.length === 1 ? '' : 's'}` : 'Select items to restore'}
              </button>
            </footer>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Tunnel stage */}
      <div className="absolute inset-x-0 top-[52px] bottom-[80px]">
        {snapshots.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3.5 px-8 text-center">
            <TimeMachineIcon size={84} className="opacity-95 drop-shadow-[0_10px_30px_rgba(90,150,255,0.45)]" />
            <div>
              <p className="text-[15px] font-semibold tracking-tight text-white">
                No backups yet
              </p>
              <p className="mx-auto mt-1 max-w-[320px] text-[12px] leading-[1.5] text-white/50">
                Time Machine keeps a copy of this volume on schedule. Create the first one now, or
                wait for the next automatic backup.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleBackUp('First backup')}
              disabled={busy}
              className="rounded-[7px] bg-[var(--accent)] px-4 py-[7px] text-[12.5px] font-medium tracking-tight text-white shadow-[0_2px_10px_rgba(0,122,255,0.4)] transition-[filter,opacity] hover:brightness-110 disabled:opacity-45"
            >
              Back Up Now
            </button>
          </div>
        ) : (
          <Tunnel
            snapshots={snapshots}
            selectedIndex={Math.max(0, selectedIndex)}
            onSelect={(i) => {
              setPane('browse');
              selectIndex(i);
            }}
            reducedMotion={reducedMotion}
          />
        )}
      </div>

      {/* Bottom scrubber bar */}
      <div className="absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-gradient-to-t from-black/75 to-black/25 px-3.5 py-2.5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!selected || isLive || busy}
            onClick={() => selected && setRestoreTarget(selected)}
            title="Restore this backup (⌘R)"
            className="flex shrink-0 items-center gap-1.5 rounded-[7px] bg-[var(--accent)] px-3 py-[6px] text-[12.5px] font-medium tracking-tight text-white shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-[filter,opacity] hover:brightness-110 active:brightness-95 disabled:cursor-default disabled:bg-white/18 disabled:text-white/45 disabled:shadow-none"
          >
            <RotateCcw size={12} />
            Restore
          </button>

          <div className="min-w-0 flex-1">
            {snapshots.length > 0 ? (
              <Timeline
                snapshots={snapshots}
                selectedIndex={Math.max(0, selectedIndex)}
                onSelect={selectIndex}
              />
            ) : (
              <p className="py-3 text-center text-[11px] text-white/35">
                Backups will appear on this timeline.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowChanges((v) => !v)}
            disabled={!selected}
            title="Show what changed since this backup"
            className={`flex shrink-0 items-center gap-1.5 rounded-[7px] border px-2.5 py-[6px] text-[12px] font-medium tracking-tight transition-colors disabled:opacity-30 ${
              showChanges
                ? 'border-white/35 bg-white/20 text-white'
                : 'border-white/20 bg-white/10 text-white/80 hover:bg-white/18'
            }`}
          >
            <List size={12} />
            Changes
          </button>
        </div>
      </div>
    </div>
  );

  /* ------------------------------ snapshots pane ---------------------------- */

  const snapshotsPane = (
    <div className="flex h-full flex-col bg-[var(--window-bg)] text-[var(--window-text)]">
      {topBar('solid')}
      <div className="min-h-0 flex-1 overflow-y-auto px-3.5 py-3">
        {snapshots.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <Archive size={34} className="text-neutral-300 dark:text-neutral-600" />
            <p className="text-[13px] font-semibold tracking-tight">No snapshots stored</p>
            <p className="max-w-[300px] text-[11.5px] leading-[1.5] text-neutral-500 dark:text-neutral-400">
              Backups are captured automatically every {INTERVAL_PRESETS.find((p) => p.minutes === config.intervalMinutes)?.label.toLowerCase() ?? 'hour'}
              {config.enabled ? '.' : ' — automatic backup is currently off.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {[...snapshots]
              .map((snap, i) => ({ snap, i }))
              .reverse()
              .reduce<{ label: string; items: { snap: TimeMachineSnapshot; i: number }[] }[]>(
                (groups, item) => {
                  const label = dayLabel(item.snap.createdAt);
                  const last = groups[groups.length - 1];
                  if (last && last.label === label) last.items.push(item);
                  else groups.push({ label, items: [item] });
                  return groups;
                },
                []
              )
              .map((group) => (
                <section key={group.label}>
                  <h3 className="sticky top-0 z-10 -mx-1 mb-1 bg-[var(--window-bg)]/92 px-1 py-1 text-[11px] font-semibold uppercase tracking-[0.4px] text-neutral-500 backdrop-blur dark:text-neutral-400">
                    {group.label}
                  </h3>
                  <div className="divide-y divide-black/8 overflow-hidden rounded-[10px] border border-black/10 bg-white/55 dark:divide-white/8 dark:border-white/10 dark:bg-white/5">
                    {group.items.map(({ snap, i }) => {
                      const active = i === selectedIndex;
                      return (
                        <div
                          key={snap.id}
                          onClick={() => {
                            selectIndex(i);
                            setPane('browse');
                          }}
                          className={`flex items-center gap-3 px-3 py-2 transition-colors ${
                            active ? 'bg-[var(--accent)]/12' : 'hover:bg-black/5 dark:hover:bg-white/8'
                          }`}
                        >
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{
                              background:
                                snap.reason === 'auto'
                                  ? '#0a84ff'
                                  : snap.reason === 'manual'
                                    ? '#30d158'
                                    : snap.reason === 'pre-restore'
                                      ? '#ff9f0a'
                                      : '#8e8e93',
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12.5px] font-medium tracking-tight text-neutral-800 dark:text-neutral-100">
                              {clockLabel(snap.createdAt)}
                              {i === snapshots.length - 1 && (
                                <span className="ml-1.5 text-[10.5px] font-normal text-neutral-400">
                                  (current)
                                </span>
                              )}
                            </p>
                            <p className="truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                              {snap.fileCount} files · {snap.folderCount} folders · {snap.note}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[11px] tabular-nums text-neutral-500 dark:text-neutral-400">
                              +{formatBytes(incremental[snap.id] ?? 0)}
                            </p>
                            <p className="text-[10px] tabular-nums text-neutral-400 dark:text-neutral-500">
                              {durationLabel(snap.durationMs)}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-0.5">
                            <button
                              type="button"
                              title="Restore this backup"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRestoreTarget(snap);
                              }}
                              className="rounded p-1 text-neutral-500 transition-colors hover:bg-black/8 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/12 dark:hover:text-white"
                            >
                              <RotateCcw size={13} />
                            </button>
                            <button
                              type="button"
                              title="Delete this backup"
                              onClick={(e) => {
                                e.stopPropagation();
                                void deleteSnapshot(snap.id);
                              }}
                              className="rounded p-1 text-neutral-500 transition-colors hover:bg-[#d0342c]/15 hover:text-[#d0342c] dark:text-neutral-400"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
          </div>
        )}
      </div>
    </div>
  );

  /* ------------------------------- options pane ---------------------------- */

  const optionsPane = (
    <div className="flex h-full flex-col bg-[var(--window-bg)] text-[var(--window-text)]">
      {topBar('solid')}
      <div className="min-h-0 flex-1 overflow-y-auto px-3.5 py-3">
        <div className="mx-auto max-w-[560px] space-y-4">
          <Card title="Backup">
            <Field label="Back up automatically" hint="Capture the volume on a schedule">
              <Switch
                checked={config.enabled}
                onChange={(v) => updateConfig({ enabled: v })}
                label="Back up automatically"
              />
            </Field>
            <Field label="Frequency">
              <select
                value={config.intervalMinutes}
                disabled={!config.enabled}
                onChange={(e) => updateConfig({ intervalMinutes: Number(e.target.value) })}
                className="rounded-[6px] border border-black/12 bg-white px-2 py-1 text-[12px] text-neutral-800 shadow-xs outline-none transition-colors focus:border-[var(--accent)] disabled:opacity-40 dark:border-white/15 dark:bg-white/10 dark:text-neutral-100"
              >
                {INTERVAL_PRESETS.map((p) => (
                  <option key={p.minutes} value={p.minutes}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Destination" hint="Backups are stored inside this browser profile">
              <div className="flex items-center gap-1.5 rounded-[6px] border border-black/12 bg-black/4 px-2 py-1 text-[12px] text-neutral-700 dark:border-white/15 dark:bg-white/8 dark:text-neutral-200">
                <HardDrive size={12} className="text-neutral-400" />
                {config.destination}
              </div>
            </Field>
            <Field label="Notify after each backup">
              <Switch
                checked={config.notifyOnBackup}
                onChange={(v) => updateConfig({ notifyOnBackup: v })}
                label="Notify after each backup"
              />
            </Field>
          </Card>

          <Card title="Retention">
            <Field
              label="Maximum backups"
              hint={`Older snapshots are thinned first, then capped (currently ${stats.snapshotCount})`}
            >
              <select
                value={config.maxSnapshots}
                onChange={(e) => updateConfig({ maxSnapshots: Number(e.target.value) })}
                className="rounded-[6px] border border-black/12 bg-white px-2 py-1 text-[12px] text-neutral-800 shadow-xs outline-none transition-colors focus:border-[var(--accent)] dark:border-white/15 dark:bg-white/10 dark:text-neutral-100"
              >
                {[25, 50, 100, 200, 400, 800].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Prune unused storage now" hint="Removes orphaned payloads from deleted backups">
              <button
                type="button"
                onClick={() => setConfirmPrune(true)}
                disabled={stats.snapshotCount === 0 || busy}
                className="rounded-[6px] border border-black/12 bg-white/70 px-2.5 py-1 text-[12px] font-medium tracking-tight text-neutral-800 shadow-xs transition-colors hover:bg-white disabled:opacity-40 dark:border-white/15 dark:bg-white/10 dark:text-neutral-100 dark:hover:bg-white/20"
              >
                Prune
              </button>
            </Field>
          </Card>

          <Card title="Exclude from backup">
            {config.excludedNames.length > 0 ? (
              config.excludedNames.map((name) => (
                <Field key={name} label={name} hint="This folder is skipped in every snapshot">
                  <button
                    type="button"
                    onClick={() =>
                      updateConfig({ excludedNames: config.excludedNames.filter((n) => n !== name) })
                    }
                    className="rounded p-1 text-neutral-500 transition-colors hover:bg-[#d0342c]/12 hover:text-[#d0342c] dark:text-neutral-400"
                    aria-label={`Stop excluding ${name}`}
                  >
                    <X size={13} />
                  </button>
                </Field>
              ))
            ) : (
              <div className="px-3.5 py-2.5 text-[11.5px] text-neutral-500 dark:text-neutral-400">
                Nothing is excluded — every file is captured.
              </div>
            )}
            <Field label="Add exclusion">
              <div className="flex items-center gap-1.5">
                <input
                  value={exclusionDraft}
                  onChange={(e) => setExclusionDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addExclusion();
                    }
                  }}
                  placeholder="Folder name"
                  className="w-[132px] rounded-[6px] border border-black/12 bg-white px-2 py-1 text-[12px] text-neutral-800 shadow-xs outline-none transition-colors focus:border-[var(--accent)] dark:border-white/15 dark:bg-white/10 dark:text-neutral-100"
                />
                <button
                  type="button"
                  onClick={addExclusion}
                  className="rounded-[6px] border border-black/12 bg-white/70 p-1 text-neutral-700 shadow-xs transition-colors hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-neutral-100 dark:hover:bg-white/20"
                  aria-label="Add exclusion"
                >
                  <Plus size={12} />
                </button>
              </div>
            </Field>
          </Card>

          <Card title="Storage">
            <div className="space-y-2 px-3.5 py-3">
              <div className="flex items-baseline justify-between">
                <span className="text-[12px] font-medium tracking-tight text-neutral-800 dark:text-neutral-100">
                  {formatBytes(stats.uniquePayloadBytes)}
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {stats.uniqueBlobCount} unique payloads · {stats.snapshotCount} snapshots
                </span>
              </div>
              <div className="flex h-[7px] overflow-hidden rounded-full bg-black/10 dark:bg-white/12">
                <div className="h-full bg-[var(--accent)]" style={{ width: '100%' }} />
              </div>
              <p className="text-[10.5px] leading-[1.5] text-neutral-500 dark:text-neutral-400">
                Payloads are content-addressed: a file that has not changed is referenced by its
                existing backup instead of being written again.
              </p>
            </div>
            <Field label="Delete all backups" hint="This cannot be undone">
              <button
                type="button"
                onClick={() => setConfirmWipe(true)}
                disabled={stats.snapshotCount === 0}
                className="rounded-[6px] border border-[#d0342c]/35 bg-[#d0342c]/10 px-2.5 py-1 text-[12px] font-medium tracking-tight text-[#d0342c] transition-colors hover:bg-[#d0342c]/18 disabled:opacity-40 dark:text-[#ff6961]"
              >
                Delete All
              </button>
            </Field>
          </Card>

          {lastError && (
            <div className="flex items-start gap-2 rounded-[10px] border border-[#d0342c]/30 bg-[#d0342c]/10 px-3 py-2.5">
              <TriangleAlert size={14} className="mt-px shrink-0 text-[#d0342c] dark:text-[#ff6961]" />
              <p className="text-[11.5px] leading-[1.5] text-[#d0342c] dark:text-[#ff6961]">{lastError}</p>
            </div>
          )}

          <p className="flex items-center justify-center gap-1.5 pb-2 text-[10.5px] text-neutral-400 dark:text-neutral-500">
            <ShieldCheck size={11} />
            Backups live only in this browser · no data leaves your device
          </p>
        </div>
      </div>
    </div>
  );

  /* --------------------------------- render -------------------------------- */

  return (
    <div className="relative h-full w-full overflow-hidden">
      {progressBar}
      {!isLoaded ? (
        <div className="flex h-full items-center justify-center text-[11.5px] text-neutral-400">
          Reading local snapshots…
        </div>
      ) : pane === 'browse' ? (
        browsePane
      ) : pane === 'snapshots' ? (
        snapshotsPane
      ) : (
        optionsPane
      )}

      {/* Restore confirmation */}
      <AnimatePresence>
        {restoreTarget && (
          <Alert
            title={`Restore from ${dayLabel(restoreTarget.createdAt)} at ${clockLabel(restoreTarget.createdAt)}?`}
            message={
              <>
                Every file will be returned to the state captured in this backup. Anything created or
                changed since then will be replaced. A safety backup of the current volume is taken
                first.
              </>
            }
            confirmLabel="Restore"
            onCancel={() => setRestoreTarget(null)}
            onConfirm={() => {
              setRestoreTarget(null);
              handleRestore(restoreTarget);
            }}
          />
        )}
      </AnimatePresence>

      {/* Delete-all confirmation */}
      <AnimatePresence>
        {confirmWipe && (
          <Alert
            title="Delete all backups?"
            message="Every snapshot and its stored payloads will be permanently removed. The files on this volume are not affected."
            confirmLabel="Delete All"
            destructive
            onCancel={() => setConfirmWipe(false)}
            onConfirm={() => {
              setConfirmWipe(false);
              void deleteAllSnapshots();
            }}
          />
        )}
      </AnimatePresence>

      {/* Prune confirmation */}
      <AnimatePresence>
        {confirmPrune && (
          <Alert
            title="Prune unused storage?"
            message="Payloads that are no longer referenced by any backup will be removed. Snapshots themselves are kept."
            confirmLabel="Prune"
            onCancel={() => setConfirmPrune(false)}
            onConfirm={() => {
              setConfirmPrune(false);
              void pruneStorage();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const formatCountdown = (ms: number): string => {
  const total = Math.round(ms / 1000);
  if (total < 60) return `${total}s`;
  const mins = Math.floor(total / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
};

export default TimeMachineApp;
