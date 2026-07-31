---
name: supabase-skills
description: Provee mejores prácticas y directrices para modelar bases de datos PostgreSQL, configurar Row Level Security (RLS) y manejar suscripciones Realtime en Supabase.
---
# Supabase Skills

## Propósito
Este skill orienta al **Backend Dev Agent** en la creación del esquema y configuración de Supabase para el MVP, asegurando rendimiento y seguridad.

## Directrices de Base de Datos y Supabase
1. **Seguridad por Defecto (RLS):** Toda tabla creada debe tener habilitado Row Level Security (`ALTER TABLE x ENABLE ROW LEVEL SECURITY;`).
2. **Políticas de Acceso Estrictas:**
   - Los clientes solo pueden interactuar con la DB a través de APIs anonimizadas o usando tokens seguros.
   - Los repartidores solo pueden ver y actualizar los pedidos asignados a ellos.
   - El propietario tiene acceso de lectura/escritura a todas las tablas del panel de despacho.
3. **Realtime API:** Para el Tablero Kanban y la Vista del Repartidor, habilitar las tablas necesarias en la publicación de `supabase_realtime` para que SolidJS pueda escuchar cambios mediante `supabase.channel()`.
4. **Contratos:** Mantener todos los tipos de datos alineados con `packages/contracts`.
