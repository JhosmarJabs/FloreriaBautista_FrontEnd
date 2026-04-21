/**
 * Tipos e Interfaces para el Motor Predictivo
 */

export interface SimulationPoint {
  date: string; // Formato ISO YYYY-MM-DD
  stock: number;
}

export interface PredictionResult {
  depletionDate: Date | null;
  daysRemaining: number | null;
  decayRate: number | null; // Tasa 'k' del modelo exponencial
}

/**
 * Motor Matemático: Ley de Decrecimiento Exponencial
 * Fórmula: y = y0 * e^(kt)
 * 
 * @param p1 Punto de referencia inicial (t1, S1)
 * @param p2 Punto de referencia secundario (t2, S2)
 * @returns Resultado con fecha estimada de stock cero
 */
export const calculateExponentialDepletion = (
  p1: SimulationPoint,
  p2: SimulationPoint
): PredictionResult => {
  const y1 = p1.stock;
  const y2 = p2.stock;

  // Validaciones de integridad física
  // El modelo asume decrecimiento; si el stock sube o es cero, no es aplicable.
  if (y1 <= y2 || y1 <= 0 || y2 <= 0) {
    return { depletionDate: null, daysRemaining: null, decayRate: null };
  }

  const t1 = new Date(p1.date).getTime();
  const t2 = new Date(p2.date).getTime();
  
  // Diferencia de tiempo en días (delta_t)
  const deltaT = Math.ceil((t2 - t1) / (1000 * 3600 * 24));

  if (deltaT <= 0) {
    return { depletionDate: null, daysRemaining: null, decayRate: null };
  }

  // 1. Cálculo de la tasa de decrecimiento (k)
  // k = ln(y2 / y1) / delta_t
  const k = Math.log(y2 / y1) / deltaT;

  // 2. Definición del umbral de stock cero (y_min)
  // Usamos 0.5 para representar el agotamiento inminente y evitar asíntotas
  const yMin = 0.5;

  // 3. Cálculo de días restantes hasta llegar a y_min
  // ln(y_min / y2) / k = t_faltante
  const daysRemaining = Math.ceil(Math.log(yMin / y2) / k);

  const depletionDate = new Date(t2);
  depletionDate.setDate(depletionDate.getDate() + daysRemaining);

  return {
    depletionDate,
    daysRemaining,
    decayRate: k
  };
};
