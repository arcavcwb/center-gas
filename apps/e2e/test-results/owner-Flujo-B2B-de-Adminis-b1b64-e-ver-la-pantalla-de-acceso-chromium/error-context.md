# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: owner.spec.ts >> Flujo B2B de Administrador >> Dueño puede ver la pantalla de acceso
- Location: tests/owner.spec.ts:5:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text="Acceso Owner"')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text="Acceso Owner"')

```

```yaml
- text: Internal Server Error
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { KanbanPage } from '../pages/KanbanPage';
  3  | 
  4  | test.describe('Flujo B2B de Administrador', () => {
  5  |   test('Dueño puede ver la pantalla de acceso', async ({ page }) => {
  6  |     await page.goto('http://localhost:3000/login');
> 7  |     await expect(page.locator('text="Acceso Owner"')).toBeVisible();
     |                                                       ^ Error: expect(locator).toBeVisible() failed
  8  |   });
  9  | });
  10 | 
```