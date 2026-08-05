<div align="center">
  🌎 <a href="README.md">Español</a> | <b>Português do Brasil</b> | <a href="README.en.md">English</a>
</div>

---

<div align="center">
  <img src="https://raw.githubusercontent.com/arcavcwb/center-gas/main/assets/diagrams/system-architecture.svg" alt="Center Gás Curitiba" width="120" height="120" />
  
  # Center Gás Curitiba
  **Plataforma de Transformação Digital & Logística de Última Milha**
  
  [![Status](https://img.shields.io/badge/Status-Development-blue?style=for-the-badge)](https://github.com/arcavcwb/center-gas)
  [![Architecture](https://img.shields.io/badge/Architecture-Hybrid_Monorepo-orange?style=for-the-badge)](#)
  [![Governance](https://img.shields.io/badge/Governance-Zero_Trust_Agentic-red?style=for-the-badge)](docs/15-agentic-flow-manual.md)
  [![AI Models](https://img.shields.io/badge/AI-Opus_|_Sonnet_|_Gemini-blueviolet?style=for-the-badge)](#)
</div>

---

## 🚀 A Visão
A Center Gás Curitiba é uma empresa local de entrega de gás (P13) e água (20L). A missão desta plataforma é **transformar uma operação manual via WhatsApp** em um ecossistema digital automatizado, reduzindo a entrada manual de dados, melhorando a experiência do cliente e fornecendo telemetria em tempo real para o proprietário e entregadores.

---

## 🤖 O Esquadrão Agêntico (Zero-Trust)
Este repositório não é um projeto de software tradicional. Ele é governado e desenvolvido por um **Esquadrão de 10 Agentes de IA autônomos** orquestrados sob uma rigorosa filosofia de **Confiança Zero (Zero-Trust)**.

### O Triângulo de Governança
- 📋 **Plane (Fonte da Verdade):** Onde o negócio vive, os requisitos (Issues) e o log dos agentes.
- 🔀 **Git/GitHub (Juiz Incorruptível):** Onde o código é auditado automaticamente antes de chegar à Produção.
- 👤 **O Humano (Autoridade Final):** Quem define as regras, abre as portas (Gates) e toma decisões estratégicas.

### Nossos 10 Agentes
| Especialidade | Agente (ID) | Modelo Atribuído |
|---|---|---|
| 🏛️ **Arquitetura** | `@architect-agent` | 👑 `claude-3-opus` |
| 🛡️ **Segurança / Review** | `@pr-reviewer-agent` | ⚡ `gemini-3.6-flash` |
| 🧪 **QA & Testing** | `@qa-agent` | 🟠 `claude-3.5-sonnet` |
| 💻 **Frontend Dev** | `@frontend-dev-agent` | 🟠 `claude-3.5-sonnet` |
| 💾 **Backend & DB** | `@backend-dev-agent` | 🟠 `claude-3.5-sonnet` |
| 🎨 **UI/UX Design** | `@designer-agent` | 🟠 `claude-3.5-sonnet` |
| 📈 **Product Owner** | `@po-agent` | 🟠 `claude-3.5-sonnet` |
| ⏱️ **Scrum Master** | `@scrum-master-agent` | 🟠 `claude-3.5-sonnet` |
| ⚙️ **DevOps & CI/CD** | `@devops-agent` | 🟠 `claude-3.5-sonnet` |
| 🤖 **Automação** | `@automation-agent` | 🟠 `claude-3.5-sonnet` |

> 📖 **Leitura Recomendada:** Conheça os detalhes dessa orquestração no [Manual de Fluxo Agêntico (docs/15)](docs/15-agentic-flow-manual.md).

---

## 🏗️ Arquitetura Técnica (Stack)
- **Frontend App (Cliente):** `Astro` + `SolidJS` (Focado em extrema velocidade e baixo JS).
- **Frontend Dashboard (Admin/Entregador):** `Next.js 15` (App Router) + `TailwindCSS` (Shadcn/UI).
- **Backend & Autenticação:** `Supabase` (PostgreSQL, RLS, Edge Functions, Realtime).
- **Automações (WhatsApp/CRM):** `n8n` (Workflows).

```mermaid
graph TD
    %% Custom Premium Styles (Nano Banana Level 🍌)
    classDef frontend fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff,rx:8,ry:8;
    classDef astro fill:#f97316,stroke:#c2410c,stroke-width:2px,color:#fff,rx:8,ry:8;
    classDef whatsapp fill:#25d366,stroke:#166534,stroke-width:2px,color:#fff,rx:8,ry:8;
    classDef n8n fill:#ea580c,stroke:#9a3412,stroke-width:2px,color:#fff,rx:8,ry:8;
    classDef supabase fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff,rx:8,ry:8;
    classDef database fill:#6366f1,stroke:#4338ca,stroke-width:2px,color:#fff,rx:8,ry:8;
    classDef banana fill:#facc15,stroke:#ca8a04,stroke-width:3px,color:#1e293b,rx:10,ry:10,stroke-dasharray: 4 4;

    subgraph "📱 Camada de Apresentação (Frontend)"
        C[🛒 Catálogo Cliente<br>Astro + SolidJS]:::astro
        P[💻 Painel Proprietário<br>Next.js 15]:::frontend
        R[🛵 Visão Entregadores<br>Next.js 15]:::frontend
    end

    subgraph "💬 Camada de Mensageria & Orquestração"
        WA[🟢 WhatsApp App]:::whatsapp <-->|Eventos de Chat| WHAM[🔌 Evolution API]:::whatsapp
        WHAM <-->|Webhooks HTTP| N8N[🤖 n8n Automation Engine]:::n8n
    end

    subgraph "⚡ Camada de Serviços (Supabase BaaS)"
        S_API[🚀 Auto-REST API]:::supabase
        S_RT[⚡ Realtime Engine]:::banana
        S_AUTH[🛡️ Auth & RLS]:::supabase
    end

    subgraph "🗄️ Camada de Persistência"
        DB[(PostgreSQL Database)]:::database
    end

    %% Relações
    C -->|Consultas HTTP| S_API
    P -->|Assinatura ao Vivo| S_RT
    R -->|Mutações SQL| S_API

    N8N -->|Leitura/Escrita SQL| S_API
    S_API --> DB
    S_RT --> DB
    S_AUTH --> DB
```

---

## 📁 Estrutura do Repositório
```text
center-gas-platform/
├── .agents/                 # 🤖 Configuração do Esquadrão (agy CLI) & Skills
├── .github/                 # ⚙️ Workflows CI/CD (Pipelines Zero-Trust)
├── apps/                    # 💻 Código Frontend (Next.js, Astro) [Em breve]
├── packages/                # 📦 Contratos Zod compartilhados [Em breve]
├── supabase/                # 🗄️ Migrações SQL e RLS [Em breve]
├── docs/                    # 📚 Documentação estruturada (00 a 15)
└── plane/                   # 📋 Espelhos da estrutura do Plane
```

---

## 🗺️ Mapa de Documentação
O trabalho de consultoria e planejamento já está concluído e exaustivamente documentado. Nenhum agente assume informações; tudo vem daqui:

| Doc | Descrição | Status |
|---|---|---|
| `docs/00` a `docs/05` | Análise de Negócios (AS-IS, TO-BE, Regras) | ✅ Auditado |
| `docs/06-prd.md` | Documento de Requisitos do Produto (PRD) | ✅ Validado |
| `docs/08-technical-architecture.md` | Decisões Técnicas (Stack) | ✅ Validado |
| `docs/09-database-design.md` | Esquema relacional Supabase | ✅ Auditado |
| `docs/15-agentic-flow-manual.md` | Protocolo de Handoffs de Agentes | 👑 **Core** |

---

<div align="center">
  <p>Construído por <strong>arcavcwb</strong> e o <strong>Esquadrão Antigravity</strong> sob uma <br/>abordagem <i>"Plane for the Business, Git for the Code"</i></p>
</div>
