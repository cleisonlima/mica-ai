import React from 'react';
import { History, Clock, MessageSquare, ArrowRight } from 'lucide-react';
import { Message } from '../types';

interface HistoryModalProps {
  messages: Message[];
  onRestoreCommand: (text: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  messages,
  onRestoreCommand
}) => {
  const userMessages = messages.filter((m) => m.role === 'user');

  return (
    <div className="flex-1 glass-panel rounded-3xl p-6 flex flex-col overflow-hidden space-y-4">
      <div className="flex items-center gap-3 border-b border-white/5 pb-4">
        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
          <History className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Histórico de Comandos & Sessão
          </h2>
          <p className="text-xs text-gray-400">
            Registro de todos os comandos e interações realizados nesta sessão.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {userMessages.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-xs">
            Nenhum comando registrado no histórico da sessão.
          </div>
        ) : (
          userMessages.map((msg, i) => (
            <div
              key={msg.id || i}
              className="p-4 rounded-2xl bg-white/[0.025] hover:bg-white/[0.06] border border-white/5 flex items-center justify-between gap-4 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0 mt-0.5">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-200 font-medium leading-relaxed">
                    {msg.content}
                  </p>
                  <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {msg.timestamp}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onRestoreCommand(msg.content)}
                title="Executar novamente"
                className="py-1.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-medium flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
              >
                Reutilizar
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
