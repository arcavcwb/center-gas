<div align="center">
  🌎 <a href="README.md">Español</a> | <a href="README.pt-br.md">Português do Brasil</a> | <b>English</b>
</div>

---

<div align="center">
  <img src="https://raw.githubusercontent.com/arcavcwb/center-gas/main/assets/diagrams/system-architecture.svg" alt="Center Gás Curitiba" width="120" height="120" />
  
  # Center Gás Curitiba
  **Digital Transformation & Last-Mile Logistics Platform**
  
  [![Status](https://img.shields.io/badge/Status-Development-blue?style=for-the-badge)](https://github.com/arcavcwb/center-gas)
  [![Architecture](https://img.shields.io/badge/Architecture-Hybrid_Monorepo-orange?style=for-the-badge)](#)
  [![Governance](https://img.shields.io/badge/Governance-Zero_Trust_Agentic-red?style=for-the-badge)](docs/15-agentic-flow-manual.md)
  [![AI Models](https://img.shields.io/badge/AI-Opus_|_Sonnet_|_Gemini-blueviolet?style=for-the-badge)](#)
</div>

---

## 🚀 The Vision
Center Gás Curitiba is a local gas (P13) and water (20L) delivery company. The mission of this platform is to **transform a manual WhatsApp-based operation** into an automated digital ecosystem, reducing manual data entry, improving the customer experience, and providing real-time telemetry to the owner and delivery drivers.

---

## 🤖 The Agentic Squad (Zero-Trust)
This repository is not a traditional software project. It is governed and developed by a **Squad of 10 autonomous AI Agents** orchestrated under a strict **Zero-Trust** philosophy.

### The Governance Triangle
- 📋 **Plane (Source of Truth):** Where the business lives, the requirements (Issues), and the agents' logs.
- 🔀 **Git/GitHub (Incorruptible Judge):** Where code is automatically audited before reaching Production.
- 👤 **The Human (Final Authority):** Who defines rules, opens Gates, and makes strategic decisions.

### Our 10 Agents
| Specialty | Agent (ID) | Assigned Model |
|---|---|---|
| 🏛️ **Architecture** | `@architect-agent` | 👑 `claude-3-opus` |
| 🛡️ **Security / Review** | `@pr-reviewer-agent` | ⚡ `gemini-3.6-flash` |
| 🧪 **QA & Testing** | `@qa-agent` | 🟠 `claude-3.5-sonnet` |
| 💻 **Frontend Dev** | `@frontend-dev-agent` | 🟠 `claude-3.5-sonnet` |
| 💾 **Backend & DB** | `@backend-dev-agent` | 🟠 `claude-3.5-sonnet` |
| 🎨 **UI/UX Design** | `@designer-agent` | 🟠 `claude-3.5-sonnet` |
| 📈 **Product Owner** | `@po-agent` | 🟠 `claude-3.5-sonnet` |
| ⏱️ **Scrum Master** | `@scrum-master-agent` | 🟠 `claude-3.5-sonnet` |
| ⚙️ **DevOps & CI/CD** | `@devops-agent` | 🟠 `claude-3.5-sonnet` |
| 🤖 **Automation** | `@automation-agent` | 🟠 `claude-3.5-sonnet` |

> 📖 **Recommended Reading:** Learn the details of this orchestration in the [Agentic Flow Manual (docs/15)](docs/15-agentic-flow-manual.md).

---

## 🏗️ Technical Architecture (Stack)
- **Frontend App (Customer):** `Astro` + `SolidJS` (Focused on extreme speed and low JS).
- **Frontend Dashboard (Admin/Driver):** `Next.js 15` (App Router) + `TailwindCSS` (Shadcn/UI).
- **Backend & Authentication:** `Supabase` (PostgreSQL, RLS, Edge Functions, Realtime).
- **Automations (WhatsApp/CRM):** `n8n` (Workflows).

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

    subgraph "📱 Presentation Layer (Frontend)"
        C[🛒 Customer Catalog<br>Astro + SolidJS]:::astro
        P[💻 Owner Dashboard<br>Next.js 15]:::frontend
        R[🛵 Driver View<br>Next.js 15]:::frontend
    end

    subgraph "💬 Messaging & Orchestration Layer"
        WA[🟢 WhatsApp App]:::whatsapp <-->|Chat Events| WHAM[🔌 Evolution API]:::whatsapp
        WHAM <-->|HTTP Webhooks| N8N[🤖 n8n Automation Engine]:::n8n
    end

    subgraph "⚡ Services Layer (Supabase BaaS)"
        S_API[🚀 Auto-REST API]:::supabase
        S_RT[⚡ Realtime Engine]:::banana
        S_AUTH[🛡️ Auth & RLS]:::supabase
    end

    subgraph "🗄️ Persistence Layer"
        DB[(PostgreSQL Database)]:::database
    end

    %% Relations
    C -->|HTTP Queries| S_API
    P -->|Live Subscription| S_RT
    R -->|SQL Mutations| S_API

    N8N -->|SQL Read/Write| S_API
    S_API --> DB
    S_RT --> DB
    S_AUTH --> DB
```

---

## 📁 Repository Structure
```text
center-gas-platform/
├── .agents/                 # 🤖 Squad Configuration (agy CLI) & Skills
├── .github/                 # ⚙️ CI/CD Workflows (Zero-Trust pipelines)
├── apps/                    # 💻 Frontend Code (Next.js, Astro) [Coming soon]
├── packages/                # 📦 Shared Zod Contracts [Coming soon]
├── supabase/                # 🗄️ SQL Migrations & RLS [Coming soon]
├── docs/                    # 📚 Structured Documentation (00 to 15)
└── plane/                   # 📋 Plane structure mirrors
```

---

## 🗺️ Documentation Map
The consulting and planning work is already completed and exhaustively documented. No agent assumes information; everything comes from here:

| Doc | Description | Status |
|---|---|---|
| `docs/00` to `docs/05` | Business Analysis (AS-IS, TO-BE, Rules) | ✅ Audited |
| `docs/06-prd.md` | Product Requirements Document | ✅ Validated |
| `docs/08-technical-architecture.md` | Technical Decisions (Stack) | ✅ Validated |
| `docs/09-database-design.md` | Supabase Relational Schema | ✅ Audited |
| `docs/15-agentic-flow-manual.md` | Agent Handoff Protocol | 👑 **Core** |

---

<div align="center">
  <p>Built by <strong>arcavcwb</strong> and the <strong>Antigravity Squad</strong> under a <br/><i>"Plane for the Business, Git for the Code"</i> approach</p>
</div>
