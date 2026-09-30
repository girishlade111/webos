import React, { useState, useEffect } from 'react';
import { Activity, XCircle, RefreshCw, Cpu, HardDrive } from 'lucide-react';
import { useProcessStore } from '../../core/processStore';
import { sound } from '../../core/sound';

export const ActivityMonitorApp: React.FC<{ windowId: string }> = () => {
  const { windows, runningAppIds, quitApp, closeWindow } = useProcessStore();
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [cpuUsage, setCpuUsage] = useState<number>(14);
  const [memUsage, setMemUsage] = useState<number>(3.8);

  // Dynamic CPU jitter
  useEffect(() => {
    const timer = setInterval(() => {
      setCpuUsage((prev) => {
        const delta = (Math.random() - 0.48) * 4;
        return Math.max(8, Math.min(48, Math.round(prev + delta)));
      });
      setMemUsage((prev) => {
        const delta = (Math.random() - 0.5) * 0.1;
        return Math.max(3.2, Math.min(5.4, Number((prev + delta).toFixed(2))));
      });
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  const handleForceQuit = () => {
    if (!selectedAppId) return;
    sound.playTrash();
    quitApp(selectedAppId);
    setSelectedAppId(null);
  };

  const processList = runningAppIds.map((appId, index) => {
    const appWindows = windows.filter((w) => w.appId === appId);
    const fakeCpu = (Math.random() * 4 + (appWindows.length * 1.5)).toFixed(1);
    const fakeMem = Math.floor(Math.random() * 80 + 120);

    return {
      appId,
      name: appId.charAt(0).toUpperCase() + appId.slice(1).replace('_', ' '),
      pid: 300 + index * 42,
      cpu: `${fakeCpu}%`,
      memory: `${fakeMem} MB`,
      threads: 4 + index,
      windowsCount: appWindows.length,
    };
  });

  return (
    <div className="flex h-full w-full flex-col bg-[var(--window-bg)] text-[var(--window-text)] select-none">
      {/* Activity Monitor Header Toolbar */}
      <div className="flex h-11 items-center justify-between border-b border-black/10 dark:border-white/10 px-4 bg-[var(--window-header)]">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-xs text-neutral-800 dark:text-neutral-200">Processes</span>
          <span className="text-[11px] text-neutral-400">({processList.length} running)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleForceQuit}
            disabled={!selectedAppId}
            className="flex items-center gap-1.5 rounded-md bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-500/20 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <XCircle size={13} />
            <span>Force Quit Process</span>
          </button>
        </div>
      </div>

      {/* Process Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-neutral-400 font-semibold">
              <th className="py-2 px-3">Process Name</th>
              <th className="py-2 px-3">PID</th>
              <th className="py-2 px-3">% CPU</th>
              <th className="py-2 px-3">Memory</th>
              <th className="py-2 px-3">Threads</th>
              <th className="py-2 px-3">Windows</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/5 font-mono">
            {processList.map((proc) => {
              const isSelected = selectedAppId === proc.appId;
              return (
                <tr
                  key={proc.appId}
                  onClick={() => setSelectedAppId(proc.appId)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[var(--accent)] text-white font-semibold'
                      : 'hover:bg-black/5 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <td className="py-2 px-3 font-sans flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                    <span>{proc.name}</span>
                  </td>
                  <td className="py-2 px-3 tabular-nums">{proc.pid}</td>
                  <td className="py-2 px-3 tabular-nums">{proc.cpu}</td>
                  <td className="py-2 px-3 tabular-nums">{proc.memory}</td>
                  <td className="py-2 px-3 tabular-nums">{proc.threads}</td>
                  <td className="py-2 px-3 tabular-nums">{proc.windowsCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom CPU & Memory Graph Dashboard */}
      <div className="h-24 border-t border-black/10 dark:border-white/10 bg-[var(--window-header)] p-3 grid grid-cols-2 gap-4">
        {/* CPU Graph */}
        <div className="flex items-center gap-3 rounded-lg border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 p-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
            <Cpu size={20} />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-neutral-700 dark:text-neutral-300">CPU Usage</span>
              <span className="tabular-nums text-emerald-500">{cpuUsage}%</span>
            </div>
            <div className="h-1.5 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${cpuUsage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Memory Graph */}
        <div className="flex items-center gap-3 rounded-lg border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 p-2.5">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
            <HardDrive size={20} />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-neutral-700 dark:text-neutral-300">Memory Used</span>
              <span className="tabular-nums text-blue-500">{memUsage} GB / 16 GB</span>
            </div>
            <div className="h-1.5 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${(memUsage / 16) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
