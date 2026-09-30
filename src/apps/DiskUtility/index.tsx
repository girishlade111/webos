import React, { useState } from 'react';
import { 
  HardDrive, Activity, PieChart, RefreshCw, Info, AlertTriangle, 
  CheckCircle, Play, X, ShieldCheck, Database, Folder 
} from 'lucide-react';
import { sound } from '../../core/sound';

interface DiskItem {
  id: string;
  name: string;
  type: 'disk' | 'volume';
  capacity: string;
  used: string;
  free: string;
  usedPercent: number;
  format: string;
  mountPoint: string;
  connection: string;
  smartStatus: string;
}

const DISKS: DiskItem[] = [
  {
    id: 'mac-hd',
    name: 'Macintosh HD',
    type: 'volume',
    capacity: '500.28 GB',
    used: '158.13 GB',
    free: '342.15 GB',
    usedPercent: 32,
    format: 'APFS (Case-sensitive)',
    mountPoint: '/',
    connection: 'Internal PCI-Express NVMe',
    smartStatus: 'Verified',
  },
  {
    id: 'mac-data',
    name: 'Macintosh HD - Data',
    type: 'volume',
    capacity: '500.28 GB',
    used: '142.71 GB',
    free: '357.57 GB',
    usedPercent: 28,
    format: 'APFS Volume',
    mountPoint: '/System/Volumes/Data',
    connection: 'Internal PCI-Express NVMe',
    smartStatus: 'Verified',
  },
  {
    id: 'external-usb',
    name: 'WebOS Flash Drive',
    type: 'disk',
    capacity: '64.00 GB',
    used: '12.40 GB',
    free: '51.60 GB',
    usedPercent: 19,
    format: 'ExFAT',
    mountPoint: '/Volumes/WebOS Flash',
    connection: 'USB 3.2 Gen 2',
    smartStatus: 'Not Supported',
  },
];

