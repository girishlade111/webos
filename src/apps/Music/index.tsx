import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Shuffle, Repeat, Music as MusicIcon, ListMusic 
} from 'lucide-react';
import { sound } from '../../core/sound';
import { useViewportStore } from '../../core/viewportStore';

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  color: string;
  notes: number[]; // frequencies for generative synth
}

const PLAYLIST: Track[] = [
  {
    id: 'track-1',
    title: 'Solar Wind Ambient',
    artist: 'WebOS Soundscapes',
    album: 'Horizons Vol. 1',
    duration: 180,
    color: 'from-amber-500 to-rose-600',
    notes: [261.63, 329.63, 392.00, 523.25, 440.00, 349.23], // C4, E4, G4, C5, A4, F4
  },
  {
    id: 'track-2',
    title: 'Neon Drift Nocturne',
    artist: 'Cybernetic Echoes',
    album: 'Obsidian Flow',
    duration: 210,
    color: 'from-blue-600 to-indigo-900',
    notes: [220.00, 261.63, 293.66, 329.63, 392.00, 440.00], // A3, C4, D4, E4, G4, A4
  },
  {
    id: 'track-3',
    title: 'Emerald Forest Breeze',
    artist: 'Atmospheric Labs',
    album: 'Neo Botanical',
    duration: 165,
    color: 'from-emerald-500 to-teal-800',
    notes: [329.63, 392.00, 440.00, 493.88, 587.33, 659.25], // E4, G4, A4, B4, D5, E5
  },
  {
    id: 'track-4',
    title: 'Velvet Midnight Chill',
    artist: 'Retro Horizon',
    album: 'Velvet Sessions',
    duration: 195,
    color: 'from-purple-600 to-pink-600',
    notes: [174.61, 220.00, 261.63, 329.63, 392.00, 440.00], // F3, A3, C4, E4, G4, A4
  },
];

