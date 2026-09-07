# Product

<!-- impeccable:product-schema 1 -->

## Platform
web

## Users
1. **Consumidores Residenciales y Negocios Locales:** Residentes del barrio Pinheirinho y alrededores en Curitiba (PR). Buscan reposición inmediata de gas de cocina GLP P13 o agua mineral 20L desde su móvil con entrega ágil y sin pasos innecesarios.
2. **Repartidores / Motoboys en Tráfico:** Trabajan en exteriores bajo luz solar directa. Requieren interfaces de alto contraste, navegación con 1 clic (Waze y Google Maps), contacto telefónico directo y validación de botellones vacíos sin trabas.
3. **Operadores y Administrador B2B:** Control de despacho en tiempo real, asignación dinámica de repartidores y trazabilidad de pedidos en el panel Kanban.

## Product Purpose
Proveer un canal digital ultra-rápido, honesto y confiable para la compra y distribución de gas de cocina y agua en Curitiba, garantizando entrega en 30-45 minutos durante el día y captura con agendamiento automático durante la noche.

## Positioning
La distribuidora de referencia en el barrio Pinheirinho: pedidos en segundos sin descargas de apps pesadas, combos inteligentes (Gas + Agua con R$ 5,00 de descuento), troco calculado al instante y programación transparente para el día siguiente si el cliente pide fuera de horario comercial.

## Operating Context
- **Horario de reparto:** Lunes a Sábado de 08:00 a 20:00 (`America/Sao_Paulo`).
- **Agendamiento:** Pedidos nocturnos o dominicales se confirman automáticamente para salir el siguiente día hábil a partir de las 08:30.
- **Idiomas:** Bilingüe nativo Português do Brasil (`pt-BR`) y Español (`es`).
- **Pagos:** Dinheiro (con desglose de troco exacto o manual) y PIX contra entrega.

## Capabilities and Constraints
- **CRÍTICO - Regra de Ouro:** ESTRICTAMENTE PROHIBIDO mencionar "entrega gratis" o "entrega grátis" en textos, botones o metadatos.
- **Arquitectura:** Monorepo Turborepo + pnpm con Astro 5 + SolidJS en `apps/site` (rendimiento zero-JS) y Next.js 15 en `apps/web`.
- **Backend:** Supabase PostgreSQL con funciones RPC transaccionales y suscripciones Realtime.

## Brand Commitments
- **Nombre comercial:** CENTER GÁS
- **Subtítulo territorial:** Pinheirinho • Curitiba - PR
- **Colores:**
  - Naranja Corporativo: `#F6842F`
  - Naranja Accesible WCAG AA: `#EA580C` (Ratio > 4.6:1 sobre blanco)
  - Azul Corporativo: `#046BD2`
- **Tipografía:** DM Sans (geométrica, legible y contemporánea)
- **Tono de voz:** Servicial, directo, honesto y transparente.
