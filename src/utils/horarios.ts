import { Horario } from '../types';

export interface HorarioGroup {
  label: string;
  value: string;
}

/** Agrupa días consecutivos con el mismo horario (o mismo estado "cerrado") en un solo rango. */
export function groupHorarios(horarios: Horario[]): HorarioGroup[] {
  const groups: HorarioGroup[] = [];
  let i = 0;
  while (i < horarios.length) {
    const start = horarios[i];
    let j = i;
    while (
      j + 1 < horarios.length &&
      horarios[j + 1].cerrado === start.cerrado &&
      (start.cerrado || (horarios[j + 1].apertura === start.apertura && horarios[j + 1].cierre === start.cierre))
    ) {
      j++;
    }
    groups.push({
      label: j > i ? `${horarios[i].dia} - ${horarios[j].dia}` : horarios[i].dia,
      value: start.cerrado ? 'Cerrado' : `${start.apertura} - ${start.cierre}`,
    });
    i = j + 1;
  }
  return groups;
}
