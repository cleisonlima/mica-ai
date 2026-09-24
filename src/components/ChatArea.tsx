import React, { useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  Mic, 
  MicOff, 
  Image as ImageIcon, 
  X, 
  Terminal, 
  CheckCircle2, 
  AlertCircle,
  Monitor,
  Sparkles,
  Volume2,
  FileCode,
  Camera
} from 'lucide-react';
import { Message } from '../types';
import { VoiceVisualizer } from './VoiceVisualizer';

interface ChatAreaProps {
  messages: Message[];
  input: string;
  setInput: (value: string) => void;
  onSend: (text?: string) => void;
  isProcessing: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  onToggleVoice: () => void;
  onStopSpeaking?: () => void;
  attachedImage: string | null;
  setAttachedImage: (img: string | null) => void;
  onCaptureScreen: () => void;
  onCaptureCamera: () => void;
  onSpeak: (text: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  input,
  setInput,
  onSend,
  isProcessing,
  isListening,
  isSpeaking,
  onToggleVoice,
  onStopSpeaking,
  attachedImage,
  setAttachedImage,
  onCaptureScreen,
  onCaptureCamera,
  onSpeak
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const promptSuggestions = [
    'Analise a tela atual e identifique elementos de interface relevantes para o fluxo do SENAI.',
    'Leia a tela e me diga como posso automatizar um relatório de ensaio.',
    'Crie um resumo do fluxo de cadastro de parâmetros em software de bancada.',
    'Guarde o contexto do experimento e mantenha a operação segura com confirmação humana.'
  ];

  return (
    <div className="flex-1 glass-panel rounded-3xl p-6 flex flex-col overflow-hidden relative">
      {/* Central Animated Voice Spectrum Visualizer Orb */}
      <VoiceVisualizer
        isSpeaking={isSpeaking}
        isListening={isListening}
        isProcessing={isProcessing}
        onToggleVoice={onToggleVoice}
        onStopSpeaking={onStopSpeaking}
        statusMessage={
          isListening 
            ? 'Ouvindo sua voz em tempo real via Web Audio API...' 
            : isSpeaking 
            ? 'Reproduzindo síntese de voz com modulação espectral...' 
            : isProcessing 
            ? 'Processando instrução generativa...' 
            : undefined
        }
      />

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2 mt-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}
          >
            <div
              className={`${
                m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'
              } p-4.5 max-w-[84%] space-y-2.5 relative group`}
            >
              {/* Sender label and timestamp */}
              <div className="flex items-center justify-between gap-3 text-[11px] font-mono text-gray-400 pb-1 border-b border-white/5">
                <span className="font-semibold text-gray-300 flex items-center gap-1.5">
                  {m.role === 'user' ? 'Você' : 'MICA'}
                </span>
                <div className="flex items-center gap-2">
                  <span>{m.timestamp}</span>
                  {m.role === 'assistant' && (
                    <button
                      onClick={() => onSpeak(m.content)}
                      title="Ouvir resposta"
                      className="opacity-0 group-hover:opacity-100 hover:text-blue-400 transition-opacity p-0.5"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Image Preview if present */}
              {m.image && (
                <div className="rounded-xl overflow-hidden border border-white/10 my-2 max-w-sm">
                  <img
                    src={m.image}
                    alt="Anexo ou Captura de Tela"
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}

              {/* Message Content */}
              <div className="text-sm leading-relaxed text-gray-100 whitespace-pre-wrap">
                {m.content}
              </div>

              {/* Tool Execution Badges if any */}
              {m.tool_execution_details && m.tool_execution_details.length > 0 && (
                <div className="pt-2 space-y-2">
                  {m.tool_execution_details.map((tool, idx) => (
                    <div
                      key={idx}
                      className="bg-black/30 p-2.5 rounded-xl border border-white/5 flex items-center justify-between gap-3 font-mono text-xs"
                    >
                      <div className="flex items-center gap-2 text-blue-300">
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                        <span className="font-semibold">
                          {tool.tool_name}({Object.keys(tool.arguments || {}).length > 0 ? JSON.stringify(tool.arguments).slice(0, 35) + '...' : ''})
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        sucesso
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Processing status indicator in chat stream */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="chat-bubble-ai p-4 max-w-[80%] flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              <span className="text-xs text-blue-300 font-mono">
                MICA está processando o comando e planejando ações...
              </span>
            </div>
          </div>
        )}

        {/* Empty state suggestions */}
        {messages.length === 1 && (
          <div className="pt-6 pb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Sugestões de Comandos Rápidos
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {promptSuggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => onSend(sug)}
                  className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 text-left text-xs text-gray-300 hover:text-white transition-all cursor-pointer flex items-center justify-between group"
                >
                  <span className="line-clamp-2">{sug}</span>
                  <span className="opacity-0 group-hover:opacity-100 text-blue-400 ml-2 transition-opacity">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Attached Image Indicator Bar */}
      {attachedImage && (
        <div className="mt-3 px-3 py-1.5 glass-card rounded-xl flex items-center justify-between border border-blue-500/30 bg-blue-500/10">
          <div className="flex items-center gap-2 text-xs text-blue-300 font-medium">
            <ImageIcon className="w-4 h-4 text-blue-400" />
            <span>Imagem/Captura anexada para análise multimodal</span>
          </div>
          <button
            onClick={() => setAttachedImage(null)}
            className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Frosted Input Bar */}
      <div className="mt-4 glass-panel rounded-2xl p-2 flex items-center gap-2">
        {/* Attachment Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Anexar Imagem para Visão Computacional"
          className="p-3 hover:bg-white/5 rounded-xl text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Screen Capture Button */}
        <button
          onClick={onCaptureScreen}
          title="Capturar Screenshot da Tela Atual"
          className="p-3 hover:bg-white/5 rounded-xl text-gray-400 hover:text-cyan-400 transition-colors cursor-pointer"
        >
          <Monitor className="w-5 h-5" />
        </button>

        {/* Camera Capture Button */}
        <button
          onClick={onCaptureCamera}
          title="Usar a câmera para análise de objetos e cenas"
          className="p-3 hover:bg-white/5 rounded-xl text-gray-400 hover:text-violet-400 transition-colors cursor-pointer"
        >
          <Camera className="w-5 h-5" />
        </button>

        {/* Text Input Field */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Envie um comando ou pergunte algo (ex: 'Abra o navegador', 'Leia meu arquivo')..."
          className="bg-transparent flex-1 outline-none text-sm px-2 text-white placeholder-gray-500"
        />

        {/* Voice Input Microphone Button */}
        <button
          onClick={onToggleVoice}
          title={isListening ? 'Parar gravação' : 'Falar comando por voz'}
          className={`p-3 rounded-xl transition-all cursor-pointer ${
            isListening
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
              : 'hover:bg-white/5 text-gray-400 hover:text-white'
          }`}
        >
          {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        {/* Send Button */}
        <button
          onClick={() => onSend()}
          disabled={isProcessing || (!input.trim() && !attachedImage)}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 p-3 rounded-xl transition-all shadow-lg shadow-blue-600/25 cursor-pointer text-white flex items-center justify-center"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
