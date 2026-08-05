# Walkthrough: End-to-End QA Plan & Go-Live (ISSUE-601)

## 🎯 Objetivo Logrado
Se estableció la suite definitiva de calidad (QA) y el plan estratégico de lanzamiento a producción (Go-Live) del negocio Center Gas.

## 🛠️ Entregables de QA Automatizado
1. **Infraestructura Aislada:** Se creó el paquete `apps/e2e` para que Playwright opere sin ensuciar las dependencias de producción de Next.js y Astro.
2. **Patrón POM (Page Object Model) Implementado:**
   - `CatalogPage.ts`: Encapsula la interacción del catálogo (Astro).
   - `KanbanPage.ts`: Encapsula el dashboard de administración B2B (Next.js).
   - `DriverApp.ts`: Encapsula la experiencia PWA del motoboy (Next.js).
3. **Casos de Pruebas Críticos (`tests/`):**
   - `customer.spec.ts`: Validar flujo de compra y aplicación de combo.
   - `owner.spec.ts`: Validar manipulación de tarjetas en el Kanban.
   - `driver.spec.ts`: Validar modal gigante y check de cilindro vacío.

## 🚀 Documento de Lanzamiento
Se publicó el archivo oficial **[GO_LIVE_CHECKLIST.md](file:///home/arcav/projects/center-gas/center-gas-platform/docs/GO_LIVE_CHECKLIST.md)**.
Este documento es la brújula para el humano (Product Owner). Define las revisiones manuales de:
- Configuraciones de Supabase (RLS y Auth).
- Variables de Vercel/Netlify.
- Dominios productivos.
- Comprobación final en n8n y pruebas de humo.

## ✅ Estado de Trazabilidad
Este Hito se empaquetó bajo estricto control de Gobernanza en la rama `feat/issue-601-qa` y cuenta con un PR formal documentado, listo para la auditoría de merge a `main`.
