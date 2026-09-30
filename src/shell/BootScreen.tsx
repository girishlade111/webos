import React, { useState, useEffect } from 'react';
import { useThemeStore } from '../core/themeStore';
import { sound } from '../core/sound';

export const BootScreen: React.FC = () => {
  const [progress, setProgress] = useState<number>(0);
  const { setOSState, soundEnabled, username } = useThemeStore();

  useEffect(() => {
    // Play boot chime
    if (soundEnabled) {
      setTimeout(() => {
        sound.playBootChime();
      }, 300);
    }

    // Fill progress bar over ~2.8 seconds
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setOSState('desktop');
          }, 450);
          return 100;
        }
        return prev + 2;
      });
    }, 45);

    return () => clearInterval(interval);
  }, [setOSState, soundEnabled]);

  const displayName = username || 'LadeStack';

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#000000] text-white select-none transition-opacity duration-700">
      <div className="flex flex-col items-center space-y-7 animate-fade-in">
        {/* Professional Custom Boot Logo designed according to Username (LadeStack) */}
        <div className="relative flex items-center justify-center">
          <svg width="92" height="92" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
            <defs>
              <linearGradient id="boot_badge_bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1e293b" />
                <stop offset="0.6" stopColor="#0f172a" />
                <stop offset="1" stopColor="#020617" />
              </linearGradient>
              <linearGradient id="boot_plate_top" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38bdf8" />
                <stop offset="0.5" stopColor="#6366f1" />
                <stop offset="1" stopColor="#a855f7" />
              </linearGradient>
              <linearGradient id="boot_specular" x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ffffff" stopOpacity="0.4" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0.05" />
              </linearGradient>
              <filter id="boot_glow" x="-15" y="-15" width="130" height="130" filterUnits="userSpaceOnUse">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Apple Silicon Hardware Squircle Badge */}
            <rect x="2" y="2" width="96" height="96" rx="24" fill="url(#boot_badge_bg)" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
            <rect x="3.5" y="3.5" width="93" height="93" rx="22.5" stroke="url(#boot_specular)" strokeWidth="1" fill="none" />

            {/* Glowing Layered Stack Architecture (LadeStack Emblem) */}
            {/* Bottom Stack Plate */}
            <path d="M50 71L26 58L50 45L74 58L50 71Z" fill="#1e1b4b" stroke="#4338ca" strokeWidth="1.5" strokeLinejoin="round" opacity="0.6" />
            
            {/* Middle Stack Plate */}
            <path d="M50 60L26 47L50 34L74 47L50 60Z" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.8" strokeLinejoin="round" opacity="0.85" />
            
            {/* Top Stack Plate with Neon Accent */}
            <path d="M50 49L26 36L50 23L74 36L50 49Z" fill="url(#boot_plate_top)" stroke="#ffffff" strokeWidth="1.8" strokeLinejoin="round" filter="url(#boot_glow)" />

            {/* Stylized Monogram "L" Embedded on the Stack */}
            <path d="M42 29V42H56" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Core Neural / Silicon Node Light */}
            <circle cx="50" cy="36" r="2.5" fill="#ffffff" />
          </svg>
        </div>

        {/* Username Branding */}
        <div className="flex flex-col items-center space-y-1 text-center">
          <span className="text-sm font-semibold tracking-[0.35em] text-white/95 uppercase drop-shadow-md">
            {displayName}
          </span>
          <span className="text-[10px] tracking-[0.25em] text-neutral-400 font-mono uppercase">
            Silicon Architecture • macOS
          </span>
        </div>

        {/* Apple-style thin sleek progress bar */}
        <div className="h-1.5 w-56 rounded-full bg-neutral-900 ring-1 ring-white/10 overflow-hidden shadow-inner mt-2">
          <div
            className="h-full bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-75 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
