-- Fix RLS: Allow drivers to read customers that belong to their orders
DROP POLICY IF EXISTS "Drivers ven clientes de sus ordenes" ON customers;
CREATE POLICY "Drivers ven clientes de sus ordenes" ON customers
FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.customer_id = customers.id AND orders.driver_id = auth.uid())
);
