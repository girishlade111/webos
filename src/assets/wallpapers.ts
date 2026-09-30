export interface WallpaperDefinition {
  id: string;
  name: string;
  type: 'gradient' | 'mesh';
  lightStyle: string;
  darkStyle: string;
  thumbnailColor: string;
}

export const WALLPAPERS: WallpaperDefinition[] = [
  {
    id: 'sequoia',
    name: 'macOS Sequoia',
    type: 'mesh',
    thumbnailColor: 'linear-gradient(135deg, #1e3a8a, #0284c7, #f59e0b)',
    lightStyle: `
      radial-gradient(at 20% 25%, #60a5fa 0px, transparent 55%),
      radial-gradient(at 80% 20%, #38bdf8 0px, transparent 50%),
      radial-gradient(at 45% 75%, #f59e0b 0px, transparent 55%),
      radial-gradient(at 85% 85%, #d97706 0px, transparent 50%),
      linear-gradient(145deg, #e0f2fe 0%, #fef3c7 100%)
    `,
    darkStyle: `
      radial-gradient(at 15% 20%, #1e3a8a 0px, transparent 50%),
      radial-gradient(at 85% 25%, #0369a1 0px, transparent 55%),
      radial-gradient(at 50% 65%, #92400e 0px, transparent 50%),
      radial-gradient(at 85% 85%, #b45309 0px, transparent 55%),
      radial-gradient(at 10% 80%, #0c1833 0px, transparent 50%),
      linear-gradient(145deg, #050b18 0%, #03060c 100%)
    `,
  },
  {
    id: 'sonoma',
    name: 'macOS Sonoma',
    type: 'mesh',
    thumbnailColor: 'linear-gradient(135deg, #0284c7, #38bdf8, #10b981)',
    lightStyle: `
      radial-gradient(at 25% 20%, #7dd3fc 0px, transparent 55%),
      radial-gradient(at 75% 25%, #34d399 0px, transparent 50%),
      radial-gradient(at 50% 70%, #0284c7 0px, transparent 55%),
      radial-gradient(at 85% 85%, #059669 0px, transparent 50%),
      linear-gradient(145deg, #f0fdf4 0%, #e0f2fe 100%)
    `,
    darkStyle: `
      radial-gradient(at 20% 20%, #075985 0px, transparent 50%),
      radial-gradient(at 80% 25%, #065f46 0px, transparent 55%),
      radial-gradient(at 45% 70%, #0369a1 0px, transparent 50%),
      radial-gradient(at 80% 85%, #064e3b 0px, transparent 50%),
      linear-gradient(145deg, #021e2f 0%, #010d14 100%)
    `,
  },
  {
    id: 'ventura',
    name: 'macOS Ventura',
    type: 'mesh',
    thumbnailColor: 'linear-gradient(135deg, #f97316, #ef4444, #3b82f6)',
    lightStyle: `
      radial-gradient(at 15% 15%, #fed7aa 0px, transparent 50%),
      radial-gradient(at 80% 20%, #f97316 0px, transparent 55%),
      radial-gradient(at 40% 65%, #ef4444 0px, transparent 50%),
      radial-gradient(at 85% 85%, #3b82f6 0px, transparent 55%),
      linear-gradient(145deg, #ffedd5 0%, #fee2e2 100%)
    `,
    darkStyle: `
      radial-gradient(at 20% 20%, #ea580c 0px, transparent 50%),
      radial-gradient(at 80% 20%, #b91c1c 0px, transparent 55%),
      radial-gradient(at 45% 70%, #1e3a8a 0px, transparent 55%),
      radial-gradient(at 85% 85%, #7c2d12 0px, transparent 50%),
      linear-gradient(145deg, #180904 0%, #0a040b 100%)
    `,
  },
  {
    id: 'monterey',
    name: 'macOS Monterey',
    type: 'mesh',
    thumbnailColor: 'linear-gradient(135deg, #d946ef, #8b5cf6, #1e1b4b)',
    lightStyle: `
      radial-gradient(at 20% 20%, #f0abfc 0px, transparent 50%),
      radial-gradient(at 80% 25%, #c084fc 0px, transparent 55%),
      radial-gradient(at 45% 70%, #a855f7 0px, transparent 50%),
      radial-gradient(at 85% 85%, #6366f1 0px, transparent 50%),
      linear-gradient(145deg, #fae8ff 0%, #ede9fe 100%)
    `,
    darkStyle: `
      radial-gradient(at 15% 20%, #c026d3 0px, transparent 50%),
      radial-gradient(at 85% 20%, #7e22ce 0px, transparent 55%),
      radial-gradient(at 45% 70%, #312e81 0px, transparent 55%),
      radial-gradient(at 85% 85%, #4c1d95 0px, transparent 50%),
      linear-gradient(145deg, #15061e 0%, #06020c 100%)
    `,
  },
  {
    id: 'bigsur',
    name: 'macOS Big Sur',
    type: 'mesh',
    thumbnailColor: 'linear-gradient(135deg, #f43f5e, #f59e0b, #0ea5e9)',
    lightStyle: `
      radial-gradient(at 10% 20%, #fbcfe8 0px, transparent 50%),
      radial-gradient(at 85% 15%, #fed7aa 0px, transparent 50%),
      radial-gradient(at 40% 70%, #fb7185 0px, transparent 50%),
      radial-gradient(at 90% 85%, #38bdf8 0px, transparent 55%),
      linear-gradient(145deg, #fff1f2 0%, #e0f2fe 100%)
    `,
    darkStyle: `
      radial-gradient(at 20% 20%, #e11d48 0px, transparent 50%),
      radial-gradient(at 80% 20%, #b45309 0px, transparent 50%),
      radial-gradient(at 40% 65%, #0369a1 0px, transparent 55%),
      radial-gradient(at 85% 85%, #6d28d9 0px, transparent 50%),
      linear-gradient(145deg, #130310 0%, #020813 100%)
    `,
  },
  {
    id: 'catalina',
    name: 'macOS Catalina',
    type: 'mesh',
    thumbnailColor: 'linear-gradient(135deg, #0284c7, #1e3a8a, #f97316)',
    lightStyle: `
      radial-gradient(at 20% 20%, #bae6fd 0px, transparent 50%),
      radial-gradient(at 80% 25%, #7dd3fc 0px, transparent 50%),
      radial-gradient(at 50% 70%, #0284c7 0px, transparent 55%),
      radial-gradient(at 85% 85%, #ea580c 0px, transparent 45%),
      linear-gradient(145deg, #e0f2fe 0%, #f0fdfa 100%)
    `,
    darkStyle: `
      radial-gradient(at 20% 20%, #0369a1 0px, transparent 50%),
      radial-gradient(at 80% 20%, #1e3a8a 0px, transparent 55%),
      radial-gradient(at 45% 75%, #0f172a 0px, transparent 60%),
      radial-gradient(at 85% 85%, #9a3412 0px, transparent 50%),
      linear-gradient(145deg, #030d1a 0%, #010408 100%)
    `,
  },
  {
    id: 'mojave',
    name: 'macOS Mojave',
    type: 'mesh',
    thumbnailColor: 'linear-gradient(135deg, #d97706, #7c2d12, #312e81)',
    lightStyle: `
      radial-gradient(at 20% 20%, #fef3c7 0px, transparent 50%),
      radial-gradient(at 80% 25%, #fde68a 0px, transparent 50%),
      radial-gradient(at 45% 70%, #f59e0b 0px, transparent 55%),
      radial-gradient(at 85% 85%, #d97706 0px, transparent 50%),
      linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%)
    `,
    darkStyle: `
      radial-gradient(at 20% 20%, #b45309 0px, transparent 50%),
      radial-gradient(at 80% 25%, #4c1d95 0px, transparent 55%),
      radial-gradient(at 45% 70%, #1e1b4b 0px, transparent 60%),
      radial-gradient(at 85% 85%, #831843 0px, transparent 50%),
      linear-gradient(145deg, #170817 0%, #05020a 100%)
    `,
  },
  {
    id: 'highsierra',
    name: 'macOS High Sierra',
    type: 'mesh',
    thumbnailColor: 'linear-gradient(135deg, #dc2626, #b91c1c, #1e3a8a)',
    lightStyle: `
      radial-gradient(at 20% 20%, #fecaca 0px, transparent 50%),
      radial-gradient(at 80% 25%, #fca5a5 0px, transparent 50%),
      radial-gradient(at 50% 70%, #ef4444 0px, transparent 55%),
      radial-gradient(at 85% 85%, #60a5fa 0px, transparent 50%),
      linear-gradient(145deg, #fef2f2 0%, #eff6ff 100%)
    `,
    darkStyle: `
      radial-gradient(at 20% 20%, #991b1b 0px, transparent 50%),
      radial-gradient(at 80% 25%, #7f1d1d 0px, transparent 55%),
      radial-gradient(at 45% 70%, #1e3a8a 0px, transparent 55%),
      radial-gradient(at 85% 85%, #0f172a 0px, transparent 50%),
      linear-gradient(145deg, #160404 0%, #030814 100%)
    `,
  },
  {
    id: 'elcapitan',
    name: 'macOS El Capitan',
    type: 'mesh',
    thumbnailColor: 'linear-gradient(135deg, #475569, #334155, #64748b)',
    lightStyle: `
      radial-gradient(at 20% 20%, #cbd5e1 0px, transparent 50%),
      radial-gradient(at 80% 20%, #94a3b8 0px, transparent 50%),
      radial-gradient(at 50% 70%, #64748b 0px, transparent 55%),
      linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)
    `,
    darkStyle: `
      radial-gradient(at 25% 20%, #334155 0px, transparent 50%),
      radial-gradient(at 85% 25%, #1e293b 0px, transparent 55%),
      radial-gradient(at 45% 70%, #0f172a 0px, transparent 55%),
      radial-gradient(at 85% 85%, #1e1b4b 0px, transparent 50%),
      linear-gradient(145deg, #090d14 0%, #030509 100%)
    `,
  },
  {
    id: 'yosemite',
    name: 'macOS Yosemite',
    type: 'mesh',
    thumbnailColor: 'linear-gradient(135deg, #f59e0b, #ec4899, #0284c7)',
    lightStyle: `
      radial-gradient(at 15% 20%, #fde68a 0px, transparent 50%),
      radial-gradient(at 80% 20%, #f472b6 0px, transparent 50%),
      radial-gradient(at 45% 70%, #38bdf8 0px, transparent 55%),
      linear-gradient(145deg, #fffbeb 0%, #f0fdf4 100%)
    `,
    darkStyle: `
      radial-gradient(at 20% 20%, #b45309 0px, transparent 50%),
      radial-gradient(at 80% 25%, #be185d 0px, transparent 55%),
      radial-gradient(at 45% 70%, #0369a1 0px, transparent 55%),
      radial-gradient(at 80% 85%, #1e1b4b 0px, transparent 50%),
      linear-gradient(145deg, #14050a 0%, #020814 100%)
    `,
  },
  {
    id: 'aqua',
    name: 'Mac OS X Aqua Classic',
    type: 'mesh',
    thumbnailColor: 'linear-gradient(135deg, #38bdf8, #0284c7, #0c4a6e)',
    lightStyle: `
      radial-gradient(at 20% 15%, #e0f2fe 0px, transparent 50%),
      radial-gradient(at 80% 20%, #7dd3fc 0px, transparent 55%),
      radial-gradient(at 40% 70%, #0284c7 0px, transparent 50%),
      radial-gradient(at 90% 85%, #0369a1 0px, transparent 55%),
      linear-gradient(145deg, #bae6fd 0%, #e0f2fe 100%)
    `,
    darkStyle: `
      radial-gradient(at 20% 15%, #0284c7 0px, transparent 55%),
      radial-gradient(at 80% 20%, #0369a1 0px, transparent 50%),
      radial-gradient(at 45% 75%, #0c4a6e 0px, transparent 60%),
      radial-gradient(at 85% 85%, #082f49 0px, transparent 55%),
      linear-gradient(145deg, #031c2e 0%, #010c14 100%)
    `,
  },
  {
    id: 'solaris',
    name: 'Solaris Horizon',
    type: 'mesh',
    thumbnailColor: 'linear-gradient(135deg, #ff7e5f, #feb47b, #ff2a6d)',
    lightStyle: `
      radial-gradient(at 10% 20%, #ffeaa7 0px, transparent 50%),
      radial-gradient(at 85% 15%, #fab1a0 0px, transparent 55%),
      radial-gradient(at 40% 70%, #ff7675 0px, transparent 50%),
      radial-gradient(at 90% 85%, #fd79a8 0px, transparent 55%),
      radial-gradient(at 15% 90%, #fdcb6e 0px, transparent 50%),
      linear-gradient(135deg, #fce4ec 0%, #ffe0b2 100%)
    `,
    darkStyle: `
      radial-gradient(at 15% 25%, #d63031 0px, transparent 50%),
      radial-gradient(at 80% 20%, #e17055 0px, transparent 55%),
      radial-gradient(at 50% 65%, #6c5ce7 0px, transparent 50%),
      radial-gradient(at 85% 85%, #b71540 0px, transparent 55%),
      radial-gradient(at 10% 80%, #0c2461 0px, transparent 50%),
      linear-gradient(145deg, #1e0b24 0%, #080310 100%)
    `,
  },
  {
    id: 'aurora',
    name: 'Celestial Aurora',
    type: 'mesh',
    thumbnailColor: 'linear-gradient(135deg, #00c6ff, #0072ff, #11998e)',
    lightStyle: `
      radial-gradient(at 20% 15%, #a8ff78 0px, transparent 50%),
      radial-gradient(at 75% 25%, #78ffd6 0px, transparent 50%),
      radial-gradient(at 35% 80%, #00b4db 0px, transparent 55%),
      radial-gradient(at 85% 80%, #0083b0 0px, transparent 50%),
      linear-gradient(140deg, #e0f7fa 0%, #e8f5e9 100%)
    `,
    darkStyle: `
      radial-gradient(at 20% 15%, #0575e6 0px, transparent 55%),
      radial-gradient(at 80% 20%, #00f260 0px, transparent 50%),
      radial-gradient(at 45% 75%, #0f2027 0px, transparent 60%),
      radial-gradient(at 85% 85%, #203a43 0px, transparent 55%),
      radial-gradient(at 10% 85%, #2c5364 0px, transparent 50%),
      linear-gradient(145deg, #061118 0%, #020609 100%)
    `,
  },
  {
    id: 'chroma',
    name: 'Chromatic Velvet',
    type: 'mesh',
    thumbnailColor: 'linear-gradient(135deg, #8a2387, #e94057, #f27121)',
    lightStyle: `
      radial-gradient(at 15% 20%, #fbc2eb 0px, transparent 50%),
      radial-gradient(at 85% 25%, #a6c1ee 0px, transparent 55%),
      radial-gradient(at 45% 75%, #fdcbf1 0px, transparent 50%),
      radial-gradient(at 85% 80%, #e6e9f0 0px, transparent 50%),
      linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)
    `,
    darkStyle: `
      radial-gradient(at 20% 20%, #4b1248 0px, transparent 50%),
      radial-gradient(at 80% 15%, #102a43 0px, transparent 55%),
      radial-gradient(at 40% 70%, #3b1443 0px, transparent 50%),
      radial-gradient(at 85% 85%, #2c1654 0px, transparent 55%),
      radial-gradient(at 10% 80%, #0f1026 0px, transparent 50%),
      linear-gradient(145deg, #130a1c 0%, #060309 100%)
    `,
  },
  {
    id: 'obsidian',
    name: 'Obsidian Flow',
    type: 'mesh',
    thumbnailColor: 'linear-gradient(135deg, #232526, #414345, #141e30)',
    lightStyle: `
      radial-gradient(at 20% 20%, #dfe4ea 0px, transparent 50%),
      radial-gradient(at 80% 20%, #ced6e0 0px, transparent 50%),
      radial-gradient(at 50% 70%, #a4b0be 0px, transparent 55%),
      linear-gradient(135deg, #f1f2f6 0%, #e4e7eb 100%)
    `,
    darkStyle: `
      radial-gradient(at 25% 20%, #2c3e50 0px, transparent 50%),
      radial-gradient(at 85% 25%, #1e272e 0px, transparent 55%),
      radial-gradient(at 45% 70%, #171c24 0px, transparent 50%),
      radial-gradient(at 85% 85%, #0f141d 0px, transparent 50%),
      linear-gradient(145deg, #0d0f12 0%, #050608 100%)
    `,
  },
  {
    id: 'neoflora',
    name: 'Neo Botanical',
    type: 'mesh',
    thumbnailColor: 'linear-gradient(135deg, #11998e, #38ef7d, #ff6b6b)',
    lightStyle: `
      radial-gradient(at 15% 20%, #b8e994 0px, transparent 50%),
      radial-gradient(at 80% 25%, #78e08f 0px, transparent 50%),
      radial-gradient(at 50% 70%, #82ccdd 0px, transparent 55%),
      radial-gradient(at 85% 85%, #60a3bc 0px, transparent 50%),
      linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)
    `,
    darkStyle: `
      radial-gradient(at 20% 20%, #0a3d62 0px, transparent 50%),
      radial-gradient(at 85% 25%, #1e3799 0px, transparent 55%),
      radial-gradient(at 45% 70%, #0c2461 0px, transparent 50%),
      radial-gradient(at 80% 85%, #3c6382 0px, transparent 50%),
      linear-gradient(145deg, #091724 0%, #03080f 100%)
    `,
  },
];
