# Walkthrough Técnico: ISSUE-502 CRM y Fidelidad (Triggers)

## 🎯 Objetivo Logrado
Se trasladó la responsabilidad del cálculo de fidelidad a la base de datos para asegurar consistencia e independencia del cliente (frontend/backend). Cuando un pedido pasa a "entregado", el cliente acumula puntos automáticamente.

## 📁 Archivos Modificados / Creados
- **`supabase/migrations/20260801140500_loyalty_trigger.sql`**: Script de migración con:
  - Nueva columna `available_free_cylinders` en `customers`.
  - Función `increment_loyalty_points()` en PL/pgSQL que verifica `OLD.status` y `NEW.status`.
  - Implementación del Trigger `trg_loyalty_points` para la tabla `orders`.

## 🛠️ Decisiones Técnicas
- **Row-Level Lock (FOR UPDATE):** La consulta `SELECT loyalty_points ... FOR UPDATE` asegura que si por un fallo de concurrencia se entregan dos pedidos de un mismo cliente en el mismo milisegundo, la suma se calcula serialmente y no se pierde ningún punto.
- **Atomicidad y Reseteo:** Cuando el valor llega a 8, el sistema en la misma transacción devuelve el valor a 0 y aumenta el inventario de cupones (`available_free_cylinders`).

## ✅ Criterios de Aceptación (QA)
- [x] Lógica de trigger encapsulada y protegida en BD.
- [x] Evita fallos de red desde aplicaciones clientes (Next.js/Astro/n8n).
