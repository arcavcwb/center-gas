CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('gas_refill', 'gas_full', 'water')),
  price NUMERIC(10, 2) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial products
INSERT INTO products (name, type, price, image_url) VALUES
  ('Gás P13 (Recarga)', 'gas_refill', 100.00, 'https://example.com/p13-refill.png'),
  ('Gás P13 COMPLETO', 'gas_full', 300.00, 'https://example.com/p13-full.png'),
  ('Água 20L', 'water', 15.00, 'https://example.com/water-20l.png');
