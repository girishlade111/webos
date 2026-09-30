import React, { useState } from 'react';
import { 
  ZoomIn, ZoomOut, RotateCw, Play, Pause, Upload, 
  ChevronLeft, ChevronRight, X, Sliders, Image as ImgIcon 
} from 'lucide-react';
import { sound } from '../../core/sound';

interface PhotoItem {
  id: string;
  title: string;
  url: string;
  category: string;
}

// Built-in curated high-res geometric & architectural photography patterns
const SAMPLE_PHOTOS: PhotoItem[] = [
  {
    id: 'photo-1',
    title: 'Solar Flare Horizon',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    category: 'Nature',
  },
  {
    id: 'photo-2',
    title: 'Architectural Minimalist Lines',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    category: 'Architecture',
  },
  {
    id: 'photo-3',
    title: 'Neon Tokyo Rain Reflection',
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
    category: 'Urban',
  },
  {
    id: 'photo-4',
    title: 'Celestial Milky Way Core',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
    category: 'Space',
  },
  {
    id: 'photo-5',
    title: 'Alpine Emerald Lake Mist',
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
    category: 'Nature',
  },
  {
    id: 'photo-6',
    title: 'Abstract Gradient Flow',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    category: 'Abstract',
  },
];

type FilterType = 'normal' | 'grayscale' | 'sepia' | 'invert' | 'warm' | 'contrast';

const FILTERS: Record<FilterType, { name: string; css: string }> = {
  normal: { name: 'Original', css: 'none' },
  grayscale: { name: 'B&W Film', css: 'grayscale(100%)' },
  sepia: { name: 'Vintage Sepia', css: 'sepia(80%)' },
  invert: { name: 'Negative', css: 'invert(90%)' },
  warm: { name: 'Golden Hour', css: 'sepia(30%) saturate(140%) brightness(105%)' },
  contrast: { name: 'High Contrast', css: 'contrast(160%) saturate(120%)' },
};

export const PhotosApp: React.FC<{ windowId: string }> = () => {
  const [photos, setPhotos] = useState<PhotoItem[]>(SAMPLE_PHOTOS);
  const [activePhotoIdx, setActivePhotoIdx] = useState<number | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [activeFilter, setActiveFilter] = useState<FilterType>('normal');
  const [isPlayingSlideshow, setIsPlayingSlideshow] = useState<boolean>(false);

  const activePhoto = activePhotoIdx !== null ? photos[activePhotoIdx] : null;

  const handleOpenPhoto = (idx: number) => {
    sound.playClick();
    setActivePhotoIdx(idx);
    setZoom(1);
    setRotation(0);
    setActiveFilter('normal');
  };

  const handleCloseLightbox = () => {
    setActivePhotoIdx(null);
    setIsPlayingSlideshow(false);
  };

  const handleNextPhoto = () => {
    if (activePhotoIdx !== null) {
      setActivePhotoIdx((activePhotoIdx + 1) % photos.length);
      setZoom(1);
    }
  };

  const handlePrevPhoto = () => {
    if (activePhotoIdx !== null) {
      setActivePhotoIdx((activePhotoIdx - 1 + photos.length) % photos.length);
      setZoom(1);
    }
  };

  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const newPhoto: PhotoItem = {
          id: `photo-${Date.now()}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          url: reader.result as string,
          category: 'User Imports',
        };
        setPhotos([newPhoto, ...photos]);
        handleOpenPhoto(0);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-[var(--window-bg)] text-[var(--window-text)] select-none">
      {/* Photos Toolbar */}
      <div className="flex h-11 items-center justify-between border-b border-black/10 dark:border-white/10 px-4 bg-[var(--window-header)]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs text-neutral-800 dark:text-neutral-200">Library</span>
          <span className="text-[11px] text-neutral-400">({photos.length} items)</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 rounded-md bg-[var(--accent)] px-3 py-1 text-xs font-medium text-white shadow-sm hover:opacity-90 cursor-pointer">
            <Upload size={12} />
            <span>Import Photo</span>
            <input type="file" accept="image/*" onChange={handleUploadPhoto} className="hidden" />
          </label>
        </div>
      </div>

      {/* Grid Gallery */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => handleOpenPhoto(idx)}
              className="group relative aspect-4/3 cursor-pointer overflow-hidden rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md"
            >
              <img
                src={item.url}
                alt={item.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  // Fallback colored gradient
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                <span className="text-xs font-medium text-white truncate drop-shadow-sm">{item.title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {activePhoto && (
        <div 
          className="fixed inset-0 z-[999] flex flex-col bg-black/90 backdrop-blur-md text-white"
          onClick={handleCloseLightbox}
        >
          {/* Lightbox Header Bar */}
          <div 
            className="flex h-12 items-center justify-between px-4 border-b border-white/10 bg-black/40"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="font-medium text-xs truncate max-w-xs">{activePhoto.title}</span>
              <span className="text-[11px] text-neutral-400">
                {activePhotoIdx! + 1} of {photos.length}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                className="rounded p-1.5 hover:bg-white/10 text-neutral-300"
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <span className="text-xs font-mono tabular-nums">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                className="rounded p-1.5 hover:bg-white/10 text-neutral-300"
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              <div className="h-4 w-px bg-white/20 mx-1" />
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="rounded p-1.5 hover:bg-white/10 text-neutral-300"
                title="Rotate 90°"
              >
                <RotateCw size={16} />
              </button>
              <button
                onClick={() => setIsPlayingSlideshow(!isPlayingSlideshow)}
                className={`rounded p-1.5 hover:bg-white/10 transition-colors ${isPlayingSlideshow ? 'text-amber-400' : 'text-neutral-300'}`}
                title="Slideshow"
              >
                {isPlayingSlideshow ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <div className="h-4 w-px bg-white/20 mx-1" />
              <button
                onClick={handleCloseLightbox}
                className="rounded-full p-1.5 hover:bg-white/20 text-neutral-400 hover:text-white"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Lightbox Image Stage */}
          <div 
            className="flex-1 flex items-center justify-center p-8 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handlePrevPhoto}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 hover:bg-white/20 p-2.5 backdrop-blur-md transition-colors"
            >
              <ChevronLeft size={24} />
            </button>

            <img
              src={activePhoto.url}
              alt={activePhoto.title}
              referrerPolicy="no-referrer"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                filter: FILTERS[activeFilter].css,
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), filter 0.2s',
              }}
              className="max-h-full max-w-full object-contain drop-shadow-2xl rounded-lg"
            />

            <button
              onClick={handleNextPhoto}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 hover:bg-white/20 p-2.5 backdrop-blur-md transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Bottom Filter Strip */}
          <div 
            className="flex h-14 items-center justify-center gap-2 border-t border-white/10 bg-black/50 px-4"
            onClick={(e) => e.stopPropagation()}
          >
            {(Object.keys(FILTERS) as FilterType[]).map((fKey) => {
              const f = FILTERS[fKey];
              const isSelected = activeFilter === fKey;
              return (
                <button
                  key={fKey}
                  onClick={() => setActiveFilter(fKey)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-white text-black shadow-md font-semibold'
                      : 'text-neutral-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {f.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
