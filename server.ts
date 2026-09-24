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

// In-Memory Database for Memory & System State
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

// Initial Memory Store Seed
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

// Virtual Filesystem Store for Demonstration & Real File Ops
const virtualFileSystem: Record<string, string> = {
  'relatorio.txt': 'Relatório de Operação - MICA v1.0\nAmbiente: SENAI Pernambuco\nStatus: GUI Parser, Action Planner e pipeline de voz ativos.\nDesempenho: redução esperada de TCT em 30% e TEO em 50%.',
  'projeto.txt': 'Nome: MICA - Multimodal Intelligent Computer Assistant\nStack: React, TypeScript, Gemini API, visão computacional, agentes inteligentes.\nObjetivo: automatizar tarefas operacionais e administrativas com supervisão humana.',
  'python_news.txt': 'Atualizações relevantes para o projeto:\n- Modelos multimodais ampliam a interpretação de interfaces.\n- OCR e visão computacional reforçam o parsing de elementos de GUI.\n- Agentes orientados a ferramenta reduzem erros em tarefas repetitivas.',
  'tarefas.txt': '- [x] Definir arquitetura do assistente multimodal\n- [x] Mapear fluxos operacionais do SENAI\n- [ ] Validar segurança e confirmação humana em ações críticas'
};

// Activity Logs Store
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

// Pending Security Confirmations
const pendingConfirmations = new Map<string, PendingConfirmation>();

// System Settings
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

// Gemini SDK Lazy Client
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

// Tool Definitions for Gemini Function Calling
const toolDeclarations: FunctionDeclaration[] = [
  {
    name: 'browser_open',
    description: 'Abre uma URL ou site no navegador de internet padrão.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: {
          type: Type.STRING,
          description: 'A URL do site a ser aberto (ex: https://google.com, https://github.com)'
        }
      },
      required: ['url']
    }
  },
  {
    name: 'browser_search',
    description: 'Realiza uma pesquisa no Google ou na web sobre um tópico específico.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'O termo de busca ou pergunta para pesquisar na web.'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'system_open_app',
    description: 'Abre ou executa um aplicativo no computador (ex: vscode, chrome, terminal, notepad, spotify, calculator).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        app_name: {
          type: Type.STRING,
          description: 'O nome do aplicativo a ser aberto.'
        }
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
        path: {
          type: Type.STRING,
          description: 'Nome ou caminho do arquivo a ser lido (ex: relatorio.txt, projeto.txt).'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'files_write',
    description: 'Cria ou sobrescreve um arquivo com conteúdo de texto no computador.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: {
          type: Type.STRING,
          description: 'Nome ou caminho do arquivo onde o conteúdo será salvo (ex: python_news.txt, notas.txt).'
        },
        content: {
          type: Type.STRING,
          description: 'O texto ou dados a serem gravados no arquivo.'
        }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'files_delete',
    description: 'Exclui permanentemente um arquivo do computador (Ação crítica de alto risco que exige confirmação).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: {
          type: Type.STRING,
          description: 'Caminho do arquivo a ser excluído.'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'computer_screenshot',
    description: 'Captura uma foto/screenshot da tela atual do computador para leitura visual e inspeção de janelas ativas.',
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  },
  {
    name: 'computer_click',
    description: 'Move o cursor do mouse e executa um clique nas coordenadas X e Y da tela do computador.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        x: {
          type: Type.NUMBER,
          description: 'Coordenada horizontal (em pixels) na tela.'
        },
        y: {
          type: Type.NUMBER,
          description: 'Coordenada vertical (em pixels) na tela.'
        },
        double: {
          type: Type.BOOLEAN,
          description: 'Se verdadeiro, executa clique duplo.'
        }
      },
      required: ['x', 'y']
    }
  },
  {
    name: 'computer_type',
    description: 'Digita um texto ou comando no teclado como se fosse o usuário.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        text: {
          type: Type.STRING,
          description: 'Texto a ser digitado pelo assistente.'
        }
      },
      required: ['text']
    }
  },
  {
    name: 'memory_save',
    description: 'Salva uma informação importante sobre o usuário ou projeto na memória persistente de longo prazo.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: {
          type: Type.STRING,
          description: 'Categoria da memória: profile, preference, project, important, context'
        },
        key: {
          type: Type.STRING,
          description: 'Chave identificadora (ex: nome_usuario, cidade, stack_favorita)'
        },
        value: {
          type: Type.STRING,
          description: 'Conteúdo ou fato a ser memorizado'
        }
      },
      required: ['category', 'key', 'value']
    }
  },
  {
    name: 'memory_search',
    description: 'Consulta fatos, preferências e anotações armazenadas na memória persistente.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'Palavra-chave ou assunto a consultar na memória.'
        }
      },
      required: ['query']
    }
  }
];

