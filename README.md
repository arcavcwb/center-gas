<div align="center">
  🌎 <b>Español</b> | <a href="README.pt-br.md">Português do Brasil</a> | <a href="README.en.md">English</a>
</div>

---

<div align="center">
  <img src="https://raw.githubusercontent.com/arcavcwb/center-gas/main/assets/diagrams/system-architecture.svg" alt="Center Gás Curitiba" width="120" height="120" />
  
  # Center Gás Curitiba
  **Plataforma de Transformación Digital & Logística de Última Milla**
  
  [![Status](https://img.shields.io/badge/Status-Development-blue?style=for-the-badge)](https://github.com/arcavcwb/center-gas)
  [![Architecture](https://img.shields.io/badge/Architecture-Hybrid_Monorepo-orange?style=for-the-badge)](#)
  [![Governance](https://img.shields.io/badge/Governance-Zero_Trust_Agentic-red?style=for-the-badge)](docs/15-agentic-flow-manual.md)
  [![AI Models](https://img.shields.io/badge/AI-Opus_|_Sonnet_|_Gemini-blueviolet?style=for-the-badge)](#)
</div>

---

## 🚀 La Visión
Center Gás Curitiba es una empresa local de entrega de gas (P13) y agua (20L). Esta plataforma tiene como misión **transformar una operación manual vía WhatsApp** en un ecosistema digital automatizado, reduciendo el ingreso manual de datos, mejorando la experiencia del cliente y brindando telemetría en tiempo real al propietario y repartidores.

---

## 🤖 El Squad Agéntico (Zero-Trust)
Este repositorio no es un proyecto de software tradicional. Es gobernado y desarrollado por un **Squad de 10 Agentes de IA autónomos** orquestados bajo una filosofía estricta de **Cero Confianza (Zero-Trust)**.

### El Triángulo de Gobernanza
- 📋 **Plane (Fuente de Verdad):** Donde vive el negocio, los requerimientos (Issue) y la bitácora de los agentes.
- 🔀 **Git/GitHub (Juez Incorruptible):** Donde el código es auditado automáticamente antes de llegar a Producción.
- 👤 **El Humano (Autoridad Final):** Quien define reglas, abre las puertas (Gates) y toma decisiones estratégicas.

### Nuestros 10 Agentes
| Especialidad | Agente (ID) | Modelo Asignado |
|---|---|---|
| 🏛️ **Arquitectura** | `@architect-agent` | 👑 `claude-3-opus` |
| 🛡️ **Seguridad / Review** | `@pr-reviewer-agent` | ⚡ `gemini-3.6-flash` |
| 🧪 **QA & Testing** | `@qa-agent` | 🟠 `claude-3.5-sonnet` |
| 💻 **Frontend Dev** | `@frontend-dev-agent` | 🟠 `claude-3.5-sonnet` |
| 💾 **Backend & DB** | `@backend-dev-agent` | 🟠 `claude-3.5-sonnet` |
| 🎨 **UI/UX Design** | `@designer-agent` | 🟠 `claude-3.5-sonnet` |
| 📈 **Product Owner** | `@po-agent` | 🟠 `claude-3.5-sonnet` |
| ⏱️ **Scrum Master** | `@scrum-master-agent` | 🟠 `claude-3.5-sonnet` |
| ⚙️ **DevOps & CI/CD** | `@devops-agent` | 🟠 `claude-3.5-sonnet` |
| 🤖 **Automatización** | `@automation-agent` | 🟠 `claude-3.5-sonnet` |

> 📖 **Lectura Recomendada:** Conoce los detalles de esta orquestación en el [Manual de Flujo Agéntico (docs/15)](docs/15-agentic-flow-manual.md).

---

## 🏗️ Arquitectura Técnica (Stack)
- **Frontend App (Cliente):** `Astro` + `SolidJS` (Enfocado en velocidad extrema y bajo JS).
- **Frontend Dashboard (Admin/Repartidor):** `Next.js 15` (App Router) + `TailwindCSS` (Shadcn/UI).
- **Backend & Autenticación:** `Supabase` (PostgreSQL, RLS, Edge Functions, Realtime).
- **Automatizaciones (WhatsApp/CRM):** `n8n` (Workflows).

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

    subgraph "📱 Capa de Presentación (Frontend)"
        C[🛒 Catálogo Cliente<br>Astro + SolidJS]:::astro
        P[💻 Panel Dueño<br>Next.js 15]:::frontend
        R[🛵 Vista Repartidores<br>Next.js 15]:::frontend
    end

    subgraph "💬 Capa de Mensajería & Orquestación"
        WA[🟢 WhatsApp App]:::whatsapp <-->|Eventos de Chat| WHAM[🔌 Evolution API]:::whatsapp
        WHAM <-->|Webhooks HTTP| N8N[🤖 n8n Automation Engine]:::n8n
    end

    subgraph "⚡ Capa de Servicios (Supabase BaaS)"
        S_API[🚀 Auto-REST API]:::supabase
        S_RT[⚡ Realtime Engine]:::banana
        S_AUTH[🛡️ Auth & RLS]:::supabase
    end

    subgraph "🗄️ Capa de Persistencia"
        DB[(PostgreSQL Database)]:::database
    end

    %% Relaciones
    C -->|Consultas HTTP| S_API
    P -->|Suscripción en Vivo| S_RT
    R -->|Mutaciones SQL| S_API

    N8N -->|Lectura/Escritura SQL| S_API
    S_API --> DB
    S_RT --> DB
    S_AUTH --> DB
```

---

## 📁 Estructura del Repositorio
```text
center-gas-platform/
├── .agents/                 # 🤖 Configuración del Squad (agy CLI) y Skills
├── .github/                 # ⚙️ CI/CD Workflows (Zero-Trust pipelines)
├── apps/                    # 💻 Código Frontend (Next.js, Astro) [Próximamente]
├── packages/                # 📦 Contratos Zod compartidos [Próximamente]
├── supabase/                # 🗄️ Migraciones SQL y RLS [Próximamente]
├── docs/                    # 📚 Documentación estructurada (00 a 15)
└── plane/                   # 📋 Espejos de la estructura de Plane
```

---

## 🗺️ Mapa de Documentación
El trabajo de consultoría y planificación ya está completado y documentado exhaustivamente. Ningún agente asume información; todo proviene de aquí:

| Doc | Descripción | Estado |
|---|---|---|
| `docs/00` a `docs/05` | Análisis de Negocio (AS-IS, TO-BE, Reglas) | ✅ Auditado |
| `docs/06-prd.md` | Product Requirements Document | ✅ Validado |
| `docs/08-technical-architecture.md` | Decisiones Técnicas (Stack) | ✅ Validado |
| `docs/09-database-design.md` | Esquema relacional Supabase | ✅ Auditado |
| `docs/15-agentic-flow-manual.md` | Protocolo de Handoffs de Agentes | 👑 **Core** |

---

<div align="center">
  <p>Construido por <strong>arcavcwb</strong> y el <strong>Antigravity Squad</strong> bajo un enfoque <br/><i>"Plane for the Business, Git for the Code"</i></p>
</div>
