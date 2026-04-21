import { test, expect } from '@playwright/test';

test('Registro de nuevo insumo rados', async ({ page }) => {
  // 1. Ir al login
  await page.goto('http://localhost:3001/login');
  
  // 2. Iniciar sesión
  await page.fill('#correo', 'admin@gmail.com');
  await page.fill('#contrasena', 'J@bs1234');
  await page.click('button[type="submit"]');
  
  // 3. Esperar a estar en el dashboard
  await page.waitForURL('**/admin/dashboard');
  
  // 4. Ir a inventario nuevo
  await page.goto('http://localhost:3001/admin/inventario/nuevo');
  
  // 5. Llenar el formulario
  await page.fill('input[placeholder*="Ej. Espuma floral"]', 'rados');
  
  // 6. Seleccionar sucursal (usando el nuevo select)
  await page.selectOption('select', { label: 'Sucursal Principal' });
  
  // 7. Subir imagen
  // Nota: El componente ImageUploader suele tener un input file invisible
  const fileChooserPromise = page.waitForEvent('filechooser');
  // Hacemos click en el área de subida (ImageUploader)
  await page.click('text=Seleccionar imagen'); 
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles('D:\\MIS_DATOS\\DESCARGA\\Rados.png');
  
  // 8. Clic en Registrar Insumo
  await page.click('button:has-text("Registrar Insumo")');
  
  // 9. Verificar que se guardó (aparece el mensaje de éxito)
  await expect(page.locator('text=¡Guardado!')).toBeVisible({ timeout: 15000 });
});
