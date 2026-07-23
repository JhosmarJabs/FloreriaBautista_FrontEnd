// Cálculo del costo de envío para pedidos web.
//
// Regla de negocio: la florería está en el CP 43021 (San Felipe Orizatlán, Hidalgo).
// - Envío GRATIS dentro de la zona local (mismo municipio de la florería).
// - Fuera de la zona local se cobra según la distancia, aproximada por zonas
//   geográficas (mismo estado / estados colindantes / resto del país), ya que
//   los datos de SEPOMEX no incluyen coordenadas para medir distancia exacta.
//
// Las tarifas son un único punto de configuración; ajústalas aquí si cambian.

import { lookupCp } from '../services/sepomexService';

export const CP_BASE = '43021';

// Ubicación de la florería (derivada del CP base en los datos de SEPOMEX).
const BASE_ESTADO = 'Hidalgo';
const BASE_MUNICIPIO = 'San Felipe Orizatlán';

// Estados colindantes con Hidalgo (zona intermedia).
const ESTADOS_VECINOS = [
  'Veracruz de Ignacio de la Llave',
  'San Luis Potosí',
  'Querétaro',
  'Querétaro de Arteaga',
  'Puebla',
  'Tlaxcala',
  'México',
  'Ciudad de México',
];

// Tarifas por zona (MXN).
export const TARIFAS_ENVIO = {
  local: 0,       // Mismo municipio que la florería
  estatal: 90,    // Mismo estado (Hidalgo), otro municipio
  vecino: 170,    // Estados colindantes
  nacional: 270,  // Resto del país
} as const;

export type ZonaEnvio = 'local' | 'estatal' | 'vecino' | 'nacional' | 'desconocida';

export interface ResultadoEnvio {
  costo: number;
  zona: ZonaEnvio;
  etiqueta: string;
  gratis: boolean;
}

const etiquetaZona: Record<ZonaEnvio, string> = {
  local: 'Zona local (envío gratis)',
  estatal: 'Dentro de Hidalgo',
  vecino: 'Estado colindante',
  nacional: 'Envío nacional',
  desconocida: 'Por confirmar',
};

/**
 * Calcula el costo de envío hacia un código postal de destino (5 dígitos).
 * Si el CP no es válido o no se encuentra, devuelve zona "desconocida" con
 * costo 0 para no bloquear el flujo (el costo se confirma al validar la dirección).
 */
export const calcularEnvio = async (cpDestino: string): Promise<ResultadoEnvio> => {
  const clean = (cpDestino || '').trim();

  const armar = (zona: ZonaEnvio, costo: number): ResultadoEnvio => ({
    costo,
    zona,
    etiqueta: etiquetaZona[zona],
    gratis: costo === 0,
  });

  if (!/^\d{5}$/.test(clean)) return armar('desconocida', 0);

  // Mismo CP que la florería → siempre local.
  if (clean === CP_BASE) return armar('local', TARIFAS_ENVIO.local);

  const info = await lookupCp(clean);
  if (!info) return armar('desconocida', 0);

  if (info.estado === BASE_ESTADO && info.municipio === BASE_MUNICIPIO) {
    return armar('local', TARIFAS_ENVIO.local);
  }
  if (info.estado === BASE_ESTADO) {
    return armar('estatal', TARIFAS_ENVIO.estatal);
  }
  if (ESTADOS_VECINOS.includes(info.estado)) {
    return armar('vecino', TARIFAS_ENVIO.vecino);
  }
  return armar('nacional', TARIFAS_ENVIO.nacional);
};
