# 🤖 MICA

## Assistente computacional multimodal para automação de tarefas no SENAI Pernambuco

O projeto foi transformado para refletir o conceito do pré-projeto acadêmico: o **MICA** é um assistente inteligente multimodal baseado em visão computacional e agentes orientados a ferramentas para reduzir o tempo de execução de tarefas, diminuir erros operacionais e apoiar a produtividade em ambientes educacionais e industriais.

Ele integra:

* 👁️ Visão computacional da interface gráfica (GUI parsing)
* 🎙️ Interação por voz e contexto conversacional
* 🧠 Planejamento de ações por agentes inteligentes
* ⚙️ Automação de tarefas com confirmação humana
* 📊 Medição de produtividade e usabilidade em cenários reais

<p align="center">
  <img 
    src="./Captura%20de%20tela%202026-08-23%20175645.png" 
    alt="Captura de tela da aplicação MICA"
    width="900"
  />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=nodedotjs" alt="Node.js" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Gemini-API-4285F4?style=for-the-badge&logo=google" alt="Gemini API" />
</p>

---

## 📌 Visão geral

O **MICA** é uma proposta de assistente inteligente multimodal orientada à pesquisa e à aplicação prática em ambientes operacionais do SENAI PE. O sistema foi concebido para combinar percepção visual de interfaces, compreensão de linguagem natural e automação guiada por agentes inteligentes.

Os principais pilares são:

* 🤖 Agentes com raciocínio orientado a ferramentas
* 🎙️ Comandos por voz e pipeline conversacional
* 👁️ Análise visual de telas e mapeamento semântico da interface
* 🖥️ Automação de ações em software e fluxos operacionais
* 🧠 Memória de contexto e acompanhamento de sessões
* ⚡ Redução de tempo de ciclo (TCT) e erro operacional (TEO)

---

## 🎯 Objetivo do projeto

O objetivo do **MICA** é funcionar como um assistente computacional multimodal para apoiar usuários em operações repetitivas, tarefas administrativas, relatórios e rotinas de bancada, reduzindo a carga cognitiva e acelerando a execução com apoio de visão computacional e IA.

A arquitetura combina diferentes formas de interação e automação:

```text
             ┌───────────────────┐
             │     USUÁRIO       │
             └─────────┬─────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
       💬 Texto      🎙️ Voz       📷 Imagem
          │            │            │
          └────────────┼────────────┘
                       ▼
              ┌─────────────────┐
              │      MICA       │
              │   Inteligência  │
              └────────┬────────┘
                       │
             ┌─────────┼─────────┐
             │         │         │
             ▼         ▼         ▼
          🧠 IA     👁️ Visão   ⚙️ Automação
             │         │         │
             └─────────┼─────────┘
                       ▼
              ┌─────────────────┐
              │    COMPUTADOR   │
              └─────────────────┘
```

---

# ✨ Funcionalidades

## 💬 Assistente conversacional

Permite conversar com a IA utilizando linguagem natural.

O usuário pode:

* Fazer perguntas;
* Solicitar explicações;
* Enviar comandos;
* Solicitar tarefas;
* Manter uma conversa contextual.

---

## 🎙️ Comandos por voz

A aplicação utiliza recursos do navegador para permitir interação por voz.

O usuário pode falar com o assistente e receber respostas por áudio.

Tecnologias utilizadas:

```text
Web Speech API
```

---

## 👁️ Visão computacional

A aplicação pode utilizar a câmera e imagens capturadas para análise visual.

Possibilidades:

* Análise de imagens;
* Identificação de elementos;
* Interpretação visual;
* Interação com o ambiente.

---

## 📷 Câmera

Utilizando:

```text
MediaDevices
getUserMedia()
```

o sistema pode acessar a câmera do computador, desde que o usuário conceda a permissão necessária.

---

## 🖥️ Captura de tela

A aplicação possui recursos para captura e análise visual da tela.

Isso permite utilizar a IA para interpretar informações apresentadas no ambiente de trabalho.

