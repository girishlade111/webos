import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronRight } from 'lucide-react';

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

export interface MenuAction {
  kind: 'item';
  /** Shortcut hint rendered right-aligned, e.g. "⇧⌘N". Omit for none. */
  shortcut?: string;
  /** Renders a leading glyph and drops the reserved checkmark gutter. */
  icon?: React.ReactNode;
  checked?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export interface MenuSeparator {
  kind: 'sep';
}

export interface MenuSubmenu {
  kind: 'submenu';
  icon?: React.ReactNode;
  children: MenuNode[];
}

export type MenuLeaf = (MenuAction & { label: string }) | MenuSeparator | (MenuSubmenu & { label: string });

export type MenuNode = MenuLeaf;

const isSubmenu = (n: MenuNode): n is MenuSubmenu & { label: string } => n.kind === 'submenu';

/* ------------------------------------------------------------------ *
 * AppKit metrics — kept here so positioning math matches the CSS above
 * ------------------------------------------------------------------ */

/** Viewport breathing room when flipping a menu back on-screen. */
const EDGE = 8;
/** Hover-out grace period before a submenu collapses, matching AppKit. */
const SUBMENU_CLOSE_DELAY = 220;

export interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuNode[];
  onClose: () => void;
  /** Minimum panel width in px. Defaults to AppKit's ~178pt minimum. */
  minWidth?: number;
}

