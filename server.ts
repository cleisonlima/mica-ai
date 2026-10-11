import express, { Request, Response } from 'express';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import * as robot from 'robotjs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config();

const logger = {
  info: (message: string, meta: Record<string, unknown> = {}) => {
    console.log(`[MICA][INFO] ${new Date().toISOString()} ${message}`, JSON.stringify(meta));
  },
  warn: (message: string, meta: Record<string, unknown> = {}) => {
    console.warn(`[MICA][WARN] ${new Date().toISOString()} ${message}`, JSON.stringify(meta));
  },
  error: (message: string, meta: Record<string, unknown> = {}) => {
    console.error(`[MICA][ERROR] ${new Date().toISOString()} ${message}`, JSON.stringify(meta));
  }
};

const DEFAULT_PORT = Number(process.env.PORT || 3000);
const ALLOWED_FILE_DIRECTORIES = (process.env.ALLOWED_FILE_DIRECTORIES || '')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);

function sanitizeText(value: string | undefined, fallback = ''): string {
  return String(value ?? fallback).trim();
}

function validateUrl(value: string | undefined): string | null {
  const rawValue = sanitizeText(value);
  if (!rawValue) return null;

  const normalized = rawValue.startsWith('http://') || rawValue.startsWith('https://')
    ? rawValue
    : `https://${rawValue}`;

  try {
    const url = new URL(normalized);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function validateAndNormalizeFilePath(value: string | undefined): string | null {
  const rawValue = sanitizeText(value, '');
  if (!rawValue) return null;

  const normalized = rawValue.replace(/\\/g, '/');

  if (normalized.length > 300) return null;
  if (/[<>:"|?*]/.test(normalized)) return null;
  if (/^\s*\.{2}([\/]|$)|(?:^|\/ )\.\.([\/]|$)/.test(normalized)) return null;
  if (normalized.includes('\0')) return null;

  if (ALLOWED_FILE_DIRECTORIES.length > 0) {
    const allowList = ALLOWED_FILE_DIRECTORIES.map((entry) => entry.replace(/\\/g, '/').replace(/\/$/, ''));
    const isAllowed = allowList.some((entry) => normalized === entry || normalized.startsWith(`${entry}/`));
    if (!isAllowed) return null;
  }

  return normalized;
}

function logAudit(action: string, metadata: Record<string, unknown> = {}) {
  logger.info(action, metadata);
}

interface MemoryRecord {
  id: string;
  category: 'profile' | 'preference' | 'project' | 'important' | 'context';
  key: string;
  value: string;
  updated_at: string;
}

interface PendingConfirmation {
  token: string;
  tool_name: string;
  arguments: Record<string, any>;
  description: string;
  permission_level: 'LOW' | 'MEDIUM' | 'HIGH';
  created_at: number;
}

let memoryStore: MemoryRecord[] = [
  {
    id: 'mem-1',
    category: 'profile',
    key: 'nome_usuario',
    value: 'Instrutor / Colaborador SENAI',
    updated_at: new Date().toISOString()
  },
  {
    id: 'mem-2',
    category: 'preference',
    key: 'editor_padrao',
    value: 'Visual Studio Code',
    updated_at: new Date().toISOString()
  },
  {
    id: 'mem-3',
    category: 'project',
    key: 'projeto_atual',
    value: 'MICA - Multimodal Intelligent Computer Assistant',
    updated_at: new Date().toISOString()
  },
  {
    id: 'mem-4',
    category: 'preference',
    key: 'linguagem_preferida',
    value: 'Python 3.12, TypeScript e automação multimodal',
    updated_at: new Date().toISOString()
  }
];

const virtualFileSystem: Record<string, string> = {
  'relatorio.txt': 'Relatório de Operação - MICA v1.0\nAmbiente: SENAI Pernambuco\nStatus: GUI Parser, Action Planner e pipeline de voz ativos.\nDesempenho: redução esperada de TCT em 30% e TEO em 20%.',
  'projeto.txt': 'Nome: MICA - Multimodal Intelligent Computer Assistant\nStack: React, TypeScript, Gemini API, visão computacional, agentes inteligentes.\nObjetivo: automatizar tarefas operacionais com segurança e contexto.',
  'python_news.txt': 'Atualizações relevantes para o projeto:\n- Modelos multimodais ampliam a interpretação de interfaces.\n- OCR e visão computacional reforçam o parsing de elementos de GUI.\n- Agentes orientados a ferramentas reduzem o risco de execução sem confirmação.',
  'tarefas.txt': '- [x] Definir arquitetura do assistente multimodal\n- [x] Mapear fluxos operacionais do SENAI\n- [ ] Validar segurança e confirmação humana em ações críticas'
};

interface ActivityLog {
  id: string;
  time: string;
  text: string;
  type: 'info' | 'plan' | 'tool' | 'exec' | 'done' | 'warn' | 'security';
  toolName?: string;
}

let activityLogs: ActivityLog[] = [
  {
    id: 'act-1',
    time: '14:00:00',
    text: 'MICA inicializada com sucesso no ambiente do SENAI.',
    type: 'info'
  },
  {
    id: 'act-2',
    time: '14:00:01',
    text: 'Módulos carregados: GUI parsing, action planner, voz, memória e automação guiada.',
    type: 'tool'
  }
];

const pendingConfirmations = new Map<string, PendingConfirmation>();

let systemSettings = {
  assistant_name: 'MICA',
  ai_model: 'gemini-3.6-flash',
  voice_enabled: true,
  voice_speed: 1.0,
  voice_pitch: 1.0,
  personality: 'Profissional, técnico, orientado à produtividade, à segurança e ao contexto operacional do SENAI.',
  detail_level: 'balanced',
  memory_enabled: true,
  computer_control_enabled: true,
  require_high_permission_confirmation: true,
  theme: 'Frosted Glass'
};

function getGeminiClient(): GoogleGenAI | null {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey.startsWith('MY_GEMINI')) {
    return null;
  }

  return new GoogleGenAI({ apiKey: apiKey.trim() });
}

const toolDeclarations: FunctionDeclaration[] = [
  {
    name: 'browser_open',
    description: 'Abre uma URL ou site no navegador de internet padrão.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: { type: Type.STRING, description: 'A URL do site a ser aberto.' }
      },
      required: ['url']
    }
  },
  {
    name: 'browser_search',
    description: 'Realiza uma pesquisa na web sobre um tópico específico.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'O termo de busca ou pergunta.' }
      },
      required: ['query']
    }
  },
  {
    name: 'system_open_app',
    description: 'Abre um aplicativo local no computador.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        app_name: { type: Type.STRING, description: 'Nome do aplicativo a ser aberto.' }
      },
      required: ['app_name']
    }
  },
  {
    name: 'files_read',
    description: 'Lê o conteúdo textual de um arquivo no computador.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: 'Caminho do arquivo a ser lido.' }
      },
      required: ['path']
    }
  },
  {
    name: 'files_write',
    description: 'Cria ou sobrescreve um arquivo com conteúdo de texto.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: 'Caminho do arquivo a ser salvo.' },
        content: { type: Type.STRING, description: 'Conteúdo a ser gravado.' }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'files_delete',
    description: 'Exclui permanentemente um arquivo do computador.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: 'Caminho do arquivo a ser removido.' }
      },
      required: ['path']
    }
  },
  {
    name: 'computer_screenshot',
    description: 'Captura uma imagem da tela atual.',
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: 'computer_click',
    description: 'Move o mouse e clica em coordenadas X/Y.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        x: { type: Type.NUMBER, description: 'Coordenada X em pixels.' },
        y: { type: Type.NUMBER, description: 'Coordenada Y em pixels.' },
        double: { type: Type.BOOLEAN, description: 'Executa clique duplo se true.' }
      },
      required: ['x', 'y']
    }
  },
  {
    name: 'computer_type',
    description: 'Digita texto no teclado do computador.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING, description: 'Texto a ser digitado.' }
      },
      required: ['text']
    }
  },
  {
    name: 'memory_save',
    description: 'Salva uma informação na memória do assistente.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: { type: Type.STRING, description: 'Categoria: profile, preference, project, important, context.' },
        key: { type: Type.STRING, description: 'Identificador da informação.' },
        value: { type: Type.STRING, description: 'Conteúdo a ser gravado.' }
      },
      required: ['category', 'key', 'value']
    }
  },
  {
    name: 'memory_search',
    description: 'Consulta registros armazenados na memória persistente.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Termo a procurar na memória.' }
      },
      required: ['query']
    }
  }
];