export const MusicApp: React.FC<{ windowId: string }> = () => {
  const isCompact = useViewportStore((s) => s.isCompact);
  const [currentTrackIdx, setCurrentTrackIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(24);
  const [volume, setVolume] = useState<number>(75);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthTimerRef = useRef<number | null>(null);

  const track = PLAYLIST[currentTrackIdx];

  // Procedural Web Audio Synth for ambient playback
  const startSynth = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      let noteIdx = 0;
      const playStep = () => {
        if (!audioCtxRef.current) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const freq = track.notes[noteIdx % track.notes.length];
        noteIdx++;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const currentVol = isMuted ? 0 : (volume / 100) * 0.15;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(currentVol, now + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 2.3);

        synthTimerRef.current = window.setTimeout(playStep, 1400);
      };

      playStep();
    } catch {}
  };

  const stopSynth = () => {
    if (synthTimerRef.current) {
      clearTimeout(synthTimerRef.current);
      synthTimerRef.current = null;
    }
  };

  const togglePlay = () => {
    sound.playClick();
    if (isPlaying) {
      stopSynth();
      setIsPlaying(false);
    } else {
      startSynth();
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    sound.playClick();
    stopSynth();
    const nextIdx = (currentTrackIdx + 1) % PLAYLIST.length;
    setCurrentTrackIdx(nextIdx);
    setCurrentTime(0);
    if (isPlaying) {
      setTimeout(startSynth, 100);
    }
  };

  const handlePrev = () => {
    sound.playClick();
    stopSynth();
    const prevIdx = (currentTrackIdx - 1 + PLAYLIST.length) % PLAYLIST.length;
    setCurrentTrackIdx(prevIdx);
    setCurrentTime(0);
    if (isPlaying) {
      setTimeout(startSynth, 100);
    }
  };

  // Timer simulation
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((t) => {
          if (t >= track.duration) {
            handleNext();
            return 0;
          }
          return t + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, track.duration]);

  // Audio Visualizer Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barCount = 36;
      const barWidth = canvas.width / barCount - 2;

      for (let i = 0; i < barCount; i++) {
        let height = 4;
        if (isPlaying) {
          const wave = Math.sin(phase + i * 0.3) * 0.5 + 0.5;
          const noise = Math.sin(i * 1.5 + phase * 2) * 0.3 + 0.3;
          height = Math.max(6, (wave * noise * canvas.height * 0.85) * (volume / 100));
        }

        const x = i * (barWidth + 2);
        const y = canvas.height - height;

        const grad = ctx.createLinearGradient(0, canvas.height, 0, y);
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
        grad.addColorStop(1, 'rgba(244, 63, 94, 0.4)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, height, [3, 3, 0, 0]);
        ctx.fill();
      }

      phase += 0.08;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, volume]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex h-full w-full bg-[var(--window-bg)] text-[var(--window-text)] select-none">
      {/* Left Pane: Album Art & Controls */}
      <div className="flex flex-1 flex-col items-center justify-between p-6">
        {/* Album Art Showcase */}
        <div className="flex flex-col items-center space-y-4 my-auto">
          <div className={`relative h-44 w-44 rounded-2xl bg-gradient-to-br ${track.color} shadow-2xl p-4 flex flex-col justify-between overflow-hidden`}>
            <div className="flex justify-between items-center text-white/70 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Stereo</span>
              <MusicIcon size={16} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight drop-shadow-md">{track.title}</h3>
              <p className="text-xs text-white/80">{track.artist}</p>
            </div>
            <div className="absolute -right-8 -bottom-8 h-28 w-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white truncate max-w-xs">{track.title}</h2>
            <p className="text-xs text-neutral-500 truncate max-w-xs">{track.artist} — {track.album}</p>
          </div>
        </div>

        {/* Visualizer canvas */}
        <div className="w-full max-w-md h-12 my-2">
          <canvas ref={canvasRef} width={380} height={48} className="w-full h-full" />
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md space-y-1">
          <div className="relative h-1.5 w-full bg-black/10 dark:bg-white/10 rounded-full cursor-pointer overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-all"
              style={{ width: `${(currentTime / track.duration) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(track.duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-6 mt-3">
          <button
            onClick={() => setIsShuffle(!isShuffle)}
            className={`p-1.5 transition-colors ${isShuffle ? 'text-[var(--accent)]' : 'text-neutral-400 hover:text-neutral-600'}`}
          >
            <Shuffle size={14} />
          </button>
          <button onClick={handlePrev} className="p-2 text-neutral-700 dark:text-neutral-200 hover:scale-110 transition-transform">
            <SkipBack size={20} />
          </button>
          <button
            onClick={togglePlay}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg hover:scale-105 active:scale-95 transition-transform"
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-1" />}
          </button>
          <button onClick={handleNext} className="p-2 text-neutral-700 dark:text-neutral-200 hover:scale-110 transition-transform">
            <SkipForward size={20} />
          </button>
          <button
            onClick={() => setIsRepeat(!isRepeat)}
            className={`p-1.5 transition-colors ${isRepeat ? 'text-[var(--accent)]' : 'text-neutral-400 hover:text-neutral-600'}`}
          >
            <Repeat size={14} />
          </button>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-2 mt-4 w-44">
          <button onClick={() => setIsMuted(!isMuted)} className="text-neutral-400 hover:text-neutral-600">
            {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(Number(e.target.value));
              setIsMuted(false);
            }}
            className="w-full h-1 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
          />
        </div>
      </div>

      {/* Right Sidebar: Playlist Queue — hidden on compact. */}
      {!isCompact && (
      <div className="w-56 border-l border-black/10 dark:border-white/10 bg-[var(--window-sidebar)] p-3 flex flex-col">
        <div className="flex items-center gap-2 pb-2 border-b border-black/10 dark:border-white/10 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
          <ListMusic size={14} />
          <span>Queue ({PLAYLIST.length})</span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 py-2">
          {PLAYLIST.map((item, idx) => {
            const isCurrent = idx === currentTrackIdx;
            return (
              <div
                key={item.id}
                onClick={() => {
                  stopSynth();
                  setCurrentTrackIdx(idx);
                  setCurrentTime(0);
                  if (isPlaying) setTimeout(startSynth, 50);
                }}
                className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                  isCurrent
                    ? 'bg-[var(--accent)] text-white font-semibold'
                    : 'hover:bg-black/5 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <div className="truncate pr-2">
                  <div className="truncate">{item.title}</div>
                  <div className="text-[10px] opacity-70 truncate">{item.artist}</div>
                </div>
                <span className="text-[10px] tabular-nums font-mono opacity-60">
                  {formatTime(item.duration)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
};
