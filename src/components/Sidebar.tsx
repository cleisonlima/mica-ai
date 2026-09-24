import React from 'react';
import { 
  MessageSquare, 
  History, 
  HardDrive, 
  FolderGit2, 
  Settings, 
  Wrench,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'chat' | 'history' | 'memory' | 'files' | 'settings';
  setActiveTab: (tab: 'chat' | 'history' | 'memory' | 'files' | 'settings') => void;
  memoryCount: number;
  filesCount: number;
  systemStatus: 'online' | 'busy' | 'offline';
  onNewChat: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  memoryCount,
  filesCount,
  systemStatus,
  onNewChat
}) => {
  return (
    <aside className="w-64 glass-panel rounded-3xl flex flex-col justify-between select-none shrink-0">
      <div>
        {/* Brand Header */}
        <div className="p-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <img
              src="/imagem.png"
              alt="Logo MICA"
              className="w-12 h-12 object-contain rounded-full shadow-[0_0_20px_rgba(59,130,246,0.7)]"
            />
            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                MICA
              </span>
              <p className="text-[10px] text-blue-400 font-mono uppercase tracking-wider">
                Multimodal Assistant
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="p-3">
          <button
            onClick={onNewChat}
            className="w-full py-2.5 px-4 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-medium flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Nova Conversa
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 space-y-1.5 mt-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full p-3 flex items-center justify-between rounded-xl cursor-pointer text-left transition-all ${
              activeTab === 'chat'
                ? 'active-nav-item'
                : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className={`w-4 h-4 ${activeTab === 'chat' ? 'text-blue-400' : ''}`} />
              <span className="text-sm font-medium">Conversa Atual</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('memory')}
            className={`w-full p-3 flex items-center justify-between rounded-xl cursor-pointer text-left transition-all ${
              activeTab === 'memory'
                ? 'active-nav-item'
                : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <HardDrive className={`w-4 h-4 ${activeTab === 'memory' ? 'text-blue-400' : ''}`} />
              <span className="text-sm font-medium">Memória</span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
              {memoryCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`w-full p-3 flex items-center justify-between rounded-xl cursor-pointer text-left transition-all ${
              activeTab === 'files'
                ? 'active-nav-item'
                : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <FolderGit2 className={`w-4 h-4 ${activeTab === 'files' ? 'text-blue-400' : ''}`} />
              <span className="text-sm font-medium">Arquivos & Disco</span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
              {filesCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`w-full p-3 flex items-center justify-between rounded-xl cursor-pointer text-left transition-all ${
              activeTab === 'history'
                ? 'active-nav-item'
                : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <History className={`w-4 h-4 ${activeTab === 'history' ? 'text-blue-400' : ''}`} />
              <span className="text-sm font-medium">Histórico</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full p-3 flex items-center justify-between rounded-xl cursor-pointer text-left transition-all ${
              activeTab === 'settings'
                ? 'active-nav-item'
                : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-blue-400' : ''}`} />
              <span className="text-sm font-medium">Configurações</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="p-5 mt-auto border-t border-white/5">
        <div className="flex items-center gap-3 bg-white/[0.02] p-3 rounded-2xl border border-white/5">
          <div className="status-dot-active"></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Status do Sistema
            </span>
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
              Online & Ativo
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
