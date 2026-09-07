/**
 * Reglas de Negocio Centralizadas (Business Rules)
 * Center Gás Curitiba
 */

export interface CartItemLike {
  sku: string;
  price: number;
  quantity: number;
  includes_cylinder?: boolean;
}

/**
 * BR-001: Descuento por Combo (Gas + Agua)
 * Si el pedido contiene al menos 1 unidad de Gas P13 y 1 unidad de Agua 20L,
 * se aplica un descuento de R$ 5,00 por cada par de combo.
 */
export function calculateComboDiscount(items: CartItemLike[]): number {
  let gasCount = 0;
  let waterCount = 0;

  for (const item of items) {
    const sku = item.sku.toLowerCase();
    if (sku.includes('p13') || sku.includes('gas')) {
      gasCount += item.quantity;
    } else if (sku.includes('water') || sku.includes('agua')) {
      waterCount += item.quantity;
    }
  }

  const comboPairs = Math.min(gasCount, waterCount);
  return comboPairs * 5.0; // R$ 5.00 por cada combo formado
}

/**
 * BR-002: Validación de Pago en Efectivo y Cálculo de Troco
 * El monto para el que se pide cambio debe ser estrictamente mayor o igual al total a pagar.
 */
export function validateCashChange(
  totalAmount: number,
  cashChangeFor: number | null | undefined,
  lang: 'pt' | 'es' = 'pt'
): {
  isValid: boolean;
  changeDue: number;
  error?: string;
} {
  if (cashChangeFor == null) {
    return { isValid: true, changeDue: 0 };
  }

  if (cashChangeFor < totalAmount) {
    const error = lang === 'pt'
      ? `O valor para troco (R$ ${cashChangeFor.toFixed(2)}) não pode ser menor que o total do pedido (R$ ${totalAmount.toFixed(2)}).`
      : `El valor para el cambio (R$ ${cashChangeFor.toFixed(2)}) no puede ser menor al total del pedido (R$ ${totalAmount.toFixed(2)}).`;
    return {
      isValid: false,
      changeDue: 0,
      error
    };
  }

  return {
    isValid: true,
    changeDue: Math.round((cashChangeFor - totalAmount) * 100) / 100
  };
}

/**
 * BR-003: Normalización de Teléfonos para WhatsApp (Brasil)
 * Elimina caracteres no numéricos y garantiza el código de país '55'.
 */
export function normalizeWhatsAppPhone(rawPhone: string): string {
  const digitsOnly = rawPhone.replace(/\D/g, '');
  if (!digitsOnly) return '';

  // Si ya comienza con 55 y tiene longitud adecuada (12 u 13 dígitos)
  if (digitsOnly.startsWith('55') && (digitsOnly.length === 12 || digitsOnly.length === 13)) {
    return digitsOnly;
  }

  // Si tiene 10 u 11 dígitos (ej: 41999998888 o 4133334444), prepend '55'
  if (digitsOnly.length === 10 || digitsOnly.length === 11) {
    return `55${digitsOnly}`;
  }

  return digitsOnly;
}

/**
 * BR-004: Formato de Moneda BRL
 */
export function formatBRL(amount: number): string {
  return `R$ ${amount.toFixed(2).replace('.', ',')}`;
}
