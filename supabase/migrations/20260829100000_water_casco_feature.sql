-- Migración: Diferenciación entre Recarga y Envase Completo (Casco) de Agua

-- 1. Actualizar el producto existente de agua a "Solo Recarga"
UPDATE products 
SET 
    sku = 'water_refill',
    name = 'Botellón de Agua 20L (Solo Recarga)',
    includes_cylinder = false
WHERE sku = 'water';

-- 2. Insertar el nuevo producto con el Envase Completo (Más caro)
INSERT INTO products (sku, name, price, includes_cylinder, is_active)
VALUES 
    ('water_full', 'Botellón de Agua 20L (Con Envase Nuevo)', 35.00, true, true)
ON CONFLICT (sku) DO NOTHING;
