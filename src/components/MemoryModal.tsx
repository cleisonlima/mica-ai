import React, { useState } from 'react';
import { HardDrive, Plus, Search, Trash2, Tag, Calendar, Sparkles } from 'lucide-react';
import { MemoryItem } from '../types';

interface MemoryModalProps {
  memories: MemoryItem[];
  onAddMemory: (category: MemoryItem['category'], key: string, value: string) => Promise<void>;
  onDeleteMemory: (id: string) => Promise<void>;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
  memories,
  onAddMemory,
  onDeleteMemory
}) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<MemoryItem['category']>('profile');
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !value.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddMemory(category, key.trim(), value.trim());
      setKey('');
      setValue('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMemories = memories.filter((m) =>
    m.key.toLowerCase().includes(search.toLowerCase()) ||
    m.value.toLowerCase().includes(search.toLowerCase()) ||
    m.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 glass-panel rounded-3xl p-6 flex flex-col overflow-hidden space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Memória Persistente da MICA
            </h2>
            <p className="text-xs text-gray-400">
              Informações, preferências e contexto operacional que a MICA recorda entre sessões.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar memórias..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      {/* Add New Memory Form */}
      <form
        onSubmit={handleSubmit}
        className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3"
      >
        <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-blue-400" />
          Adicionar Nova Lembrança
        </span>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 outline-none focus:border-blue-500"
          >
            <option value="profile">Perfil do Usuário</option>
            <option value="preference">Preferência</option>
            <option value="project">Projeto</option>
            <option value="important">Informação Crítica</option>
            <option value="context">Contexto Geral</option>
          </select>

          <input
            type="text"
            placeholder="Chave (ex: nome, editor_favorito)"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 outline-none focus:border-blue-500 placeholder-gray-500"
          />

          <input
            type="text"
            placeholder="Valor (ex: SENAI, GUI Parser)"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 outline-none focus:border-blue-500 placeholder-gray-500"
          />

          <button
            type="submit"
            disabled={isSubmitting || !key.trim() || !value.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-medium py-2 px-4 rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Memorizar
          </button>
        </div>
      </form>

      {/* Memories List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-2">
        {filteredMemories.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-xs">
            Nenhuma memória encontrada com os critérios informados.
          </div>
        ) : (
          filteredMemories.map((mem) => (
            <div
              key={mem.id}
              className="p-3.5 rounded-2xl bg-white/[0.025] hover:bg-white/[0.05] border border-white/5 flex items-center justify-between gap-4 transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono uppercase px-2 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 shrink-0">
                  {mem.category}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-200">{mem.key}</span>
                    <span className="text-gray-500 text-xs">→</span>
                    <span className="text-xs text-blue-200">{mem.value}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">
                    Atualizado em {new Date(mem.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onDeleteMemory(mem.id)}
                title="Excluir memória"
                className="p-2 rounded-xl text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
