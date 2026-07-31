# 07 - Lineamientos de UI/UX (User Interface & Experience)

> **Alineado con Plane API - 26 Issues (2026-07-26)**

## Propósito
Definir la guía de diseño (UI) y experiencia (UX) para la plataforma híbrida (Next.js y Astro), estableciendo los wireframes estructurales para los 26 requerimientos operativos (Troco, Cancelaciones, Ingreso Manual, Cascos).

## 1. Design System y Paleta de Colores
* **Core:** Diseño administrado mediante el paquete interno `packages/ui-tokens` (CSS variables compartidas).
* **Colores:** Naranja Primario (`#F6842F`), Azul Secundario (`#046BD2`). Fondos grises claros (`#F8FAFC`).
* **Estados UI:** Verde (`#16A34A` - Entregado), Amarillo (`#CA8A04` - Asignado), Rojo (`#DC2626` - Cancelado).

---

## 2. Wireframes Estructurales (ASCII Mockups)

### A. Catálogo del Cliente (apps/site - Astro/SolidJS)
*(Refleja ISSUE-304 "Cascos vs Recarga" e ISSUE-303 "Troco")*
```text
+------------------------------------------+
|  CENTER GÁS CURITIBA            [Ayuda]  |
+------------------------------------------+
|  ¡Hola, Carlos!                          |
|  Dirección: Rua Eng. João Bley 633       |
|  [Cambiar Dirección]                     |
+------------------------------------------+
|  +------------------------------------+  |
|  | [Icono Gas] Gás P13 (Recarga)      |  |
|  | (Debes entregar envase vacío)      |  |
|  | R$ 100,00      [ - ]  1  [ + ]     |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  | [Icono Gas] Gás P13 COMPLETO       |  |
|  | (Incluye Casco Nuevo)              |  |
|  | R$ 300,00      [ - ]  0  [ + ]     |  |
|  +------------------------------------+  |
|                                          |
|  Total: R$ 100,00                        |
+------------------------------------------+
|  MÉTODO DE PAGO:                         |
|  (o) Efectivo    ( ) PIX                 |
|                                          |
|  ¿Necesitas vuelto (Troco)?              |
|  [ ] Pagaré el monto exacto              |
|  [x] Traer troco para: [ R$ 200,00 ]     |
+------------------------------------------+
|   [  PEDIR AHORA EN 1 CLIC (R$ 100)  ]   |
+------------------------------------------+
```

### B. Tablero Kanban del Dueño (apps/web - Next.js/React)
*(Refleja ISSUE-201 Realtime e ISSUE-203 Pedido Manual)*
```text
+-----------------------------------------------------------------------------------+
| CENTER GÁS - PANEL DE CONTROL (Next.js)                     [Alertas 🔊] [Dueño]  |
+-----------------------------------------------------------------------------------+
|  [+ INGRESAR PEDIDO POR TELÉFONO]  Filtro: [Todos v]      Buscar: [________]      |
+----------------------------------+------------------------------------------------+
| NUEVOS (2)                       | ASIGNADOS / EN CAMINO (3)                      |
+----------------------------------+------------------------------------------------+
| #PED-104 - Carlos Silva          | #PED-102 - Ana Souza                           |
| 1x P13 (Recarga)                 | 1x P13 Completo + 1x Água 20L                  |
| Dir: Rua João Bley 633           | Asignado a: Repartidor 1 (João)                |
| Pago: PIX (R$ 100,00)            | Estado: En camino (hace 10 min)                |
| [ Asignar a: [Motoboy 1 v] ]     | [ Reasignar ] [ Cancelar ]                     |
+----------------------------------+------------------------------------------------+
```

### C. Modal: Ingreso de Pedido Manual Telefónico (Panel Dueño)
*(Refleja ISSUE-203)*
```text
+------------------------------------------------+
|  NUEVO PEDIDO TELEFÓNICO / AUDIO               |
+------------------------------------------------+
|  Teléfono: [ 5541999999999         ] [Buscar]  |
|                                                |
|  Resultados: Cliente Encontrado (Carlos Silva) |
|  Dirección: Rua João Bley 633                  |
|                                                |
|  Carrito:                                      |
|  [ 1 ] x [ Gás P13 Recarga v ]                 |
|  [ + Agregar Producto ]                        |
|                                                |
|  Pago: [ Efectivo v ] Troco para: [ 200,00 ]   |
|                                                |
|  [  CANCELAR  ]       [  CREAR PEDIDO AHORA  ] |
+------------------------------------------------+
```

### D. Interfaz del Repartidor (apps/site/driver - Astro)
*(Refleja ISSUE-501 UI Táctil e ISSUE-105 Verificación Envase)*
```text
+------------------------------------------+
| REPARTIDOR: João (Motoboy 1)   [Refrescar]|
+------------------------------------------+
| PEDIDO #PED-104                          |
| Cliente: Carlos Silva                    |
| Dir: Rua João Bley 633 - Pinheirinho     |
| [ 🗺️ NAVEGAR CON GOOGLE MAPS ]           |
|                                          |
| ENTREGAR: 1x Recarga P13                 |
| COBRAR: R$ 100,00                        |
| PAGO: Efectivo (¡Llevar R$ 100 de Troco!)|
|                                          |
| +--------------------------------------+ |
| |   [  MARCAR COMO ENTREGADO  ]        | |
| +--------------------------------------+ |
+------------------------------------------+

(Al presionar "Entregado", se abre el Modal de Casco)
+------------------------------------------+
|  CONFIRMACIÓN DE CASCO                   |
|  ¿Recibiste 1x Envase Vacío P13?         |
|                                          |
|  [x] Sí, envase recogido                 |
|  [ ] No (Requiere cobrar R$ 200 extra)   |
|                                          |
|  [  FINALIZAR ENTREGA ]                  |
+------------------------------------------+

### E. Modal: Registro de Nuevo Cliente (ISSUE-104)
*(Aparece en catálogo si el teléfono no existe)*
```text
+------------------------------------------+
|  ¡Hola! Vemos que es tu primera compra   |
+------------------------------------------+
|  Nombre Completo: [ ________________ ]   |
|                                          |
|  Barrio (Solo zonas de cobertura):       |
|  [ Selecciona tu barrio...         v ]   |
|                                          |
|  Dirección exacta:                       |
|  [ _________________________________ ]   |
|                                          |
|  [  GUARDAR Y CONTINUAR AL CARRITO ]     |
+------------------------------------------+
```

### F. Modal: Justificación de Cancelación (ISSUE-202)
*(Aparece en el Kanban al cancelar un pedido)*
```text
+------------------------------------------+
|  CANCELAR PEDIDO #PED-104                |
+------------------------------------------+
|  Atención: Esta acción es irreversible.  |
|                                          |
|  Motivo de la cancelación (Obligatorio): |
|  [ ] Cliente no estaba en casa           |
|  [ ] Cliente no tenía dinero / troco mal |
|  [ ] Error de ingreso manual             |
|  [ ] Otro (Especifique abajo)            |
|                                          |
|  Comentarios:                            |
|  [ _________________________________ ]   |
|                                          |
|  [  VOLVER  ]      [  CONFIRMAR BAJA  ]  |
+------------------------------------------+
```

---

## Historial de Revisiones
| Versión | Fecha | Autor | Descripción |
|---------|-------|-------|-------------|
| 1.0 | 2026-07-23 | Lead PM | Borrador inicial |
| 2.0 | 2026-07-26 | Antigravity | Refactor para incluir especificaciones de Plane: Input de Troco, Modal de Ingreso Manual, Distinción Recarga vs Completo. |
