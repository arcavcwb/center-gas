# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: customer.spec.ts >> Flujo B2C de Compra >> Cliente NUEVO puede registrarse y hacer un pedido
- Location: tests/customer.spec.ts:5:7

# Error details

```
Error: Phone Check Error: Error de conexión. Intenta de nuevo.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - heading "CENTER GÁS" [level=1] [ref=e3]
    - button "Ayuda" [ref=e4] [cursor=pointer]
  - main [ref=e5]:
    - generic [ref=e6]:
      - heading "¡Hola! Haz tu pedido" [level=2] [ref=e7]
      - paragraph [ref=e8]: Selecciona tus productos abajo.
    - generic [ref=e11]:
      - heading "Ingresa tu WhatsApp" [level=2] [ref=e12]
      - paragraph [ref=e13]: Para continuar con tu pedido, necesitamos identificarte.
      - paragraph [ref=e15]: Error de conexión. Intenta de nuevo.
      - generic [ref=e16]:
        - textbox "(41) 99999-9999" [ref=e18]: "4199997798"
        - button "Continuar" [ref=e19] [cursor=pointer]
  - generic [ref=e22]:
    - button [ref=e23]
    - button [ref=e29]
    - button [ref=e33]
    - button [ref=e38]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { CatalogPage } from '../pages/CatalogPage';
  3  | 
  4  | test.describe('Flujo B2C de Compra', () => {
  5  |   test('Cliente NUEVO puede registrarse y hacer un pedido', async ({ page }) => {
  6  |     page.on('console', msg => console.log(msg.text()));
  7  |     const catalog = new CatalogPage(page);
  8  |     
  9  |     // 1. Visitar catálogo
  10 |     await catalog.goto();
  11 | 
  12 |     // 2. Ingresar teléfono nuevo (aleatorio para evitar conflicto en reintentos)
  13 |     const randomPhone = `41999${Math.floor(10000 + Math.random() * 90000)}`;
  14 |     await catalog.submitPhone(randomPhone);
  15 | 
  16 |     // 3. Debería mostrar el formulario de registro
  17 |     try {
  18 |       await expect(catalog.nameInput).toBeVisible({ timeout: 5000 });
  19 |     } catch (e) {
  20 |       if (await catalog.submitError.isVisible()) {
> 21 |         throw new Error("Phone Check Error: " + await catalog.submitError.textContent());
     |               ^ Error: Phone Check Error: Error de conexión. Intenta de nuevo.
  22 |       }
  23 |       throw e;
  24 |     }
  25 |     await catalog.registerCustomer('Cliente Nuevo E2E', 1, 'Rua das Flores 123');
  26 | 
  27 |     // 4. Debería mostrar el catálogo
  28 |     await expect(catalog.addBtn).toBeVisible();
  29 |     await catalog.addCylinderToCart();
  30 | 
  31 |     // 5. Confirmar Checkout (ya tiene los datos)
  32 |     await catalog.checkout();
  33 | 
  34 |     // 6. Validar mensaje de éxito
  35 |     try {
  36 |       await expect(catalog.successMessage).toBeVisible({ timeout: 10000 });
  37 |     } catch (e) {
  38 |       if (await catalog.submitError.isVisible()) {
  39 |         const errorText = await catalog.submitError.textContent();
  40 |         throw new Error(`RPC Failed with error: ${errorText}`);
  41 |       }
  42 |       throw e;
  43 |     }
  44 |   });
  45 | 
  46 |   test('Cliente EXISTENTE pasa directo al catálogo', async ({ page }) => {
  47 |     page.on('console', msg => console.log(msg.text()));
  48 |     const catalog = new CatalogPage(page);
  49 |     
  50 |     // Primero, necesitamos un cliente que ya exista. Usamos un teléfono específico 
  51 |     // y lo registramos si no existe, o simplemente aprovechamos el comportamiento del RPC.
  52 |     // Como el bot de WhatsApp manda la URL con "?phone=", probemos ese entrypoint.
  53 |     
  54 |     // Asumimos que el teléfono 41999999999 ya existe o lo registramos on the fly.
  55 |     // Para asegurar que existe, lo registramos primero (o saltará directo al catálogo si existe)
  56 |     await catalog.goto();
  57 |     await catalog.submitPhone('41888888888');
  58 |     
  59 |     try {
  60 |       await expect(catalog.nameInput).toBeVisible({ timeout: 5000 });
  61 |       await catalog.registerCustomer('Cliente Frecuente', 1, 'Rua Antiga 456');
  62 |       await expect(catalog.addBtn).toBeVisible();
  63 |     } catch (e) {
  64 |       // Ya existía
  65 |       await expect(catalog.addBtn).toBeVisible();
  66 |     }
  67 |     
  68 |     // Ahora simulamos que entra otra vez (por link de WhatsApp)
  69 |     await catalog.goto('41888888888');
  70 |     
  71 |     // Debería ir directo al catálogo sin pedir registro
  72 |     await expect(catalog.addBtn).toBeVisible({ timeout: 10000 });
  73 |     await expect(catalog.nameInput).not.toBeVisible();
  74 |     
  75 |     // Verifica que el teléfono y dirección están pre-cargados
  76 |     await expect(catalog.phoneInput).toHaveValue('41888888888');
  77 |     // En solidJS el textarea asocia su value.
  78 |     await expect(catalog.addressInput).toHaveValue('Rua Antiga 456');
  79 |   });
  80 | });
  81 | 
```