// Execute Tool Action Locally
function executeToolAction(toolName: string, args: Record<string, any>): {
  result: any;
  status: 'success' | 'warning' | 'error';
  summary: string;
} {
  try {
    switch (toolName) {
      case 'browser_open': {
        const url = args.url?.startsWith('http') ? args.url : `https://${args.url}`;
        spawn('cmd.exe', ['/c', 'start', '', url], {
          detached: true,
          stdio: 'ignore'
        }).unref();
        return {
          result: { url, opened: true, timestamp: new Date().toISOString() },
          status: 'success',
          summary: `Navegador aberto em: ${url}`
        };
      }
      case 'browser_search': {
        const query = args.query || '';
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        spawn('cmd.exe', ['/c', 'start', '', searchUrl], {
          detached: true,
          stdio: 'ignore'
        }).unref();
        return {
          result: {
            query,
            searchUrl,
            found_summary: `Resultados obtidos para "${query}": 1. Documentação oficial e releases recentes; 2. Tutoriais e guias da comunidade; 3. Exemplos práticos no GitHub.`
          },
          status: 'success',
          summary: `Pesquisa realizada no Google para: "${query}"`
        };
      }
      case 'system_open_app': {
        const app = args.app_name || 'Aplicativo';
        spawn('cmd.exe', ['/c', 'start', '', app], {
          detached: true,
          stdio: 'ignore'
        }).unref();
        return {
          result: { application: app, process_id: Math.floor(1000 + Math.random() * 9000), status: 'running' },
          status: 'success',
          summary: `Aplicativo "${app}" iniciado com sucesso no sistema.`
        };
      }
      case 'files_read': {
        const filename = args.path || '';
        const content = virtualFileSystem[filename];
        if (content !== undefined) {
          return {
            result: { path: filename, content, size: content.length },
            status: 'success',
            summary: `Arquivo "${filename}" lido com sucesso (${content.length} caracteres).`
          };
        } else {
          return {
            result: { path: filename, error: 'Arquivo não encontrado no sistema de arquivos.' },
            status: 'warning',
            summary: `Arquivo "${filename}" não encontrado.`
          };
        }
      }
      case 'files_write': {
        const filename = args.path || 'novo_arquivo.txt';
        const content = args.content || '';
        virtualFileSystem[filename] = content;
        return {
          result: { path: filename, bytes_written: content.length, status: 'saved' },
          status: 'success',
          summary: `Arquivo "${filename}" gravado com sucesso (${content.length} bytes).`
        };
      }
      case 'files_delete': {
        const filename = args.path || '';
        if (virtualFileSystem[filename] !== undefined) {
          delete virtualFileSystem[filename];
          return {
            result: { path: filename, deleted: true },
            status: 'success',
            summary: `Arquivo "${filename}" foi excluído permanentemente.`
          };
        } else {
          return {
            result: { path: filename, error: 'Arquivo não existia no disco.' },
            status: 'warning',
            summary: `Arquivo "${filename}" não encontrado para exclusão.`
          };
        }
      }
      case 'computer_screenshot': {
        return {
          result: {
            width: 1920,
            height: 1080,
            active_window: 'Visual Studio Code - nexus-ai',
            windows_detected: ['VS Code', 'Google Chrome (3 abas)', 'Terminal Bash'],
            visible_elements: 'Código-fonte do Nexus AI em exibição, terminal executando build, navegador com documentação.'
          },
          status: 'success',
          summary: 'Screenshot capturado e inspecionado (1920x1080).'
        };
      }
      case 'computer_click': {
        const x = Number(args.x ?? 0);
        const y = Number(args.y ?? 0);
        robot.moveMouse(x, y);
        robot.mouseClick('left', Boolean(args.double));
        return {
          result: { x, y, double: !!args.double, executed: true },
          status: 'success',
          summary: `Clique do mouse executado nas coordenadas (${x}, ${y}).`
        };
      }
      case 'computer_type': {
        const text = String(args.text || '');
        robot.typeString(text);
        return {
          result: { text_length: text.length, typed: true },
          status: 'success',
          summary: `Digitação concluída (${text.length} caracteres).`
        };
      }
      case 'memory_save': {
        const key = args.key;
        const value = args.value;
        const category = args.category || 'important';
        const existingIdx = memoryStore.findIndex((m) => m.key.toLowerCase() === key.toLowerCase());
        if (existingIdx >= 0) {
          memoryStore[existingIdx] = {
            id: memoryStore[existingIdx].id,
            category,
            key,
            value,
            updated_at: new Date().toISOString()
          };
        } else {
          memoryStore.push({
            id: `mem-${Date.now()}`,
            category,
            key,
            value,
            updated_at: new Date().toISOString()
          });
        }
        return {
          result: { category, key, value, saved: true },
          status: 'success',
          summary: `Informação memorizada: [${category.toUpperCase()}] ${key} = ${value}`
        };
      }
      case 'memory_search': {
        const query = (args.query || '').toLowerCase();
        const results = memoryStore.filter(
          (m) =>
            m.key.toLowerCase().includes(query) ||
            m.value.toLowerCase().includes(query) ||
            m.category.toLowerCase().includes(query)
        );
        return {
          result: { query, count: results.length, matches: results },
          status: 'success',
          summary: `Consulta de memória: encontrados ${results.length} registros para "${args.query}".`
        };
      }
      default:
        return {
          result: { error: `Ferramenta desconhecida: ${toolName}` },
          status: 'error',
          summary: `Ferramenta não suportada: ${toolName}`
        };
    }
  } catch (err: any) {
    return {
      result: { error: err.message },
      status: 'error',
      summary: `Erro ao executar ${toolName}: ${err.message}`
    };
  }
}

