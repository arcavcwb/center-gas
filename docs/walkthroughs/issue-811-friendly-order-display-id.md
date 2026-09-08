# Walkthrough - [ISSUE-811] Formato de Pedido Amigable (display_id): Sustitución de UUID Gigante

## Resumen del Problema y Causa Raíz
Al procesar un pedido, las notificaciones salientes de WhatsApp (`WF-02`) inyectaban en las plantillas de mensaje el identificador UUID interno de PostgreSQL (`body.id`, ej: `727b2ad8-6ec4-4c8b-a38f-5ae3c0db7cc9`) en lugar del código amigable `display_id` (ej: `4821`). Esto generaba mensajes con un hash de 36 caracteres confuso y poco legible para el cliente de WhatsApp. Adicionalmente, el catálogo web no presentaba el número de pedido en la pantalla de éxito.

---

## Solución Implementada (Arquitectura Amigable & Lean)

### 1. Base de Datos / Supabase
- **Migración [`supabase/migrations/20260908010000_b2c_order_display_id_return.sql`](file:///home/arcav/projects/center-gas/center-gas-platform/supabase/migrations/20260908010000_b2c_order_display_id_return.sql):**
  - Se modificó la función PL/pgSQL `create_b2c_order`.
  - Genera explícitamente `v_display_id := floor(random() * 8999 + 1000)::text`.
  - Retorna un objeto `JSONB` estructurado:
    ```json
    {
      "order_id": "UUID",
      "id": "UUID",
      "display_id": "4821"
    }
    ```
  - Preserva retrocompatibilidad total con la clave `'id'`.

### 2. Automatizaciones n8n (`WF-02`)
- **Workflow [`workflows/n8n/WF-02_WhatsApp_Outbound.json`](file:///home/arcav/projects/center-gas/center-gas-platform/workflows/n8n/WF-02_WhatsApp_Outbound.json)):**
  - Sincronizado en la instancia activa de producción (`SCqre7me1lAPKeH1`).
  - Las 3 plantillas de estado reemplazan `body.id` por `body.display_id`:
    - **Nuevo:** `Recebemos seu pedido #{{ $('Webhook Supabase').item.json.body.display_id || $('Webhook Supabase').item.json.body.id.slice(0, 8) }}, total R$ {{ Number($('Webhook Supabase').item.json.body.total_amount).toFixed(2) }}! 📝 Avisaremos assim que sair para entrega.`
    - **En Camino:** `Ótima notícia! 🚚 Seu pedido #{{ $('Webhook Supabase').item.json.body.display_id || $('Webhook Supabase').item.json.body.id.slice(0, 8) }} está a caminho com o entregador...`
    - **Entregado:** `Seu pedido #{{ $('Webhook Supabase').item.json.body.display_id || $('Webhook Supabase').item.json.body.id.slice(0, 8) }} foi entregue com sucesso! ✅ Obrigado por escolher a Center Gás.`

### 3. Frontend Catálogo Móvil (`apps/site`)
- **Componente [`apps/site/src/components/Catalog.tsx`](file:///home/arcav/projects/center-gas/center-gas-platform/apps/site/src/components/Catalog.tsx):**
  - Captura `display_id` de la respuesta de la RPC y actualiza la señal `createdDisplayId`.
  - Muestra un distintivo limpio de alto contraste en la pantalla de éxito:
    `Pedido #XXXX`
  - Reemplazo de emojis unicode (`✅`, `💬`) por iconos SVG vectoriales geométricos conforme a los estándares de **Impeccable**.

---

## Verificación y Pruebas Zero-Trust

| Prueba | Comando | Resultado |
|---|---|---|
| Impeccable Design Audit | `pnpm run check:design` | 0 anti-patrones detectados |
| Contracts & Zod Schemas | `pnpm --filter @center-gas/contracts test` | 38/38 tests pasando |
| Turborepo Build | `pnpm run build` | Next.js 15 & Astro 5 PASS (100%) |
| WhatsApp E2E Suite | `pnpm run test:whatsapp` | Ciclo completo PASS (display_id #7492 validado) |
