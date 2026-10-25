import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Download, RotateCcw, Volume2 } from 'lucide-react';
import { formatTime } from '../utils/textUtils';

interface AudioPlayerProps {
  audioUrl: string | null;
  fileName: string;
  compact?: boolean;
}

const BARS = 96;

/** Tính biên độ đỉnh để vẽ dạng sóng. */
const usePeaks = (url: string | null, bars: number) => {
  const [peaks, setPeaks] = useState<number[]>([]);
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    (async () => {
      try {
        const buf = await (await fetch(url)).arrayBuffer();
        const ctx = new AudioContext();
        const audio = await ctx.decodeAudioData(buf);
        ctx.close();
        const data = audio.getChannelData(0);
        const step = Math.floor(data.length / bars) || 1;
        const out: number[] = [];
        for (let i = 0; i < bars; i++) {
          let max = 0;
          for (let j = i * step; j < (i + 1) * step && j < data.length; j++) max = Math.max(max, Math.abs(data[j]));
          out.push(max);
        }
        const top = Math.max(...out, 0.01);
        if (!cancelled) setPeaks(out.map((v) => Math.max(0.06, v / top)));
      } catch {
        if (!cancelled) setPeaks([]);
      }
    })();
    return () => { cancelled = true; };
  }, [url, bars]);
  return peaks;
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, fileName, compact }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const bars = compact ? 56 : BARS;
  const peaks = usePeaks(audioUrl, bars);

  useEffect(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
    setCurrentTime(0);
  }, [audioUrl]);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a || !audioUrl) return;
    if (a.paused) a.play(); else a.pause();
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  if (!audioUrl) return null;
  const progress = duration ? currentTime / duration : 0;

  return (
    <div className={compact ? '' : 'panel rise p-5 md:p-6'}>
      <audio
        ref={audioRef}
        src={audioUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => { setIsPlaying(false); setCurrentTime(0); }}
        className="hidden"
      />

      {!compact && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blade-500/10">
              <Volume2 className="h-5 w-5 text-blade-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Kết quả âm thanh</h3>
              <p className="text-xs text-ink-400">Đã lưu vào Thư viện · bấm vào sóng âm để tua</p>
            </div>
          </div>
          <a href={audioUrl} download={`${fileName}.wav`} className="btn-ghost">
            <Download className="h-4 w-4" /> Tải .wav
          </a>
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          className={`grid shrink-0 place-items-center rounded-full bg-blade-500 text-white shadow-lg shadow-blade-600/30 transition hover:bg-blade-400 active:scale-95 ${compact ? 'h-10 w-10' : 'h-14 w-14'}`}
          aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
        >
          {isPlaying ? <Pause className={`${compact ? 'h-4 w-4' : 'h-6 w-6'} fill-current`} /> : <Play className={`${compact ? 'h-4 w-4' : 'h-6 w-6'} ml-0.5 fill-current`} />}
        </button>

        <div className="min-w-0 flex-1">
          <div onClick={seek} className={`flex cursor-pointer items-center gap-[2px] ${compact ? 'h-9' : 'h-16'}`}>
            {(peaks.length ? peaks : Array.from({ length: bars }, () => 0.15)).map((p, i) => (
              <span
                key={i}
                className={`flex-1 rounded-full transition-colors ${i / bars < progress ? 'bg-blade-500' : 'bg-ink-600'}`}
                style={{ height: `${p * 100}%` }}
              />
            ))}
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[11px] text-ink-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {!compact && (
          <button
            onClick={() => { if (audioRef.current) audioRef.current.currentTime = 0; }}
            className="p-2 text-ink-400 transition-colors hover:text-ink-100"
            title="Phát lại từ đầu"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AudioPlayer;
