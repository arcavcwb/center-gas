-- 1. Insert System Config for Loyalty Program
INSERT INTO system_config (key, value)
VALUES ('loyalty_target', '8')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Insert Neighborhoods (Cobertura)
INSERT INTO neighborhoods (name, is_active, delivery_fee)
VALUES 
  ('Centro', true, 5.00),
  ('Bairro Norte', true, 8.00),
  ('Vila Sul', true, 12.00)
ON CONFLICT (name) DO NOTHING;

-- 3. Insert Products Catalog
INSERT INTO products (sku, name, price, includes_cylinder, is_active)
VALUES 
  ('P13-REFILL', 'Gas P13 (Recarga)', 110.00, false, true),
  ('P13-FULL', 'Gas P13 (Con Casco/Vasilhame)', 280.00, true, true),
  ('AGUA-20L', 'Agua Mineral 20L', 15.00, false, true)
ON CONFLICT (sku) DO NOTHING;
