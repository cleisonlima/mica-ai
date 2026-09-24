import React from 'react';
import { Settings as SettingsIcon, Volume2, Shield, Bot, Palette, CheckCircle2 } from 'lucide-react';
import { SystemSettings } from '../types';

interface SettingsModalProps {
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  onSaveSettings: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  setSettings,
  onSaveSettings
}) => {
  return (
    <div className="flex-1 glass-panel rounded-3xl p-6 flex flex-col overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/5 pb-4">
        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
          <SettingsIcon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Configurações & Personalidade da MICA
          </h2>
          <p className="text-xs text-gray-400">
            Ajuste os parâmetros de inteligência, permissões de segurança, voz e automação do assistente multimodal.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identidade e IA */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
            <Bot className="w-4 h-4" />
            Identidade do Assistente
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Nome de Exibição</label>
            <input
              type="text"
              value={settings.assistant_name}
              onChange={(e) => setSettings({ ...settings, assistant_name: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Modelo de IA Primário</label>
            <select
              value={settings.ai_model}
              onChange={(e) => setSettings({ ...settings, ai_model: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 outline-none focus:border-blue-500"
            >
              <option value="gemini-3.6-flash">Gemini 3.6 Flash (Atual & Multimodal)</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (Raciocínio Avançado)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Personalidade & Tom</label>
            <textarea
              rows={3}
              value={settings.personality}
              onChange={(e) => setSettings({ ...settings, personality: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-gray-200 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Voz e Interação */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
            <Volume2 className="w-4 h-4" />
            Voz & Síntese de Áudio
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5 cursor-pointer">
              <span className="text-xs text-gray-200 font-medium">Leitura em Voz Alta (TTS)</span>
              <input
                type="checkbox"
                checked={settings.voice_enabled}
                onChange={(e) => setSettings({ ...settings, voice_enabled: e.target.checked })}
                className="w-4 h-4 accent-blue-600 rounded"
              />
            </label>

            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Velocidade da Voz</span>
                <span className="font-mono text-blue-400">{settings.voice_speed}x</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.5"
                step="0.05"
                value={settings.voice_speed}
                onChange={(e) => setSettings({ ...settings, voice_speed: parseFloat(e.target.value) })}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Segurança e Permissões */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4 md:col-span-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
            <Shield className="w-4 h-4" />
            Políticas de Segurança e Controle do Computador
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-black/30 border border-white/5 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.require_high_permission_confirmation}
                onChange={(e) =>
                  setSettings({ ...settings, require_high_permission_confirmation: e.target.checked })
                }
                className="mt-0.5 w-4 h-4 accent-blue-600 rounded"
              />
              <div>
                <span className="text-xs text-gray-200 font-medium block">
                  Exigir confirmação para Ações Críticas (HIGH RISK)
                </span>
                <span className="text-[11px] text-gray-500">
                  Solicita autorização explícita antes de excluir arquivos ou executar comandos shell.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-black/30 border border-white/5 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.computer_control_enabled}
                onChange={(e) =>
                  setSettings({ ...settings, computer_control_enabled: e.target.checked })
                }
                className="mt-0.5 w-4 h-4 accent-blue-600 rounded"
              />
              <div>
                <span className="text-xs text-gray-200 font-medium block">
                  Habilitar Controle de Mouse & Teclado
                </span>
                <span className="text-[11px] text-gray-500">
                  Permite que a IA mova o cursor, clique e digite comandos no sistema.
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={onSaveSettings}
          className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          Salvar Configurações
        </button>
      </div>
    </div>
  );
};
