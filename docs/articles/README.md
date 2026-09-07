# 📖 Serie de Artículos: La Construcción de Center Gás Curitiba
## De 0 a Producción con un Squad Agéntico y Filosofía Zero-Trust

Esta serie de 3 artículos técnicos y de producto documenta exhaustivamente cómo transformamos una operación analógica de distribución de gas en Curitiba en una plataforma digital moderna de alto rendimiento, utilizando un escuadrón de agentes de IA autónomos gobernados por el triángulo **Git × Plane × Humano**.

---

### 📑 Índice de la Serie

1. **[Artículo 1: De la Libreta y WhatsApp a la Plataforma Digital](articulo-1-de-whatsapp-a-plataforma-digital.md)**
   - *El descubrimiento del negocio real:* Por qué el software del mundo real no es un simple CRUD.
   - *Los 4 Gotchas del terreno:* La regla de cascos vacíos (BR-002, +R$ 200,00), el troco en efectivo, combos automáticos y el agendamiento fuera de horario (08:00 a 20:00).
   - *La arquitectura híbrida en Turborepo:* Astro 5 + SolidJS (B2C) + Next.js 15 (B2B) + Supabase (PostgreSQL RLS).
   - *La Regra de Ouro:* Prohibición absoluta de prometer "entrega gratis".

2. **[Artículo 2: El Flujo Agéntico en la Práctica (Git × Plane × Humano)](articulo-2-el-flujo-agentico-git-plane-humano.md)**
   - *La falacia del 'Vibe Coding':* Por qué los prompts desordenados destruyen las bases de código.
   - *El Triángulo de Gobernanza:* Plane como cerebro organizacional, Git como sistema judicial y el Humano como autoridad de los Gates.
   - *El Squad de 10 Agentes Especializados:* Matriz de responsabilidades y fronteras técnicas.
   - *El IDE Memory Anchor:* Cómo resolver la amnesia de contexto en los LLMs mediante checklists infranqueables.
   - *La Máquina no Confía en la Máquina:* Zero-Trust en contratos Zod, compilación estática y 38 tests unitarios con Vitest.

3. **[Artículo 3: El Estándar Impeccable y Producción Real](articulo-3-impeccable-y-produccion-real.md)**
   - *Erradicando el 'AI Slop' visual:* Por qué el diseño generado por IA suele ser genérico e inusable en exteriores.
   - *Los 4 Pilares de Impeccable:* Cero emojis unicode (100% SVG vectorial), touch targets $\ge 48\text{px}$, contraste extremo WCAG 2.1 AA para luz solar y navegación 1-tap a Waze/Maps.
   - *El Candado Mecánico (`pnpm run check:design`):* Análisis AST automático contra los 12 anti-patrones de diseño.
   - *Despliegue Dual en Vercel:* Catálogo móvil y Driver App (`center-gas-site.vercel.app`) y Panel Kanban B2B (`center-gas-web.vercel.app`).
