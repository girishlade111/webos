import React, { useState, useEffect } from 'react';
import { Save, FilePlus, Download, FileText, X } from 'lucide-react';
import { useFSStore, DOCUMENTS_ID } from '../../core/fsStore';
import { sound } from '../../core/sound';

interface OpenFileTab {
  id: string; // file id or temp id
  name: string;
  content: string;
  isDirty: boolean;
  isStored: boolean;
}

export const TextEditApp: React.FC<{ windowId: string; initialParams?: any }> = ({ initialParams }) => {
  const { nodes, createFile, updateFileContent, exportFile } = useFSStore();

  const [tabs, setTabs] = useState<OpenFileTab[]>(() => {
    if (initialParams?.fileId && nodes[initialParams.fileId]) {
      const f = nodes[initialParams.fileId];
      return [{
        id: f.id,
        name: f.name,
        content: f.content || '',
        isDirty: false,
        isStored: true,
      }];
    }
    return [{
      id: `new-${Date.now()}`,
      name: 'Untitled.txt',
      content: 'Type your text or code here...',
      isDirty: false,
      isStored: false,
    }];
  });

  const [activeTabId, setActiveTabId] = useState<string>(tabs[0].id);

  // Sync if initialParams changes
  useEffect(() => {
    if (initialParams?.fileId && nodes[initialParams.fileId]) {
      const f = nodes[initialParams.fileId];
      if (!tabs.some((t) => t.id === f.id)) {
        const newTab = {
          id: f.id,
          name: f.name,
          content: f.content || '',
          isDirty: false,
          isStored: true,
        };
        setTabs((prev) => [...prev, newTab]);
        setActiveTabId(f.id);
      }
    }
  }, [initialParams?.fileId, nodes]);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const handleContentChange = (val: string) => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId ? { ...t, content: val, isDirty: true } : t
      )
    );
  };

  const handleSave = () => {
    sound.playClick();
    if (activeTab.isStored) {
      updateFileContent(activeTab.id, activeTab.content);
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, isDirty: false } : t))
      );
    } else {
      const newFileId = createFile(activeTab.name, DOCUMENTS_ID, activeTab.content);
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? { ...t, id: newFileId, isDirty: false, isStored: true }
            : t
        )
      );
      setActiveTabId(newFileId);
    }
  };

  const handleNewTab = () => {
    const id = `new-${Date.now()}`;
    const newTab: OpenFileTab = {
      id,
      name: `Untitled-${tabs.length + 1}.txt`,
      content: '',
      isDirty: false,
      isStored: false,
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(id);
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) {
      handleNewTab();
      setTabs((prev) => prev.filter((t) => t.id !== id));
      return;
    }
    const remaining = tabs.filter((t) => t.id !== id);
    setTabs(remaining);
    if (activeTabId === id) {
      setActiveTabId(remaining[0].id);
    }
  };

  const lines = activeTab.content.split('\n');
  const wordCount = activeTab.content.trim() ? activeTab.content.trim().split(/\s+/).length : 0;
  const charCount = activeTab.content.length;

  return (
    <div className="flex h-full w-full flex-col bg-[var(--window-bg)] text-[var(--window-text)] select-none">
      {/* Tabs bar */}
      <div className="flex h-9 items-center border-b border-black/10 dark:border-white/10 bg-[var(--window-header)] px-2 gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`group flex items-center gap-2 rounded-t-lg px-3 py-1 text-xs cursor-pointer max-w-[180px] min-w-[120px] transition-colors ${
                isActive
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm border-t-2 border-t-[var(--accent)]'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <FileText size={12} className={isActive ? 'text-[var(--accent)]' : 'text-neutral-400'} />
              <span className="truncate flex-1 font-medium">
                {tab.name} {tab.isDirty && '•'}
              </span>
              <button
                onClick={(e) => handleCloseTab(tab.id, e)}
                className="opacity-0 group-hover:opacity-100 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 text-neutral-400"
              >
                <X size={10} />
              </button>
            </div>
          );
        })}
        <button
          onClick={handleNewTab}
          className="rounded p-1 text-neutral-500 hover:bg-black/10 dark:hover:bg-white/10 ml-1"
          title="New Document"
        >
          <FilePlus size={14} />
        </button>
      </div>

      {/* Action Toolbar */}
      <div className="flex h-10 items-center justify-between border-b border-black/10 dark:border-white/10 px-4 bg-[var(--window-header)] gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-md bg-[var(--accent)] px-3 py-1 text-xs font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
            title="Save to Virtual Filesystem"
          >
            <Save size={13} />
            <span>Save</span>
          </button>
          {activeTab.isStored && (
            <button
              onClick={() => exportFile(activeTab.id)}
              className="flex items-center gap-1 rounded-md border border-black/10 dark:border-white/10 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5"
              title="Download to computer"
            >
              <Download size={13} />
              <span>Export</span>
            </button>
          )}
        </div>

        <div className="text-[11px] text-neutral-400 tabular-nums">
          {lines.length} lines · {wordCount} words · {charCount} chars
        </div>
      </div>

      {/* Editor Body with Line Numbers */}
      <div className="flex flex-1 overflow-hidden bg-white dark:bg-neutral-900">
        {/* Line Numbers */}
        <div className="w-12 shrink-0 border-r border-black/5 dark:border-white/5 bg-neutral-50 dark:bg-neutral-950/40 py-3 pr-2 text-right font-mono text-xs text-neutral-400 select-none">
          {lines.map((_, i) => (
            <div key={i} className="leading-6">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          value={activeTab.content}
          onChange={(e) => handleContentChange(e.target.value)}
          spellCheck={false}
          className="flex-1 resize-none bg-transparent p-3 font-mono text-xs text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 outline-none leading-6 select-text"
        />
      </div>
    </div>
  );
};
