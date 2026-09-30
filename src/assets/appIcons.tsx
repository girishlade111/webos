import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

// Original OS Logo Mark: Concentric orbital nexus
export const WebOSLogo: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="webos_logo_grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#60a5fa" />
        <stop offset="0.5" stopColor="#a855f7" />
        <stop offset="1" stopColor="#ec4899" />
      </linearGradient>
      <linearGradient id="webos_core_grad" x1="12" y1="12" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ffffff" />
        <stop offset="1" stopColor="#cbd5e1" />
      </linearGradient>
    </defs>
    <rect width="40" height="40" rx="9" fill="url(#webos_logo_grad)" />
    {/* Inner glassy highlight */}
    <rect x="1" y="1" width="38" height="38" rx="8" stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="none" />
    {/* Geometric nexus symbol */}
    <circle cx="20" cy="20" r="10" stroke="white" strokeWidth="2.5" strokeOpacity="0.9" />
    <path d="M12 20C12 15.5817 15.5817 12 20 12C24.4183 12 28 15.5817 28 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="20" cy="20" r="4" fill="url(#webos_core_grad)" />
  </svg>
);

// Monochrome Menu Bar Apple Logo
export const AppleLogo: React.FC<IconProps> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 170 170" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.6-7.85-11.71-14.42-5.55-8.91-9.98-19.16-13.3-30.74-3.32-11.58-4.98-22.8-4.98-33.65 0-14.46 3.65-26.31 10.95-35.56 7.3-9.24 16.59-13.98 27.87-14.22 4.9 0 10.37 1.34 16.4 4.02 6.03 2.68 9.94 4.08 11.73 4.2 2.07-.12 6.22-1.64 12.44-4.56 6.23-2.92 11.66-4.32 16.3-4.2 12.06.61 21.84 5.38 29.35 14.32-10.49 6.35-15.62 15.15-15.39 26.4.24 8.79 3.53 16.23 9.87 22.32 6.34 6.09 13.9 9.61 22.68 10.57-2.33 7.07-5.18 14.34-8.54 21.8zm-30.82-104.9c0-6.73 2.45-13.12 7.35-19.17 4.9-6.05 11.02-10.05 18.36-12 0 .85.06 1.76.06 2.73 0 6.6-2.6 13.06-7.8 19.37-5.2 6.31-11.4 10.22-18.6 11.73-.24-.85-.37-1.74-.37-2.66z" />
  </svg>
);

export const WebOSMenuBarLogo = AppleLogo;

