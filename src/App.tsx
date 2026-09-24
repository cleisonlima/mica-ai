import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { ScreenMonitor } from './components/ScreenMonitor';
import { ActivityPanel } from './components/ActivityPanel';
import { MemoryModal } from './components/MemoryModal';
import { FilesModal } from './components/FilesModal';
import { SettingsModal } from './components/SettingsModal';
import { HistoryModal } from './components/HistoryModal';
import { 
  Message, 
  ActivityItem, 
  SecurityConfirmation, 
  MemoryItem, 
  SystemSettings 
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'history' | 'memory' | 'files' | 'settings'>('chat');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-init',
      role: 'assistant',
      content: 'Olá! Sou a **MICA** — Multimodal Intelligent Computer Assistant.\n\nMeu foco é apoiar tarefas operacionais e administrativas no SENAI Pernambuco por meio de visão computacional, agentes inteligentes e automação guiada por voz e contexto.\n\nPosso analisar a tela, interpretar interfaces, mapear ações e acelerar fluxos de trabalho com segurança e confirmação humana.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tool_execution_details: []
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  
  // Real-time Screen Monitor state
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [activeWindow, setActiveWindow] = useState('SENAI PE / GUI Parser Active');
  const [isCapturing, setIsCapturing] = useState(false);

  // Activities log
  const [activities, setActivities] = useState<ActivityItem[]>([
    {
      id: 'act-1',
      time: '14:02:10',
      text: 'MICA inicializado com sucesso.',
      type: 'info'
    },
    {
      id: 'act-2',
      time: '14:02:11',
      text: 'Módulos carregados: GUI parsing, action planner, voz, memória e automação.',
      type: 'tool'
    }
  ]);

  // Security confirmation state
  const [pendingConfirmation, setPendingConfirmation] = useState<SecurityConfirmation | null>(null);

  // Memory store
  const [memories, setMemories] = useState<MemoryItem[]>([]);

  // Files store
  const [files, setFiles] = useState<{ name: string; size: number }[]>([]);

  // System Settings
  const [settings, setSettings] = useState<SystemSettings>({
    assistant_name: 'MICA',
    ai_model: 'gemini-3.6-flash',
    voice_enabled: true,
    voice_speed: 1.0,
    voice_pitch: 1.35,
    personality: 'Profissional, técnico, orientado à produtividade, à segurança e ao contexto operacional do SENAI.',
    detail_level: 'balanced',
    memory_enabled: true,
    computer_control_enabled: true,
    require_high_permission_confirmation: true,
    theme: 'Frosted Glass'
  });

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      const [memRes, filesRes, actRes] = await Promise.all([
        fetch('/api/memory'),
        fetch('/api/files'),
        fetch('/api/activities')
      ]);

      if (memRes.ok) {
        const memData = await memRes.json();
        setMemories(memData);
      }
      if (filesRes.ok) {
        const filesData = await filesRes.json();
        setFiles(filesData);
      }
      if (actRes.ok) {
        const actData = await actRes.json();
        if (actData && actData.length > 0) {
          setActivities(actData);
        }
      }
    } catch (e) {
      console.warn('API sync warning:', e);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // TTS Speech Synthesis
  const speakText = (text: string) => {
    if (!settings.voice_enabled || !('speechSynthesis' in window)) return;

    const speech = window.speechSynthesis;
    speech.cancel();

    const cleanText = text
      .replace(/[*_#`]/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .replace(/\n+/g, '. ');

    const preferredFemaleVoice = speech
      .getVoices()
      .find((voice) => {
        const name = voice.name.toLowerCase();
        const lang = voice.lang.toLowerCase();
        const femaleSignal = /female|woman|feminina|samantha|zira|julia|aria|nora|susan|sylvia|karen|victoria|alice|diana|marina|helena/i;
        return (lang.startsWith('pt') || lang.startsWith('pt-br')) && femaleSignal.test(name);
      }) ?? speech
      .getVoices()
      .find((voice) => /female|woman|feminina/i.test(voice.name)) ?? speech.getVoices().find((voice) => voice.lang.toLowerCase().startsWith('pt')) ?? null;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.voice = preferredFemaleVoice ?? null;
    utterance.rate = settings.voice_speed;
    utterance.pitch = settings.voice_pitch;
    utterance.lang = 'pt-BR';
    utterance.volume = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speech.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // STT Speech Recognition
  const toggleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Reconhecimento de fala não suportado neste navegador. Use o campo de texto.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSend(transcript);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  // Capture Screen
  const handleCaptureScreen = async () => {
    setIsCapturing(true);
    try {
      // 1. Try Browser Display Media
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const track = stream.getVideoTracks()[0];
        const imageCapture = new (window as any).ImageCapture(track);
        const bitmap = await imageCapture.grabFrame();
        
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(bitmap, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        track.stop();

        setScreenshotUrl(dataUrl);
        setAttachedImage(dataUrl);
        setActiveWindow('Tela Principal Compartilhada');
      } else {
        throw new Error('Display media not available');
      }
    } catch (err) {
      // 2. Simulated Desktop Screenshot Fallback
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Gradient Desktop
        const grad = ctx.createLinearGradient(0, 0, 1280, 720);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1280, 720);

        // Simulated VS Code Window
        ctx.fillStyle = '#1e293b';
        ctx.roundRect(100, 80, 1080, 560, [12]);
        ctx.fill();

        // Top bar
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(100, 80, 1080, 40);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px monospace';
        ctx.fillText('mica/src/App.tsx - Visual Studio Code', 130, 105);

        // Window code lines
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('const guiParser = new GuiParser();', 130, 160);
        ctx.fillStyle = '#4ade80';
        ctx.fillText('await orchestrator.executeTask("action.planner");', 130, 190);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText('// MICA pronta para automação multimodal', 130, 220);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setScreenshotUrl(dataUrl);
        setAttachedImage(dataUrl);
        setActiveWindow('Visual Studio Code (Active)');
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const handleCaptureCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('A câmera não está disponível neste navegador.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

      stream.getTracks().forEach((track) => track.stop());
      setScreenshotUrl(dataUrl);
      setAttachedImage(dataUrl);
      setActiveWindow('Câmera do computador');
    } catch (err: any) {
      console.error('Camera capture error:', err);
      alert(`Não foi possível acessar a câmera: ${err.message || 'permissão negada'}`);
    }
  };

  // Send Command to Agent
  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt !== undefined ? customPrompt : input).trim();
    if (!textToSend && !attachedImage) return;

    const userMessage: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: textToSend || 'Analise a imagem/tela anexada.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      image: attachedImage || undefined
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    const currentImg = attachedImage;
    setAttachedImage(null);
    setIsProcessing(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          image_base64: currentImg || undefined
        })
      });

      const data = await response.json();

      if (data.activities && data.activities.length > 0) {
        setActivities((prev) => [...data.activities, ...prev].slice(0, 50));
      }

      if (data.needs_confirmation && data.confirmation_details) {
        setPendingConfirmation(data.confirmation_details);
      }

      const assistantMsg: Message = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tool_execution_details: data.tool_execution_details
      };

      setMessages((prev) => [...prev, assistantMsg]);
      speakText(data.response);
      fetchData();
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Desculpe, encontrei uma falha temporária ao executar o comando: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirm or Deny High-Risk Security Action
  const handleConfirmAction = async (token: string, confirmed: boolean) => {
    setPendingConfirmation(null);
    setIsProcessing(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmation_token: token,
          confirmed
        })
      });

      const data = await res.json();

      if (data.activities) {
        setActivities((prev) => [...data.activities, ...prev].slice(0, 50));
      }

      const assistantMsg: Message = {
        id: `conf-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tool_execution_details: data.tool_execution_details
      };

      setMessages((prev) => [...prev, assistantMsg]);
      speakText(data.response);
      fetchData();
    } catch (e: any) {
      alert(`Falha na autorização: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Memory Actions
  const handleAddMemory = async (category: MemoryItem['category'], key: string, value: string) => {
    const res = await fetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, key, value })
    });
    if (res.ok) {
      fetchData();
    }
  };

  const handleDeleteMemory = async (id: string) => {
    await fetch(`/api/memory/${id}`, { method: 'DELETE' });
    fetchData();
  };

  // File Actions
  const handleReadFile = async (path: string): Promise<string> => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `Leia o arquivo ${path}` })
    });
    const data = await res.json();
    const details = data.tool_execution_details?.find((t: any) => t.tool_name === 'files_read');
    return details?.result?.content || data.response;
  };

  const handleWriteFile = async (path: string, content: string): Promise<void> => {
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Escreva no arquivo ${path} o conteúdo: ${content}`
      })
    });
    fetchData();
  };

  const handleDeleteFile = async (path: string): Promise<void> => {
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `Exclua o arquivo ${path}` })
    });
    fetchData();
  };

  const handleClearActivities = async () => {
    await fetch('/api/activities', { method: 'DELETE' });
    setActivities([]);
  };

  return (
    <div className="fixed inset-0 overflow-hidden flex flex-col font-sans text-white bg-[#05060f] select-none">
      {/* Dynamic Mesh Gradient Background */}
      <div className="mesh-gradient absolute inset-0 -z-10"></div>

      {/* Main Container Layout */}
      <div className="flex flex-1 h-full overflow-hidden p-4 gap-4">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          memoryCount={memories.length}
          filesCount={files.length}
          systemStatus="online"
          onNewChat={() => {
            setMessages([
              {
                id: `new-${Date.now()}`,
                role: 'assistant',
                content: 'Nova conversa iniciada. Estou pronto para ajudar com o seu computador.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ]);
            setActiveTab('chat');
          }}
        />

        {/* Center Main Stage */}
        <main className="flex-1 flex flex-col gap-4 overflow-hidden">
          {activeTab === 'chat' && (
            <ChatArea
              messages={messages}
              input={input}
              setInput={setInput}
              onSend={handleSend}
              isProcessing={isProcessing}
              isListening={isListening}
              isSpeaking={isSpeaking}
              onToggleVoice={toggleVoice}
              onStopSpeaking={stopSpeaking}
              attachedImage={attachedImage}
              setAttachedImage={setAttachedImage}
              onCaptureScreen={handleCaptureScreen}
              onCaptureCamera={handleCaptureCamera}
              onSpeak={speakText}
            />
          )}

          {activeTab === 'memory' && (
            <MemoryModal
              memories={memories}
              onAddMemory={handleAddMemory}
              onDeleteMemory={handleDeleteMemory}
            />
          )}

          {activeTab === 'files' && (
            <FilesModal
              files={files}
              onReadFile={handleReadFile}
              onWriteFile={handleWriteFile}
              onDeleteFile={handleDeleteFile}
              onRefresh={fetchData}
            />
          )}

          {activeTab === 'history' && (
            <HistoryModal
              messages={messages}
              onRestoreCommand={(text) => {
                setActiveTab('chat');
                handleSend(text);
              }}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsModal
              settings={settings}
              setSettings={setSettings}
              onSaveSettings={async () => {
                await fetch('/api/settings', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(settings)
                });
                alert('Configurações salvas com sucesso na MICA!');
              }}
            />
          )}
        </main>

        {/* Right Aside: Screen Monitor & Real-Time Activity Panel */}
        <aside className="w-72 flex flex-col gap-4 shrink-0 overflow-hidden">
          <ScreenMonitor
            screenshotUrl={screenshotUrl}
            activeWindow={activeWindow}
            onCaptureNow={handleCaptureScreen}
            isCapturing={isCapturing}
          />

          <ActivityPanel
            activities={activities}
            pendingConfirmation={pendingConfirmation}
            onConfirmAction={handleConfirmAction}
            onClearActivities={handleClearActivities}
          />
        </aside>
      </div>
    </div>
  );
}
