# Walkthrough: Localización Bilingüe (PT-BR / ES) & Enfoque Pinheirinho

> **Rama:** `feat/bilingual-pt-br-es-pinheirinho`  
> **Fecha:** 2026-09-07  
> **Gobernanza:** "Plane for the Business, Git for the Code" — Zero-Trust CI/CD & Testing Pyramid

---

## 🎯 Resumen Ejecutivo
Se implementó la arquitectura completa de internacionalización bilingüe:
1. **Português do Brasil (PT-BR) como idioma nativo por defecto** en toda la plataforma B2C (`apps/site`) y la aplicación móvil del repartidor (`DriverApp.tsx`).
2. **Español (ES) como idioma secundario**, conmutado en tiempo real sin recarga mediante el selector `[ 🇧🇷 PT | 🇪🇸 ES ]`, con persistencia en `localStorage` y en la URL (`?lang=pt|es`).
3. **Hiperlocalización en Bairro Pinheirinho (Curitiba):**
   - Enfoque centrado en **Velocidad y Cercanía** (*"🚚 Entrega Rápida no Pinheirinho e região em até 30-45 min"*).
   - **Remoción estricta de cualquier mención a "entrega gratis"** por solicitud directa del negocio.
   - Preselección automática del barrio **Pinheirinho** en el catálogo y formulario de registro.
4. **Validación en Vitest:** 30/30 pruebas unitarias exitosas, incluyendo validación contra regresiones de textos y verificación de ausencia de "entrega gratis".

---

## 🛠️ Cambios Implementados

### 1. Módulo Centralizado de i18n (`@center-gas/contracts`)
- **[`packages/contracts/src/i18n/dict.ts`](file:///home/arcav/projects/center-gas/center-gas-platform/packages/contracts/src/i18n/dict.ts):** Diccionario tipado con paridad 100% entre `pt` y `es`.
- **[`packages/contracts/src/i18n/index.ts`](file:///home/arcav/projects/center-gas/center-gas-platform/packages/contracts/src/i18n/index.ts):** Función `t(key, lang, params)` para interpolación reactiva.
- **[`packages/contracts/src/business-rules.ts`](file:///home/arcav/projects/center-gas/center-gas-platform/packages/contracts/src/business-rules.ts):** `validateCashChange` emite mensajes de error localizados según el idioma del cliente.
- **[`packages/contracts/src/i18n.test.ts`](file:///home/arcav/projects/center-gas/center-gas-platform/packages/contracts/src/i18n.test.ts):** Suite de 6 tests de consistencia lingüística y política de envío.

### 2. Selector de Idioma & Catálogo B2C (`apps/site`)
- **[`apps/site/src/components/LanguageToggle.tsx`](file:///home/arcav/projects/center-gas/center-gas-platform/apps/site/src/components/LanguageToggle.tsx):** Selector táctil con banderas `[ 🇧🇷 PT | 🇪🇸 ES ]`.
- **[`apps/site/src/components/Catalog.tsx`](file:///home/arcav/projects/center-gas/center-gas-platform/apps/site/src/components/Catalog.tsx):**
  - Señal reactiva `lang` sincronizada con `localStorage` y `URLSearchParams`.
  - Banner dinámico superior con el switch de idioma incorporado.
  - Preselección de Pinheirinho en el desplegable de barrios.
  - Selector de barrios muestra nombre y tasa `(+ R$ X,XX)` sin textos de gratuidad.
- **[`apps/site/src/pages/index.astro`](file:///home/arcav/projects/center-gas/center-gas-platform/apps/site/src/pages/index.astro):** `<html lang="pt-BR">` y metadatos SEO de Curitiba/Pinheirinho.

### 3. App del Entregador (`apps/site/src/components/DriverApp.tsx`)
- Adaptada íntegramente al portugués de Brasil para los motoboys locales (*Acesso Entregador*, *Confirmação de Vasilhame*, *Total recebido*, *Navegar no Google Maps*).

---

## 📊 Resultados de Verificación

```bash
$ pnpm run test:unit
✓ packages/contracts/src/business-rules.test.ts (17 tests)
✓ packages/contracts/src/contracts.test.ts (7 tests)
✓ packages/contracts/src/i18n.test.ts (6 tests)
Test Files: 3 passed (3)
Tests: 30 passed (30)
Time: 512ms

$ pnpm run test:rpc
🧪 Iniciando prueba de RPC create_b2c_order y Descuento de Combo...
✓ Productos detectados: Gas (Gas P13 (Recarga), R$ 110) y Agua (Botellón de Agua 20L (Solo Recarga), R$ 15)
📦 Enviando pedido con Combo (Gas + Agua)...
✓ Orden creada con ID: 4ea8357a-255d-4450-b93b-dca6887af320
📊 Validación Financiera: Subtotal R$ 125.00 | Descuento BD: R$ 5.00 | Total BD: R$ 120.00
✅ REGLA BR-001 VERIFICADA: El descuento de R$ 5,00 se aplicó correctamente en la base de datos!
🧹 Limpiando registros de prueba de Supabase...
✨ Base de datos restaurada a estado limpio (0 residuos).

$ pnpm build
• turbo 2.10.7
  Tasks: 2 successful, 2 total (site + web)
  Time: 34.318s
```
