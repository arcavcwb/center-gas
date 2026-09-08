# Walkthrough: Rediseño de Catálogo B2C: Selector de Categorías Circular y Tarjetas Unificadas (ISSUE-813)

## 📌 Resumen Ejecutivo
Se resolvió la redundancia en la interfaz de pedidos del catálogo B2C (`apps/site`), transformando la anterior lista plana de 4 tarjetas redundantes (2 de gas y 2 de agua) en un catálogo moderno estilo app de delivery (iFood / Zé Delivery):
1. **Barra de Categorías Circulares**: Selector horizontal visual superior (`Todos`, `Gás P13`, `Água Mineral`) con iconografía SVG limpia, feedback activo con anillos de enfoque y compatibilidad estricta con WCAG 2.1 AA.
2. **Tarjetas Maestras Unificadas (`ProductFamilyCard`)**: Agrupación reactiva por familia de producto (`Gás GLP 13kg`, `Água Mineral 20L`) con un selector segmentado inline (*Pill Switch*) entre "Já tenho o vazio" (recarga) y "Comprar vasilhame novo" (completo).
3. **Escalabilidad y Cero Cambios en Backend**: La UI se adapta dinámicamente y preserva los `product_id` reales en el carrito (`cart()`), garantizando el funcionamiento nativo del descuento por combo (R$ 5,00) y de la función RPC `create_b2c_order` en Supabase.
4. **Cumplimiento Impeccable UI/UX**:
   - 0 emojis unicode en toda la interfaz (iconos SVG vectoriales limpios).
   - Touch targets táctiles garantizados de 48×48px en botones de cantidad (`+` / `−`) y mínimo 48px en los selectores.
   - Contraste accesible sobre fondos claros (`text-orange-700`, `text-blue-700`).

---

## 🛠️ Archivos Modificados y Creados

| Archivo | Acción | Descripción |
|---|---|---|
| `packages/contracts/src/i18n/dict.ts` | Modificado | Añadidas claves de internacionalización (`categoryAll`, `categoryGas`, `categoryWater`, `optionWithExchange`, `optionWithCylinder`, `tipExchangeRequired`, `tipNewCylinderIncluded`, `itemsInCartSummary`) en PT-BR y ES. Eliminado emoji residual en traducción de banner. |
| `apps/site/src/components/ProductFamilyCard.tsx` | Creado | Componente SolidJS que encapsula la tarjeta unificada de familia de producto, el switch segmentado de vasilhame, tip contextual dinámico y controles táctiles de cantidad (>= 48px). |
| `apps/site/src/components/Catalog.tsx` | Modificado | Añadido selector de categorías circular, memo reactivo de agrupación de familias (`productFamilies` y `filteredFamilies`), integración con `ProductFamilyCard` y fallback para categorías vacías. |
| `docs/walkthroughs/issue-813-catalog-categories-and-unified-cards.md` | Creado | Documento de trazabilidad y reporte de arquitectura para el Issue 813. |

---

## 🧪 Verificación y Auditoría Zero-Trust

1. **Tests de Contratos (`@center-gas/contracts`):**
   ```bash
   pnpm --filter @center-gas/contracts test
   # Vitest: 3 passed (3), 43 passed (43)
   ```
2. **Auditoría Impeccable Design (`pnpm run check:design`):**
   ```bash
   .agents/skills/impeccable/scripts/impeccable detect
   # 0 anti-patrones detectados. 0 emojis en apps/site/src.
   ```
3. **Compilación Estática de Producción (`pnpm run build`):**
   - Turborepo: 2 packages en build (`apps/site` Astro 5 y `apps/web` Next.js 15).
   - Cero errores de compilación TypeScript o empaquetado Vite/Turbopack.
