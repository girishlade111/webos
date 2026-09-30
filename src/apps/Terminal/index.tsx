import React, { useState, useRef, useEffect } from 'react';
import { useFSStore, ROOT_ID, USER_HOME_ID } from '../../core/fsStore';
import { useProcessStore } from '../../core/processStore';
import { useThemeStore } from '../../core/themeStore';
import { sound } from '../../core/sound';

type TermTheme = 'default' | 'matrix' | 'amber' | 'cobalt';

const THEMES: Record<TermTheme, { bg: string; text: string; prompt: string; cursor: string }> = {
  default: { bg: '#18181b', text: '#f4f4f5', prompt: '#22c55e', cursor: '#38bdf8' },
  matrix: { bg: '#051105', text: '#4ade80', prompt: '#22c55e', cursor: '#4ade80' },
  amber: { bg: '#140c02', text: '#fbbf24', prompt: '#f59e0b', cursor: '#fbbf24' },
  cobalt: { bg: '#0b192c', text: '#93c5fd', prompt: '#38bdf8', cursor: '#60a5fa' },
};

export const TerminalApp: React.FC<{ windowId: string }> = () => {
  const [theme, setTheme] = useState<TermTheme>('default');
  const [currentFolderId, setCurrentFolderId] = useState<string>(USER_HOME_ID);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [inputVal, setInputVal] = useState<string>('');
  const [lines, setLines] = useState<Array<{ type: 'input' | 'output' | 'error'; text: string }>>([
    { type: 'output', text: 'WebOS Terminal v1.0.4 (x86_64-apple-darwin23)' },
    { type: 'output', text: 'Type "help" for a list of commands, or "neofetch" for system specs.\n' },
  ]);

  const { nodes, getChildren, createFolder, createFile, moveToTrash, getNodePath } = useFSStore();
  const { openWindow } = useProcessStore();
  const { username } = useThemeStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.scrollTo(0, containerRef.current.scrollHeight);
  }, [lines]);

  const currentFolder = nodes[currentFolderId] || nodes[ROOT_ID];
  const currentPath = getNodePath(currentFolderId);

  const executeCommand = (cmdStr: string) => {
    const raw = cmdStr.trim();
    if (!raw) return;

    // Add to history
    setHistory((prev) => [...prev, raw]);
    setHistoryIdx(-1);

    const parts = raw.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    const newLines: Array<{ type: 'input' | 'output' | 'error'; text: string }> = [
      { type: 'input', text: `alex@webos:${currentPath}$ ${raw}` },
    ];

    switch (cmd) {
      case 'help':
        newLines.push({
          type: 'output',
          text: `Available commands:
  ls [-l]          List directory contents
  cd <dir>         Change working directory
  pwd              Print working directory path
  cat <file>       Display content of a file
  mkdir <name>     Create a new folder
  touch <name>     Create an empty file
  rm <name>        Move file/folder to Trash
  echo <text>      Print text to standard output
  calc <expr>      Evaluate a math expression (e.g. calc 24 * 7)
  neofetch         Display system information and logo
  open <app>       Launch an app (finder, browser, notes, etc.)
  theme <name>     Switch theme (default, matrix, amber, cobalt)
  clear            Clear terminal screen
  whoami           Display current user
  date             Print current date & time`,
        });
        break;

      case 'clear':
        setLines([]);
        setInputVal('');
        return;

      case 'whoami':
        newLines.push({ type: 'output', text: 'alex' });
        break;

      case 'date':
        newLines.push({ type: 'output', text: new Date().toString() });
        break;

      case 'pwd':
        newLines.push({ type: 'output', text: currentPath });
        break;

      case 'ls': {
        const children = getChildren(currentFolderId);
        if (children.length === 0) {
          newLines.push({ type: 'output', text: '(empty directory)' });
        } else {
          const isLong = args.includes('-l') || args.includes('-la');
          if (isLong) {
            const listText = children
              .map((c) => {
                const typeCode = c.type === 'folder' ? 'drwxr-xr-x' : '-rw-r--r--';
                const sizeStr = `${c.size}B`.padStart(8);
                const dateStr = new Date(c.modifiedAt).toLocaleDateString();
                return `${typeCode}  alex staff  ${sizeStr}  ${dateStr}  ${c.name}${c.type === 'folder' ? '/' : ''}`;
              })
              .join('\n');
            newLines.push({ type: 'output', text: listText });
          } else {
            const listText = children.map((c) => (c.type === 'folder' ? `${c.name}/` : c.name)).join('   ');
            newLines.push({ type: 'output', text: listText });
          }
        }
        break;
      }

      case 'cd': {
        const target = args[0];
        if (!target || target === '~') {
          setCurrentFolderId(USER_HOME_ID);
        } else if (target === '..') {
          if (currentFolder.parentId) {
            setCurrentFolderId(currentFolder.parentId);
          }
        } else if (target === '/') {
          setCurrentFolderId(ROOT_ID);
        } else {
          const children = getChildren(currentFolderId);
          const found = children.find(
            (c) => c.type === 'folder' && c.name.toLowerCase() === target.toLowerCase().replace('/', '')
          );
          if (found) {
            setCurrentFolderId(found.id);
          } else {
            newLines.push({ type: 'error', text: `cd: no such file or directory: ${target}` });
          }
        }
        break;
      }

      case 'cat': {
        const target = args[0];
        if (!target) {
          newLines.push({ type: 'error', text: 'cat: missing file operand' });
        } else {
          const children = getChildren(currentFolderId);
          const found = children.find((c) => c.name.toLowerCase() === target.toLowerCase());
          if (found) {
            if (found.type === 'folder') {
              newLines.push({ type: 'error', text: `cat: ${target}: Is a directory` });
            } else {
              newLines.push({ type: 'output', text: found.content || '(empty file)' });
            }
          } else {
            newLines.push({ type: 'error', text: `cat: ${target}: No such file or directory` });
          }
        }
        break;
      }

      case 'mkdir': {
        const folderName = args.join(' ');
        if (!folderName) {
          newLines.push({ type: 'error', text: 'mkdir: missing operand' });
        } else {
          createFolder(folderName, currentFolderId);
          newLines.push({ type: 'output', text: `Created directory: ${folderName}` });
        }
        break;
      }

      case 'touch': {
        const fileName = args.join(' ');
        if (!fileName) {
          newLines.push({ type: 'error', text: 'touch: missing file operand' });
        } else {
          createFile(fileName, currentFolderId, '');
          newLines.push({ type: 'output', text: `Created file: ${fileName}` });
        }
        break;
      }

      case 'rm': {
        const target = args.filter((a) => !a.startsWith('-')).join(' ');
        if (!target) {
          newLines.push({ type: 'error', text: 'rm: missing operand' });
        } else {
          const children = getChildren(currentFolderId);
          const found = children.find((c) => c.name.toLowerCase() === target.toLowerCase());
          if (found) {
            if (found.isProtected) {
              newLines.push({ type: 'error', text: `rm: ${target}: Operation not permitted (system file)` });
            } else {
              moveToTrash(found.id);
              newLines.push({ type: 'output', text: `Moved to trash: ${target}` });
            }
          } else {
            newLines.push({ type: 'error', text: `rm: ${target}: No such file or directory` });
          }
        }
        break;
      }

      case 'echo':
        newLines.push({ type: 'output', text: args.join(' ') });
        break;

      case 'calc': {
        const expr = args.join(' ');
        if (!expr) {
          newLines.push({ type: 'error', text: 'calc: please provide an arithmetic expression' });
        } else {
          try {
            // Safe arithmetic evaluation using Function
            const sanitized = expr.replace(/[^0-9+\-*/().\s]/g, '');
            // eslint-disable-next-line no-new-func
            const result = new Function(`return (${sanitized})`)();
            newLines.push({ type: 'output', text: `${result}` });
          } catch {
            newLines.push({ type: 'error', text: `calc: invalid math expression: ${expr}` });
          }
        }
        break;
      }

      case 'open': {
        const target = args[0]?.toLowerCase();
        if (!target) {
          newLines.push({ type: 'error', text: 'open: specify app name (e.g. open notes, open browser)' });
        } else {
          const appMap: Record<string, string> = {
            finder: 'finder',
            browser: 'browser',
            safari: 'browser',
            web: 'browser',
            terminal: 'terminal',
            notes: 'notes',
            textedit: 'textedit',
            calc: 'calculator',
            calculator: 'calculator',
            calendar: 'calendar',
            photos: 'photos',
            music: 'music',
            weather: 'weather',
            settings: 'settings',
            activity: 'activity_monitor',
            activitymonitor: 'activity_monitor',
            clock: 'clock',
            reminders: 'reminders',
            photobooth: 'photobooth',
            camera: 'photobooth',
            diskutility: 'diskutility',
            disk: 'diskutility',
            stickies: 'stickies',
          };
          const appId = appMap[target];
          if (appId) {
            openWindow(appId);
            newLines.push({ type: 'output', text: `Launched ${target}...` });
          } else {
            newLines.push({ type: 'error', text: `open: unknown app "${target}"` });
          }
        }
        break;
      }

      case 'theme': {
        const t = args[0]?.toLowerCase() as TermTheme;
        if (t && THEMES[t]) {
          setTheme(t);
          newLines.push({ type: 'output', text: `Terminal theme switched to "${t}".` });
        } else {
          newLines.push({ type: 'error', text: `Available themes: default, matrix, amber, cobalt` });
        }
        break;
      }

      case 'neofetch':
        newLines.push({
          type: 'output',
          text: `
       .----------------.       ${(username || 'ladestack').toLowerCase()}@webos
      /  .-.        .-.  \\      --------------
     |  /   \\      /   \\  |     OS: WebOS 1.0.4 Darwin
     | |  0  |====|  0  | |     Host: Browser Engine (V8/Blink)
     |  \\   /      \\   /  |     Kernel: 23.4.0 Virtual
      \\  \`-'        \`-'  /      Uptime: 24 mins
       '----------------'       Shell: websh 1.2
                                Terminal: xterm-react
                                Resolution: ${window.innerWidth}x${window.innerHeight}
                                Memory: 16384MB / 32768MB
                                CPU: Virtual Apple Silicon 12-Core
                                GPU: WebGL Hardware Accelerated
`,
        });
        break;

      default:
        newLines.push({
          type: 'error',
          text: `websh: command not found: ${cmd}. Type "help" for a list of commands.`,
        });
        sound.playError();
        break;
    }

    setLines((prev) => [...prev, ...newLines]);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx !== -1) {
        if (historyIdx < history.length - 1) {
          const nextIdx = historyIdx + 1;
          setHistoryIdx(nextIdx);
          setInputVal(history[nextIdx]);
        } else {
          setHistoryIdx(-1);
          setInputVal('');
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Auto complete children files
      const parts = inputVal.split(' ');
      const last = parts[parts.length - 1];
      if (last) {
        const children = getChildren(currentFolderId);
        const match = children.find((c) => c.name.toLowerCase().startsWith(last.toLowerCase()));
        if (match) {
          parts[parts.length - 1] = match.name;
          setInputVal(parts.join(' '));
        }
      }
    }
  };

  const curTheme = THEMES[theme];

  return (
    <div
      ref={containerRef}
      onClick={() => inputRef.current?.focus()}
      style={{ backgroundColor: curTheme.bg, color: curTheme.text }}
      className="h-full w-full overflow-y-auto p-4 font-mono text-xs leading-relaxed selection:bg-blue-500/30 cursor-text select-text"
    >
      {lines.map((l, i) => (
        <div
          key={i}
          className={`whitespace-pre-wrap ${
            l.type === 'error' ? 'text-red-400' : l.type === 'input' ? 'font-semibold opacity-90' : 'opacity-85'
          }`}
        >
          {l.text}
        </div>
      ))}

      {/* Active prompt row */}
      <div className="flex items-center gap-2 pt-1">
        <span style={{ color: curTheme.prompt }} className="font-semibold shrink-0">
          {(username || 'ladestack').toLowerCase()}@webos:{currentPath}$
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="flex-1 bg-transparent outline-none font-mono text-xs border-none p-0"
          style={{ color: curTheme.text }}
        />
      </div>
    </div>
  );
};