---

## ⚙️ Automação

O projeto utiliza automação para executar determinadas ações no computador.

Entre as possibilidades estão:

* 🖱️ Movimentação do mouse;
* 🖱️ Cliques;
* ⌨️ Digitação;
* 🚀 Abertura de aplicações;
* ⚡ Execução de tarefas automatizadas.

A automação é realizada utilizando:

```text
RobotJS
```

---

## 🧠 Memória e contexto

O assistente mantém informações relacionadas às interações para melhorar a continuidade da conversa.

Isso permite que o sistema trabalhe com:

* Histórico;
* Contexto;
* Conversas anteriores;
* Informações da sessão.

---

# 🛠️ Tecnologias utilizadas

| Tecnologia     | Função                    |
| -------------- | ------------------------- |
| React          | Interface                 |
| TypeScript     | Tipagem e desenvolvimento |
| Vite           | Build e desenvolvimento   |
| Node.js        | Ambiente do backend       |
| Express        | API/backend local         |
| Gemini API     | Inteligência Artificial   |
| Web Speech API | Voz                       |
| MediaDevices   | Microfone e câmera        |
| getUserMedia   | Captura de mídia          |
| RobotJS        | Automação do computador   |

---

# 🏗️ Arquitetura

A aplicação utiliza uma arquitetura dividida entre frontend e backend.

```text
MICA
│
├── Frontend
│   ├── React
│   ├── TypeScript
│   └── Vite
│
├── Backend
│   ├── Node.js
│   └── Express
│
├── Inteligência Artificial
│   └── Gemini API
│
├── Multimodal / GUI Vision
│   ├── Microfone
│   ├── Câmera
│   └── Captura de tela
│
└── Automação
    └── RobotJS
```

---

# 📂 Estrutura sugerida

```text
mica/
│
├── src/
│   ├── components/
│   ├── services/
│   ├── hooks/
│   └── App.tsx
│
├── server/
│   └── ...
│
├── public/
│
├── .env.local
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

# 📋 Requisitos

Antes de executar o projeto, é necessário possuir:

* Node.js 20 ou superior;
* npm;
* Chave da API Gemini;
* Navegador compatível com APIs de voz e mídia;
* Permissão para utilizar microfone e câmera.

Para algumas funcionalidades de automação, o ambiente também precisa suportar o **RobotJS**.

---

# 🚀 Instalação

## 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/mica.git
```

Entre na pasta:

```bash
cd mica
```

---

## 2. Instalar as dependências

```bash
npm install
```

---

## 3. Configurar a API Gemini

Crie um arquivo:

```text
.env.local
```

Adicione:

```env
GEMINI_API_KEY=sua_chave_aqui
```

> ⚠️ Nunca publique sua chave da API no GitHub.

Adicione o arquivo ao `.gitignore`:

```text
.env
.env.local
.env.*.local
```

---

# ▶️ Executar o projeto

Execute:

```bash
npm run dev
```

Depois abra no navegador o endereço apresentado pelo Vite.

Normalmente:

```text
http://localhost:3000
```

ou:

```text
http://localhost:5173
```

---

# 🔐 Permissões

Para utilizar todos os recursos, o navegador poderá solicitar permissões para:

### 🎙️ Microfone

Necessário para comandos de voz.

### 📷 Câmera

Necessário para recursos de visão computacional.

### 🖥️ Captura de tela

Necessária para funcionalidades de análise visual da tela.

O usuário deve conceder as permissões quando solicitadas pelo navegador.

---

# ☁️ Inteligência Artificial

O projeto utiliza a **Gemini API** para processamento de linguagem natural e interpretação das instruções enviadas pelo usuário.

Fluxo simplificado:

```text
Usuário
   ↓
MICA
   ↓
Frontend React
   ↓
Backend Node.js
   ↓
Gemini API + GUI Parser
   ↓
Resposta / ação multimodal
   ↓
MICA
   ↓
Usuário
```

---

# 🧩 Interação multimodal

