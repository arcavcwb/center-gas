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

/**
 * BR-005: Horarios Comerciales y Pedidos Programados (ISSUE-703)
 * Center Gás Curitiba opera de Lunes a Sábado de 08:00 a 20:00 (America/Sao_Paulo).
 * Fuera de este horario, la plataforma nunca rechaza pedidos, sino que los captura
 * y programa para el siguiente turno disponible (08:30 del próximo día hábil).
 */

export interface BusinessHoursConfig {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  timezone: string;
  operatingDays: number[]; // 1 = Lunes, ..., 6 = Sábado. 0 = Domingo
}

export const DEFAULT_BUSINESS_HOURS: BusinessHoursConfig = {
  startHour: 8,
  startMinute: 0,
  endHour: 20,
  endMinute: 0,
  timezone: 'America/Sao_Paulo',
  operatingDays: [1, 2, 3, 4, 5, 6], // Lunes a Sábado
};

/**
 * Obtiene la fecha/hora en la zona horaria de Curitiba / São Paulo
 */
export function getCuritibaDateTime(date: Date = new Date()): {
  year: number;
  month: number;
  day: number;
  dayOfWeek: number;
  hours: number;
  minutes: number;
  isoString: string;
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const findPart = (type: string) => parts.find(p => p.type === type)?.value || '';

  const month = parseInt(findPart('month'), 10) - 1;
  const day = parseInt(findPart('day'), 10);
  const year = parseInt(findPart('year'), 10);
  let hours = parseInt(findPart('hour'), 10);
  if (hours === 24) hours = 0;
  const minutes = parseInt(findPart('minute'), 10);

  const weekdayStr = findPart('weekday');
  const dayOfWeekMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6
  };
  const dayOfWeek = dayOfWeekMap[weekdayStr] ?? date.getDay();

  return { year, month, day, dayOfWeek, hours, minutes, isoString: date.toISOString() };
}

/**
 * Determina si una fecha/hora dada está dentro del horario operativo de entrega inmediata
 */
export function isWithinBusinessHours(
  date: Date = new Date(),
  config: BusinessHoursConfig = DEFAULT_BUSINESS_HOURS
): boolean {
  const local = getCuritibaDateTime(date);

  // Validar si el día de la semana opera
  if (!config.operatingDays.includes(local.dayOfWeek)) {
    return false;
  }

  const currentMinutes = local.hours * 60 + local.minutes;
  const startMinutes = config.startHour * 60 + config.startMinute;
  const endMinutes = config.endHour * 60 + config.endMinute;

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Calcula el siguiente horario de entrega programada (próximo día hábil a las 08:30)
 */
export function getNextDeliverySlot(
  date: Date = new Date(),
  config: BusinessHoursConfig = DEFAULT_BUSINESS_HOURS
): {
  isScheduled: boolean;
  scheduledDate: Date;
  timeSlot: string;
  formattedPT: string;
  formattedES: string;
} {
  const local = getCuritibaDateTime(date);
  const isOperating = isWithinBusinessHours(date, config);

  if (isOperating) {
    return {
      isScheduled: false,
      scheduledDate: date,
      timeSlot: 'imediato',
      formattedPT: 'Entrega Imediata (30-45 min)',
      formattedES: 'Entrega Inmediata (30-45 min)',
    };
  }

  const isEarlyMorning = config.operatingDays.includes(local.dayOfWeek) && local.hours < config.startHour;

  let daysToAdd = isEarlyMorning ? 0 : 1;
  let targetDayOfWeek = (local.dayOfWeek + daysToAdd) % 7;

  while (!config.operatingDays.includes(targetDayOfWeek)) {
    daysToAdd++;
    targetDayOfWeek = (local.dayOfWeek + daysToAdd) % 7;
  }

  // Target 08:30 São Paulo (UTC-3 => 11:30 UTC)
  const targetDate = new Date(date.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  const targetLocal = getCuritibaDateTime(targetDate);
  const scheduledDate = new Date(Date.UTC(targetLocal.year, targetLocal.month, targetLocal.day, 11, 30, 0));

  const dayLabelPT = isEarlyMorning ? 'Hoje' : (daysToAdd === 1 ? 'Amanhã' : 'Segunda-feira');
  const dayLabelES = isEarlyMorning ? 'Hoy' : (daysToAdd === 1 ? 'Mañana' : 'Lunes');

  return {
    isScheduled: true,
    scheduledDate,
    timeSlot: '08:30',
    formattedPT: `${dayLabelPT} a partir das 08:30`,
    formattedES: `${dayLabelES} a partir de las 08:30`,
  };
}

