# Walkthrough: Horarios Comerciales y Pedidos Programados (ISSUE-703)

> **Historia de Usuario en Plane:** `ISSUE-703: [Post-MVP] Business Hours & Scheduled Orders`  
> **Estado:** 🟢 Verificado e Integrado  
> **Gobernanza:** "Plane for the Business, Git for the Code" — Zero-Trust CI/CD & Testing Pyramid  

---

## 🎯 Resumen de Negocio

En el modelo operativo de **Center Gás Curitiba**, el negocio atiende entregas de **Lunes a Sábado de 08:00 a 20:00** (zona horaria `America/Sao_Paulo`).

### El Problema Anterior:
Si un cliente en el barrio Pinheirinho intentaba pedir gas o agua por la noche o los domingos, el sistema mostraba la promesa estándar de entrega inmediata (30-45 min), lo que generaba frustración y posibles reclamos al no haber motoboys disponibles fuera de turno.

### La Solución Implementada:
1. **Regla de Negocio BR-005 (`@center-gas/contracts`):**
   - La plataforma **nunca rechaza un pedido**. Captura la venta y calcula determinísticamente el siguiente turno hábil de entrega (08:30 del próximo día operativo).
   - Manejo estricto de zona horaria `America/Sao_Paulo` (UTC-3), distinguiendo pedidos nocturnos (programados para mañana), pedidos de madrugada (programados para hoy a las 08:30) y fines de semana (saltando los domingos hacia el lunes).
2. **Frontend B2C (`apps/site`):**
   - Banner nocturno dinámico con estilo visual diferenciado (`🌙 Atendimento Fora de Horário Comercial`) que aclara el horario de 08:00 a 20:00 y exhibe el badge de agendamiento (`📅 Agendado para amanhã às 08:30`).
   - Alerta en el checkout informando el horario programado.
   - Envío de parámetros `p_is_scheduled: true` y `p_scheduled_for` a PostgreSQL.
   - Mensaje de confirmación personalizado para pedidos programados en PT-BR y ES.
3. **Panel B2B del Dueño (`apps/web`):**
   - En el tablero Kanban, las órdenes agendadas se destacan con un badge distintivo: `🌙 Agendado (08:30)`.
   - Permite al dueño (Carlos) saber instantáneamente que esa orden está en cola para el primer turno de la mañana y no requiere despacho urgente nocturno.
4. **Base de Datos Supabase (PostgreSQL Zero-Trust):**
   - Migración `20260907130000_scheduled_orders_and_business_hours.sql` aplicada a producción.
   - Columnas `is_scheduled` y `scheduled_for` en tabla `orders`.
   - Procedimiento almacenado `create_b2c_order` actualizado con persistencia y auditoría contable.

---

## 🧪 Pruebas y Verificación

### 1. Pruebas Unitarias Vitest (`@center-gas/contracts`)
- **Suite BR-005:** 8 nuevos casos de prueba unitarios validando:
  - Horario operativo diurno (Lunes 10:00 AM) -> `true`.
  - Madrugada antes de abrir (Lunes 07:15 AM) -> `false`, agenda para hoy a las 08:30.
  - Noche después de cerrar (Lunes 21:30) -> `false`, agenda para mañana a las 08:30.
  - Domingo cerrado -> `false`, agenda para lunes a las 08:30.
  - Noche de sábado -> `false`, salta domingo y agenda para lunes a las 08:30.
- **Resultado:** 🟢 **38/38 tests PASS** en 519ms.

### 2. Prueba de Integración RPC en Vivo (`test_rpc.js`)
- Crea un pedido agendado con `p_is_scheduled = true` y `p_scheduled_for`.
- Consulta la orden en Supabase Cloud y verifica que los campos persistan correctamente.
- Purga los datos creados con 100% de limpieza (0 residuos).
- **Resultado:** 🟢 **100% PASS**.

### 3. Compilación Monorepo (`turbo build`)
- `apps/site` (Astro + SolidJS): 🟢 Compila en 4.21s.
- `apps/web` (Next.js 15 Turbopack): 🟢 Compila en 10.4s (7/7 páginas estáticas generadas).
- **Resultado:** 🟢 **2/2 tareas exitosas** en 46.4s.