O diferencial do projeto está na possibilidade de trabalhar com diferentes formas de entrada:

```text
                MICA
                  │
      ┌───────────┼───────────┐
      │           │           │
      ▼           ▼           ▼
    Texto        Voz       Imagem
      │           │           │
      └───────────┼───────────┘
                  ▼
     GUI Parsing + IA Agente
                  │
        ┌─────────┼─────────┐
        ▼         ▼         ▼
      Planejamento   Voz   Automação
```

---

# 🔄 Possível fluxo de utilização

1. O usuário realiza uma pergunta ou comando;
2. A aplicação recebe a entrada;
3. O backend processa a solicitação;
4. A IA interpreta a intenção;
5. O sistema gera uma resposta;
6. Quando necessário, uma ação automatizada pode ser executada;
7. O resultado é apresentado ao usuário.

---

# ⚠️ Observações

A aplicação depende de alguns serviços e recursos externos.

A disponibilidade de funcionalidades pode variar de acordo com:

* Conexão com a internet;
* Disponibilidade da Gemini API;
* Limites/quota da API;
* Permissões do navegador;
* Sistema operacional;
* Compatibilidade do RobotJS;
* Configuração do ambiente local.

Caso a API de IA esteja indisponível, determinadas funcionalidades podem não funcionar corretamente.

---

# 🔒 Segurança

Este projeto pode executar ações no computador do usuário.

Por isso:

* Não execute comandos de fontes desconhecidas;
* Não compartilhe sua chave da Gemini API;
* Não publique arquivos `.env`;
* Revise as ações de automação antes de executá-las;
* Utilize o projeto somente em ambientes confiáveis.

---

# 🚧 Melhorias futuras

Algumas funcionalidades que podem ser implementadas:

* [ ] Memória persistente com banco de dados
* [ ] Sistema de autenticação
* [ ] Histórico permanente de conversas
* [ ] RAG com documentos
* [ ] Upload e análise de arquivos
* [ ] Mais comandos de automação
* [ ] Integração com aplicativos do sistema
* [ ] Dashboard de atividades
* [ ] Configuração personalizada da personalidade
* [ ] Suporte a múltiplos modelos de IA
* [ ] Execução de tarefas agendadas
* [ ] Integração com APIs externas
* [ ] Interface responsiva para dispositivos móveis

---

# 🎓 Finalidade

O **MICA** possui finalidade de **estudo, experimentação e desenvolvimento de soluções envolvendo Inteligência Artificial, automação e aplicações multimodais em ambientes operacionais e educacionais**.

O projeto também pode ser utilizado como laboratório para explorar:

* Inteligência Artificial Generativa;
* Engenharia de Software;
* Desenvolvimento Web;
* APIs;
* Automação;
* Visão Computacional;
* Processamento de linguagem natural;
* Interfaces multimodais.

---

# 👨‍💻 Autor

## MICA Research

Professor e desenvolvedor na área de Tecnologia da Informação.

Áreas de interesse:

**Inteligência Artificial • Ciência de Dados • Engenharia de Software • Desenvolvimento de Sistemas • Automação**

---

# ⭐ Contribuição

Contribuições, sugestões e melhorias são bem-vindas.

Para contribuir:

```bash
git clone https://github.com/seu-usuario/mica.git
```

Crie uma branch:

```bash
git checkout -b minha-feature
```

Faça suas alterações:

```bash
git add .
git commit -m "feat: adiciona nova funcionalidade"
```

Envie para o repositório:

```bash
git push origin minha-feature
```

Depois abra um **Pull Request**.

---

# 📄 Licença

Este projeto foi desenvolvido para fins de **estudo, desenvolvimento e uso pessoal em soluções de Inteligência Artificial e automação**.

Consulte as licenças e termos de uso das tecnologias e APIs utilizadas no projeto.

---

## 🚀 MICA

> **Seu copiloto digital para produtividade, automação e interação inteligente com o computador.**

**Texto • Voz • Imagem • IA • Automação**
