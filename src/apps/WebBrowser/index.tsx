import React, { useState } from 'react';
import { 
  ArrowLeft, ArrowRight, RotateCw, Shield, Star, Share2, 
  ExternalLink, Search, Globe, Bookmark, Plus, X 
} from 'lucide-react';

interface Tab {
  id: string;
  title: string;
  url: string;
  isCustomUrl?: boolean;
}

const FAVORITES = [
  { name: 'Wikipedia', url: 'https://en.m.wikipedia.org/wiki/Main_Page', icon: '🌐', desc: 'Free Encyclopedia' },
  { name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/export/embed.html', icon: '🗺️', desc: 'Interactive Maps' },
  { name: 'MDN Web Docs', url: 'https://developer.mozilla.org/en-US/', icon: '📚', desc: 'Web Documentation' },
  { name: 'Internet Archive', url: 'https://archive.org', icon: '🏛️', desc: 'Digital Library' },
  { name: 'Hacker News', url: 'https://news.ycombinator.com', icon: '⚡', desc: 'Tech & Startups' },
  { name: 'W3Schools', url: 'https://www.w3schools.com', icon: '💻', desc: 'Web Tutorials' },
];

export const WebBrowserApp: React.FC<{ windowId: string; initialParams?: any }> = ({ initialParams }) => {
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: 'tab-1',
      title: initialParams?.url ? 'Website' : 'Start Page',
      url: initialParams?.url || '',
      isCustomUrl: !!initialParams?.url,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const [urlInput, setUrlInput] = useState<string>(initialParams?.url || '');
  const [iframeError, setIframeError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const handleNavigate = (inputUrl: string) => {
    let target = inputUrl.trim();
    if (!target) return;

    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      if (target.includes('.') && !target.includes(' ')) {
        target = `https://${target}`;
      } else {
        target = `https://en.m.wikipedia.org/w/index.php?search=${encodeURIComponent(target)}`;
      }
    }

    setUrlInput(target);
    setIframeError(false);
    setIsLoading(true);

    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTabId
          ? {
              ...tab,
              url: target,
              title: new URL(target).hostname.replace('www.', ''),
              isCustomUrl: true,
            }
          : tab
      )
    );
  };

  const handleReload = () => {
    setIsLoading(true);
    setIframeError(false);
    setTimeout(() => setIsLoading(false), 500);
  };

  const addTab = () => {
    const newId = `tab-${Date.now()}`;
    const newTab: Tab = {
      id: newId,
      title: 'New Tab',
      url: '',
      isCustomUrl: false,
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
    setUrlInput('');
    setIframeError(false);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) {
      setTabs([{ id: 'tab-1', title: 'Start Page', url: '', isCustomUrl: false }]);
      setUrlInput('');
      return;
    }
    const filtered = tabs.filter((t) => t.id !== id);
    setTabs(filtered);
    if (activeTabId === id) {
      setActiveTabId(filtered[0].id);
      setUrlInput(filtered[0].url);
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-[var(--window-bg)] text-[var(--window-text)] select-none">
      {/* Tab Bar */}
      <div className="flex h-9 items-center border-b border-black/10 dark:border-white/10 bg-[var(--window-header)] px-2 gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => {
                setActiveTabId(tab.id);
                setUrlInput(tab.url);
                setIframeError(false);
              }}
              className={`group flex items-center gap-2 rounded-t-lg px-3 py-1 text-xs cursor-pointer max-w-[200px] min-w-[120px] transition-colors ${
                isActive
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm border-t-2 border-t-[var(--accent)]'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Globe size={12} className={isActive ? 'text-[var(--accent)]' : 'text-neutral-400'} />
              <span className="truncate flex-1 font-medium">{tab.title}</span>
              <button
                onClick={(e) => closeTab(tab.id, e)}
                className="opacity-0 group-hover:opacity-100 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-700"
              >
                <X size={10} />
              </button>
            </div>
          );
        })}
        <button
          onClick={addTab}
          className="rounded p-1 text-neutral-500 hover:bg-black/10 dark:hover:bg-white/10 ml-1"
          title="New Tab"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Toolbar / Address Bar */}
      <div className="flex h-11 items-center justify-between border-b border-black/10 dark:border-white/10 px-3 bg-[var(--window-header)] gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {}}
            className="rounded p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10"
            title="Back"
          >
            <ArrowLeft size={14} />
          </button>
          <button
            onClick={() => {}}
            className="rounded p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10"
            title="Forward"
          >
            <ArrowRight size={14} />
          </button>
          <button
            onClick={handleReload}
            className={`rounded p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10 ${isLoading ? 'animate-spin' : ''}`}
            title="Reload"
          >
            <RotateCw size={13} />
          </button>
        </div>

        {/* Omnibar Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleNavigate(urlInput);
          }}
          className="flex-1 max-w-xl relative flex items-center"
        >
          <div className="absolute left-3 flex items-center gap-1.5 text-neutral-400">
            <Shield size={12} className="text-emerald-500" />
          </div>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Search or enter website name"
            className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-800/80 py-1.5 pl-8 pr-8 text-xs text-neutral-800 dark:text-neutral-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <button
            type="submit"
            className="absolute right-2.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            <Search size={13} />
          </button>
        </form>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {}}
            className="rounded p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10"
            title="Bookmarks"
          >
            <Bookmark size={14} />
          </button>
          <button
            onClick={() => {
              if (activeTab.url) {
                window.open(activeTab.url, '_blank');
              }
            }}
            className="rounded p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10"
            title="Open in new window"
          >
            <ExternalLink size={14} />
          </button>
        </div>
      </div>

      {/* Main View: Start Page vs Embedded iFrame */}
      <div className="flex-1 overflow-auto bg-neutral-50 dark:bg-neutral-900/50">
        {!activeTab.url || !activeTab.isCustomUrl ? (
          /* Start Page */
          <div className="mx-auto max-w-3xl p-8 space-y-8 animate-fade-in">
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-neutral-800 dark:text-neutral-100">Favorites</h1>
              <p className="text-xs text-neutral-500">Quickly explore web resources or enter any URL above</p>
            </div>

            {/* Favorites Grid */}
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
              {FAVORITES.map((fav) => (
                <button
                  key={fav.name}
                  onClick={() => handleNavigate(fav.url)}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-black/5 dark:border-white/5 bg-white dark:bg-neutral-800 p-4 shadow-sm hover:shadow-md hover:scale-105 transition-all text-center"
                >
                  <span className="text-3xl">{fav.icon}</span>
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate w-full">
                    {fav.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Privacy Report Box */}
            <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-800/70 p-4 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-emerald-500/10 p-2.5 text-emerald-500">
                  <Shield size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    Privacy Report · Protected
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    WebOS Intelligent Tracking Prevention prevents cross-site tracking in this browser session.
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                Active
              </span>
            </div>
          </div>
        ) : iframeError ? (
          /* Friendly fallback card if X-Frame-Options prevents embedding */
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="w-[420px] rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-800 p-6 shadow-xl space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 text-[var(--accent)]">
                <Globe size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-100">
                  This site cannot be embedded
                </h3>
                <p className="text-xs text-neutral-500">
                  Due to browser security policies (X-Frame-Options / CSP), <strong className="text-neutral-700 dark:text-neutral-300">{activeTab.url}</strong> restricts in-iframe rendering.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => handleNavigate('https://en.m.wikipedia.org/wiki/Main_Page')}
                  className="rounded-lg border border-black/10 dark:border-white/10 px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Go to Wikipedia
                </button>
                <a
                  href={activeTab.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-medium text-white shadow-sm hover:opacity-95"
                >
                  <span>Open in New Tab</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        ) : (
          /* Render iframe */
          <div className="relative h-full w-full">
            <iframe
              src={activeTab.url}
              title={activeTab.title}
              className="h-full w-full border-none bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              onLoad={() => setIsLoading(false)}
              onError={() => setIframeError(true)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
