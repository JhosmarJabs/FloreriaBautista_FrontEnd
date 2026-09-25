import type jsPDF from 'jspdf';
import type { SupplyOrderDetail, SupplyOrderLinea } from '../services/adminService';
import { formatApiDate } from './date';

const AZUL: [number, number, number] = [30, 58, 95];
const GRIS: [number, number, number] = [120, 130, 145];

const moneda = (valor: number) =>
  valor.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

async function loadPdfLibs() {
  const [{ default: jsPDF }, { autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  return { jsPDF, autoTable };
}

export async function generarSolicitudPdf(solicitud: SupplyOrderDetail): Promise<jsPDF> {
  const { jsPDF, autoTable } = await loadPdfLibs();
  const doc = new jsPDF();
  const anchoPagina = doc.internal.pageSize.getWidth();
  const margen = 14;

  // ── Encabezado ─────────────────────────────────────────────────
  doc.setFillColor(...AZUL);
  doc.rect(0, 0, anchoPagina, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Florería Bautista', margen, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Solicitud de reabastecimiento', margen, 19);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(solicitud.folio, anchoPagina - margen, 16, { align: 'right' });

  // ── Datos de la solicitud ──────────────────────────────────────
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const datos: [string, string][] = [
    ['Fecha de solicitud', formatApiDate(solicitud.fechaSolicitud)],
    ['Proveedor', solicitud.proveedor || 'Por definir'],
    ['Semana objetivo', solicitud.semanaObjetivo || '—'],
    ['Estado', solicitud.estado.replace('_', ' ')],
  ];

  let y = 36;
  datos.forEach(([etiqueta, valor]) => {
    doc.setTextColor(...GRIS);
    doc.text(`${etiqueta}:`, margen, y);
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.text(valor, margen + 34, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
  });

  if (solicitud.notas) {
    doc.setTextColor(...GRIS);
    doc.text('Notas:', margen, y);
    doc.setTextColor(40, 40, 40);
    doc.text(doc.splitTextToSize(solicitud.notas, anchoPagina - margen * 2 - 34), margen + 34, y);
    y += 6 + Math.max(0, doc.splitTextToSize(solicitud.notas, anchoPagina - margen * 2 - 34).length - 1) * 5;
  }

  // ── Tabla de insumos ───────────────────────────────────────────
  // La última columna va vacía a propósito: es el espacio para anotar a mano
  // cuánto llegó realmente cuando el proveedor surte.
  const filas = solicitud.lineas.map((linea: SupplyOrderLinea, i: number) => [
    String(i + 1),
    linea.nombreSnapshot,
    linea.unidadMedida || '—',
    String(linea.cantidadSolicitada),
    '',
  ]);

  autoTable(doc, {
    head: [['#', 'Insumo', 'Unidad', 'Cantidad solicitada', 'Recibido']],
    body: filas,
    startY: y + 4,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3, lineColor: [225, 229, 235], textColor: [40, 40, 40] },
    headStyles: { fillColor: AZUL, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', textColor: GRIS },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 34, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 30, halign: 'center', fillColor: [250, 250, 252] },
    },
    margin: { left: margen, right: margen },
  });

  // ── Pie: totales y firmas ──────────────────────────────────────
  const totalUnidades = solicitud.lineas.reduce((suma, l) => suma + l.cantidadSolicitada, 0);
  let pieY = ((doc as any).lastAutoTable?.finalY ?? y + 40) + 10;

  // Si el pie no cabe, se pasa a una hoja nueva para no encimarlo con la tabla.
  if (pieY > doc.internal.pageSize.getHeight() - 52) {
    doc.addPage();
    pieY = 24;
  }

  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total de insumos: ${solicitud.lineas.length}`, margen, pieY);
  doc.text(`Total de unidades: ${totalUnidades}`, margen + 62, pieY);
  doc.text(`Total estimado: ${moneda(solicitud.totalEstimado)}`, anchoPagina - margen, pieY, { align: 'right' });

  const firmaY = pieY + 34;
  const anchoFirma = 62;
  doc.setDrawColor(...GRIS);
  doc.line(margen, firmaY, margen + anchoFirma, firmaY);
  doc.line(anchoPagina - margen - anchoFirma, firmaY, anchoPagina - margen, firmaY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRIS);
  doc.text('Entrega (proveedor)', margen, firmaY + 5);
  doc.text('Recibe (Florería Bautista)', anchoPagina - margen, firmaY + 5, { align: 'right' });

  return doc;
}

export async function descargarSolicitudPdf(solicitud: SupplyOrderDetail): Promise<void> {
  const doc = await generarSolicitudPdf(solicitud);
  doc.save(`${solicitud.folio}.pdf`);
}

/** Texto plano de la solicitud, para copiar o mandar por WhatsApp. */
export function textoSolicitud(
  lineas: { nombre: string; cantidad: number; unidad?: string | null }[],
  folio?: string,
): string {
  const encabezado = folio
    ? `Solicitud de reabastecimiento ${folio} — Florería Bautista\n\n`
    : 'Lista de reabastecimiento — Florería Bautista\n\n';
  const cuerpo = lineas
    .map(l => `• ${l.nombre} — ${l.cantidad}${l.unidad ? ` ${l.unidad}` : ''}`)
    .join('\n');
  return encabezado + cuerpo;
}
