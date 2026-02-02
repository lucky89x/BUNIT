import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Download, Volume2, RotateCcw } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string | null;
  fileName: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, fileName }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  if (!audioUrl) return null;

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          className="hidden"
        />
        
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <Volume2 className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <h3 className="text-slate-100 font-medium text-sm">Kết quả âm thanh</h3>
                    <p className="text-slate-500 text-xs">Sẵn sàng để nghe và tải xuống</p>
                </div>
            </div>
            
             <a
                href={audioUrl}
                download={`${fileName}.wav`}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors border border-slate-600"
            >
                <Download className="w-4 h-4" />
                <span>Tải xuống (.wav)</span>
            </a>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-indigo-500 transition-all duration-100 ease-linear"
                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                />
            </div>
             <div className="flex justify-between mt-2 text-xs text-slate-400 font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
            </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center gap-6">
             <button 
                onClick={() => {
                    if (audioRef.current) {
                        audioRef.current.currentTime = 0;
                        setCurrentTime(0);
                    }
                }}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Phát lại từ đầu"
            >
                <RotateCcw className="w-5 h-5" />
            </button>

            <button
                onClick={togglePlay}
                className="w-14 h-14 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all transform active:scale-95"
            >
                {isPlaying ? (
                    <Pause className="w-6 h-6 fill-current" />
                ) : (
                    <Play className="w-6 h-6 fill-current ml-1" />
                )}
            </button>
        </div>
    </div>
  );
};

export default AudioPlayer;