function executeToolAction(toolName: string, args: Record<string, any>): {
  result: any;
  status: 'success' | 'warning' | 'error';
  summary: string;
} {
  try {
    switch (toolName) {
      case 'browser_open': {
        const url = validateUrl(args.url);
        if (!url) {
          return {
            result: { error: 'URL inválida ou não permitida.' },
            status: 'error',
            summary: 'URL inválida para abrir no navegador.'
          };
        }

        spawn('cmd.exe', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
        logAudit('tool_executed', { toolName, url });
        return {
          result: { url, opened: true, timestamp: new Date().toISOString() },
          status: 'success',
          summary: `Navegador aberto em: ${url}`
        };
      }

      case 'browser_search': {
        const query = sanitizeText(args.query, '');
        if (!query) {
          return {
            result: { error: 'Consulta de busca ausente.' },
            status: 'error',
            summary: 'Busca não executada: consulta vazia.'
          };
        }

        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        spawn('cmd.exe', ['/c', 'start', '', searchUrl], { detached: true, stdio: 'ignore' }).unref();
        logAudit('tool_executed', { toolName, query });
        return {
          result: { query, searchUrl },
          status: 'success',
          summary: `Pesquisa realizada para: "${query}"`
        };
      }

      case 'system_open_app': {
        const app = sanitizeText(args.app_name, '');
        if (!/^[a-zA-Z0-9 _./-]{1,80}$/.test(app)) {
          return {
            result: { error: 'Nome do aplicativo inválido.' },
            status: 'error',
            summary: 'Aplicativo não executado: nome inválido.'
          };
        }

        spawn('cmd.exe', ['/c', 'start', '', app], { detached: true, stdio: 'ignore' }).unref();
        logAudit('tool_executed', { toolName, app });
        return {
          result: { application: app, status: 'running' },
          status: 'success',
          summary: `Aplicativo "${app}" iniciado com sucesso.`
        };
      }

      case 'files_read': {
        const filePath = validateAndNormalizeFilePath(args.path);
        if (!filePath) {
          return {
            result: { error: 'Arquivo não permitido ou caminho inválido.' },
            status: 'error',
            summary: 'Leitura negada: caminho inválido.'
          };
        }

        const content = virtualFileSystem[filePath];
        if (content !== undefined) {
          logAudit('file_read', { filePath });
          return {
            result: { path: filePath, content, size: content.length },
            status: 'success',
            summary: `Arquivo "${filePath}" lido com sucesso.`
          };
        }

        return {
          result: { path: filePath, error: 'Arquivo não encontrado.' },
          status: 'warning',
          summary: `Arquivo "${filePath}" não foi encontrado.`
        };
      }

      case 'files_write': {
        const filePath = validateAndNormalizeFilePath(args.path);
        if (!filePath) {
          return {
            result: { error: 'Arquivo não permitido ou caminho inválido.' },
            status: 'error',
            summary: 'Gravação negada: caminho inválido.'
          };
        }

        const content = String(args.content ?? '');
        virtualFileSystem[filePath] = content;
        logAudit('file_write', { filePath, bytes: content.length });
        return {
          result: { path: filePath, bytes_written: content.length, status: 'saved' },
          status: 'success',
          summary: `Arquivo "${filePath}" gravado com sucesso.`
        };
      }

      case 'files_delete': {
        const filePath = validateAndNormalizeFilePath(args.path);
        if (!filePath) {
          return {
            result: { error: 'Arquivo não permitido ou caminho inválido.' },
            status: 'error',
            summary: 'Exclusão negada: caminho inválido.'
          };
        }

        if (virtualFileSystem[filePath] !== undefined) {
          delete virtualFileSystem[filePath];
          logAudit('file_delete', { filePath });
          return {
            result: { path: filePath, deleted: true },
            status: 'success',
            summary: `Arquivo "${filePath}" foi excluído.`
          };
        }

        return {
          result: { path: filePath, error: 'Arquivo não existia.' },
          status: 'warning',
          summary: `Arquivo "${filePath}" não encontrado para exclusão.`
        };
      }

      case 'computer_screenshot': {
        logAudit('tool_executed', { toolName });
        return {
          result: {
            width: 1920,
            height: 1080,
            active_window: 'Visual Studio Code - MICA',
            windows_detected: ['VS Code', 'Google Chrome', 'Terminal'],
            visible_elements: 'Código-fonte da aplicação MICA em exibição.'
          },
          status: 'success',
          summary: 'Screenshot capturado.'
        };
      }

      case 'computer_click': {
        const x = Number(args.x ?? 0);
        const y = Number(args.y ?? 0);
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
          return {
            result: { error: 'Coordenadas inválidas.' },
            status: 'error',
            summary: 'Clique não executado: coordenadas inválidas.'
          };
        }

        robot.moveMouse(x, y);
        robot.mouseClick('left', Boolean(args.double));
        logAudit('tool_executed', { toolName, x, y, double: Boolean(args.double) });
        return {
          result: { x, y, double: !!args.double, executed: true },
          status: 'success',
          summary: `Clique executado nas coordenadas (${x}, ${y}).`
        };
      }

      case 'computer_type': {
        const text = String(args.text ?? '');
        if (!text || text.length > 2000) {
          return {
            result: { error: 'Texto inválido ou excedeu o limite.' },
            status: 'error',
            summary: 'Digitação não executada.'
          };
        }

        robot.typeString(text);
        logAudit('tool_executed', { toolName, length: text.length });
        return {
          result: { text_length: text.length, typed: true },
          status: 'success',
          summary: `Digitação concluída (${text.length} caracteres).`
        };
      }

      case 'memory_save': {
        const category = sanitizeText(args.category, 'important');
        const key = sanitizeText(args.key, '');
        const value = sanitizeText(args.value, '');

        if (!key || !value || !['profile', 'preference', 'project', 'important', 'context'].includes(category)) {
          return {
            result: { error: 'Categoria, chave e valor são obrigatórios.' },
            status: 'error',
            summary: 'Memória não salva: dados inválidos.'
          };
        }

        const existing = memoryStore.findIndex((m) => m.key.toLowerCase() === key.toLowerCase());
        if (existing >= 0) {
          memoryStore[existing] = {
            ...memoryStore[existing],
            category: category as any,
            key,
            value,
            updated_at: new Date().toISOString()
          };
        } else {
          memoryStore.push({
            id: `mem-${Date.now()}`,
            category: category as any,
            key,
            value,
            updated_at: new Date().toISOString()
          });
        }

        logAudit('memory_saved', { category, key, value });
        return {
          result: { category, key, value, saved: true },
          status: 'success',
          summary: `Informação memorizada: [${category.toUpperCase()}] ${key}`
        };
      }

      case 'memory_search': {
        const query = sanitizeText(args.query, '').toLowerCase();
        const results = memoryStore.filter((m) =>
          m.key.toLowerCase().includes(query) ||
          m.value.toLowerCase().includes(query) ||
          m.category.toLowerCase().includes(query)
        );

        logAudit('memory_search', { query, count: results.length });
        return {
          result: { query, count: results.length, matches: results },
          status: 'success',
          summary: `Consulta de memória retornou ${results.length} registros.`
        };
      }

      default:
        return {
          result: { error: `Ferramenta desconhecida: ${toolName}` },
          status: 'error',
          summary: `Ferramenta não suportada: ${toolName}`
        };
    }
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('tool_execution_failed', { toolName, error: message });
    return {
      result: { error: message },
      status: 'error',
      summary: `Erro ao executar ${toolName}: ${message}`
    };
  }
}

