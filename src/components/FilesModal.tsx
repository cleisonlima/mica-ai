import React, { useState } from 'react';
import { FolderGit2, FileText, Plus, Save, Trash2, Eye, RefreshCw } from 'lucide-react';

interface FilesModalProps {
  files: { name: string; size: number }[];
  onReadFile: (path: string) => Promise<string>;
  onWriteFile: (path: string, content: string) => Promise<void>;
  onDeleteFile: (path: string) => Promise<void>;
  onRefresh: () => void;
}

export const FilesModal: React.FC<FilesModalProps> = ({
  files,
  onReadFile,
  onWriteFile,
  onDeleteFile,
  onRefresh
}) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(files[0]?.name || null);
  const [fileContent, setFileContent] = useState<string>('');
  const [newFileName, setNewFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSelectFile = async (filename: string) => {
    setSelectedFile(filename);
    setIsLoading(true);
    try {
      const content = await onReadFile(filename);
      setFileContent(content);
    } catch (e) {
      setFileContent('Erro ao ler arquivo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const name = newFileName.endsWith('.txt') ? newFileName.trim() : `${newFileName.trim()}.txt`;
    await onWriteFile(name, `# ${name}\nCriado pela MICA em ${new Date().toLocaleString()}\nContexto: documentação operacional do SENAI.`);
    setNewFileName('');
    onRefresh();
    handleSelectFile(name);
  };

  const handleSaveContent = async () => {
    if (!selectedFile) return;
    setIsSaving(true);
    try {
      await onWriteFile(selectedFile, fileContent);
      onRefresh();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 glass-panel rounded-3xl p-6 flex flex-col overflow-hidden space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Sistema de Arquivos & Ferramentas de Disco
            </h2>
            <p className="text-xs text-gray-400">
              Arquivos locais que o assistente pode ler, criar, editar e analisar.
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-gray-400 hover:text-white transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content: File list and Editor */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Left: Files List */}
        <div className="w-64 flex flex-col space-y-3 shrink-0">
          <form onSubmit={handleCreateFile} className="flex gap-2">
            <input
              type="text"
              placeholder="novo_arquivo.txt"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {files.map((f) => (
              <button
                key={f.name}
                onClick={() => handleSelectFile(f.name)}
                className={`w-full p-2.5 rounded-xl text-left text-xs font-mono flex items-center justify-between transition-all cursor-pointer ${
                  selectedFile === f.name
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                    : 'bg-white/[0.02] hover:bg-white/[0.05] text-gray-400 hover:text-gray-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{f.name}</span>
                </div>
                <span className="text-[10px] text-gray-500">{f.size} B</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: File Viewer & Editor */}
        <div className="flex-1 rounded-2xl bg-black/30 border border-white/10 p-4 flex flex-col space-y-3 overflow-hidden">
          {selectedFile ? (
            <>
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2 text-xs font-mono text-blue-400 font-bold">
                  <FileText className="w-4 h-4" />
                  <span>{selectedFile}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveContent}
                    disabled={isSaving}
                    className="py-1 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Salvar
                  </button>
                  <button
                    onClick={() => onDeleteFile(selectedFile)}
                    className="py-1 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                disabled={isLoading}
                placeholder="Conteúdo do arquivo..."
                className="flex-1 w-full bg-transparent resize-none font-mono text-xs text-gray-200 outline-none leading-relaxed"
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-xs">
              Selecione um arquivo à esquerda para visualizar e editar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