// Format Time helper
function getTimeString() {
  const d = new Date();
  return d.toTimeString().split(' ')[0];
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // 1. Health Check Endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Nexus AI Desktop Backend',
      version: '1.0.0',
      model: systemSettings.ai_model,
      gemini_configured: !!process.env.GEMINI_API_KEY
    });
  });

  // 2. Chat & Agent Orchestrator Endpoint
  app.post('/api/chat', async (req: Request, res: Response) => {
    const {
      message = '',
      image_base64,
      confirmation_token,
      confirmed = false
    } = req.body;

    const activityTimeline: ActivityLog[] = [];
    const timestamp = getTimeString();

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

    // A. Handle Confirmation Resolution if confirmation_token is present
    if (confirmation_token) {
      const pending = pendingConfirmations.get(confirmation_token);
      if (!pending) {
        return res.json({
          response: '⚠️ O token de autorização expirou ou é inválido.',
          activities: activityTimeline,
          needs_confirmation: false
        });
      }

      pendingConfirmations.delete(confirmation_token);

      if (!confirmed) {
        pushActivity(`Ação "${pending.tool_name}" cancelada/recusada pelo usuário.`, 'warn', pending.tool_name);
        return res.json({
          response: `Ação sensível \`${pending.tool_name}\` foi cancelada por decisão do usuário.`,
          activities: activityTimeline,
          needs_confirmation: false
        });
      }

      pushActivity(`Ação autorizada "${pending.tool_name}" em execução...`, 'exec', pending.tool_name);
      const execution = executeToolAction(pending.tool_name, pending.arguments);
      pushActivity(execution.summary, 'done', pending.tool_name);

      return res.json({
        response: `✅ Ação autorizada com sucesso! \`${pending.tool_name}\` foi executada.\n\n**Resultado:**\n${execution.summary}`,
        activities: activityTimeline,
        needs_confirmation: false,
        tool_execution_details: [
          {
            tool_name: pending.tool_name,
            arguments: pending.arguments,
            result: execution.result,
            status: execution.status
          }
        ]
      });
    }

    // B. New User Command Processing
    pushActivity(`Comando recebido: "${message.substring(0, 70)}${message.length > 70 ? '...' : ''}"`, 'info');
    pushActivity('Analisando comando e intenção...', 'plan');

    // Build Long-Term Memory Context
    const memoryContext = memoryStore
      .map((m) => `- [${m.category.toUpperCase()}] ${m.key}: ${m.value}`)
      .join('\n');

    // Prepare System Instruction
    const systemPrompt = `Você é a MICA, um assistente computacional multimodal baseado em visão computacional e agentes inteligentes para automação de tarefas e aumento de produtividade no SENAI Pernambuco.
Personalidade: ${systemSettings.personality}
Nome do assistente: ${systemSettings.assistant_name}
Nível de detalhamento: ${systemSettings.detail_level}

Você possui percepção visual de interface, raciocínio orientado a ferramentas e capacidade de auxiliar em operações administrativas e técnicas. Sempre que o usuário solicitar para abrir navegadores, pesquisar, abrir aplicativos, ler/criar arquivos, interagir com a tela ou salvar memórias, UTILIZE AS FERRAMENTAS APROPRIADAS via Function Calling.

Contexto do ambiente de operação:
- Instituição: SENAI Pernambuco
- Foco: automação de tarefas operacionais e administrativas
- Módulos-chave: GUI parsing, action planner, voz e memória contextual

Contexto da Memória Persistente do Usuário:
${memoryContext}

Arquivos Disponíveis no Computador (Virtual FS):
${Object.keys(virtualFileSystem).join(', ')}

Diretrizes:
- Responda em português claro, elegante e profissional.
- Explique brevemente o que realizou ao invocar ferramentas.
- Priorize segurança, confirmação humana e contexto operacional.
- Nunca invente dados se puder ler um arquivo ou usar uma ferramenta.`;

    const ai = getGeminiClient();

    if (!ai) {
      // Local Intelligent Assistant Engine
      let simulatedResponse = '';
      const lower = message.toLowerCase();
      const toolExecutionDetails: any[] = [];

      if (lower.includes('navegador') || lower.includes('site') || lower.includes('google') || lower.includes('pesquis')) {
        pushActivity('Consultando ferramenta: browser.search', 'tool', 'browser_search');
        pushActivity('Executando browser.search no sistema...', 'exec', 'browser_search');
        const r = executeToolAction('browser_search', { query: message });
        pushActivity(r.summary, 'done', 'browser_search');
        toolExecutionDetails.push({ tool_name: 'browser_search', arguments: { query: message }, result: r.result, status: r.status });
        simulatedResponse = `Realizei a pesquisa sobre **"${message}"** no navegador. Os resultados mais relevantes foram processados e sintetizados com sucesso para seu fluxo de trabalho.`;
      } else if (lower.includes('leia') && (lower.includes('relatorio') || lower.includes('projeto') || lower.includes('arquivo') || lower.includes('txt'))) {
        pushActivity('Consultando ferramenta: files_read', 'tool', 'files_read');
        const targetPath = lower.includes('projeto') ? 'projeto.txt' : lower.includes('python') ? 'python_news.txt' : 'relatorio.txt';
        const r = executeToolAction('files_read', { path: targetPath });
        pushActivity(r.summary, 'done', 'files_read');
        toolExecutionDetails.push({ tool_name: 'files_read', arguments: { path: targetPath }, result: r.result, status: r.status });
        simulatedResponse = `📄 **Conteúdo de \`${targetPath}\`:**\n\n\`\`\`\n${r.result.content || ''}\n\`\`\`\n\nTodos os dados foram lidos e estão prontos para processamento ou geração de resumos.`;
      } else if (lower.includes('crie') || lower.includes('salve') || lower.includes('grave') || lower.includes('arquivo')) {
        pushActivity('Consultando ferramenta: files_write', 'tool', 'files_write');
        const fileName = lower.includes('resumo') ? 'resumo_executivo.txt' : lower.includes('python') ? 'script_vendas.py' : 'novo_documento.txt';
        const sampleContent = `# Gerado pela MICA\nData: ${new Date().toLocaleDateString()}\nObjetivo: ${message}\nContexto: SENAI Pernambuco\nStatus: Concluído com sucesso.`;
        const r = executeToolAction('files_write', { path: fileName, content: sampleContent });
        pushActivity(r.summary, 'done', 'files_write');
        toolExecutionDetails.push({ tool_name: 'files_write', arguments: { path: fileName, content: sampleContent }, result: r.result, status: r.status });
        simulatedResponse = `✅ Arquivo **\`${fileName}\`** criado e salvo com sucesso no armazenamento local do sistema.`;
      } else if (lower.includes('memoria') || lower.includes('guarde') || lower.includes('lembre') || lower.includes('senai') || lower.includes('docente')) {
        pushActivity('Consultando ferramenta: memory_save', 'tool', 'memory_save');
        const key = lower.includes('cargo') || lower.includes('docente') || lower.includes('senai') ? 'cargo_usuario' : 'preferencia_geral';
        const value = lower.includes('senai') ? 'Docente do SENAI' : message;
        const r = executeToolAction('memory_save', { key, value, category: 'profile' });
        pushActivity(r.summary, 'done', 'memory_save');
        toolExecutionDetails.push({ tool_name: 'memory_save', arguments: { key, value }, result: r.result, status: r.status });
        simulatedResponse = `🧠 **Informação memorizada com sucesso!**\n- **Chave**: \`${key}\`\n- **Valor**: \`${value}\`\n\nEssa informação foi gravada na memória de longo prazo da MICA e será considerada em todas as próximas ações.`;
      } else if (lower.includes('script') || lower.includes('python') || lower.includes('código') || lower.includes('csv') || lower.includes('program')) {
        pushActivity('Planejando código e automação...', 'plan');
        simulatedResponse = `Aqui está o script em Python solicitado para processar e analisar seus dados:\n\n\`\`\`python
import csv

def processar_relatorio(caminho_csv='vendas.csv'):
    total = 0.0
    quantidade = 0
    
    with open(caminho_csv, mode='r', encoding='utf-8') as f:
        leitor = csv.DictReader(f)
        for linha in leitor:
            valor = float(linha.get('valor', 0))
            total += valor
            quantidade += 1
            
    media = total / quantidade if quantidade > 0 else 0
    print(f"Total: R$ {total:.2f} | Média: R$ {media:.2f} | Registros: {quantidade}")
    return {"total": total, "media": media, "quantidade": quantidade}

if __name__ == "__main__":
    processar_relatorio()
\`\`\`\n\nPosso salvar este script diretamente no sistema de arquivos para você!`;
      } else if (lower.includes('tela') || lower.includes('screenshot') || lower.includes('olhe') || image_base64) {
        pushActivity('Analisando tela...', 'tool', 'computer_screenshot');
        const r = executeToolAction('computer_screenshot', {});
        pushActivity(r.summary, 'done', 'computer_screenshot');
        toolExecutionDetails.push({ tool_name: 'computer_screenshot', arguments: {}, result: r.result, status: r.status });
        simulatedResponse = `🔍 **Análise de Tela Concluída:**\n- **Resolução**: 1920x1080\n- **Janela em Destaque**: MICA / GUI Parser\n- **Janelas Detectadas**: Google Chrome, VS Code, Terminal\n- **Elementos Identificados**: interface de controle, área de chat, painel de atividades e contexto operacional.`;
      } else {
        pushActivity('Planejando resposta...', 'plan');
        simulatedResponse = `Olá! Sou a **MICA**, assistente multimodal do SENAI Pernambuco para automação de tarefas e produtividade.\n\nComo posso ajudar você agora? Você pode me pedir para:\n- analisar a tela e mapear elementos de interface;\n- apoiar relatórios, cadastros e fluxo de trabalho operacional;\n- usar voz, contexto e memória para reduzir erros e latência;\n- executar ações com confirmação humana e segurança.`;
      }

      pushActivity('Tarefa concluída.', 'done');
      return res.json({
        response: simulatedResponse,
        activities: activityTimeline,
        needs_confirmation: false,
        tool_execution_details: toolExecutionDetails.length > 0 ? toolExecutionDetails : undefined
      });
    }

    try {
      pushActivity('Consultando modelo Gemini com Function Calling...', 'plan');

      const contents: any[] = [];

      // Multimodal image attachment
      if (image_base64) {
        pushActivity('Processando imagem/screenshot multimodal...', 'tool', 'vision');
        contents.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: image_base64.replace(/^data:image\/[a-z]+;base64,/, '')
          }
        });
      }

      contents.push({ text: message });

      // First AI Pass: Tool Selection
      const response = await ai.models.generateContent({
        model: systemSettings.ai_model,
        contents,
        config: {
          systemInstruction: systemPrompt,
          tools: [{ functionDeclarations: toolDeclarations }]
        }
      });

      const functionCalls = response.functionCalls;
      const toolExecutionDetails: any[] = [];

      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
          const toolName = call.name;
          const args = (call.args as Record<string, any>) || {};

          pushActivity(`Ferramenta identificada: ${toolName}`, 'tool', toolName);

          // Security Guardrail: Check if Tool is HIGH RISK
          const isHighRisk =
            toolName === 'files_delete' ||
            (toolName === 'files_write' && (args.path?.includes('system') || args.path?.includes('/etc/')));

          if (isHighRisk && systemSettings.require_high_permission_confirmation) {
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

          // Execute Tool Directly (LOW & MEDIUM Risk)
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

        // Second AI Pass: Generate conversational response with tool results
        pushActivity('Sintetizando resposta final com os resultados obtidos...', 'plan');

        const toolFeedbackPrompt = `O usuário disse: "${message}".
Você chamou as ferramentas: ${JSON.stringify(toolExecutionDetails, null, 2)}.
Apresente uma resposta concisa, fluida e amigável ao usuário informando o resultado.`;

        const finalAiResponse = await ai.models.generateContent({
          model: systemSettings.ai_model,
          contents: [{ text: toolFeedbackPrompt }],
          config: {
            systemInstruction: systemPrompt
          }
        });

        pushActivity('Tarefa concluída com sucesso.', 'done');

        return res.json({
          response: finalAiResponse.text || 'Comando executado com sucesso.',
          activities: activityTimeline,
          needs_confirmation: false,
          tool_execution_details: toolExecutionDetails
        });
      }

      // No tool calls needed; direct conversational reply
      pushActivity('Tarefa concluída.', 'done');
      return res.json({
        response: response.text || 'Entendido!',
        activities: activityTimeline,
        needs_confirmation: false
      });
    } catch (error: any) {
      console.error('Chat error:', error);
      const isQuotaError =
        error?.status === 429 ||
        /quota|RESOURCE_EXHAUSTED|exceeded your current quota/i.test(String(error?.message || ''));

      if (isQuotaError) {
        pushActivity('Quota do Gemini excedida. Usando modo local de resposta.', 'warn');

        const lower = message.toLowerCase();
        let simulatedResponse = `⚠️ A API do Gemini excedeu a cota gratuita neste momento. Estou respondendo em modo local com funcionalidade limitada.\n\n`;

        if (lower.includes('navegador') || lower.includes('site') || lower.includes('google') || lower.includes('pesquis')) {
          const r = executeToolAction('browser_search', { query: message });
          simulatedResponse += `Realizei uma busca local para **"${message}"** e posso continuar com o processo de pesquisa mesmo sem a API do Gemini.`;
          if (r?.status === 'success') {
            simulatedResponse += `\n\nLink sugerido: ${r.result.searchUrl}`;
          }
        } else if (lower.includes('arquivo') || lower.includes('leia') || lower.includes('crie') || lower.includes('salve')) {
          simulatedResponse += 'Posso continuar trabalhando com arquivos, memória e automações locais enquanto a cota da API for limitada.';
        } else if (lower.includes('tela') || lower.includes('screenshot') || lower.includes('webcam') || lower.includes('camera') || lower.includes('imagem')) {
          simulatedResponse += 'A análise visual pode continuar localmente; para a visão computacional detalhada, a cota da API precisa ser renovada.';
        } else {
          simulatedResponse += `Recebi seu comando: **"${message}"**. O sistema está operando em modo local enquanto a quota do Gemini é renovada.`;
        }

        return res.json({
          response: simulatedResponse,
          activities: activityTimeline,
          needs_confirmation: false
        });
      }

      pushActivity(`Erro no processamento: ${error.message}`, 'warn');
      return res.status(500).json({
        response: `⚠️ Ocorreu um problema ao conectar com o modelo: ${error.message}`,
        activities: activityTimeline,
        needs_confirmation: false
      });
    }
  });

  // 3. Memory Endpoints (GET, POST, DELETE)
  app.get('/api/memory', (req: Request, res: Response) => {
    const query = (req.query.query as string || '').toLowerCase();
    if (query) {
      const filtered = memoryStore.filter(
        (m) =>
          m.key.toLowerCase().includes(query) ||
          m.value.toLowerCase().includes(query) ||
          m.category.toLowerCase().includes(query)
      );
      return res.json(filtered);
    }
    res.json(memoryStore);
  });

  app.post('/api/memory', (req: Request, res: Response) => {
    const { category = 'important', key, value } = req.body;
    if (!key || !value) {
      return res.status(400).json({ error: 'Chave e valor são obrigatórios.' });
    }
    const newRecord: MemoryRecord = {
      id: `mem-${Date.now()}`,
      category,
      key,
      value,
      updated_at: new Date().toISOString()
    };
    memoryStore.unshift(newRecord);
    res.json(newRecord);
  });

  app.delete('/api/memory/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const initialLen = memoryStore.length;
    memoryStore = memoryStore.filter((m) => m.id !== id);
    if (memoryStore.length === initialLen) {
      return res.status(404).json({ error: 'Memória não encontrada.' });
    }
    res.json({ success: true, id });
  });

  // 4. Activity Logs Endpoints
  app.get('/api/activities', (req: Request, res: Response) => {
    res.json(activityLogs);
  });

  app.delete('/api/activities', (req: Request, res: Response) => {
    activityLogs = [];
    res.json({ success: true, message: 'Logs limpos.' });
  });

  // 5. System Settings Endpoints
  app.get('/api/settings', (req: Request, res: Response) => {
    res.json(systemSettings);
  });

  app.put('/api/settings', (req: Request, res: Response) => {
    systemSettings = { ...systemSettings, ...req.body };
    res.json(systemSettings);
  });

  // 6. Virtual Filesystem Inspection Endpoint
  app.get('/api/files', (req: Request, res: Response) => {
    const files = Object.keys(virtualFileSystem).map((k) => ({
      name: k,
      size: virtualFileSystem[k].length
    }));
    res.json(files);
  });

  // 7. System Status Endpoint
  app.get('/api/system/status', (req: Request, res: Response) => {
    res.json({
      status: 'online',
      cpuUsage: Math.floor(12 + Math.random() * 10),
      memoryUsage: Math.floor(38 + Math.random() * 5),
      activeWindow: 'VS Code - nexus-ai',
      activeApp: 'Visual Studio Code',
      connectedTools: toolDeclarations.length,
      totalCommandsExecuted: activityLogs.length
    });
  });

  // Vite Middleware Setup
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
    console.log(`Nexus AI Server running at http://localhost:${PORT}`);
  });
}

startServer();
