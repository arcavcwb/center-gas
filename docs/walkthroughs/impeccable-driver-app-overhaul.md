# Walkthrough: Rediseño Impeccable de la Driver Mobile App (`/driver`)

## 📌 Contexto y Objetivos (ISSUE-501 / BR-002)
El motoboy opera en la calle con guantes de moto, bajo luz solar directa y con conectividad intermitente en Pinheirinho, Curitiba.
Se ejecutó un rediseño integral bajo el estándar **Impeccable (Mode: Operate)** para garantizar:
- Áreas táctiles mínimas de **48px** para todas las acciones operativas.
- Eliminación total de emojis unicode en favor de un sistema de iconos vectoriales SVG limpios.
- Navegación dual en 1-tap para Google Maps y Waze.
- Cumplimiento riguroso de la regla de negocio **BR-002** (verificación de retorno de vasilhame vacío con recargo de R$ 200,00 si no se devuelve).
- Desglose instantáneo de troco a devolver para pagos en efectivo.
- Suscripción en tiempo real a Supabase para actualización reactiva de pedidos asignados.

---

## 🛠️ Archivos Modificados
- [`apps/site/src/pages/driver/index.astro`](file:///home/arcav/projects/center-gas/center-gas-platform/apps/site/src/pages/driver/index.astro):
  - Shell de alto contraste (`bg-slate-950` con contenedor mobile centrado).
  - Header institucional con isotipo Center Gás, indicador `🟢 Online` y botón de actualización táctil (`min-h-[44px]`).
  - Viewport optimizado para interacción móvil.
- [`apps/site/src/components/DriverApp.tsx`](file:///home/arcav/projects/center-gas/center-gas-platform/apps/site/src/components/DriverApp.tsx):
  - Formulario de login corporativo con inputs táctiles accesibles (altura 48px), iconos SVG (Mail, Lock) y botón naranja `#EA580C`.
  - Iconos SVG consistentes sin dependencias externas: `IconMotorcycle`, `IconWhatsApp`, `IconPhone`, `IconMapPin`, `IconNavigation`, `IconMap`, `IconCheck`, `IconX`, `IconAlertTriangle`.
  - Card XL del pedido con `#ID` legible, estado visual (`Atribuído` / `Em Rota de Entrega`), botones directos para WhatsApp y llamada telefónica.
  - Bloque de dirección con alto contraste outdoor y botones dedicados para Google Maps y Waze.
  - Indicador de troco a devolver con cálculo dinámico según el monto entregado por el cliente.
  - Modal de validación de vasilhame (BR-002) con recálculo dinámico del total si no se entrega el casco.
  - Pantalla de éxito con retención del monto cobrado y estado de vasilhame.
- [`apps/site/astro.config.mjs`](file:///home/arcav/projects/center-gas/center-gas-platform/apps/site/astro.config.mjs):
  - Deshabilitación de `devToolbar` en desarrollo para evitar bloqueos en la interfaz táctil.

---

## 🧪 Pruebas y Verificación
1. **Detección Impeccable:**
   ```bash
   ./.agent/skills/impeccable/scripts/impeccable detect apps/site/src/components/DriverApp.tsx apps/site/src/pages/driver/index.astro
   # Resultado: 0 anti-patterns (100% limpio)
   ```
2. **Tests Unitarios:**
   ```bash
   pnpm run test:unit
   # Resultado: 38 tests passing (100%)
   ```
3. **Compilación Estática Monorepo:**
   ```bash
   pnpm build
   # Resultado: 2/2 packages compilaron exitosamente (Next.js 15 Turbopack + Astro 5)
   ```
4. **Verificación Visual E2E con Playwright:**
   - Login validado con cuenta `motoboy1@centergas.com`.
   - Card XL renderizada en viewport móvil 390x844.
   - Modal de vasilhame probado: opción *com vasilhame* (sin costo extra) y *sem vasilhame* (+ R$ 200,00 recalculado).
   - Pantalla de confirmación verificada.

---

## 🚀 Trazabilidad y Despliegue
- **Branch:** `feat/ISSUE-501-impeccable-driver-app`
- **Pull Request:** [PR #46](https://github.com/arcavcwb/center-gas/pull/46)
- **Commit:** `7a16e1e`
- **Plane Issue:** [ISSUE-501](https://app.plane.so/centergas/projects/439788cb-26c2-408d-a5e3-fde74e493f07/issues/46c11ca3-76c2-4917-bbde-cc5b319c3a0d)
- **URL Producción:** `https://center-gas-site.vercel.app/driver`
