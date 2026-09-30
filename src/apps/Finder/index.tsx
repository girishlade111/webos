import React, { useState, useMemo } from 'react';
import { 
  Folder, FileText, Image as ImageIcon, Music, Trash2, HardDrive, 
  ChevronRight, ChevronLeft, LayoutGrid, List, Search, Plus, 
  Trash, ArrowUpDown, Eye, Download, Upload, Info
} from 'lucide-react';
import { useFSStore, DESKTOP_ID, DOCUMENTS_ID, DOWNLOADS_ID, PICTURES_ID, MUSIC_ID, ROOT_ID, TRASH_ID } from '../../core/fsStore';
import { useProcessStore } from '../../core/processStore';
import { FSNode } from '../../types/os';
import { sound } from '../../core/sound';

export const FinderApp: React.FC<{ windowId: string; initialParams?: any }> = ({ initialParams }) => {
  const [currentFolderId, setCurrentFolderId] = useState<string>(initialParams?.folderId || DESKTOP_ID);
  const [history, setHistory] = useState<string[]>([initialParams?.folderId || DESKTOP_ID]);
  const [historyIdx, setHistoryIdx] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickLookNode, setQuickLookNode] = useState<FSNode | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState<string>('');
  const [infoNode, setInfoNode] = useState<FSNode | null>(null);

  const { nodes, getChildren, createFolder, createFile, moveToTrash, emptyTrash, renameNode, exportFile, importFile } = useFSStore();
  const { openWindow } = useProcessStore();

  const currentFolder = nodes[currentFolderId] || nodes[DESKTOP_ID];

  // Navigate folder with history
  const navigateTo = (folderId: string) => {
    if (folderId === currentFolderId) return;
    const newHist = history.slice(0, historyIdx + 1);
    newHist.push(folderId);
    setHistory(newHist);
    setHistoryIdx(newHist.length - 1);
    setCurrentFolderId(folderId);
  };

  const goBack = () => {
    if (historyIdx > 0) {
      setHistoryIdx(historyIdx - 1);
      setCurrentFolderId(history[historyIdx - 1]);
    }
  };

  const goForward = () => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx(historyIdx + 1);
      setCurrentFolderId(history[historyIdx + 1]);
    }
  };

  // Filter items in current directory
  const items = useMemo(() => {
    const raw = getChildren(currentFolderId);
    if (!searchQuery.trim()) return raw;
    return raw.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [currentFolderId, nodes, searchQuery, getChildren]);

  // Handle double clicking item
  const handleItemOpen = (node: FSNode) => {
    if (node.type === 'folder') {
      navigateTo(node.id);
    } else {
      // Determine app based on file extension
      const name = node.name.toLowerCase();
      if (name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.json') || name.endsWith('.js') || name.endsWith('.ts')) {
        openWindow('textedit', node.name, { w: 720, h: 520 }, { fileId: node.id });
      } else if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.svg') || name.endsWith('.webp')) {
        openWindow('photos', node.name, { w: 760, h: 540 }, { fileId: node.id });
      } else if (name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.ogg')) {
        openWindow('music', 'Music', { w: 700, h: 480 }, { fileId: node.id });
      } else {
        // Quick look preview fallback
        setQuickLookNode(node);
      }
    }
  };

  const handleStartRename = (node: FSNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(node.id);
    setRenameText(node.name);
  };

  const handleFinishRename = (id: string) => {
    if (renameText.trim()) {
      renameNode(id, renameText.trim());
    }
    setRenamingId(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await importFile(file, currentFolderId);
    }
  };

  const renderIcon = (node: FSNode, size: number = 36) => {
    if (node.type === 'folder') {
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <path d="M6 16C6 11.58 9.58 8 14 8H26C28.5 8 30.5 9.5 32 12L35 16H50C54.42 16 58 19.58 58 24V48C58 52.42 54.42 56 50 56H14C9.58 56 6 52.42 6 48V16Z" fill="#38bdf8" />
          <path d="M6 24H58V48C58 52.42 54.42 56 50 56H14C9.58 56 6 52.42 6 48V24Z" fill="#0284c7" />
          <path d="M6 20C6 17.79 7.79 16 10 16H54C56.21 16 58 17.79 58 20V24H6V20Z" fill="#7dd3fc" />
        </svg>
      );
    }
    const name = node.name.toLowerCase();
    if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.svg')) {
      return <ImageIcon size={size} className="text-emerald-500" />;
    }
    if (name.endsWith('.mp3') || name.endsWith('.wav')) {
      return <Music size={size} className="text-pink-500" />;
    }
    return <FileText size={size} className="text-blue-500" />;
  };

  const isTrashFolder = currentFolderId === TRASH_ID;

  return (
    <div className="flex h-full w-full select-none bg-[var(--window-bg)] text-[var(--window-text)]">
      {/* Sidebar */}
      <div className="w-48 shrink-0 border-r border-black/10 dark:border-white/10 bg-[var(--window-sidebar)] p-3 flex flex-col justify-between text-xs font-medium">
        <div className="space-y-4">
          {/* Favorites */}
          <div>
            <div className="px-2 pb-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Favorites
            </div>
            <div className="space-y-0.5">
              {[
                { id: DESKTOP_ID, name: 'Desktop', icon: HardDrive },
                { id: DOCUMENTS_ID, name: 'Documents', icon: FileText },
                { id: DOWNLOADS_ID, name: 'Downloads', icon: Download },
                { id: PICTURES_ID, name: 'Pictures', icon: ImageIcon },
                { id: MUSIC_ID, name: 'Music', icon: Music },
              ].map((fav) => {
                const Icon = fav.icon;
                const isActive = currentFolderId === fav.id;
                return (
                  <button
                    key={fav.id}
                    onClick={() => navigateTo(fav.id)}
                    className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors text-left ${
                      isActive
                        ? 'bg-[var(--accent)] text-white shadow-sm font-semibold'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  >
                    <Icon size={14} className={isActive ? 'text-white' : 'text-blue-500'} />
                    <span className="truncate">{fav.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Locations */}
          <div>
            <div className="px-2 pb-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Locations
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => navigateTo(ROOT_ID)}
                className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors text-left ${
                  currentFolderId === ROOT_ID
                    ? 'bg-[var(--accent)] text-white font-semibold'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <HardDrive size={14} className={currentFolderId === ROOT_ID ? 'text-white' : 'text-neutral-400'} />
                <span className="truncate">Macintosh HD</span>
              </button>
            </div>
          </div>

          {/* Trash */}
          <div>
            <button
              onClick={() => navigateTo(TRASH_ID)}
              className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors text-left ${
                isTrashFolder
                  ? 'bg-[var(--accent)] text-white font-semibold'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              <Trash2 size={14} className={isTrashFolder ? 'text-white' : 'text-neutral-400'} />
              <span className="truncate">Trash</span>
            </button>
          </div>
        </div>

        {/* Storage disk info */}
        <div className="rounded-lg border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 p-2 text-[10px] text-neutral-400 space-y-1">
          <div className="flex justify-between font-semibold">
            <span>Macintosh HD</span>
            <span>482 GB free</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
            <div className="h-full w-1/4 rounded-full bg-[var(--accent)]" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Finder Toolbar */}
        <div className="flex h-11 items-center justify-between border-b border-black/10 dark:border-white/10 px-3 bg-[var(--window-header)] gap-2">
          {/* History Nav */}
          <div className="flex items-center gap-1">
            <button
              onClick={goBack}
              disabled={historyIdx === 0}
              className="rounded p-1 text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
              title="Back"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={goForward}
              disabled={historyIdx >= history.length - 1}
              className="rounded p-1 text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
              title="Forward"
            >
              <ChevronRight size={16} />
            </button>
            <span className="ml-2 font-semibold text-xs text-neutral-800 dark:text-neutral-200 truncate max-w-[150px]">
              {currentFolder?.name || 'Folder'}
            </span>
          </div>

          {/* Center actions: View mode */}
          <div className="flex items-center rounded-md border border-black/10 dark:border-white/10 p-0.5 bg-black/5 dark:bg-white/5">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded p-1 transition-colors ${
                viewMode === 'grid' ? 'bg-white dark:bg-neutral-700 shadow-sm text-[var(--accent)]' : 'text-neutral-500'
              }`}
              title="Icon View"
            >
              <LayoutGrid size={13} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded p-1 transition-colors ${
                viewMode === 'list' ? 'bg-white dark:bg-neutral-700 shadow-sm text-[var(--accent)]' : 'text-neutral-500'
              }`}
              title="List View"
            >
              <List size={13} />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {isTrashFolder ? (
              <button
                onClick={emptyTrash}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-red-500/10 text-red-600 hover:bg-red-500/20"
              >
                <Trash size={12} />
                <span>Empty Trash</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => createFolder('New Folder', currentFolderId)}
                  className="flex items-center gap-1 rounded-md border border-black/10 dark:border-white/10 px-2 py-1 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10"
                  title="New Folder"
                >
                  <Plus size={12} />
                  <span>New Folder</span>
                </button>
                <label className="flex items-center gap-1 rounded-md border border-black/10 dark:border-white/10 px-2 py-1 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer">
                  <Upload size={12} />
                  <span>Import</span>
                  <input type="file" onChange={handleFileUpload} className="hidden" />
                </label>
              </>
            )}

            {/* Search */}
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-32 rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-800/80 py-1 pl-7 pr-2 text-xs text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          </div>
        </div>

        {/* Items Container */}
        <div 
          className="flex-1 overflow-auto p-4"
          onKeyDown={(e) => {
            if (e.key === ' ' && items.length > 0 && !quickLookNode) {
              e.preventDefault();
              setQuickLookNode(items[0]);
            }
          }}
          tabIndex={0}
        >
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-neutral-400">
              <Folder size={48} strokeWidth={1} className="mb-2 opacity-40" />
              <p className="text-sm font-medium">This folder is empty</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-3">
              {items.map((node) => {
                const isRenaming = renamingId === node.id;
                return (
                  <div
                    key={node.id}
                    onDoubleClick={() => handleItemOpen(node)}
                    className="group flex flex-col items-center rounded-lg p-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-center cursor-pointer relative"
                  >
                    <div className="mb-1 flex items-center justify-center h-12 w-12 drop-shadow-sm">
                      {renderIcon(node, 42)}
                    </div>

                    {isRenaming ? (
                      <input
                        type="text"
                        autoFocus
                        value={renameText}
                        onChange={(e) => setRenameText(e.target.value)}
                        onBlur={() => handleFinishRename(node.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleFinishRename(node.id);
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                        className="w-full rounded border border-[var(--accent)] bg-white dark:bg-neutral-800 px-1 py-0.5 text-center text-xs text-neutral-800 dark:text-neutral-200 outline-none"
                      />
                    ) : (
                      <span className="text-xs font-normal text-neutral-800 dark:text-neutral-200 line-clamp-2 break-all group-hover:text-[var(--accent)]">
                        {node.name}
                      </span>
                    )}

                    {/* Quick action buttons on hover */}
                    <div className="absolute top-1 right-1 hidden group-hover:flex items-center gap-0.5 bg-neutral-900/80 rounded-md p-0.5 shadow-sm text-white">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickLookNode(node);
                        }}
                        className="p-1 hover:text-[var(--accent)]"
                        title="Quick Look"
                      >
                        <Eye size={11} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInfoNode(node);
                        }}
                        className="p-1 hover:text-[var(--accent)]"
                        title="Get Info"
                      >
                        <Info size={11} />
                      </button>
                      {!node.isProtected && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveToTrash(node.id);
                          }}
                          className="p-1 hover:text-red-400"
                          title="Move to Trash"
                        >
                          <Trash size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="w-full text-xs">
              <div className="grid grid-cols-[1fr_120px_90px_60px] border-b border-black/10 dark:border-white/10 pb-2 font-semibold text-neutral-400 px-2">
                <span>Name</span>
                <span>Date Modified</span>
                <span>Size</span>
                <span>Kind</span>
              </div>
              <div className="divide-y divide-black/5 dark:divide-white/5">
                {items.map((node) => (
                  <div
                    key={node.id}
                    onDoubleClick={() => handleItemOpen(node)}
                    className="grid grid-cols-[1fr_120px_90px_60px] items-center py-2 px-2 hover:bg-black/5 dark:hover:bg-white/10 rounded cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {renderIcon(node, 18)}
                      <span className="truncate text-neutral-800 dark:text-neutral-200">{node.name}</span>
                    </div>
                    <span className="text-neutral-400">
                      {new Date(node.modifiedAt).toLocaleDateString()}
                    </span>
                    <span className="text-neutral-400 tabular-nums">
                      {node.type === 'folder' ? '--' : `${(node.size / 1024).toFixed(1)} KB`}
                    </span>
                    <span className="text-neutral-400 capitalize">{node.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Path Bar Footer */}
        <div className="flex h-6 items-center justify-between border-t border-black/10 dark:border-white/10 px-3 bg-[var(--window-header)] text-[11px] text-neutral-500">
          <div className="flex items-center gap-1.5 truncate">
            <span>Macintosh HD</span>
            <ChevronRight size={10} />
            <span className="font-medium text-neutral-700 dark:text-neutral-300">{currentFolder?.name}</span>
          </div>
          <div className="tabular-nums">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </div>
        </div>
      </div>

      {/* Quick Look Preview Modal */}
      {quickLookNode && (
        <div 
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setQuickLookNode(null)}
        >
          <div 
            className="w-[500px] max-w-[90vw] rounded-xl border border-black/10 dark:border-white/20 bg-white dark:bg-neutral-900 p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
              <div className="flex items-center gap-3">
                {renderIcon(quickLookNode, 32)}
                <div>
                  <h4 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100">{quickLookNode.name}</h4>
                  <p className="text-xs text-neutral-400">
                    {(quickLookNode.size / 1024).toFixed(1)} KB · Modified {new Date(quickLookNode.modifiedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuickLookNode(null)}
                className="rounded-md px-2 py-1 text-xs font-medium text-neutral-500 hover:bg-black/5 dark:hover:bg-white/10"
              >
                Close (Esc)
              </button>
            </div>

            {/* Content Preview */}
            <div className="max-h-[300px] overflow-auto rounded-lg border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 p-4 text-xs font-mono text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
              {quickLookNode.content ? (
                quickLookNode.content.slice(0, 1500)
              ) : (
                <div className="text-center py-8 text-neutral-400">Preview not available for this binary file</div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => exportFile(quickLookNode.id)}
                className="flex items-center gap-1.5 rounded-lg border border-black/10 dark:border-white/10 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10"
              >
                <Download size={13} />
                <span>Download</span>
              </button>
              <button
                onClick={() => {
                  const node = quickLookNode;
                  setQuickLookNode(null);
                  handleItemOpen(node);
                }}
                className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:opacity-90"
              >
                Open in App
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Get Info Modal */}
      {infoNode && (
        <div 
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setInfoNode(null)}
        >
          <div 
            className="w-[380px] rounded-xl border border-black/10 dark:border-white/20 bg-white dark:bg-neutral-900 p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-black/10 dark:border-white/10 pb-3">
              {renderIcon(infoNode, 40)}
              <div>
                <h4 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100">{infoNode.name}</h4>
                <span className="text-xs text-neutral-400 capitalize">{infoNode.type}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                <span className="text-neutral-400">Kind:</span>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">{infoNode.mime || infoNode.type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                <span className="text-neutral-400">Size:</span>
                <span className="font-medium text-neutral-700 dark:text-neutral-300 tabular-nums">
                  {(infoNode.size / 1024).toFixed(2)} KB ({infoNode.size} bytes)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                <span className="text-neutral-400">Created:</span>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {new Date(infoNode.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                <span className="text-neutral-400">Modified:</span>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {new Date(infoNode.modifiedAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInfoNode(null)}
                className="rounded-lg bg-[var(--accent)] px-4 py-1.5 text-xs font-medium text-white shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