// Finder
export const FinderIcon: React.FC<IconProps> = ({ size = 64, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shadow-lg rounded-2xl ${className}`}>
    <defs>
      <linearGradient id="finder_bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0284c7" />
        <stop offset="1" stopColor="#0369a1" />
      </linearGradient>
      <linearGradient id="finder_left" x1="0" y1="0" x2="32" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38bdf8" />
        <stop offset="1" stopColor="#0284c7" />
      </linearGradient>
      <filter id="finder_glow" x="-2" y="-2" width="68" height="68" filterUnits="userSpaceOnUse">
        <feGaussianBlur stdDeviation="1.5" />
      </filter>
    </defs>
    <rect width="64" height="64" rx="14.3" fill="url(#finder_bg)" />
    <path d="M0 14.3C0 6.4 6.4 0 14.3 0H32V64H14.3C6.4 64 0 57.6 0 49.7V14.3Z" fill="url(#finder_left)" />
    <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.55" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
    {/* Stylized face lines */}
    <circle cx="21" cy="24" r="3.5" fill="#ffffff" />
    <circle cx="43" cy="24" r="3.5" fill="#ffffff" />
    <path d="M32 20V36H28" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19 40C23 46 41 46 45 40" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
  </svg>
);

// Launchpad App Drawer Icon (macOS Rocket)
export const LaunchpadIcon: React.FC<IconProps> = ({ size = 64, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shadow-lg rounded-2xl ${className}`}>
    <defs>
      <linearGradient id="launchpad_bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3b82f6" />
        <stop offset="0.5" stopColor="#6366f1" />
        <stop offset="1" stopColor="#8b5cf6" />
      </linearGradient>
      <linearGradient id="rocket_body" x1="28" y1="12" x2="48" y2="36" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ffffff" />
        <stop offset="1" stopColor="#cbd5e1" />
      </linearGradient>
      <linearGradient id="rocket_thruster" x1="24" y1="36" x2="16" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f59e0b" />
        <stop offset="0.5" stopColor="#ef4444" />
        <stop offset="1" stopColor="#fbbf24" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14.3" fill="url(#launchpad_bg)" />
    <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.55" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
    
    {/* Background stars */}
    <circle cx="16" cy="18" r="1" fill="white" opacity="0.6" />
    <circle cx="48" cy="14" r="1.2" fill="white" opacity="0.8" />
    <circle cx="52" cy="46" r="1" fill="white" opacity="0.6" />
    <circle cx="14" cy="42" r="1" fill="white" opacity="0.5" />
    
    {/* Rocket exhaust flame */}
    <path d="M22 36L14 44C13 45 13 47 15 47L19 46L20 50C20 52 22 52 23 51L31 43L22 36Z" fill="url(#rocket_thruster)" />
    <path d="M24 38L18 44C17.5 44.5 18 45.5 19 45.5L21 45L22 47C22.5 48 23.5 47.5 24 47L29 42L24 38Z" fill="#fef08a" />
    
    {/* Rocket fins */}
    <path d="M27 27L19 33L21 41L29 39L27 27Z" fill="#94a3b8" />
    <path d="M40 14L46 22L38 30L36 22L40 14Z" fill="#94a3b8" />
    
    {/* Rocket body */}
    <path d="M48 16C44 14 36 18 28 26C20 34 16 42 18 46C22 48 30 44 38 36C46 28 50 20 48 16Z" fill="url(#rocket_body)" />
    <path d="M48 16C47 15.5 43 17 38 22L42 26C47 21 48.5 17 48 16Z" fill="#ef4444" />
    
    {/* Rocket window */}
    <circle cx="35" cy="29" r="4" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
    <circle cx="34" cy="28" r="1.5" fill="#ffffff" opacity="0.8" />
  </svg>
);

// Browser / Web
export const BrowserIcon: React.FC<IconProps> = ({ size = 64, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shadow-lg rounded-2xl ${className}`}>
    <defs>
      <linearGradient id="browser_bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0ea5e9" />
        <stop offset="0.5" stopColor="#2563eb" />
        <stop offset="1" stopColor="#1e40af" />
      </linearGradient>
      <radialGradient id="browser_core" cx="50%" cy="50%" r="50%">
        <stop stopColor="#ffffff" stopOpacity="0.9" />
        <stop offset="1" stopColor="#93c5fd" stopOpacity="0.4" />
      </radialGradient>
    </defs>
    <rect width="64" height="64" rx="14.3" fill="url(#browser_bg)" />
    <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.55" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
    {/* Compass / Astrolabe tick marks */}
    <circle cx="32" cy="32" r="22" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeDasharray="2 3" />
    <circle cx="32" cy="32" r="17" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
    {/* Compass Needle */}
    <g transform="rotate(45 32 32)">
      <polygon points="32,12 36,32 32,32" fill="#ef4444" />
      <polygon points="32,12 28,32 32,32" fill="#dc2626" />
      <polygon points="32,52 36,32 32,32" fill="#e2e8f0" />
      <polygon points="32,52 28,32 32,32" fill="#cbd5e1" />
      <circle cx="32" cy="32" r="2.5" fill="#ffffff" />
    </g>
  </svg>
);

// Terminal
export const TerminalIcon: React.FC<IconProps> = ({ size = 64, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shadow-lg rounded-2xl ${className}`}>
    <defs>
      <linearGradient id="term_bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#27272a" />
        <stop offset="1" stopColor="#09090b" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14.3" fill="url(#term_bg)" />
    <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.55" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
    {/* Prompt glyph */}
    <path d="M16 22L28 32L16 42" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="32" y1="42" x2="48" y2="42" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

// Notes
export const NotesIcon: React.FC<IconProps> = ({ size = 64, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shadow-lg rounded-2xl ${className}`}>
    <defs>
      <linearGradient id="notes_bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fef08a" />
        <stop offset="1" stopColor="#facc15" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14.3" fill="url(#notes_bg)" />
    <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.55" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
    {/* Ruled lines */}
    <line x1="14" y1="20" x2="50" y2="20" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.4" />
    <line x1="14" y1="28" x2="50" y2="28" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.3" />
    <line x1="14" y1="36" x2="50" y2="36" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.3" />
    <line x1="14" y1="44" x2="38" y2="44" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.3" />
    {/* Stylized pencil */}
    <g transform="translate(36, 26) rotate(45)">
      <rect x="0" y="0" width="8" height="24" rx="2" fill="#ea580c" />
      <polygon points="0,24 8,24 4,30" fill="#fde047" />
      <polygon points="3,28 5,28 4,30" fill="#1e293b" />
    </g>
  </svg>
);

// TextEdit
export const TextEditIcon: React.FC<IconProps> = ({ size = 64, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shadow-lg rounded-2xl ${className}`}>
    <defs>
      <linearGradient id="textedit_bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f8fafc" />
        <stop offset="1" stopColor="#e2e8f0" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14.3" fill="url(#textedit_bg)" />
    <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.55" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" />
    {/* Page text mock */}
    <rect x="14" y="16" width="22" height="4" rx="2" fill="#0284c7" />
    <rect x="14" y="24" width="36" height="3" rx="1.5" fill="#94a3b8" />
    <rect x="14" y="31" width="30" height="3" rx="1.5" fill="#94a3b8" />
    <rect x="14" y="38" width="34" height="3" rx="1.5" fill="#94a3b8" />
    {/* Stylized Fountain Pen Nib */}
    <g transform="translate(36, 26) rotate(-25)">
      <path d="M8 0L14 16L12 28L8 34L4 28L2 16L8 0Z" fill="#2563eb" />
      <circle cx="8" cy="18" r="1.5" fill="#ffffff" />
      <line x1="8" y1="18" x2="8" y2="34" stroke="#ffffff" strokeWidth="1" />
    </g>
  </svg>
);

// Calculator
export const CalculatorIcon: React.FC<IconProps> = ({ size = 64, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shadow-lg rounded-2xl ${className}`}>
    <defs>
      <linearGradient id="calc_bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3f3f46" />
        <stop offset="1" stopColor="#18181b" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14.3" fill="url(#calc_bg)" />
    <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.55" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
    {/* Screen */}
    <rect x="12" y="12" width="40" height="12" rx="3" fill="#09090b" />
    <text x="48" y="22" fill="#22c55e" fontSize="9" fontWeight="600" textAnchor="end" fontFamily="sans-serif">42</text>
    {/* Keys */}
    <circle cx="18" cy="33" r="4.5" fill="#52525b" />
    <circle cx="32" cy="33" r="4.5" fill="#52525b" />
    <circle cx="46" cy="33" r="4.5" fill="#f97316" />
    <circle cx="18" cy="46" r="4.5" fill="#52525b" />
    <circle cx="32" cy="46" r="4.5" fill="#52525b" />
    <circle cx="46" cy="46" r="4.5" fill="#ea580c" />
  </svg>
);

// Calendar
export const CalendarIcon: React.FC<IconProps> = ({ size = 64, className = '' }) => {
  const today = new Date();
  const dayOfWeek = today.toLocaleString('default', { weekday: 'short' }).toUpperCase();
  const dayNum = today.getDate();

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shadow-lg rounded-2xl ${className}`}>
      <defs>
        <linearGradient id="cal_bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#f1f5f9" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14.3" fill="url(#cal_bg)" />
      <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.55" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" />
      {/* Red top bar */}
      <path d="M0 14.3C0 6.4 6.4 0 14.3 0H49.7C57.6 0 64 6.4 64 14.3V19H0V14.3Z" fill="#ef4444" />
      <text x="32" y="14" fill="#ffffff" fontSize="9" fontWeight="700" textAnchor="middle" letterSpacing="1" fontFamily="sans-serif">{dayOfWeek}</text>
      {/* Date */}
      <text x="32" y="47" fill="#1e293b" fontSize="28" fontWeight="300" textAnchor="middle" fontFamily="sans-serif">{dayNum}</text>
    </svg>
  );
};

// Photos
export const PhotosIcon: React.FC<IconProps> = ({ size = 64, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shadow-lg rounded-2xl ${className}`}>
    <defs>
      <linearGradient id="photos_bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ffffff" />
        <stop offset="1" stopColor="#f8fafc" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14.3" fill="url(#photos_bg)" />
    <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.55" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" />
    {/* Chromatic color wheel petals */}
    <g transform="translate(32, 32)">
      <ellipse cx="0" cy="-13" rx="5.5" ry="11" fill="#f43f5e" opacity="0.85" />
      <ellipse cx="11.5" cy="-6.5" rx="5.5" ry="11" fill="#f97316" opacity="0.85" transform="rotate(60)" />
      <ellipse cx="11.5" cy="6.5" rx="5.5" ry="11" fill="#eab308" opacity="0.85" transform="rotate(120)" />
      <ellipse cx="0" cy="13" rx="5.5" ry="11" fill="#22c55e" opacity="0.85" transform="rotate(180)" />
      <ellipse cx="-11.5" cy="6.5" rx="5.5" ry="11" fill="#06b6d4" opacity="0.85" transform="rotate(240)" />
      <ellipse cx="-11.5" cy="-6.5" rx="5.5" ry="11" fill="#8b5cf6" opacity="0.85" transform="rotate(300)" />
      <circle cx="0" cy="0" r="5" fill="#ffffff" />
    </g>
  </svg>
);

// Music
export const MusicIcon: React.FC<IconProps> = ({ size = 64, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shadow-lg rounded-2xl ${className}`}>
    <defs>
      <linearGradient id="music_bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fa233b" />
        <stop offset="1" stopColor="#fb5b6f" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14.3" fill="url(#music_bg)" />
    <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.55" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
    {/* Music notes */}
    <path d="M43 17V36.5C41.8 35.6 40.2 35 38.5 35C34.9 35 32 37.5 32 40.5C32 43.5 34.9 46 38.5 46C42.1 46 45 43.5 45 40.5V23.5L25 27.5V40.5C23.8 39.6 22.2 39 20.5 39C16.9 39 14 41.5 14 44.5C14 47.5 16.9 50 20.5 50C24.1 50 27 47.5 27 44.5V22L43 17Z" fill="#ffffff" />
  </svg>
);

// Weather
export const WeatherIcon: React.FC<IconProps> = ({ size = 64, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shadow-lg rounded-2xl ${className}`}>
    <defs>
      <linearGradient id="weather_bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38bdf8" />
        <stop offset="1" stopColor="#0284c7" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14.3" fill="url(#weather_bg)" />
    <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.55" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
    {/* Sun */}
    <circle cx="26" cy="26" r="10" fill="#facc15" />
    {/* Cloud */}
    <path d="M22 45C17.5817 45 14 41.4183 14 37C14 32.8687 17.1352 29.4705 21.1664 29.0494C22.6841 23.3364 27.8767 19 34 19C41.1797 19 47 24.8203 47 32C47 32.348 46.9863 32.6928 46.9593 33.0335C49.886 34.0921 52 36.9208 52 40.25C52 44.5302 48.5302 48 44.25 48H22" fill="#ffffff" opacity="0.95" />
  </svg>
);

// Settings
export const SettingsIcon: React.FC<IconProps> = ({ size = 64, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shadow-lg rounded-2xl ${className}`}>
    <defs>
      <linearGradient id="settings_bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#94a3b8" />
        <stop offset="1" stopColor="#475569" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14.3" fill="url(#settings_bg)" />
    <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.55" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
    {/* Gear icon */}
    <g transform="translate(32, 32)">
      <path d="M-6 -22L6 -22L7 -17L12 -15L16 -18L23 -11L20 -7L22 -2L27 -1L27 11L22 12L20 17L23 21L16 28L12 25L7 27L6 32L-6 32L-7 27L-12 25L-16 28L-23 21L-20 17L-22 12L-27 11L-27 -1L-22 -2L-20 -7L-23 -11L-16 -18L-12 -15L-7 -17Z" fill="#e2e8f0" />
      <circle cx="0" cy="0" r="10" fill="#334155" />
      <circle cx="0" cy="0" r="6" fill="#e2e8f0" />
    </g>
  </svg>
);

// Activity Monitor
export const ActivityMonitorIcon: React.FC<IconProps> = ({ size = 64, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shadow-lg rounded-2xl ${className}`}>
    <defs>
      <linearGradient id="act_bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1e293b" />
        <stop offset="1" stopColor="#0f172a" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14.3" fill="url(#act_bg)" />
    <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.55" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
    {/* Grid lines */}
    <line x1="12" y1="22" x2="52" y2="22" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
    <line x1="12" y1="32" x2="52" y2="32" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
    <line x1="12" y1="42" x2="52" y2="42" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
    {/* Pulse waveform */}
    <path d="M12 32H22L26 18L32 46L38 24L42 32H52" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// App Store
export const AppStoreIcon: React.FC<IconProps> = ({ size = 64, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shadow-lg rounded-2xl ${className}`}>
    <defs>
      <linearGradient id="store_bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3b82f6" />
        <stop offset="1" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14.3" fill="url(#store_bg)" />
    <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.55" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
    {/* Intersecting styluses forming 'A' */}
    <g transform="translate(32, 33)">
      <line x1="-14" y1="14" x2="0" y2="-16" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="14" y1="14" x2="0" y2="-16" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="-11" y1="4" x2="11" y2="4" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
    </g>
  </svg>
);

// Trash
export const TrashIcon: React.FC<IconProps & { isEmpty?: boolean }> = ({ size = 64, isEmpty = true, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="trash_can_grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ffffff" stopOpacity="0.4" />
        <stop offset="1" stopColor="#cbd5e1" stopOpacity="0.15" />
      </linearGradient>
    </defs>
    {/* Translucent frosted wireframe trash bin */}
    <path d="M18 20L21 54C21.2 56 22.8 57.5 24.8 57.5H39.2C41.2 57.5 42.8 56 43 54L46 20H18Z" fill="url(#trash_can_grad)" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
    <ellipse cx="32" cy="20" rx="14" ry="4" stroke="rgba(255,255,255,0.8)" strokeWidth="2" fill="rgba(255,255,255,0.2)" />
    {/* Inner trash paper sheets if not empty */}
    {!isEmpty && (
      <g>
        <path d="M25 24L32 16L36 22Z" fill="#f8fafc" opacity="0.9" />
        <path d="M30 22L38 15L42 20Z" fill="#e2e8f0" opacity="0.8" />
        <path d="M22 23L27 18L32 23Z" fill="#cbd5e1" opacity="0.85" />
      </g>
    )}
    {/* Ribbed lines */}
    <line x1="26" y1="24" x2="27.5" y2="52" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
    <line x1="32" y1="24" x2="32" y2="52" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
    <line x1="38" y1="24" x2="36.5" y2="52" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
  </svg>
);

// Clock Icon
export const ClockIcon: React.FC<IconProps> = ({ size = 64, className = '' }) => {
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = (time.getHours() % 12) + time.getMinutes() / 60;
  const minutes = time.getMinutes() + time.getSeconds() / 60;
  const seconds = time.getSeconds();

  const hourAngle = hours * 30;
  const minuteAngle = minutes * 6;
  const secondAngle = seconds * 6;

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shadow-lg rounded-2xl ${className}`}>
      <defs>
        <linearGradient id="clock_bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e293b" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14.3" fill="url(#clock_bg)" />
      <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.55" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="22" fill="#ffffff" />
      {/* Dial tick marks */}
      <line x1="32" y1="13" x2="32" y2="16" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
      <line x1="51" y1="32" x2="48" y2="32" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="51" x2="32" y2="48" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
      <line x1="13" y1="32" x2="16" y2="32" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
      {/* Hour hand */}
      <g transform={`rotate(${hourAngle}, 32, 32)`}>
        <line x1="32" y1="32" x2="32" y2="20" stroke="#0f172a" strokeWidth="2.8" strokeLinecap="round" />
      </g>
      {/* Minute hand */}
      <g transform={`rotate(${minuteAngle}, 32, 32)`}>
        <line x1="32" y1="32" x2="32" y2="15" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
      </g>
      {/* Second hand */}
      <g transform={`rotate(${secondAngle}, 32, 32)`}>
        <line x1="32" y1="38" x2="32" y2="14" stroke="#f97316" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="32" cy="32" r="2" fill="#f97316" />
      </g>
    </svg>
  );
};

// Reminders Icon
export const RemindersIcon: React.FC<IconProps> = ({ size = 64, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shadow-lg rounded-2xl ${className}`}>
    <rect width="64" height="64" rx="14.3" fill="#f8fafc" />
    <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.55" stroke="rgba(0,0,0,0.1)" strokeWidth="1.5" />
    {/* 3 bullet list items with colored circles */}
    <circle cx="20" cy="20" r="5" fill="#3b82f6" />
    <line x1="29" y1="20" x2="48" y2="20" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
    <circle cx="20" cy="32" r="5" fill="#f97316" />
    <line x1="29" y1="32" x2="48" y2="32" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
    <circle cx="20" cy="44" r="5" fill="#ef4444" />
    <line x1="29" y1="44" x2="44" y2="44" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// Photo Booth Icon
export const PhotoBoothIcon: React.FC<IconProps> = ({ size = 64, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shadow-lg rounded-2xl ${className}`}>
    <defs>
      <linearGradient id="booth_bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#dc2626" />
        <stop offset="1" stopColor="#991b1b" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14.3" fill="url(#booth_bg)" />
    <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.55" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
    {/* Photo Strip cards */}
    <rect x="16" y="12" width="32" height="40" rx="3" fill="#ffffff" className="drop-shadow-md" />
    <rect x="20" y="16" width="24" height="15" rx="2" fill="#0284c7" />
    <rect x="20" y="33" width="24" height="15" rx="2" fill="#f59e0b" />
    <circle cx="32" cy="23.5" r="4" fill="#ffffff" opacity="0.9" />
    <circle cx="32" cy="40.5" r="4" fill="#ffffff" opacity="0.9" />
  </svg>
);

// Disk Utility Icon
export const DiskUtilityIcon: React.FC<IconProps> = ({ size = 64, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shadow-lg rounded-2xl ${className}`}>
    <defs>
      <linearGradient id="disk_bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#475569" />
        <stop offset="1" stopColor="#1e293b" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14.3" fill="url(#disk_bg)" />
    <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.55" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
    {/* Hard drive platter */}
    <circle cx="32" cy="32" r="18" fill="#94a3b8" />
    <circle cx="32" cy="32" r="14" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
    <circle cx="32" cy="32" r="6" fill="#475569" />
    <circle cx="32" cy="32" r="2.5" fill="#f8fafc" />
    {/* Read write arm */}
    <path d="M44 44L34 34" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />
    {/* Stethoscope / Diagnostic badge */}
    <circle cx="46" cy="18" r="7" fill="#3b82f6" />
    <path d="M43 18L45 20L49 16" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Stickies Icon
export const StickiesIcon: React.FC<IconProps> = ({ size = 64, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shadow-lg rounded-2xl ${className}`}>
    <defs>
      <linearGradient id="stickies_bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fef08a" />
        <stop offset="1" stopColor="#facc15" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14.3" fill="url(#stickies_bg)" />
    <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.55" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
    {/* Folded bottom-right corner */}
    <path d="M46 64H14.3C6.4 64 0 57.6 0 49.7V14.3C0 6.4 6.4 0 14.3 0H49.7C57.6 0 64 6.4 64 14.3V46L46 64Z" fill="url(#stickies_bg)" />
    <path d="M46 46H64L46 64V46Z" fill="#eab308" />
    {/* Note Lines */}
    <line x1="14" y1="20" x2="46" y2="20" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="14" y1="28" x2="40" y2="28" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="14" y1="36" x2="34" y2="36" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
