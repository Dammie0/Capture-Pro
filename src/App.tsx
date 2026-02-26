import React, { useState } from 'react';
import { useRecorder, RecorderSettings } from './hooks/useRecorder';
import { DraggableWebcam } from './components/DraggableWebcam';
import { 
  Monitor, Mic, Volume2, Video, Settings2, 
  Play, Square, Pause, Download, RotateCcw,
  Aperture
} from 'lucide-react';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export default function App() {
  const {
    status,
    countdown,
    timer,
    fileSize,
    mediaUrl,
    webcamStream,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    reset
  } = useRecorder();

  const [settings, setSettings] = useState<RecorderSettings>({
    quality: '1080p',
    audio: 'both',
    webcam: false
  });

  const handleStart = () => {
    startRecording(settings);
  };

  return (
    <div className="min-h-screen bg-dots relative text-zinc-50 font-sans selection:bg-zinc-800 flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              <Aperture size={18} className="text-black" />
            </div>
            <h1 className="font-display font-bold text-xl tracking-tight text-white">
              Capture<span className="text-zinc-500 font-medium">Pro</span>
            </h1>
          </div>
          
          {/* Status Indicator */}
          {(status === 'recording' || status === 'paused') && (
            <div className="flex items-center gap-4 px-4 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${status === 'recording' ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-amber-500'}`} />
                <span className="text-sm font-mono text-zinc-300">{formatTime(timer)}</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <span className="text-xs font-mono text-zinc-500">{formatBytes(fileSize)}</span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 flex flex-col justify-center relative">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        {status === 'idle' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10">
            <div className="text-center space-y-4">
              <h2 className="text-5xl md:text-6xl font-display font-bold tracking-tight bg-gradient-to-br from-white via-white to-zinc-500 bg-clip-text text-transparent">
                Record with precision.
              </h2>
              <p className="text-lg text-zinc-400 max-w-xl mx-auto font-light">
                High-quality screen capture tailored for creators. Configure your environment and start recording instantly.
              </p>
            </div>

            <div className="glass-panel rounded-[2rem] p-8 space-y-8 relative overflow-hidden">
              {/* Subtle inner glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              <div className="flex items-center gap-2 text-sm font-medium text-zinc-400 uppercase tracking-widest mb-2">
                <Settings2 size={16} />
                <span>Configuration</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Audio Source */}
                <div className="space-y-4">
                  <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Audio Source</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['none', 'mic', 'system', 'both'] as const).map(opt => (
                      <button
                        key={opt}
                        onClick={() => setSettings(s => ({ ...s, audio: opt }))}
                        className={`px-4 py-4 rounded-2xl text-sm font-medium transition-all duration-200 flex flex-col items-center justify-center gap-3 hardware-button
                          ${settings.audio === opt 
                            ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.15)] scale-[1.02]' 
                            : 'bg-black/40 border border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-black/60 hover:border-white/10'}`}
                      >
                        <div className={`p-2 rounded-full ${settings.audio === opt ? 'bg-black/5' : 'bg-white/5'}`}>
                          {opt === 'none' && <Volume2 size={18} className="opacity-50" />}
                          {opt === 'mic' && <Mic size={18} />}
                          {opt === 'system' && <Monitor size={18} />}
                          {opt === 'both' && <div className="flex -space-x-1"><Mic size={16} /><Monitor size={16} /></div>}
                        </div>
                        <span className="capitalize">{opt}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Video Quality */}
                  <div className="space-y-4">
                    <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Resolution</label>
                    <div className="flex p-1 rounded-2xl bg-black/40 border border-white/5">
                      {(['720p', '1080p'] as const).map(opt => (
                        <button
                          key={opt}
                          onClick={() => setSettings(s => ({ ...s, quality: opt }))}
                          className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-200 hardware-button
                            ${settings.quality === opt 
                              ? 'bg-white text-black shadow-sm' 
                              : 'text-zinc-400 hover:text-zinc-200'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Webcam Toggle */}
                  <div className="space-y-4">
                    <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Overlay</label>
                    <button
                      onClick={() => setSettings(s => ({ ...s, webcam: !s.webcam }))}
                      className={`w-full px-5 py-4 rounded-2xl border transition-all duration-200 flex items-center justify-between hardware-button
                        ${settings.webcam 
                          ? 'bg-white/10 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
                          : 'bg-black/40 border-white/5 text-zinc-400 hover:bg-black/60 hover:border-white/10'}`}
                    >
                      <div className="flex items-center gap-3">
                        <Video size={18} className={settings.webcam ? 'text-white' : 'text-zinc-500'} />
                        <span className="font-medium">Camera Picture-in-Picture</span>
                      </div>
                      <div className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${settings.webcam ? 'bg-white' : 'bg-zinc-800'}`}>
                        <div className={`w-5 h-5 rounded-full transition-transform duration-300 shadow-sm ${settings.webcam ? 'bg-black translate-x-5' : 'bg-zinc-400 translate-x-0'}`} />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-8">
              <button
                onClick={handleStart}
                className="group relative flex items-center justify-center w-32 h-32 rounded-full hardware-button"
                title="Start Recording"
              >
                {/* Outer glow */}
                <div className="absolute inset-0 rounded-full bg-red-500/20 blur-xl group-hover:bg-red-500/30 transition-colors duration-500" />
                {/* Border ring */}
                <div className="absolute inset-0 rounded-full border border-red-500/30 group-hover:border-red-500/60 group-hover:scale-105 transition-all duration-500" />
                {/* Inner button */}
                <div className="relative w-24 h-24 rounded-full bg-red-500 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.5)] group-hover:bg-red-400 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-white" />
                </div>
              </button>
            </div>
          </div>
        )}

        {status === 'countdown' && (
          <div className="flex flex-col items-center justify-center h-full space-y-8 animate-in zoom-in duration-300">
            <div className="text-[15rem] leading-none font-display font-bold text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.4)]">
              {countdown}
            </div>
            <div className="flex items-center gap-3 text-zinc-400">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <p className="font-mono tracking-widest uppercase text-sm">Preparing capture</p>
            </div>
          </div>
        )}

        {(status === 'recording' || status === 'paused') && (
          <div className="flex flex-col items-center justify-center h-full space-y-16 animate-in fade-in duration-500">
            <div className="text-center space-y-6 relative">
              {/* Ambient glow behind timer */}
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[150px] blur-[80px] rounded-full pointer-events-none transition-colors duration-1000 ${status === 'recording' ? 'bg-red-500/20' : 'bg-amber-500/10'}`} />
              
              <div className="text-8xl md:text-9xl font-mono font-light tracking-tighter text-white relative z-10 drop-shadow-2xl">
                {formatTime(timer)}
              </div>
              
              <div className="flex items-center justify-center gap-3">
                <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] ${status === 'recording' ? 'bg-red-500 text-red-500 animate-pulse' : 'bg-amber-500 text-amber-500'}`} />
                <div className="text-zinc-400 font-mono tracking-widest uppercase text-sm">
                  {status === 'paused' ? 'Paused' : 'Recording'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 glass-panel p-4 rounded-full">
              {status === 'recording' ? (
                <button
                  onClick={pauseRecording}
                  className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-all hardware-button"
                  title="Pause"
                >
                  <Pause size={20} className="fill-current" />
                </button>
              ) : (
                <button
                  onClick={resumeRecording}
                  className="w-14 h-14 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center transition-all hardware-button shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                  title="Resume"
                >
                  <Play size={20} className="fill-current ml-1" />
                </button>
              )}

              <button
                onClick={stopRecording}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center text-white transition-all hardware-button shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                title="Stop"
              >
                <Square size={24} className="fill-current" />
              </button>
            </div>
          </div>
        )}

        {status === 'preview' && mediaUrl && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 w-full max-w-5xl mx-auto relative z-10">
            <div className="flex items-end justify-between">
              <div className="space-y-2">
                <h2 className="text-3xl font-display font-bold tracking-tight text-white">Capture Complete</h2>
                <p className="text-zinc-400 font-mono text-sm">File size: {formatBytes(fileSize)}</p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={reset}
                  className="px-5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm font-medium text-zinc-300 hover:text-white hover:bg-black/60 transition-all hardware-button flex items-center gap-2"
                >
                  <RotateCcw size={16} />
                  Discard
                </button>
                <a
                  href={mediaUrl}
                  download={`capture-${new Date().getTime()}.webm`}
                  className="px-6 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-all hardware-button flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                  <Download size={16} />
                  Save Video
                </a>
              </div>
            </div>

            <div className="rounded-3xl overflow-hidden border border-white/10 bg-black aspect-video relative shadow-[0_20px_60px_rgba(0,0,0,0.5)] group">
              <video
                src={mediaUrl}
                controls
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}
      </main>

      {/* Webcam Overlay */}
      {webcamStream && (status === 'recording' || status === 'paused' || status === 'countdown') && (
        <DraggableWebcam stream={webcamStream} />
      )}
    </div>
  );
}
