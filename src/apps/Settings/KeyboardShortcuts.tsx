import React, { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import {
  SHORTCUT_GROUPS,
  ShortcutDef,
  chordFromEvent,
  formatChordParts,
  isModifierKey,
  serializeChord,
  useShortcutStore,
} from '../../core/shortcutStore';
import { buildShortcuts } from '../../shell/ShortcutManager';
import { sound } from '../../core/sound';

/** Renders one chord as macOS does: modifier glyphs, then a key cap. */
export const ChordDisplay: React.FC<{ chord: string }> = ({ chord }) => {
  const parts = formatChordParts(chord);
  if (parts.length === 0) return null;

  return (
    <span className="kb-glyph flex items-center gap-[3px] text-[13px] text-neutral-500 dark:text-neutral-400">
      {parts.map((p, i) =>
        i === parts.length - 1 ? (
          <span key={i} className="kb-cap">
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </span>
  );
};

/**
 * Keyboard Shortcuts pane.
 *
 * Mirrors System Settings → Keyboard → Keyboard Shortcuts: a sidebar of
 * categories, and a list of bindings with the chord right-aligned. Clicking a
 * row arms a recorder, exactly like the real pane — press a combination and it
 * rebinds.
 */
export const KeyboardShortcutsPane: React.FC = () => {
  const allShortcuts = useMemo(buildShortcuts, []);
  const overrides = useShortcutStore((s) => s.overrides);
  const setOverride = useShortcutStore((s) => s.setOverride);
  const recordingId = useShortcutStore((s) => s.recordingId);
  const setRecordingId = useShortcutStore((s) => s.setRecordingId);

  const [activeGroup, setActiveGroup] = useState<string>(SHORTCUT_GROUPS[0]);
  const [search, setSearch] = useState<string>('');
  /** Live preview of the chord currently held down during a recording. */
  const [preview, setPreview] = useState<string>('');

  /* Resolve each binding against the user's rebinds, and drop the helper keys
     from `pressed` so a live recording can show what has been captured. */
  const resolved: (ShortcutDef & { chord: string; isCustom: boolean })[] = useMemo(
    () =>
      allShortcuts.map((def) => ({
        ...def,
        chord: overrides[def.id] ?? def.chord,
        isCustom: Boolean(overrides[def.id]),
      })),
    [allShortcuts, overrides],
  );

  const groups = useMemo(() => {
    const seen = new Set<string>();
    resolved.forEach((s) => seen.add(s.group));
    // Preserve the declared macOS ordering, then append any custom groups.
    const ordered = SHORTCUT_GROUPS.filter((g) => seen.has(g));
    Array.from(seen).forEach((g) => {
      if (!ordered.includes(g as (typeof SHORTCUT_GROUPS)[number])) ordered.push(g);
    });
    return ordered;
  }, [resolved]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return resolved
      .filter((s) => (term ? s.label.toLowerCase().includes(term) || s.description.toLowerCase().includes(term) : true))
      .filter((s) => (search.trim() ? true : s.group === activeGroup));
  }, [resolved, search, activeGroup]);

  /* Recording listens on the window, not the row: the recorder must work even
     when focus is still in the search field. The manager stands down for the
     duration (see its `recordingId` guard), so nothing else competes. */
  useEffect(() => {
    if (!recordingId) {
      setPreview('');
      return;
    }

    const commit = (serialized: string) => {
      const conflict = resolved.find((s) => s.chord === serialized && s.id !== recordingId);
      if (conflict) {
        sound.playError();
      } else {
        sound.playClick();
        setOverride(recordingId, serialized);
      }
      setRecordingId(null);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        sound.playClick();
        setRecordingId(null);
        return;
      }

      // Bare modifiers only update the live preview.
      if (isModifierKey(e.key)) {
        setPreview(
          serializeChord({
            mods: [
              ...(e.metaKey || e.ctrlKey ? (['cmd'] as const) : []),
              ...(e.altKey ? (['alt'] as const) : []),
              ...(e.shiftKey ? (['shift'] as const) : []),
            ],
            key: '…',
          }).replace('+…', '…'),
        );
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const chord = chordFromEvent(e);
      if (!chord) return;

      // macOS requires a modifier on a custom binding; a bare key would swallow
      // ordinary typing across the whole system.
      if (chord.mods.length === 0) {
        sound.playError();
        return;
      }

      commit(serializeChord(chord));
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [recordingId, resolved, setOverride, setRecordingId]);

  const handleReset = () => {
    sound.playClick();
    resolved.forEach((s) => {
      if (s.isCustom) setOverride(s.id, null);
    });
  };

  const customCount = resolved.filter((s) => s.isCustom).length;

  return (
    <div className="flex h-full min-h-0">
      {/* Category list */}
      <div className="w-44 shrink-0 overflow-y-auto border-r border-black/10 pr-2 dark:border-white/10">
        {groups.map((g) => {
          const isActive = g === activeGroup;
          const count = resolved.filter((s) => s.group === g).length;
          return (
            <button
              key={g}
              onClick={() => {
                sound.playClick();
                setActiveGroup(g);
              }}
              className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition-colors ${
                isActive
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-neutral-700 hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10'
              }`}
            >
              <span className="truncate pr-1">{g}</span>
              <span className={`text-[10px] ${isActive ? 'text-white/70' : 'text-neutral-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Binding list */}
      <div className="flex min-w-0 flex-1 flex-col pl-4">
        {/* Search */}
        <div className="mb-2 flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-black/10 bg-white/60 px-2 py-1 dark:border-white/10 dark:bg-white/10">
            <Search size={12} className="shrink-0 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shortcuts"
              className="min-w-0 flex-1 bg-transparent text-xs text-neutral-700 outline-none placeholder:text-neutral-400 dark:text-neutral-200"
            />
          </div>
          {customCount > 0 && (
            <button
              onClick={handleReset}
              title="Reset all to defaults"
              className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-neutral-500 hover:bg-black/5 hover:text-[var(--accent)] dark:text-neutral-400 dark:hover:bg-white/10"
            >
              <RotateCcw size={11} />
              Reset
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {visible.length === 0 ? (
            <p className="py-6 text-center text-xs text-neutral-400">No shortcuts found</p>
          ) : (
            visible.map((s) => {
              const isRecording = recordingId === s.id;
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 border-b border-black/5 py-1.5 last:border-0 dark:border-white/5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-800 dark:text-neutral-100">
                      {s.label}
                      {s.isCustom && (
                        <span className="rounded bg-[var(--accent)]/15 px-1 py-px text-[9px] font-semibold text-[var(--accent)]">
                          Custom
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[10px] text-neutral-400">{s.description}</p>
                  </div>

                  {/* Chord / recorder */}
                  {isRecording ? (
                    <div className="kb-hint flex shrink-0 items-center rounded-md border border-[var(--accent)] bg-[var(--accent)]/10 px-2 py-1">
                      {preview ? (
                        <ChordDisplay chord={preview} />
                      ) : (
                        <span className="text-[10px] font-medium text-[var(--accent)]">
                          Press keys…
                        </span>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        sound.playClick();
                        setRecordingId(s.id);
                      }}
                      title="Click to change shortcut"
                      className="shrink-0 rounded-md px-1.5 py-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      <ChordDisplay chord={s.chord} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {recordingId && (
          <p className="mt-2 shrink-0 text-[10px] text-neutral-400">
            Press a combination including ⌘, ⇧, ⌥, or ⌃. Press esc to cancel.
          </p>
        )}
      </div>
    </div>
  );
};

/** Small preview used elsewhere in the UI. */
export const ShortcutLegend: React.FC<{ chord: string }> = ({ chord }) => <ChordDisplay chord={chord} />;

export { MODIFIER_GLYPH, Check, Keyboard, parseChord };