export const DiskUtilityApp: React.FC<{ windowId: string }> = () => {
  const [selectedDiskId, setSelectedDiskId] = useState<string>('mac-hd');
  const [isFirstAidRunning, setIsFirstAidRunning] = useState<boolean>(false);
  const [firstAidLogs, setFirstAidLogs] = useState<string[]>([]);
  const [firstAidDone, setFirstAidDone] = useState<boolean>(false);

  const selectedDisk = DISKS.find((d) => d.id === selectedDiskId) || DISKS[0];

  const runFirstAid = () => {
    sound.playClick();
    setIsFirstAidRunning(true);
    setFirstAidDone(false);
    setFirstAidLogs(['Running First Aid on "' + selectedDisk.name + '"...']);

    const steps = [
      'Verifying storage system prerequisites...',
      'Checking snapshot metadata tree...',
      'Checking APFS container superblock...',
      'Checking the object map...',
      'Verifying the volume bitmap and space manager...',
      'Checking the fsroot tree and extent references...',
      'Storage system check exit code is 0.',
      'The volume ' + selectedDisk.name + ' appears to be OK.',
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setFirstAidLogs((prev) => [...prev, step]);
        if (idx === steps.length - 1) {
          setIsFirstAidRunning(false);
          setFirstAidDone(true);
          sound.playWindowSnap();
        }
      }, (idx + 1) * 600);
    });
  };

  return (
    <div className="flex h-full w-full bg-neutral-900 text-white select-none overflow-hidden text-xs">
      {/* Sidebar */}
      <div className="w-56 border-r border-white/10 bg-neutral-900/90 flex flex-col p-3 space-y-3 shrink-0">
        <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider px-2">
          Internal Storage
        </div>
        <div className="space-y-1">
          {DISKS.slice(0, 2).map((d) => (
            <button
              key={d.id}
              onClick={() => {
                sound.playClick();
                setSelectedDiskId(d.id);
              }}
              className={`flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                selectedDiskId === d.id ? 'bg-[var(--accent)] text-white shadow-xs font-semibold' : 'text-white/70 hover:bg-white/5'
              }`}
            >
              <HardDrive size={15} />
              <div className="truncate">
                <p className="truncate font-medium">{d.name}</p>
                <p className="text-[10px] text-white/50">{d.capacity}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider px-2 pt-2 border-t border-white/10">
          External Storage
        </div>
        <div className="space-y-1">
          {DISKS.slice(2).map((d) => (
            <button
              key={d.id}
              onClick={() => {
                sound.playClick();
                setSelectedDiskId(d.id);
              }}
              className={`flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                selectedDiskId === d.id ? 'bg-[var(--accent)] text-white shadow-xs font-semibold' : 'text-white/70 hover:bg-white/5'
              }`}
            >
              <Database size={15} />
              <div className="truncate">
                <p className="truncate font-medium">{d.name}</p>
                <p className="text-[10px] text-white/50">{d.capacity}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-neutral-950 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 p-3 border-b border-white/10 bg-neutral-900/60">
          <button
            onClick={runFirstAid}
            disabled={isFirstAidRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all font-medium text-white shadow-xs"
          >
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>First Aid</span>
          </button>

          <button
            onClick={() => sound.playClick()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-white/70"
          >
            <PieChart size={14} />
            <span>Partition</span>
          </button>

          <button
            onClick={() => sound.playClick()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-white/70"
          >
            <Info size={14} />
            <span>Info</span>
          </button>
        </div>

        {/* Disk Dashboard */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-neutral-700 to-neutral-800 border border-white/10 flex items-center justify-center shadow-lg">
              <HardDrive size={32} className="text-white/90" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{selectedDisk.name}</h2>
              <p className="text-xs text-white/50">{selectedDisk.format} • {selectedDisk.capacity}</p>
            </div>
          </div>

          {/* Storage Breakdown Bar */}
          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-white">Storage Allocation</span>
              <span className="text-white/60">
                {selectedDisk.used} of {selectedDisk.capacity} Used ({selectedDisk.free} Free)
              </span>
            </div>

            {/* Segmented multi-colored bar */}
            <div className="flex h-4 w-full rounded-full overflow-hidden bg-white/10 p-0.5">
              <div style={{ width: '12%' }} className="h-full bg-blue-500 rounded-l-full" title="Apps: 42 GB" />
              <div style={{ width: '8%' }} className="h-full bg-orange-500" title="Documents: 28 GB" />
              <div style={{ width: '5%' }} className="h-full bg-pink-500" title="Photos: 18 GB" />
              <div style={{ width: '4%' }} className="h-full bg-emerald-500" title="Developer: 14 GB" />
              <div style={{ width: '3%' }} className="h-full bg-purple-500" title="System: 10 GB" />
            </div>

            <div className="flex flex-wrap gap-4 pt-1 text-[11px] text-white/70">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> Apps</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-500" /> Documents</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-pink-500" /> Photos</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Developer</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-purple-500" /> System</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-white/20" /> Free</span>
            </div>
          </div>

          {/* Properties Grid */}
          <div className="rounded-2xl border border-white/10 bg-white/5 divide-y divide-white/5 text-xs">
            <div className="flex justify-between p-3">
              <span className="text-white/50">Mount Point:</span>
              <span className="font-mono text-white/90">{selectedDisk.mountPoint}</span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-white/50">Connection:</span>
              <span className="text-white/90">{selectedDisk.connection}</span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-white/50">File System:</span>
              <span className="text-white/90">{selectedDisk.format}</span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-white/50">S.M.A.R.T. Status:</span>
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle size={13} /> {selectedDisk.smartStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* First Aid Log Modal */}
      {(isFirstAidRunning || firstAidDone) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-white/20 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" />
                <h3 className="font-bold text-sm text-white">First Aid Process</h3>
              </div>
              {firstAidDone && (
                <button onClick={() => setFirstAidDone(false)} className="rounded-full p-1 hover:bg-white/10">
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="h-44 overflow-y-auto rounded-xl bg-black/60 p-3 font-mono text-[11px] space-y-1 text-emerald-300">
              {firstAidLogs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>

            {firstAidDone && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setFirstAidDone(false)}
                  className="px-4 py-1.5 rounded-lg bg-[var(--accent)] text-white font-medium shadow-sm hover:brightness-110"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
