# 🏃 Sprint Actual: Sprint 4 — Vista Motoboy, Fidelización & QA E2E

> **Proyecto:** Center Gás Curitiba (`center-gas-platform`)  
> **Ciclo en Plane:** `Sprint 4: Vista Motoboy, Fidelización & QA` (`07dc4f3e-11f1-4d64-b3f5-6a907d9a6e0f`)  
> **Gobernanza:** "Plane for the Business, Git for the Code"  
> **Última Sincronización:** 2026-09-07  

---

## 🎯 Objetivo del Sprint
Consolidar la experiencia integral de despacho y entrega: App PWA del Motoboy con GPS y validación de cascos vacíos, motor de fidelización (8 entregas = 1 gas gratis), automatización con WhatsApp (Evolution API v2 + n8n) y aseguramiento de calidad con suite E2E en Playwright y Dashboard de KPIs para el Dueño.

---

## 📊 Estado de los Tickets (Plane ↔ Git)

| Issue | Descripción | Responsable | Estado Plane | Commit / PR |
| :--- | :--- | :--- | :---: | :---: |
| **ISSUE-101** | Setup Monorepo Híbrido (Next.js + Astro + SolidJS) | `devops-agent` | 🟢 Done | PR #1 / `530135d` |
| **ISSUE-102** | Esquema DDL PostgreSQL + RLS Policies | `backend-dev-agent` | 🟢 Done | PR #2 / `c0ee521` |
| **ISSUE-103** | Seed Inicial: Productos, Cobertura y Configuración | `backend-dev-agent` | 🟢 Done | `530135d` |
| **ISSUE-104** | Flujo de Registro de Nuevos Clientes (RPCs) | `backend-dev-agent` | 🟢 Done | PR #19 |
| **ISSUE-105** | Check de Cilindro Vacío en Vista Chofer | `frontend-dev-agent` | 🟢 Done | PR #25 |
| **ISSUE-106** | Enlaces Efímeros y Sesiones Tokenizadas (LGPD) | `backend-dev-agent` | 🟢 Done | PR #23 |
| **ISSUE-107** | Autenticación Dueño & Chofer (Supabase Auth) | `backend-dev-agent` | 🟢 Done | `530135d` |
| **ISSUE-108** | Especificación Modelo de Datos y Máquina de Estados | `architect-agent` | 🟢 Done | `docs/09-database-design.md` |
| **ISSUE-201** | Kanban en Tiempo Real (Next.js + Supabase Realtime) | `frontend-dev-agent` | 🟢 Done | PR #24 |
| **ISSUE-202** | Asignación de Chofer y Modal de Cancelación | `frontend-dev-agent` | 🟢 Done | PR #24 |
| **ISSUE-203** | Creación Manual de Pedidos (Vía telefónica) | `frontend-dev-agent` | 🟢 Done | `530135d` |
| **ISSUE-301** | Catálogo B2C de Autoservicio con Reconocimiento Telefónico | `frontend-dev-agent` | 🟢 Done | `b1ac7ef` |
| **ISSUE-302** | Descuento Automático de Combo y Validador de Cobertura | `frontend-dev-agent` | 🟢 Done | PR #23 |
| **ISSUE-303** | Formas de Pago en Checkout (PIX y Efectivo con Troco) | `frontend-dev-agent` | 🟢 Done | PR #23 |
| **ISSUE-304** | Distinción Recarga vs Casco Nuevo en Catálogo | `frontend-dev-agent` | 🟢 Done | PR #17 |
| **ISSUE-401** | Setup n8n y Flujo Inbound de WhatsApp (Evolution API) | `automation-agent` | 🟢 Done | PR #27 / `WF-01` |
| **ISSUE-402** | Flujo n8n Outbound de Notificaciones de Estado | `automation-agent` | 🟢 Done | PR #27 / `WF-02` |
| **ISSUE-403** | Infraestructura Evolution API v2 y Mitigación Anti-Ban | `devops-agent` | 🟢 Done | PR #28 / `89402f4` |
| **ISSUE-404** | Manejo de Errores n8n y Alertas al Dueño | `automation-agent` | 🟢 Done | PR #27 / `WF-04` |
| **ISSUE-501** | App Móvil PWA del Repartidor con Enlace GPS (Maps/Waze) | `frontend-dev-agent` | 🟢 Done | PR #25 |
| **ISSUE-502** | Trigger de Fidelización (8 pedidos = 1 recarga gratis) | `backend-dev-agent` | 🟢 Done | PR #25 |
| **ISSUE-601** | Suite de Pruebas E2E (Playwright) y Go-Live Checklist | `qa-agent` | 🟢 Done | PR #26 |
| **ISSUE-701** | Dashboard de Métricas y KPIs del Dueño (Next.js) | `frontend-dev-agent` | 🟢 Done | PR #26 / `97b1607` |

---

## 🔮 Backlog Priorizado (Próximo Sprint / Post-MVP)

Los siguientes tickets están listados en el Backlog de Plane y representan las futuras fases de expansión:

1. **`ISSUE-702`**: *[Post-MVP] Proactive Repurchase Reminder (inactive 45+ days)*
   - Flujo n8n cron diario que audita clientes sin compras en 45 días y dispara cupón de descuento por WhatsApp.
2. **`ISSUE-703`**: *[Post-MVP] Business Hours & Scheduled Orders*
   - Validación de horario comercial (08:00 - 20:00) y posibilidad de agendar pedido para el día siguiente.
3. **`ISSUE-704`**: *[Post-MVP] Delivery Fee per Neighborhood*
   - Tarificación diferenciada de entrega según la distancia y barrio de Curitiba.

---

## 🛡️ Estado del Pipeline Zero-Trust CI/CD
- **Compilación Monorepo (`turbo build`):** 🟢 **100% PASS** (2/2 tareas exitosas en ~29s)
- **`apps/site` (Astro 5 + SolidJS):** 🟢 Compila en 12.4s
- **`apps/web` (Next.js 15 Turbopack):** 🟢 Compila en 7.2s
