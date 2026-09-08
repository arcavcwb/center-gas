# Walkthrough - [ISSUE-812] Reconocimiento Resiliente de Clientes (Tolerancia al 9° Dígito Brasileño y Acceso Sin Fricción)

## 📌 Resumen del Problema y Causa Raíz
* **Discrepancia del 9° Dígito Móvil:** En Brasil (Curitiba / DDD 41), WhatsApp (vía Evolution API / Baileys) envía el JID del remitente con 12 dígitos (`554198450477`, formato antiguo/interno de WhatsApp sin el 9° dígito móvil). Sin embargo, en el registro inicial del cliente Armando Castro, su número se guardó con 13 dígitos (`5541998450477`, formato nacional con 9° dígito).
* **Falla en Procedimientos Almacenados:** Las funciones SQL `resolve_catalog_session`, `generate_catalog_session` y `check_customer_exists` realizaban comparaciones estrictas (`WHERE phone = p_phone`). Esto causaba que un cliente recurrente fuera reportado como inexistente (`exists: false`) forzándolo a la pantalla de registro de nuevo cliente cada vez que abría su enlace.
* **Fricción en Web:** En visitas directas al sitio, no había persistencia en el navegador, obligando a escribir el número repetidamente. En la pantalla de registro, el usuario debía ingresar su información sin feedback visual de su número detectado.

---

## 🛠️ Solución Implementada (Arquitectura Zero-Trust & Impeccable)

### 1. Base de Datos / Supabase ([`supabase/migrations/20260908010000_resilient_brazilian_phone_matching.sql`](file:///home/arcav/projects/center-gas/center-gas-platform/supabase/migrations/20260908010000_resilient_brazilian_phone_matching.sql))
* **Función Helper Inmutable `get_phone_variants(p_phone VARCHAR) RETURNS TEXT[]`:**
  * Extrae solo dígitos y antepone `55` si viene en formato local (10 u 11 dígitos).
  * Si es un número brasileño de 12 dígitos (`55` + 2 DDD + 8 locales), genera la variante con 9° dígito insertándolo tras el DDD (`substr(v_digits, 1, 4) || '9' || substr(v_digits, 5)`).
  * Si tiene 13 dígitos y el 5° es `9`, genera la variante sin 9° dígito.
  * Retorna `ARRAY[v_digits, v_alt_phone]` para búsquedas directas indexadas vía `= ANY(...)`.
* **Actualizaciones en Procedimientos Almacenados:**
  * `generate_catalog_session`: Identifica clientes existentes y reutiliza sesiones activas evaluando las variantes canónicas.
  * `resolve_catalog_session`: Resuelve automáticamente al cliente existente aunque la sesión se haya abierto con el formato de WhatsApp de 12 dígitos.
  * `check_customer_exists`: Devuelve los datos del cliente tanto si se consulta con 12 como con 13 dígitos.
  * `register_b2c_customer`: Evita registros duplicados actualizando el registro existente ante cualquiera de las variantes.

### 2. Paquete de Contratos Compartidos ([`packages/contracts`](file:///home/arcav/projects/center-gas/center-gas-platform/packages/contracts))
* **Reglas de Negocio ([`packages/contracts/src/business-rules.ts`](file:///home/arcav/projects/center-gas/center-gas-platform/packages/contracts/src/business-rules.ts)):**
  * `getPhoneVariants(rawPhone: string): string[]`: Genera las representaciones canónicas idénticas a PostgreSQL.
  * `arePhonesEquivalent(phoneA: string, phoneB: string): boolean`: Valida equivalencia funcional entre dos números.
* **Pruebas Unitarias ([`packages/contracts/src/business-rules.test.ts`](file:///home/arcav/projects/center-gas/center-gas-platform/packages/contracts/src/business-rules.test.ts)):**
  * Suite `BR-003b` con pruebas para números de 10, 11, 12 y 13 dígitos. Total de tests pasando: 43/43.

### 3. Catálogo Web B2C ([`apps/site`](file:///home/arcav/projects/center-gas/center-gas-platform/apps/site))
* **Persistencia Inteligente de Cliente:** Guarda el teléfono verificado en `localStorage` (`center_gas_customer_phone`). En visitas recurrentes directas a la web, valida silenciosamente contra Supabase y abre directamente el catálogo con su dirección precargada.
* **Opción "Trocar de conta":** Botón accesible en el banner de bienvenida que permite cambiar de usuario o teléfono limpiando la sesión local.
* **Pre-rellenado y Badge Informativo:** En caso de nuevos registros, muestra una insignia con el WhatsApp identificado (`+{phone}`) y enlace de corrección rápida sin duplicar inputs.
* **Auditoría Impeccable Estricta (0 Emojis Unicode):**
  * Sustitución total de emojis (`📡`, `🚚`, `📍`, `🌙`, `📅`, `⚠️`, `🔄`, `💧`, `✅`, `👉`, `💬`) por iconos SVG geométricos de alto contraste y legibilidad visual bajo luz solar directa.
  * Cumplimiento del type ramp (`text-xs`) según `DESIGN.md`.

---

## 🧪 Pruebas y Verificación Zero-Trust

| Prueba / Auditoría | Comando | Resultado |
|---|---|---|
| RPC Resiliente Supabase (Sin 9) | `check_customer_exists('554198450477')` | ✅ `exists: true` (Armando Castro) |
| RPC Resiliente Supabase (Con 9) | `check_customer_exists('5541998450477')` | ✅ `exists: true` (Armando Castro) |
| Resolución de Token WhatsApp | `resolve_catalog_session('04uZ29')` | ✅ `valid: true, exists: true` (Armando Castro) |
| Reutilización de Sesiones | `generate_catalog_session` con variantes | ✅ `reused: true` (asocia token existente) |
| Tests Unitarios Contracts | `pnpm --filter @center-gas/contracts test` | ✅ 43/43 tests PASS |
| Impeccable Design Audit | `pnpm run check:design` | ✅ 0 anti-patrones, 0 advisories |
| Escaneo de Emojis Unicode | Node regex scanner en `apps/site/src` | ✅ 0 emojis encontrados |
| Turborepo Production Build | `pnpm run build` | ✅ Next.js 15 & Astro 5 PASS (100%) |
