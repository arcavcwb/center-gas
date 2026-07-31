# Plane Technical Debt & Future Backlog

## Technical Debt & Post-MVP Backlog

### TD-001: Progressive Web App (PWA) Offline First para Repartidores
* **Priority:** Medium
* **Target Version:** Version 1.1
* **Description:** Implementar Service Workers e IndexedDB para permitir que la app de repartidores funcione completamente sin conexión a internet y sincronice los pedidos entregados al recuperar señal.
* **Reason for Postponement:** Excesiva complejidad para el MVP inicial.

### TD-002: Algoritmo Automático de Optimización de Rutas (IA / Routing API)
* **Priority:** Low
* **Target Version:** Version 1.2
* **Description:** Asignación inteligente de pedidos basada en la distancia geográfica más cercana del motoboy mediante la API de Google Maps / Mapbox Matrix.
* **Reason for Postponement:** En el MVP el propietario prefiere mantener el control manual de asignación para simplificar la solución.

### TD-003: Pasarela de Pago Integrada (PIX Dinámico In-App)
* **Priority:** Medium
* **Target Version:** Version 1.1
* **Description:** Generación automática de QR Code de PIX dinámico en la web de pedido para cobro instantáneo antes del despacho.
* **Reason for Postponement:** Mantenimiento de la regla de cobro contra entrega directa con motoboy en el MVP.

### TD-004: Motor de Marketing Relacional Predictivo (Notificaciones 40 Días)
* **Priority:** Low
* **Target Version:** Version 1.2
* **Description:** Envío automático de notificaciones de WhatsApp recordando al cliente comprar gas 40 días después de su última compra de P13.
* **Reason for Postponement:** Requiere acumulado de datos de consumo durante al menos 3 meses en producción.

### TD-005: Módulo Avanzado de Control de Stock de Cilindros Vacíos / Llenos
* **Priority:** Medium
* **Target Version:** Version 1.1
* **Description:** Registro de entradas y salidas de cilindros llenos vs vacíos en el depósito físico.
* **Reason for Postponement:** Excluido del alcance del MVP para no abrumar la operación diaria.
