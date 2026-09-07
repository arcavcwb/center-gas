# Walkthrough: Trilogía de Artículos Técnicos — Construyendo en Público (ISSUE-803)

## 📌 Contexto y Objetivos
Se redactó, estructuró y publicó la serie completa de 3 artículos técnicos y de producto que documentan exhaustivamente el recorrido de digitalización de Center Gás Curitiba ("Building in Public"), sintetizando el descubrimiento del negocio, la arquitectura híbrida, la gobernanza agéntica con Zero-Trust y la elevación visual bajo el estándar Impeccable.

---

## 📚 Contenido de la Trilogía (`docs/articles/`)

1. **[`articulo-1-de-whatsapp-a-plataforma-digital.md`](file:///home/arcav/projects/center-gas/center-gas-platform/docs/articles/articulo-1-de-whatsapp-a-plataforma-digital.md):**
   - El punto de partida analógico: 1 dueño, 3 motoboys y cientos de WhatsApps diarios en Pinheirinho.
   - Los 4 Gotchas del negocio real: La regla de cascos vacíos (BR-002, +R$ 200,00), el troco en efectivo (`cash_change_for`), combos dinámicos y agendamiento fuera de horario (08:00 a 20:00).
   - Topología técnica: Astro 5 + SolidJS (catálogo sub-segundo) y Next.js 15 (control en tiempo real) sobre Supabase PostgreSQL.
   - Respeto estricto de la Regra de Ouro (cero "entrega gratis").

2. **[`articulo-2-el-flujo-agentico-git-plane-humano.md`](file:///home/arcav/projects/center-gas/center-gas-platform/docs/articles/articulo-2-el-flujo-agentico-git-plane-humano.md):**
   - Superación de la falacia del "Vibe Coding".
   - El Triángulo de Gobernanza: Plane como Fuente de Verdad, Git como Sistema Judicial y el Humano como Autoridad de los Gates.
   - Matriz de 10 agentes especializados con restricciones de dominio.
   - El IDE Memory Anchor en `superules.md` para erradicar la amnesia de contexto en los LLMs.
   - Zero-Trust mecánico: contratos Zod, compilación Turborepo y 38 tests unitarios.

3. **[`articulo-3-impeccable-y-produccion-real.md`](file:///home/arcav/projects/center-gas/center-gas-platform/docs/articles/articulo-3-impeccable-y-produccion-real.md):**
   - Erradicación del "AI Slop" visual.
   - Los 4 pilares de Impeccable: Cero emojis unicode (100% SVG), touch targets $\ge 48\text{px}$, contraste extremo WCAG 2.1 AA para luz solar en calle y navegación en 1-tap a Waze/Maps.
   - El candado mecánico en CI: `pnpm run check:design` (`impeccable detect`).
   - URLs de producción en Vercel y métricas de rendimiento.

4. **[`README.md`](file:///home/arcav/projects/center-gas/center-gas-platform/docs/articles/README.md):**
   - Índice unificado y guía de lectura para la trilogía.

---

## 🧪 Verificación de Calidad
- **Regla de Oro:** Cero menciones de "entrega gratis" o "entrega grátis" en los 3 artículos.
- **Detección Impeccable:** `pnpm run check:design` ejecutado con 0 anti-patrones.
- **Compilación Monorepo:** `pnpm turbo run build` $\rightarrow$ 100% PASS.
- **Tests Unitarios:** 38/38 tests pasando en `@center-gas/contracts`.
