import React from 'react';
import { Monitor, Camera, RefreshCw } from 'lucide-react';

interface ScreenMonitorProps {
  screenshotUrl: string | null;
  activeWindow: string;
  onCaptureNow: () => void;
  isCapturing: boolean;
}

export const ScreenMonitor: React.FC<ScreenMonitorProps> = ({
  screenshotUrl,
  activeWindow,
  onCaptureNow,
  isCapturing
}) => {
  return (
    <div className="h-48 glass-panel rounded-3xl overflow-hidden relative group shrink-0 border border-white/10 shadow-lg select-none">
      {/* Top Banner Tag */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-200">
          Monitorando Tela
        </span>
      </div>

      {/* Capture Button */}
      <button
        onClick={onCaptureNow}
        disabled={isCapturing}
        title="Capturar quadro da tela agora"
        className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/10 text-gray-300 hover:text-white transition-all cursor-pointer"
      >
        <Camera className={`w-3.5 h-3.5 ${isCapturing ? 'animate-spin text-blue-400' : ''}`} />
      </button>

      {/* Screen Preview */}
      {screenshotUrl ? (
        <img
          src={screenshotUrl}
          alt="Visualização da Tela"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full bg-[#0a0c18] flex flex-col items-center justify-center text-center p-4 relative">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-2">
            <Monitor className="w-6 h-6" />
          </div>
          <span className="text-xs text-gray-400 font-medium">Visualização da Tela Principal</span>
          <span className="text-[10px] text-gray-600 mt-0.5">Clique na câmera para capturar</span>
        </div>
      )}

      {/* Bottom Gradient Overlay & Active Window Caption */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 pointer-events-none"></div>

      <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between text-[11px] text-gray-300 font-mono">
        <span className="truncate max-w-[200px]" title={activeWindow}>
          {activeWindow || 'Desktop Principal'}
        </span>
        <span className="text-[10px] text-blue-400 font-sans font-semibold">
          1920×1080
        </span>
      </div>
    </div>
  );
};
