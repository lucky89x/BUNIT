import React, { useState } from 'react';
import Header from './components/Header';
import LoadingOverlay from './components/LoadingOverlay';
import AudioPlayer from './components/AudioPlayer';
import { generateSpeech } from './services/geminiService';
import { VOICE_OPTIONS, VoiceName } from './types';
import { Wand2, AlertCircle, Gauge } from 'lucide-react';

const App: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>(VoiceName.Zephyr); // Default to a clear voice
  const [speed, setSpeed] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!text.trim()) {
        setError('Vui lòng nhập nội dung văn bản.');
        return;
    }

    if (text.length > 3000) {
        setError('Văn bản quá dài. Vui lòng giới hạn dưới 3000 ký tự để có kết quả tốt nhất.');
        return;
    }

    setIsLoading(true);
    setError(null);
    setAudioUrl(null);

    try {
      const blob = await generateSpeech(text, selectedVoice, speed);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (err: any) {
      console.error(err);
      setError('Đã có lỗi xảy ra khi tạo giọng nói. Vui lòng kiểm tra kết nối mạng và API Key.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSpeedLabel = (val: number) => {
    if (val <= 0.5) return 'Rất chậm';
    if (val <= 0.75) return 'Chậm';
    if (val < 1.0) return 'Hơi chậm';
    if (val === 1.0) return 'Bình thường';
    if (val <= 1.25) return 'Hơi nhanh';
    if (val <= 1.5) return 'Nhanh';
    return 'Rất nhanh';
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header />
      <LoadingOverlay isVisible={isLoading} />

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Input */}
            <div className="lg:col-span-2 space-y-6">
                
                <div className="bg-slate-900 rounded-xl p-1 border border-slate-800 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
                     <textarea
                        className="w-full h-80 bg-slate-900 text-slate-100 p-4 rounded-lg resize-none focus:outline-none placeholder:text-slate-600 leading-relaxed text-lg"
                        placeholder="Nhập nội dung kịch bản bạn muốn lồng tiếng vào đây..."
                        value={text}
                        onChange={(e) => {
                            setText(e.target.value);
                            if (error) setError(null);
                        }}
                        maxLength={5000}
                    />
                    <div className="px-4 py-2 flex justify-between items-center text-xs text-slate-500 border-t border-slate-800">
                        <span>Nhập tiếng Việt có dấu</span>
                        <span>{text.length} / 5000 ký tự</span>
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-4 bg-red-900/20 border border-red-800/50 rounded-lg text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}
            </div>

            {/* Right Column: Settings & Actions */}
            <div className="space-y-6">
                
                {/* Voice Selection */}
                <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                    <h2 className="text-slate-100 font-semibold mb-4 text-sm uppercase tracking-wider">Chọn Giọng Đọc</h2>
                    <div className="space-y-3">
                        {VOICE_OPTIONS.map((voice) => (
                            <label 
                                key={voice.id}
                                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                    selectedVoice === voice.id 
                                    ? 'bg-indigo-600/10 border-indigo-500/50 ring-1 ring-indigo-500/50' 
                                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="voice"
                                    className="mt-1 sr-only"
                                    checked={selectedVoice === voice.id}
                                    onChange={() => setSelectedVoice(voice.id)}
                                />
                                <div className={`w-4 h-4 mt-1 rounded-full border flex items-center justify-center ${selectedVoice === voice.id ? 'border-indigo-500' : 'border-slate-500'}`}>
                                    {selectedVoice === voice.id && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-medium ${selectedVoice === voice.id ? 'text-indigo-400' : 'text-slate-200'}`}>
                                            {voice.name}
                                        </span>
                                        <span className="text-[10px] uppercase px-1.5 py-0.5 bg-slate-700 rounded text-slate-400 font-semibold">
                                            {voice.gender}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">{voice.description}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Speed Control */}
                <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-slate-100 font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
                            <Gauge className="w-4 h-4 text-slate-400" />
                            Tốc độ đọc
                        </h2>
                        <span className="text-xs font-mono bg-slate-800 text-indigo-400 px-2 py-1 rounded">
                            {speed}x
                        </span>
                    </div>
                    
                    <div className="mb-2 flex justify-between text-xs text-slate-500 font-medium">
                        <span>Chậm</span>
                        <span>Bình thường</span>
                        <span>Nhanh</span>
                    </div>
                    
                    <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.25"
                        value={speed}
                        onChange={(e) => setSpeed(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
                    />
                    
                    <div className="mt-3 text-center">
                        <span className="text-sm text-slate-300 font-medium">
                            {getSpeedLabel(speed)}
                        </span>
                    </div>
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !text.trim()}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-all flex items-center justify-center gap-2 group"
                >
                    <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    <span>Tạo Giọng Nói</span>
                </button>

                 <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 text-xs text-slate-400 leading-relaxed">
                    <p>💡 <strong>Mẹo:</strong> Sử dụng dấu câu (chấm, phẩy) để ngắt nghỉ hợp lý. Kiểm tra chính tả tiếng Việt để AI đọc chính xác nhất.</p>
                </div>
            </div>
        </div>

        {/* Audio Output Section */}
        {audioUrl && (
            <div className="max-w-2xl mx-auto">
                 <AudioPlayer audioUrl={audioUrl} fileName="vietvoice_output" />
            </div>
        )}

      </main>
    </div>
  );
};

export default App;
