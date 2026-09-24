import React from 'react';
import { ShieldAlert, Trash2, CheckCircle2, XCircle, Activity as ActivityIcon } from 'lucide-react';
import { ActivityItem, SecurityConfirmation } from '../types';

interface ActivityPanelProps {
  activities: ActivityItem[];
  pendingConfirmation: SecurityConfirmation | null;
  onConfirmAction: (token: string, confirmed: boolean) => void;
  onClearActivities: () => void;
}

export const ActivityPanel: React.FC<ActivityPanelProps> = ({
  activities,
  pendingConfirmation,
  onConfirmAction,
  onClearActivities
}) => {
  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'plan':
        return 'text-purple-400';
      case 'tool':
        return 'text-amber-400';
      case 'exec':
        return 'text-emerald-400 font-bold';
      case 'done':
        return 'text-gray-400 opacity-60';
      case 'security':
      case 'warn':
        return 'text-rose-400 font-medium';
      default:
        return 'text-blue-400';
    }
  };

  return (
    <div className="flex-1 glass-panel rounded-3xl p-5 flex flex-col overflow-hidden select-none border border-white/10 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
          <ActivityIcon className="w-3.5 h-3.5 text-blue-400" />
          Painel de Atividade
        </h3>
        {activities.length > 0 && (
          <button
            onClick={onClearActivities}
            title="Limpar logs"
            className="text-gray-500 hover:text-rose-400 transition-colors p-1"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Activity Timeline List */}
      <div className="flex-1 space-y-3.5 overflow-y-auto font-mono text-[11px] pr-1">
        {activities.length === 0 ? (
          <div className="text-gray-500 italic text-center py-6 text-xs">
            Nenhuma atividade registrada ainda.
          </div>
        ) : (
          activities.map((act) => (
            <div key={act.id} className="flex items-start gap-2.5 leading-snug">
              <span className="text-gray-500 text-[10px] shrink-0 font-mono mt-0.5">
                {act.time}
              </span>
              <span className={`${getActivityColor(act.type)} break-words flex-1`}>
                {act.text}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Sensitive Action Approval Card */}
      {pendingConfirmation && (
        <div className="mt-4 pt-3 border-t border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-rose-500/10 border border-rose-500/30 p-3.5 rounded-2xl space-y-2.5 shadow-lg shadow-rose-950/40">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-[11px]">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>AÇÃO SENSÍVEL DETECTADA</span>
            </div>
            
            <p className="text-[11px] text-gray-200 leading-tight">
              MICA requer confirmação humana para executar:
              <strong className="text-rose-300 block font-mono mt-1 bg-black/40 px-2 py-1 rounded border border-rose-500/20">
                {pendingConfirmation.tool_name}({JSON.stringify(pendingConfirmation.arguments)})
              </strong>
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => onConfirmAction(pendingConfirmation.token, true)}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-xs py-1.5 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/30 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Permitir
              </button>
              <button
                onClick={() => onConfirmAction(pendingConfirmation.token, false)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white text-xs py-1.5 px-3 rounded-xl font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                Negar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
