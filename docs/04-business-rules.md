# 04 - Reglas de Negocio (Business Rules)

> **Alineado con Plane API - 26 Issues (2026-07-26)**

## Propósito
Definir formalmente las políticas y restricciones operativas que rigen el negocio de Center Gás Curitiba, asegurando trazabilidad directa con los Issues de Plane.

## Alcance
**Dentro del Alcance:**
- Especificación formal de reglas para recargas vs cilindros completos, depósitos, fidelización, métodos de pago (Troco), ingresos manuales, cancelaciones, comisiones y promociones.

---

## Contenido Principal

### BR-001: Distinción Recarga vs Envase Completo (ISSUE-304)
* **ID:** BR-001
* **Descripción:** El sistema debe distinguir comercialmente entre "Recarga P13" (el cliente entrega un casco vacío al motoboy) y "P13 Completo" (el cliente compra el gas y el casco por primera vez).
* **Ejemplo:** Recarga cuesta R$ 100,00; P13 Completo cuesta R$ 300,00 (100 de gas + 200 de casco).
* **Impacto:** Evita pérdidas financieras por fuga de cascos.

### BR-002: Verificación de Envase en Puerta (ISSUE-105)
* **ID:** BR-002
* **Descripción:** Al marcar un pedido como entregado, el motoboy debe confirmar obligatoriamente en su App si recogió o no el envase vacío. Si no lo recogió (y el pedido era solo recarga), debe registrar el cobro de penalidad o contactar al dueño.
* **Impacto:** Protege el activo físico principal de la empresa (los cascos).

### BR-003: Programa de Fidelidad 8 -> 1 (ISSUE-502)
* **ID:** BR-003
* **Descripción:** Por cada compra de P13 acumulada (trigger al pasar a estado `entregado`), se suma 1 punto. Al llegar a `system_config.loyalty_target` (default: 8), el sistema libera el pedido número 9 con recarga 100% gratuita.
* **Excepciones:** Clientes comerciales B2B y compras exclusivas de agua no aplican a la promoción de gas.

### BR-004: Métodos de Pago y Troco (ISSUE-303)
* **ID:** BR-004
* **Descripción:** Pagos aceptados: Efectivo y PIX. Si el cliente selecciona Efectivo, el catálogo web debe obligar a especificar el campo "Troco para R$ ____" o "Pagaré con el monto exacto".
* **Ejemplo:** Total R$ 115,00. Cliente marca "Efectivo" y "Troco para R$ 200,00". El motoboy recibe la orden sabiendo que debe llevar R$ 85,00 de cambio.
* **Impacto:** Elimina entregas fallidas por falta de cambio del motoboy en la puerta.

### BR-005: Ingreso Manual de Pedidos (ISSUE-203)
* **ID:** BR-005
* **Descripción:** No todos los clientes usarán el catálogo web. El sistema debe permitir al dueño ingresar manualmente pedidos desde el Kanban (por llamadas telefónicas o audios), asignándolos a clientes existentes o creando nuevos sin bloquear el flujo.
* **Impacto:** Asegura que el tablero Kanban siga siendo la única fuente de la verdad operativa (100% de las ventas registradas).

### BR-006: Cobertura Logística (ISSUE-302)
* **ID:** BR-006
* **Descripción:** La atención de pedidos web requiere validar obligatoriamente que el barrio seleccionado pertenezca a la tabla de `neighborhoods` activos. Un cliente no puede crear direcciones fuera del radio.
* **Impacto:** Mantiene la rentabilidad operativa y el cumplimiento del tiempo de entrega.

### BR-007: Promociones y Combos Automáticos (ISSUE-302)
* **ID:** BR-007
* **Descripción:** La compra simultánea de ≥1 Gas + ≥1 Agua dispara automáticamente un descuento del total basado en `system_config.combo_discount` (R$ 5,00). 
* **Prioridad:** Backend as a source of truth (nunca confiar en totales manipulados del frontend).

### BR-008: Estados y Cancelaciones de Pedido (ISSUE-108, ISSUE-202)
* **ID:** BR-008
* **Descripción:** El ciclo de vida estricto del pedido es: `nuevo` → `confirmado` → `asignado` → `en_camino` → `entregado`. Las cancelaciones o fallos (`cancelado` / `fallido`) exigen obligatoriamente registrar un motivo en `order_status_history`.

---

## Historial de Revisiones
| Versión | Fecha | Autor | Descripción |
|---------|-------|-------|-------------|
| 1.0 | 2026-07-23 | Lead PM | Borrador inicial |
| 2.0 | 2026-07-26 | Antigravity | Refactor total vs Plane: Troco, Ingreso Manual, Cascos diferenciados y auditoría de estado. |