/* ------------------------------------------------------------------ *
 * Root component
 * ------------------------------------------------------------------ */

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  items,
  onClose,
  minWidth = 178,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  /** Open submenu indices, one per nesting level. */
  const [openPath, setOpenPath] = useState<number[]>([]);
  /** Keyboard-highlighted row, one per nesting level. */
  const [actives, setActives] = useState<number[]>([-1]);

  const [placement, setPlacement] = useState({
    left: x,
    top: y,
    transformOrigin: 'top left',
  });

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleCloseAll = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setOpenPath([]);
      setActives([]);
    }, SUBMENU_CLOSE_DELAY);
  }, [clearCloseTimer]);

  /* Reset transient state whenever a new menu is opened at a new spot. */
  useEffect(() => {
    setOpenPath([]);
    setActives([-1]);
  }, [x, y]);

  /* Position the panel, flipping it back inside the viewport when needed. */
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = el.offsetWidth;
    const h = el.offsetHeight;

    let left = x;
    let top = y;
    let origin: string = 'top left';

    if (w > 0 && x + w > vw - EDGE) {
      left = Math.max(EDGE, x - w);
      origin = 'top right';
    }

    if (h > 0 && y + h > vh - EDGE) {
      top = Math.max(EDGE, y - h);
      origin = origin === 'top right' ? 'bottom right' : 'bottom left';
    }

    /* Menus taller than the viewport pin to the top instead of flipping. */
    if (h > vh - EDGE * 2) {
      top = EDGE;
      origin = origin.endsWith('right') ? 'top right' : 'top left';
    }

    setPlacement({ left, top, transformOrigin: origin });
  }, [x, y, items]);

  /* Flip submenus horizontally / nudge them vertically into the viewport. */
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    root.querySelectorAll<HTMLElement>('[data-menu-sub]').forEach((panel) => {
      panel.style.left = '';
      panel.style.right = '';
      panel.style.top = '';

      const rect = panel.getBoundingClientRect();
      const hostRect = (panel.parentElement as HTMLElement)?.getBoundingClientRect();

      if (rect.right > vw - EDGE) {
        panel.style.left = 'auto';
        panel.style.right = 'calc(100% + 5px)';
      }

      /* Nudge vertically with `top` — a transform would be clobbered by the
         entrance keyframes, which hold `transform: scale(1)` via fill-mode. */
      const after = panel.getBoundingClientRect();
      if (hostRect && after.bottom > vh - EDGE) {
        const shift = Math.min(after.bottom - (vh - EDGE), Math.max(0, after.top - hostRect.top));
        panel.style.top = `${-Math.round(shift)}px`;
      }
    });
  }, [openPath, placement.left, placement.top]);

  /* Dismiss on outside press, Escape, scroll, or window blur. */
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    const handleDismiss = () => onClose();

    window.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('blur', handleDismiss);
    window.addEventListener('resize', handleDismiss);
    window.addEventListener('wheel', handleDismiss, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('blur', handleDismiss);
      window.removeEventListener('resize', handleDismiss);
      window.removeEventListener('wheel', handleDismiss);
      clearCloseTimer();
    };
  }, [onClose, clearCloseTimer]);

  /* Keyboard navigation across the whole open tree. */
  const navigate = useCallback(
    (delta: number) => {
      setActives((prev) => {
        const next = [...prev];
        const level = Math.max(0, next.length - 1);
        const siblings = itemsAtLevel(items, openPath.slice(0, level));
        if (siblings.length === 0) return prev;
        const current = next[level];
        let cursor = current;
        for (let step = 0; step < siblings.length; step++) {
          cursor = (cursor + delta + siblings.length * 2) % siblings.length;
          const candidate = siblings[cursor];
          if (candidate.kind === 'item' && !candidate.disabled) break;
        }
        next[level] = cursor;
        return next;
      });
    },
    [items, openPath]
  );

  const activateAt = useCallback(
    (level: number, index: number) => {
      const siblings = itemsAtLevel(items, openPath.slice(0, level));
      const target = siblings[index];
      if (!target) return;

      if (isSubmenu(target)) {
        setOpenPath((p) => [...p.slice(0, level), index]);
        setActives((a) => [...a.slice(0, level), 0]);
        return;
      }

      if (target.kind !== 'item' || target.disabled) return;
      onClose();
      target.onSelect();
    },
    [items, openPath, onClose]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const level = Math.max(0, openPath.length);
    const current = actives[level] ?? -1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        navigate(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        navigate(-1);
        break;
      case 'Home':
        e.preventDefault();
        setActives((a) => {
          const next = [...a];
          next[level] = firstEnabled(itemsAtLevel(items, openPath.slice(0, level)));
          return next;
        });
        break;
      case 'End':
        e.preventDefault();
        setActives((a) => {
          const next = [...a];
          next[level] = lastEnabled(itemsAtLevel(items, openPath.slice(0, level)));
          return next;
        });
        break;
      case 'ArrowRight':
        if (current >= 0) {
          const siblings = itemsAtLevel(items, openPath.slice(0, level));
          if (siblings[current] && isSubmenu(siblings[current])) {
            e.preventDefault();
            activateAt(level, current);
          }
        }
        break;
      case 'ArrowLeft':
        if (openPath.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          setOpenPath((p) => p.slice(0, -1));
          setActives((a) => (a.length > 1 ? a.slice(0, -1) : a));
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (current >= 0) activateAt(level, current);
        break;
      default:
        break;
    }
  };

  /** Hovering a row at `level` focuses it; submenus expand in place. */
  const handleRowEnter = (level: number, index: number, hasChildren: boolean) => {
    clearCloseTimer();
    setActives((a) => {
      const next = a.slice(0, level + 1);
      next[level] = index;
      return next;
    });
    setOpenPath((p) => (hasChildren ? [...p.slice(0, level), index] : p.slice(0, level)));
  };

  const renderPanel = (nodes: MenuNode[], level: number): React.ReactNode => {
    const openIndex = level < openPath.length ? openPath[level] : -1;
    const activeIndex = actives[level] ?? -1;

    return (
      <div className="macos-menu-panel" role="menu">
        {nodes.map((node, index) => {
          if (node.kind === 'sep') {
            return <div key={`sep-${level}-${index}`} className="macos-menu-sep" role="separator" />;
          }

          const highlighted = activeIndex === index;
          const hasIcon = Boolean(node.icon);

          if (isSubmenu(node)) {
            const expanded = openIndex === index;
            return (
              <div key={`sub-${level}-${index}`} style={{ position: 'relative' }}>
                <button
                  type="button"
                  role="menuitem"
                  aria-haspopup="true"
                  aria-expanded={expanded}
                  data-highlighted={highlighted}
                  className={`macos-menu-item${hasIcon ? ' macos-menu-item--icon' : ''}`}
                  onPointerEnter={() => handleRowEnter(level, index, true)}
                >
                  {hasIcon && <span className="macos-menu-icon">{node.icon}</span>}
                  <span className="macos-menu-label">{node.label}</span>
                  <ChevronRight size={13} strokeWidth={2.25} className="opacity-45 shrink-0" />
                </button>
                {expanded && (
                  <div
                    data-menu-sub
                    className="macos-menu macos-menu-sub"
                    style={{ minWidth: `${minWidth - 20}px` }}
                  >
                    {renderPanel(node.children, level + 1)}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={`item-${level}-${index}`}
              type="button"
              role="menuitem"
              data-highlighted={highlighted}
              data-disabled={node.disabled || undefined}
              data-destructive={node.destructive || undefined}
              className={`macos-menu-item${hasIcon ? ' macos-menu-item--icon' : ''}`}
              onPointerEnter={() => handleRowEnter(level, index, false)}
              onClick={() => {
                if (node.disabled) return;
                onClose();
                node.onSelect();
              }}
            >
              {!hasIcon && (
                <span className="macos-menu-check">
                  {node.checked && <Check size={13} strokeWidth={2.6} />}
                </span>
              )}
              {hasIcon && <span className="macos-menu-icon">{node.icon}</span>}
              <span className="macos-menu-label">{node.label}</span>
              {node.shortcut && <span className="macos-menu-shortcut">{node.shortcut}</span>}
            </button>
          );
        })}
      </div>
    );
  };

  const content = (
    <div
      ref={rootRef}
      role="menu"
      className="macos-menu"
      style={{
        left: `${placement.left}px`,
        top: `${placement.top}px`,
        minWidth: `${minWidth}px`,
        transformOrigin: placement.transformOrigin,
      }}
      onPointerEnter={clearCloseTimer}
      onPointerLeave={scheduleCloseAll}
      onKeyDown={handleKeyDown}
    >
      {renderPanel(items, 0)}
    </div>
  );

  return typeof document === 'undefined' ? content : createPortal(content, document.body);
};

/* ------------------------------------------------------------------ *
 * Hook: open/close state + dismissal for right-click targets
 * ------------------------------------------------------------------ */

export interface ContextMenuAnchor {
  x: number;
  y: number;
}

export interface ContextMenuController {
  anchor: ContextMenuAnchor | null;
  isOpen: boolean;
  /** Call from an element's `onContextMenu` after `preventDefault()`. */
  open: (e: { clientX: number; clientY: number }) => void;
  close: () => void;
  toggle: (e: { clientX: number; clientY: number }) => void;
}

export function useContextMenu(): ContextMenuController {
  const [anchor, setAnchor] = useState<ContextMenuAnchor | null>(null);

  const open = useCallback((e: { clientX: number; clientY: number }) => {
    setAnchor({ x: e.clientX, y: e.clientY });
  }, []);

  const close = useCallback(() => setAnchor(null), []);

  const toggle = useCallback((e: { clientX: number; clientY: number }) => {
    setAnchor((prev) => (prev ? null : { x: e.clientX, y: e.clientY }));
  }, []);

  return useMemo(
    () => ({ anchor, isOpen: anchor !== null, open, close, toggle }),
    [anchor, open, close, toggle]
  );
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

/** Resolve the item list for a nesting path by walking `children` chains. */
function itemsAtLevel(root: MenuNode[], path: number[]): MenuNode[] {
  let level = root;
  for (const index of path) {
    const node = level[index];
    if (!node || !isSubmenu(node)) return [];
    level = node.children;
  }
  return level;
}

function firstEnabled(nodes: MenuNode[]): number {
  return nodes.findIndex((n) => n.kind === 'item' && !n.disabled);
}

function lastEnabled(nodes: MenuNode[]): number {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    if (n.kind === 'item' && !n.disabled) return i;
  }
  return -1;
}

/* ------------------------------------------------------------------ *
 * Convenience constructors — keep call sites terse and type-safe
 * ------------------------------------------------------------------ */

export const menuItem = (
  label: string,
  onSelect: () => void,
  extra: Partial<Omit<MenuAction, 'kind' | 'onSelect'>> = {}
): MenuNode => ({ kind: 'item', label, onSelect, ...extra });

export const menuSubmenu = (
  label: string,
  children: MenuNode[],
  extra: Partial<Omit<MenuSubmenu, 'kind' | 'children'>> = {}
): MenuNode => ({ kind: 'submenu', label, children, ...extra });

export const menuSeparator = (): MenuNode => ({ kind: 'sep' });
