import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Download, Trash2, Sliders, Sparkles, Image, Check } from 'lucide-react';
import { sound } from '../../core/sound';

interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: number;
  filter: string;
}

const FILTERS = [
  { id: 'normal', name: 'Normal', css: 'none' },
  { id: 'sepia', name: 'Sepia', css: 'sepia(0.9) contrast(1.1)' },
  { id: 'bw', name: 'B & W', css: 'grayscale(1) contrast(1.3)' },
  { id: 'pop', name: 'Pop Art', css: 'hue-rotate(90deg) saturate(3.5)' },
  { id: 'comic', name: 'Comic', css: 'contrast(2) brightness(1.1) grayscale(0.3)' },
  { id: 'thermal', name: 'Thermal', css: 'invert(1) hue-rotate(180deg) saturate(2)' },
  { id: 'glow', name: 'Glow', css: 'brightness(1.25) saturate(1.4)' },
  { id: 'vintage', name: 'Vintage', css: 'sepia(0.5) hue-rotate(-30deg) saturate(1.4)' },
];

export const PhotoBoothApp: React.FC<{ windowId: string }> = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>('normal');
  const [isCountingDown, setIsCountingDown] = useState<boolean>(false);
  const [countdownNum, setCountdownNum] = useState<number>(3);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [activePhoto, setActivePhoto] = useState<CapturedPhoto | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize webcam with fallback
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { width: 1280, height: 720 } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play();
            setIsWebcamActive(true);
          }
        })
        .catch(() => {
          setIsWebcamActive(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Capture photo with 3-2-1 countdown & flash
  const handleSnap = () => {
    if (isCountingDown) return;
    sound.playClick();
    setIsCountingDown(true);
    setCountdownNum(3);

    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdownNum(count);
        sound.playClick();
      } else {
        clearInterval(interval);
        setIsCountingDown(false);

        // Flash & Shutter
        setIsFlashing(true);
        sound.playScreenshot();
        setTimeout(() => setIsFlashing(false), 200);

        // Take snapshot from video or canvas
        takeSnapshot();
      }
    }, 800);
  };

  const takeSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 640;
    canvas.height = 480;

    const filterDef = FILTERS.find((f) => f.id === selectedFilter) || FILTERS[0];
    ctx.filter = filterDef.css;

    if (isWebcamActive && videoRef.current) {
      // Mirror image horizontally like real Photo Booth
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    } else {
      // Procedural camera simulator graphic
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 24px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('WebOS Photo Booth', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '14px -apple-system, sans-serif';
      ctx.fillText(new Date().toLocaleTimeString(), canvas.width / 2, canvas.height / 2 + 15);
    }

    const dataUrl = canvas.toDataURL('image/png');
    const newPhoto: CapturedPhoto = {
      id: `photo-${Date.now()}`,
      dataUrl,
      timestamp: Date.now(),
      filter: selectedFilter,
    };

    setPhotos((prev) => [newPhoto, ...prev]);
  };

  const currentFilterObj = FILTERS.find((f) => f.id === selectedFilter) || FILTERS[0];

  return (
    <div className="flex h-full w-full flex-col bg-neutral-950 text-white select-none overflow-hidden text-xs">
      {/* Viewfinder Main View */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
        {/* Live Video Feed with Filter */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            filter: currentFilterObj.css,
            transform: 'scaleX(-1)', // Mirrored view
          }}
          className={`h-full w-full object-contain ${isWebcamActive ? 'block' : 'hidden'}`}
        />

        {/* Fallback Viewfinder if webcam unavailable */}
        {!isWebcamActive && (
          <div
            style={{ filter: currentFilterObj.css }}
            className="flex flex-col items-center justify-center p-8 text-center space-y-3"
          >
            <div className="h-28 w-28 rounded-full border-4 border-dashed border-sky-400/40 flex items-center justify-center animate-pulse">
              <Camera size={48} className="text-sky-400" />
            </div>
            <h3 className="text-base font-bold text-white">Simulated iSight Camera</h3>
            <p className="text-xs text-white/50 max-w-sm">
              Ready to snap snapshots with full live filters! Click the red camera button below.
            </p>
          </div>
        )}

        {/* 3-2-1 Countdown Overlay */}
        {isCountingDown && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-xs">
            <span className="text-9xl font-extralight text-white drop-shadow-2xl animate-scale-in tabular-nums font-mono">
              {countdownNum}
            </span>
          </div>
        )}

        {/* Shutter Flash effect */}
        {isFlashing && (
          <div className="absolute inset-0 z-30 bg-white animate-fade-out pointer-events-none" />
        )}

        {/* Hidden processing canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Filter Selection Bar */}
      <div className="flex items-center justify-center gap-1.5 p-2 bg-neutral-900/90 border-t border-white/10 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => {
              sound.playClick();
              setSelectedFilter(f.id);
            }}
            className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all ${
              selectedFilter === f.id
                ? 'bg-[var(--accent)] text-white shadow-xs font-semibold'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            {f.name}
          </button>
        ))}
      </div>

      {/* Bottom Controls & Snapped Filmstrip */}
      <div className="flex items-center justify-between p-3 bg-neutral-900 border-t border-white/10">
        {/* Photo Count */}
        <div className="w-28 text-white/50 text-[11px]">
          {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
        </div>

        {/* Giant Red Camera Snap Button */}
        <button
          onClick={handleSnap}
          disabled={isCountingDown}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white shadow-xl ring-4 ring-white/20 transition-all cursor-pointer"
          title="Take Photo"
        >
          <Camera size={24} />
        </button>

        {/* Filmstrip previews */}
        <div className="w-28 flex justify-end gap-1.5 overflow-hidden">
          {photos.slice(0, 3).map((p) => (
            <img
              key={p.id}
              src={p.dataUrl}
              alt="Snapshot"
              onClick={() => setActivePhoto(p)}
              className="h-10 w-10 object-cover rounded-md border border-white/20 cursor-pointer hover:scale-110 transition-transform shadow-xs"
            />
          ))}
        </div>
      </div>

      {/* Photo Preview Modal */}
      {activePhoto && (
        <div
          onClick={() => setActivePhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-6 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="rounded-2xl border border-white/20 bg-neutral-900 p-4 shadow-2xl flex flex-col items-center gap-3 max-w-lg"
          >
            <img
              src={activePhoto.dataUrl}
              alt="Preview"
              className="max-h-[60vh] rounded-xl object-contain shadow-lg"
            />
            <div className="flex gap-2">
              <a
                href={activePhoto.dataUrl}
                download={`PhotoBooth-${activePhoto.timestamp}.png`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] text-white font-medium shadow-md hover:brightness-110"
              >
                <Download size={14} /> Download
              </a>
              <button
                onClick={() => {
                  setPhotos((prev) => prev.filter((p) => p.id !== activePhoto.id));
                  setActivePhoto(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
