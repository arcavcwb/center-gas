-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Funciones Auxiliares para Roles
CREATE OR REPLACE FUNCTION public.is_owner() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_driver() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'driver'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas para Profiles
CREATE POLICY "Profiles son legibles por todos los usuarios autenticados" ON profiles
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Solo owner puede crear/modificar perfiles" ON profiles
FOR ALL TO authenticated USING (public.is_owner());

-- Políticas para Neighborhoods
CREATE POLICY "Barrios son legibles por todos (incluyendo anon)" ON neighborhoods
FOR SELECT USING (is_active = true);

CREATE POLICY "Solo owner puede administrar barrios" ON neighborhoods
FOR ALL TO authenticated USING (public.is_owner());

-- Políticas para Products
CREATE POLICY "Productos son legibles por todos (incluyendo anon)" ON products
FOR SELECT USING (is_active = true);

CREATE POLICY "Solo owner puede administrar productos" ON products
FOR ALL TO authenticated USING (public.is_owner());

-- Políticas para Customers
CREATE POLICY "Dueño lee y escribe customers" ON customers
FOR ALL TO authenticated USING (public.is_owner());

-- Políticas para Orders
CREATE POLICY "Dueños tienen control total sobre orders" ON orders
FOR ALL TO authenticated USING (public.is_owner());

CREATE POLICY "Drivers ven sus propias ordenes" ON orders
FOR SELECT TO authenticated USING (driver_id = auth.uid());

CREATE POLICY "Drivers actualizan sus propias ordenes" ON orders
FOR UPDATE TO authenticated USING (driver_id = auth.uid());

-- Políticas para Order Items
CREATE POLICY "Dueños tienen control total sobre order items" ON order_items
FOR ALL TO authenticated USING (public.is_owner());

CREATE POLICY "Drivers ven items de sus ordenes" ON order_items
FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.driver_id = auth.uid())
);

-- Políticas para Order Status History
CREATE POLICY "Dueños tienen control total sobre history" ON order_status_history
FOR ALL TO authenticated USING (public.is_owner());

CREATE POLICY "Drivers ven history de sus ordenes" ON order_status_history
FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_status_history.order_id AND orders.driver_id = auth.uid())
);

CREATE POLICY "Drivers pueden insertar en history" ON order_status_history
FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_status_history.order_id AND orders.driver_id = auth.uid())
);

-- Políticas para Catalog Sessions
CREATE POLICY "Nadie puede consultar sesiones directamente" ON catalog_sessions
FOR ALL USING (false);

-- System Config
CREATE POLICY "Nadie puede consultar system config directamente" ON system_config
FOR ALL USING (false);

-- RPC resolver sesion (bypass RLS)
CREATE OR REPLACE FUNCTION public.resolve_catalog_session(p_token VARCHAR)
RETURNS TABLE (
    customer_id UUID,
    customer_name VARCHAR,
    phone VARCHAR,
    neighborhood_id UUID,
    address_line VARCHAR
) AS $$
BEGIN
    RETURN QUERY 
    SELECT c.id, c.name, c.phone, c.neighborhood_id, c.address_line
    FROM catalog_sessions cs
    JOIN customers c ON c.id = cs.customer_id
    WHERE cs.token = p_token AND cs.expires_at > NOW() AND cs.used_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Publicaciones Realtime (Supabase)
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE orders, order_status_history;
COMMIT;
