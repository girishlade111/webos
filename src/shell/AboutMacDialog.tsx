import React from 'react';
import { X, HardDrive, Cpu, MemoryStick, ShieldCheck, ExternalLink } from 'lucide-react';
import { useProcessStore } from '../core/processStore';
import { sound } from '../core/sound';

interface AboutMacDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutMacDialog: React.FC<AboutMacDialogProps> = ({ isOpen, onClose }) => {
  const { openWindow } = useProcessStore();

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 select-none animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[440px] rounded-2xl border border-white/20 bg-neutral-900/95 glass-panel p-6 shadow-2xl text-white flex flex-col items-center text-center animate-scale-in"
        style={{
          boxShadow: '0 25px 70px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.15)',
        }}
      >
        {/* Traffic Light Close at top-left */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 flex h-3 w-3 items-center justify-center rounded-full bg-[#ff5f56] border border-[#e0443e] hover:brightness-90 transition-all cursor-pointer"
          title="Close"
        >
          <X size={7} strokeWidth={3} className="text-neutral-950 opacity-0 hover:opacity-100" />
        </button>

        {/* MacBook Pro Hardware Graphic */}
        <div className="relative mt-2 mb-4 flex items-center justify-center">
          <svg width="180" height="110" viewBox="0 0 180 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
            {/* Screen lid */}
            <rect x="24" y="6" width="132" height="84" rx="6" fill="#18181b" stroke="#71717a" strokeWidth="1.5" />
            {/* Glass screen */}
            <rect x="28" y="10" width="124" height="76" rx="3" fill="#09090b" />
            {/* Screen wallpaper art */}
            <rect x="29" y="11" width="122" height="74" rx="2" fill="url(#screen_art)" />
            <defs>
              <linearGradient id="screen_art" x1="29" y1="11" x2="151" y2="85" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0284c7" />
                <stop offset="0.5" stopColor="#38bdf8" />
                <stop offset="1" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
            {/* Notch */}
            <rect x="85" y="10" width="10" height="3" rx="1" fill="#000000" />
            {/* Base */}
            <path d="M6 92C6 90.5 7.5 89.5 9 89.5H171C172.5 89.5 174 90.5 174 92L171 98C170.5 99 169.5 99.5 168 99.5H12C10.5 99.5 9.5 99 9 98L6 92Z" fill="#a1a1aa" />
            {/* Thumb indent */}
            <rect x="76" y="89.5" width="28" height="3" rx="1.5" fill="#52525b" />
            {/* Feet */}
            <rect x="26" y="99.5" width="12" height="1.5" rx="0.5" fill="#27272a" />
            <rect x="142" y="99.5" width="12" height="1.5" rx="0.5" fill="#27272a" />
          </svg>
        </div>

        {/* Mac Model & OS Version */}
        <h2 className="text-xl font-bold tracking-tight text-white">MacBook Pro</h2>
        <p className="text-xs text-white/60 mt-0.5 font-medium">16-inch, Nov 2024</p>

        <div className="mt-4 px-3 py-1 rounded-full bg-white/10 text-[11px] font-semibold text-white/90 border border-white/10 shadow-xs">
          macOS Sequoia <span className="font-normal text-white/60">15.1</span>
        </div>

        {/* Specs Grid */}
        <div className="w-full mt-5 space-y-2 border-t border-b border-white/10 py-4 text-xs">
          <div className="flex justify-between items-center px-2">
            <span className="text-white/50 flex items-center gap-1.5"><Cpu size={13} className="text-sky-400" /> Chip</span>
            <span className="font-semibold text-white">Apple M3 Max (16-core)</span>
          </div>
          <div className="flex justify-between items-center px-2">
            <span className="text-white/50 flex items-center gap-1.5"><MemoryStick size={13} className="text-emerald-400" /> Memory</span>
            <span className="font-medium text-white/90">64 GB Unified Memory</span>
          </div>
          <div className="flex justify-between items-center px-2">
            <span className="text-white/50 flex items-center gap-1.5"><HardDrive size={13} className="text-orange-400" /> Startup Disk</span>
            <span className="font-medium text-white/90">Macintosh HD</span>
          </div>
          <div className="flex justify-between items-center px-2">
            <span className="text-white/50 flex items-center gap-1.5"><ShieldCheck size={13} className="text-purple-400" /> Serial Number</span>
            <span className="font-mono text-white/80">C02G87Y0MD6R</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex gap-3 w-full">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
              openWindow('settings');
            }}
            className="flex-1 py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all font-medium text-xs text-white shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>More Info...</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
              openWindow('system_report' in useProcessStore.getState() ? 'system_report' : 'activity_monitor');
            }}
            className="py-1.5 px-4 rounded-xl border border-white/20 hover:bg-white/10 transition-all font-medium text-xs text-white/80 cursor-pointer"
          >
            System Report...
          </button>
        </div>

        {/* Legal & Copyright */}
        <p className="text-[10px] text-white/40 mt-4">
          ™ and © 1983-2026 Apple Inc. All Rights Reserved.
        </p>
      </div>
    </div>
  );
};