function getTimeString() {
  const d = new Date();
  return d.toTimeString().split(' ')[0];
}

async function startServer() {
  const app = express();
  const PORT = DEFAULT_PORT;

  app.use(express.json({ limit: '50mb' }));

  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'MICA Desktop Backend',
      version: '1.0.0',
      model: systemSettings.ai_model,
      gemini_configured: !!process.env.GEMINI_API_KEY
    });
  });

  app.post('/api/chat', async (req: Request, res: Response) => {
    const { message = '', image_base64, confirmation_token, confirmed = false } = req.body;
    const activityTimeline: ActivityLog[] = [];

    const pushActivity = (text: string, type: ActivityLog['type'], toolName?: string) => {
      const act: ActivityLog = {
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        time: getTimeString(),
        text,
        type,
        toolName
      };
      activityTimeline.push(act);
      activityLogs.unshift(act);
      if (activityLogs.length > 100) activityLogs.pop();
    };

    if (confirmation_token) {
      const pending = pendingConfirmations.get(confirmation_token);
      if (!pending) {
        logAudit('confirmation_rejected', { token: confirmation_token, reason: 'invalid_token' });
        return res.json({
          response: '⚠️ O token de autorização expirou ou é inválido.',
          activities: activityTimeline,
          needs_confirmation: false
        });
      }

      pendingConfirmations.delete(confirmation_token);
      if (!confirmed) {
        pushActivity(`Ação "${pending.tool_name}" cancelada pelo usuário.`, 'warn', pending.tool_name);
        logAudit('confirmation_cancelled', { toolName: pending.tool_name });
        return res.json({
          response: `Ação sensível \`${pending.tool_name}\` foi cancelada por decisão do usuário.`,
          activities: activityTimeline,
          needs_confirmation: false
        });
      }

      pushActivity(`Ação autorizada "${pending.tool_name}" em execução...`, 'exec', pending.tool_name);
      const execution = executeToolAction(pending.tool_name, pending.arguments);
      pushActivity(execution.summary, 'done', pending.tool_name);
      logAudit('confirmation_approved', { toolName: pending.tool_name, result: execution.status });

      return res.json({
        response: `✅ Ação autorizada com sucesso! \`${pending.tool_name}\` foi executada.\n\n**Resultado:**\n${execution.summary}`,
        activities: activityTimeline,
        needs_confirmation: false,
        tool_execution_details: [{
          tool_name: pending.tool_name,
          arguments: pending.arguments,
          result: execution.result,
          status: execution.status
        }]
      });
    }

    pushActivity(`Comando recebido: "${String(message).substring(0, 70)}${String(message).length > 70 ? '...' : ''}"`, 'info');
    pushActivity('Analisando comando e intenção...', 'plan');

    const memoryContext = memoryStore
      .map((m) => `- [${m.category.toUpperCase()}] ${m.key}: ${m.value}`)
      .join('\n');

    const systemPrompt = `Você é a MICA, um assistente computacional multimodal baseado em visão computacional e agentes inteligentes para automação de tarefas e aumento de produtividade no SENAI Pernambuco.\nPersonalidade: ${systemSettings.personality}\nNome do assistente: ${systemSettings.assistant_name}\nNível de detalhamento: ${systemSettings.detail_level}\n\nContexto da memória persistente:\n${memoryContext}\n\nDiretrizes:\n- Responda em português claro e profissional.\n- Explique brevemente o que realizou ao invocar ferramentas.\n- Priorize segurança e confirmação humana.\n- Nunca invente dados quando puder consultar arquivos ou memória.`;

    const ai = getGeminiClient();

    if (!ai) {
      const lower = String(message).toLowerCase();
      let simulatedResponse = 'Olá! Sou a MICA, assistente multimodal do SENAI Pernambuco.';
      const toolExecutionDetails: any[] = [];

      if (lower.includes('navegador') || lower.includes('site') || lower.includes('google') || lower.includes('pesquisar')) {
        const result = executeToolAction('browser_search', { query: message });
        toolExecutionDetails.push({ tool_name: 'browser_search', arguments: { query: message }, result: result.result, status: result.status });
        simulatedResponse = `Realizei uma busca para **"${message}"** no navegador.`;
      } else if (lower.includes('arquivo') || lower.includes('leia') || lower.includes('relatorio')) {
        const target = lower.includes('projeto') ? 'projeto.txt' : lower.includes('python') ? 'python_news.txt' : 'relatorio.txt';
        const result = executeToolAction('files_read', { path: target });
        toolExecutionDetails.push({ tool_name: 'files_read', arguments: { path: target }, result: result.result, status: result.status });
        simulatedResponse = `📄 Conteúdo de **\`${target}\`**:\n\n\`\`\`\n${result.result.content || ''}\n\`\`\``;
      } else if (lower.includes('crie') || lower.includes('salve') || lower.includes('grave')) {
        const fileName = lower.includes('resumo') ? 'resumo_executivo.txt' : 'novo_documento.txt';
        const content = `# Gerado pela MICA\nData: ${new Date().toLocaleDateString()}\nObjetivo: ${message}`;
        const result = executeToolAction('files_write', { path: fileName, content });
        toolExecutionDetails.push({ tool_name: 'files_write', arguments: { path: fileName, content }, result: result.result, status: result.status });
        simulatedResponse = `✅ Arquivo **\`${fileName}\`** foi criado com sucesso.`;
      } else if (lower.includes('memoria') || lower.includes('guarde') || lower.includes('lembre')) {
        const result = executeToolAction('memory_save', { category: 'profile', key: 'informacao_usuario', value: message });
        toolExecutionDetails.push({ tool_name: 'memory_save', arguments: { category: 'profile', key: 'informacao_usuario', value: message }, result: result.result, status: result.status });
        simulatedResponse = `🧠 Informações gravadas com sucesso na memória da MICA.`;
      } else {
        simulatedResponse = `Recebi seu comando: **"${message}"**. Posso continuar com pesquisa, arquivos, automação e monitoramento de sistema em modo local.`;
      }

      pushActivity('Tarefa concluída.', 'done');
      logAudit('chat_fallback', { message, toolExecutionDetails: toolExecutionDetails.length });
      return res.json({
        response: simulatedResponse,
        activities: activityTimeline,
        needs_confirmation: false,
        tool_execution_details: toolExecutionDetails.length ? toolExecutionDetails : undefined
      });
    }

    try {
      pushActivity('Consultando modelo Gemini com Function Calling...', 'plan');
      const contents: any[] = [];

      if (image_base64) {
        contents.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: image_base64.replace(/^data:image\/[a-z]+;base64,/, '')
          }
        });
      }

      contents.push({ text: message });

      const response = await ai.models.generateContent({
        model: systemSettings.ai_model,
        contents,
        config: {
          systemInstruction: systemPrompt,
          tools: [{ functionDeclarations: toolDeclarations }]
        }
      });

      const functionCalls = response.functionCalls || [];
      const toolExecutionDetails: any[] = [];

      if (functionCalls.length > 0) {
        for (const call of functionCalls) {
          const toolName = call.name;
          const args = (call.args as Record<string, any>) || {};
          const highRisk = toolName === 'files_delete' || (toolName === 'files_write' && (String(args.path ?? '').includes('system') || String(args.path ?? '').includes('/etc/')));

          pushActivity(`Ferramenta identificada: ${toolName}`, 'tool', toolName);

          if (highRisk && systemSettings.require_high_permission_confirmation) {
            const token = `sec-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
            pendingConfirmations.set(token, {
              token,
              tool_name: toolName,
              arguments: args,
              description: `O assistente solicitou executar "${toolName}" com argumentos: ${JSON.stringify(args)}`,
              permission_level: 'HIGH',
              created_at: Date.now()
            });

            pushActivity(`⚠️ Ação de alto risco interceptada (${toolName}). Solicitando confirmação...`, 'security', toolName);
            logAudit('high_risk_action_pending', { toolName, token });

            return res.json({
              response: `Ação crítica de alto risco detectada (\`${toolName}\`). Por segurança, é necessária sua autorização explícita antes da execução.`,
              activities: activityTimeline,
              needs_confirmation: true,
              confirmation_details: {
                token,
                tool_name: toolName,
                arguments: args,
                warning: 'Esta operação pode modificar ou excluir dados permanentes no sistema.',
                permission_level: 'HIGH'
              }
            });
          }

          pushActivity(`Executando ${toolName}...`, 'exec', toolName);
          const execResult = executeToolAction(toolName, args);
          pushActivity(execResult.summary, 'done', toolName);
          toolExecutionDetails.push({
            tool_name: toolName,
            arguments: args,
            result: execResult.result,
            status: execResult.status
          });
        }

        const toolFeedbackPrompt = `O usuário disse: "${message}". Você chamou as ferramentas: ${JSON.stringify(toolExecutionDetails, null, 2)}. Apresente uma resposta concisa e amigável.`;
        const finalAiResponse = await ai.models.generateContent({
          model: systemSettings.ai_model,
          contents: [{ text: toolFeedbackPrompt }],
          config: { systemInstruction: systemPrompt }
        });

        pushActivity('Tarefa concluída com sucesso.', 'done');
        logAudit('chat_success', { message, toolCount: toolExecutionDetails.length });

        return res.json({
          response: finalAiResponse.text || 'Comando executado com sucesso.',
          activities: activityTimeline,
          needs_confirmation: false,
          tool_execution_details: toolExecutionDetails
        });
      }

      pushActivity('Tarefa concluída.', 'done');
      return res.json({
        response: response.text || 'Entendido!',
        activities: activityTimeline,
        needs_confirmation: false
      });
    } catch (error: any) {
      const isQuotaError = error?.status === 429 || /quota|RESOURCE_EXHAUSTED|exceeded your current quota/i.test(String(error?.message || ''));
      if (isQuotaError) {
        pushActivity('Quota do Gemini excedida. Usando modo local de resposta.', 'warn');
        logAudit('gemini_quota_exceeded', { message });
        return res.json({
          response: `⚠️ A API do Gemini excedeu a cota gratuita neste momento. Estou respondendo em modo local com funcionalidade limitada.`,
          activities: activityTimeline,
          needs_confirmation: false,
          fallback_mode: true
        });
      }

      logger.error('chat_error', { message: String(error?.message || error), stack: error?.stack });
      return res.status(500).json({
        response: `⚠️ Ocorreu um problema ao conectar com o modelo: ${error.message}`,
        activities: activityTimeline,
        needs_confirmation: false
      });
    }
  });

  app.get('/api/memory', (req: Request, res: Response) => {
    const query = String(req.query.query || '').toLowerCase();
    if (query) {
      const filtered = memoryStore.filter((m) =>
        m.key.toLowerCase().includes(query) ||
        m.value.toLowerCase().includes(query) ||
        m.category.toLowerCase().includes(query)
      );
      return res.json(filtered);
    }
    return res.json(memoryStore);
  });

  app.post('/api/memory', (req: Request, res: Response) => {
    const { category = 'important', key, value } = req.body;
    if (!key || !value) {
      return res.status(400).json({ error: 'Chave e valor são obrigatórios.' });
    }

    const record: MemoryRecord = {
      id: `mem-${Date.now()}`,
      category,
      key,
      value,
      updated_at: new Date().toISOString()
    };

    memoryStore.unshift(record);
    logAudit('memory_created', { category, key });
    return res.json(record);
  });

  app.delete('/api/memory/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const initialLen = memoryStore.length;
    memoryStore = memoryStore.filter((m) => m.id !== id);
    if (memoryStore.length === initialLen) {
      return res.status(404).json({ error: 'Memória não encontrada.' });
    }
    logAudit('memory_deleted', { id });
    return res.json({ success: true, id });
  });

  app.get('/api/activities', (req: Request, res: Response) => {
    res.json(activityLogs);
  });

  app.delete('/api/activities', (req: Request, res: Response) => {
    activityLogs = [];
    logAudit('activities_cleared');
    res.json({ success: true, message: 'Logs limpos.' });
  });

  app.get('/api/settings', (req: Request, res: Response) => {
    res.json(systemSettings);
  });

  app.put('/api/settings', (req: Request, res: Response) => {
    systemSettings = { ...systemSettings, ...req.body };
    logAudit('settings_updated', { settings: systemSettings });
    res.json(systemSettings);
  });

  app.get('/api/files', (req: Request, res: Response) => {
    const files = Object.keys(virtualFileSystem).map((k) => ({
      name: k,
      size: virtualFileSystem[k].length
    }));
    res.json(files);
  });

  app.get('/api/system/status', (req: Request, res: Response) => {
    res.json({
      status: 'online',
      cpuUsage: Math.floor(12 + Math.random() * 10),
      memoryUsage: Math.floor(38 + Math.random() * 5),
      activeWindow: 'VS Code - MICA',
      activeApp: 'Visual Studio Code',
      connectedTools: toolDeclarations.length,
      totalCommandsExecuted: activityLogs.length
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    logger.info('server_started', { port: PORT, service: 'MICA' });
    console.log(`MICA server running at http://localhost:${PORT}`);
  });
}

startServer();
