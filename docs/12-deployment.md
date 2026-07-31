# 12 - Estrategia de Despliegue y Mantenimiento (Deployment)

> **Alineado con Plane API - 26 Issues (2026-07-26)**

## Propósito
Definir la guía técnica de despliegue para el Monorepo, Supabase y los contenedores de n8n.

## 1. Topología del Monorepo (pnpm workspaces / Turborepo)
El código fuente convive en un único repositorio Git organizado mediante Turborepo para optimizar los tiempos de compilación compartida.

```text
/
├── apps/
│   ├── site/ (Astro + SolidJS -> Catálogo Cliente y App Repartidor)
│   └── web/  (Next.js + React -> Panel Dueño)
├── packages/
│   ├── contracts/ (Zod Schemas compartidos)
│   └── ui-tokens/ (Impeccable Design Tokens)
```

## 2. Entornos de Hosting

### A. Frontend (Vercel)
La plataforma Vercel alojará **dos proyectos** independientes vinculados al mismo repositorio (monorepo):
1. Proyecto `center-gas-site`: Configurado con el Root Directory `apps/site` y el framework preset "Astro".
2. Proyecto `center-gas-web`: Configurado con el Root Directory `apps/web` y el framework preset "Next.js".

Ambos proyectos pueden compartir un dominio raíz usando subdominios (ej. `pedir.centergas.com.br` para Astro, `admin.centergas.com.br` para Next.js).

### B. Backend y Base de Datos
* **Supabase:** Proyecto de Producción dedicado. Aplicación estricta de RLS, Auth y Triggers (ISSUE-102, 107, 108).

### C. Servidor Self-Hosted (VPS / Docker)
Para mantener soberanía de datos y bajos costos operativos, se aprovisionará un VPS (ej. Hetzner, DigitalOcean) ejecutando un único `docker-compose.yml` que contendrá:
1. **n8n + WhatsApp:** Instancia ejecutando los Workflows WF-01 y WF-02 y pasarela de mensajería.
2. **Uptime Kuma:** Monitorización del uptime (pings cada 60s a Vercel y Supabase).
3. **OpenPanel:** Recolección de métricas de negocio (eventos LGPD-compliant).

## 3. Integración Continua (CI) y Bloqueos en GitHub
El proyecto obedece Trunk-Based Development:
1. Ningún push directo a `main`. Todo código viaja por Pull Request (PR).
2. **`pr-reviewer-agent` (Auditoría Estática):** Revisa que el PR cumpla con el contrato Zod. Bloquea el merge si hay violaciones.
3. **`qa-agent` (Pruebas Automatizadas):** Ejecuta Vitest, pgTAP y Playwright. Bloquea el merge si falla un test.

## 4. Checklist de Go-Live (ISSUE-601)
- [ ] Aplicar DDL v2.0 (10 tablas, RLS, Enum Types).
- [ ] Conectar Vercel a `apps/site` y `apps/web` y compilar exitosamente.
- [ ] Seed de precios de cascos y barrios autorizados (ISSUE-103).
- [ ] Configurar alertas de fallo de n8n al celular del dueño (ISSUE-404).
- [ ] Ejecutar Plan de QA E2E Manual (Flujo feliz, Ataque Red-Team de inyección de precios, Pérdida de Casco).

---

## Historial de Revisiones
| Versión | Fecha | Autor | Descripción |
|---------|-------|-------|-------------|
| 1.0 | 2026-07-23 | DevOps | Estrategia inicial Astro-only. |
| 2.0 | 2026-07-26 | Antigravity | Refactor: Migración a despliegue Monorepo Vercel (apps/site + apps/web). |
| 2.1 | 2026-07-26 | Antigravity | Add: Incorporación de Uptime Kuma y OpenPanel al entorno Docker del VPS. |
