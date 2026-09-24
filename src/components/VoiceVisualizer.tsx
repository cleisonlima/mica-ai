import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Activity, 
  Radio, 
  Zap,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface VoiceVisualizerProps {
  isSpeaking: boolean;
  isListening: boolean;
  isProcessing: boolean;
  onToggleVoice: () => void;
  onStopSpeaking?: () => void;
  statusMessage?: string;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  isSpeaking,
  isListening,
  isProcessing,
  onToggleVoice,
  onStopSpeaking,
  statusMessage
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  const [amplitude, setAmplitude] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [visualMode, setVisualMode] = useState<'hologram' | 'plasma' | 'quantum'>('hologram');

  // Initialize Web Audio API for live mic input
  useEffect(() => {
    let active = true;

    async function startAudioCapture() {
      if (isListening) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (!active) {
            stream.getTracks().forEach(t => t.stop());
            return;
          }
          mediaStreamRef.current = stream;

          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioContextClass();
          audioContextRef.current = ctx;

          const analyser = ctx.createAnalyser();
          analyser.fftSize = 128;
          analyser.smoothingTimeConstant = 0.8;
          analyserRef.current = analyser;

          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);
          sourceNodeRef.current = source;
        } catch (err) {
          console.warn('Microphone access for visualizer analyser:', err);
        }
      } else {
        // Clean up audio capture
        if (sourceNodeRef.current) {
          sourceNodeRef.current.disconnect();
          sourceNodeRef.current = null;
        }
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(t => t.stop());
          mediaStreamRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
        }
        analyserRef.current = null;
      }
    }

    startAudioCapture();

    return () => {
      active = false;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isListening]);

  // Main Canvas Rendering Loop with Web Audio Data & Harmonic Physics
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;
    let particlePhase = 0;
    const dataArray = new Uint8Array(64);

    // Particles system in orb orbit
    const particles: Array<{ angle: number; speed: number; radiusOffset: number; size: number; alpha: number }> = [];
    for (let i = 0; i < 48; i++) {
      particles.push({
        angle: Math.random() * Math.PI * 2,
        speed: (Math.random() * 0.02 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
        radiusOffset: (Math.random() - 0.5) * 35,
        size: Math.random() * 2.5 + 1,
        alpha: Math.random() * 0.7 + 0.3
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = isExpanded ? 54 : 36;

      let currentAmp = 0;

      // Extract real audio frequency data if analyser is active
      if (analyserRef.current && isListening) {
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        currentAmp = Math.min(1.5, (sum / dataArray.length) / 45);
      } else if (isSpeaking) {
        // Dynamic simulated voice amplitude
        const voicePulse = Math.sin(phase * 4) * 0.4 + Math.sin(phase * 7.5) * 0.3 + Math.cos(phase * 12) * 0.2;
        currentAmp = 0.55 + Math.max(0, voicePulse * 0.45);
      } else if (isProcessing) {
        currentAmp = 0.35 + Math.sin(phase * 3) * 0.15;
      } else {
        currentAmp = 0.12 + Math.sin(phase * 1.5) * 0.05;
      }

      setAmplitude(currentAmp);

      // Phase progression
      phase += isListening ? 0.07 + currentAmp * 0.05 : isSpeaking ? 0.06 : isProcessing ? 0.04 : 0.02;
      particlePhase += 0.02;

      // 1. Deep Atmospheric Glow Outer Aura
      const outerGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.3,
        centerX,
        centerY,
        baseRadius * (1.8 + currentAmp * 0.5)
      );

      if (isListening) {
        outerGlow.addColorStop(0, 'rgba(244, 114, 182, 0.42)');
        outerGlow.addColorStop(0.5, 'rgba(236, 72, 153, 0.22)');
        outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (isSpeaking) {
        outerGlow.addColorStop(0, 'rgba(251, 113, 133, 0.45)');
        outerGlow.addColorStop(0.45, 'rgba(168, 85, 247, 0.28)');
        outerGlow.addColorStop(1, 'rgba(139, 92, 246, 0)');
      } else if (isProcessing) {
        outerGlow.addColorStop(0, 'rgba(216, 180, 254, 0.38)');
        outerGlow.addColorStop(0.5, 'rgba(244, 114, 182, 0.2)');
        outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        outerGlow.addColorStop(0, 'rgba(244, 114, 182, 0.24)');
        outerGlow.addColorStop(0.6, 'rgba(168, 85, 247, 0.1)');
        outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }

      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * (1.8 + currentAmp * 0.5), 0, Math.PI * 2);
      ctx.fill();

      // 2. Neon arrow accents inspired by the MICA logo
      const accentCount = 6;
      ctx.save();
      for (let i = 0; i < accentCount; i++) {
        const angle = (i / accentCount) * Math.PI * 2 + phase * 0.35;
        const radius = baseRadius + 34 + currentAmp * 18;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + 18 + currentAmp * 12);
        const y2 = centerY + Math.sin(angle) * (radius + 18 + currentAmp * 12);

        ctx.strokeStyle = i % 2 === 0 ? 'rgba(59, 130, 246, 0.95)' : 'rgba(168, 85, 247, 0.95)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        const arrowAngle = Math.atan2(y2 - y, x2 - x);
        const arrowSize = 9 + currentAmp * 8;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(
          x2 - Math.cos(arrowAngle - Math.PI / 6) * arrowSize,
          y2 - Math.sin(arrowAngle - Math.PI / 6) * arrowSize
        );
        ctx.lineTo(
          x2 - Math.cos(arrowAngle + Math.PI / 6) * arrowSize,
          y2 - Math.sin(arrowAngle + Math.PI / 6) * arrowSize
        );
        ctx.closePath();
        ctx.fillStyle = i % 2 === 0 ? 'rgba(96, 165, 250, 0.95)' : 'rgba(216, 180, 254, 0.95)';
        ctx.fill();
      }
      ctx.restore();

      // 2. Frequency Radial Spikes (when listening or speaking)
      const spikeCount = 36;
      if (isListening || isSpeaking || isProcessing) {
        ctx.save();
        for (let i = 0; i < spikeCount; i++) {
          const angle = (i / spikeCount) * Math.PI * 2 + phase * 0.2;
          const freqVal = dataArray[i % dataArray.length] || (Math.sin(angle * 4 + phase * 3) * 50 + 50);
          const spikeLength = (freqVal / 255) * (30 * currentAmp) + 4;

          const x1 = centerX + Math.cos(angle) * (baseRadius + 6);
          const y1 = centerY + Math.sin(angle) * (baseRadius + 6);
          const x2 = centerX + Math.cos(angle) * (baseRadius + 6 + spikeLength);
          const y2 = centerY + Math.sin(angle) * (baseRadius + 6 + spikeLength);

          ctx.strokeStyle = isListening 
            ? `rgba(251, 113, 133, ${0.4 + (freqVal / 255) * 0.5})` 
            : `rgba(56, 189, 248, ${0.3 + (freqVal / 255) * 0.6})`;
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 3. Multi-Harmonic Deforming Wave Rings
      const points = 72;
      const waveLayers = [
        {
          color: isListening ? '#f43f5e' : isSpeaking ? '#f472b6' : isProcessing ? '#d946ef' : '#f9a8d4',
          freq: 5,
          speed: 1.0,
          ampMultiplier: 16 * currentAmp,
          lineWidth: 2.5
        },
        {
          color: isListening ? '#fb7185' : isSpeaking ? '#c084fc' : isProcessing ? '#f9a8d4' : '#c4b5fd',
          freq: 7,
          speed: -0.7,
          ampMultiplier: 12 * currentAmp,
          lineWidth: 2.0
        },
        {
          color: isListening ? '#fda4af' : isSpeaking ? '#fbcfe8' : isProcessing ? '#f472b6' : '#f5d0fe',
          freq: 9,
          speed: 1.3,
          ampMultiplier: 8 * currentAmp,
          lineWidth: 1.5
        }
      ];

      waveLayers.forEach((layer) => {
        ctx.beginPath();
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const harmonic = 
            Math.sin(angle * layer.freq + phase * layer.speed) * 
            Math.cos(angle * 3 - phase * 0.4) * 
            layer.ampMultiplier;

          const r = baseRadius + harmonic;
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = layer.color;
        ctx.lineWidth = layer.lineWidth;
        ctx.shadowColor = layer.color;
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // 4. Glowing Quantum Core Sphere
      const coreGrad = ctx.createRadialGradient(
        centerX - baseRadius * 0.28,
        centerY - baseRadius * 0.28,
        2,
        centerX,
        centerY,
        baseRadius * 0.8
      );

      if (isListening) {
        coreGrad.addColorStop(0, '#fff1f2');
        coreGrad.addColorStop(0.3, '#f472b6');
        coreGrad.addColorStop(0.7, '#be185d');
        coreGrad.addColorStop(1, '#1f0d17');
      } else if (isSpeaking) {
        coreGrad.addColorStop(0, '#fff1f2');
        coreGrad.addColorStop(0.3, '#f9a8d4');
        coreGrad.addColorStop(0.65, '#a78bfa');
        coreGrad.addColorStop(1, '#120b1f');
      } else if (isProcessing) {
        coreGrad.addColorStop(0, '#fdf2f8');
        coreGrad.addColorStop(0.35, '#c084fc');
        coreGrad.addColorStop(0.7, '#ec4899');
        coreGrad.addColorStop(1, '#140c1f');
      } else {
        coreGrad.addColorStop(0, '#fdf2f8');
        coreGrad.addColorStop(0.4, '#f472b6');
        coreGrad.addColorStop(0.8, '#8b5cf6');
        coreGrad.addColorStop(1, '#090812');
      }

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 0.8, 0, Math.PI * 2);
      ctx.fill();

      // 5. Internal Quantum Grid & Sparkle Nodes
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 0.45, phase * 0.6, phase * 0.6 + Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 0.25, -phase * 0.9, -phase * 0.9 + Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 6. Orbiting Star Particles
      particles.forEach((p) => {
        p.angle += p.speed;
        const pRadius = baseRadius + p.radiusOffset + Math.sin(phase * 2 + p.angle) * (10 * currentAmp);
        const px = centerX + Math.cos(p.angle) * pRadius;
        const py = centerY + Math.sin(p.angle) * pRadius;

        ctx.fillStyle = isListening 
          ? `rgba(254, 205, 211, ${p.alpha})` 
          : isSpeaking 
          ? `rgba(186, 230, 253, ${p.alpha})` 
          : `rgba(224, 231, 255, ${p.alpha})`;

        ctx.beginPath();
        ctx.arc(px, py, p.size * (1 + currentAmp * 0.5), 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isSpeaking, isListening, isProcessing, isExpanded]);

  const canvasWidth = isExpanded ? 240 : 160;
  const canvasHeight = isExpanded ? 200 : 130;

  return (
    <div
      id="voice-visualizer-orb-container"
      className="w-full flex flex-col items-center justify-center my-2 transition-all duration-300"
    >
      <div className="relative w-full max-w-xl bg-slate-950/70 border border-sky-500/20 backdrop-blur-2xl rounded-3xl p-4 shadow-2xl shadow-sky-500/10 hover:border-sky-500/40 transition-all">
        
        {/* Top Header bar with status badges */}
        <div className="flex items-center justify-between px-2 pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${
              isListening ? 'bg-rose-500 animate-ping' :
              isSpeaking ? 'bg-sky-400 animate-pulse' :
              isProcessing ? 'bg-purple-400 animate-spin' :
              'bg-emerald-400'
            }`} />
            <span className="text-xs font-mono font-semibold tracking-wider text-slate-200">
              {isListening ? 'MICROFONE ATIVO (OUVINDO)' :
               isSpeaking ? 'MICA FALANDO' :
               isProcessing ? 'PROCESSANDO COMANDO' :
               'ESPECTRO VOCAL MULTIMODAL'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Mute/Stop Speaking control */}
            {isSpeaking && onStopSpeaking && (
              <button
                onClick={onStopSpeaking}
                className="px-2.5 py-1 text-[11px] font-mono bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 rounded-lg border border-rose-500/30 transition flex items-center gap-1"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>Pausar Voz</span>
              </button>
            )}

            {/* Mic Toggle Button */}
            <button
              onClick={onToggleVoice}
              className={`px-3 py-1 text-[11px] font-mono rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                isListening
                  ? 'bg-rose-500/30 text-rose-300 border-rose-500/50 shadow-lg shadow-rose-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
              }`}
            >
              {isListening ? <Mic className="w-3.5 h-3.5 text-rose-400 animate-bounce" /> : <Mic className="w-3.5 h-3.5 text-slate-400" />}
              <span>{isListening ? 'Ouvindo...' : 'Falar'}</span>
            </button>

            {/* Collapse / Expand Toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition"
              title={isExpanded ? 'Recolher Visualizador' : 'Expandir Visualizador'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Dynamic Canvas Center Orb */}
        {isExpanded && (
          <div className="relative flex flex-col items-center justify-center py-2">
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              className="cursor-pointer filter drop-shadow-[0_0_25px_rgba(56,189,248,0.25)] transition-transform hover:scale-105"
              onClick={onToggleVoice}
              title="Clique para Ativar / Desativar Entrada de Voz"
            />

            {/* Real-time Frequency & Amplitude Gauge */}
            <div className="w-full px-6 flex items-center justify-between gap-4 mt-1 text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-sky-400" />
                <span>Modulação: {Math.round(amplitude * 100)}%</span>
              </div>

              {/* Dynamic Soundwave Bar Indicator */}
              <div className="flex items-center gap-0.5 h-3 flex-1 max-w-[140px] justify-center">
                {Array.from({ length: 16 }).map((_, i) => {
                  const barHeight = Math.max(
                    2,
                    Math.sin(i * 0.4 + amplitude * 5) * 12 * (amplitude > 0.2 ? amplitude : 0.2) + 2
                  );
                  return (
                    <span
                      key={i}
                      style={{ height: `${barHeight}px` }}
                      className={`w-1 rounded-full transition-all duration-75 ${
                        isListening ? 'bg-rose-400' : isSpeaking ? 'bg-sky-400' : 'bg-slate-600'
                      }`}
                    />
                  );
                })}
              </div>

              <div className="flex items-center gap-1 text-slate-400">
                <Radio className={`w-3.5 h-3.5 ${isListening || isSpeaking ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                <span>WebAudio API: Live</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Subtitle / Contextual Status */}
        {statusMessage && (
          <div className="mt-2 text-center text-xs text-slate-300 font-mono bg-white/[0.03] px-3 py-1.5 rounded-xl border border-white/5 truncate">
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  );
};
