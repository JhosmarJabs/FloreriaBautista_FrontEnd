export const filterSensitiveFields = (data: any[]) => {
  return data.map(item => {
    const newItem = { ...item };
    Object.keys(newItem).forEach(key => {
      const lowerKey = key.toLowerCase();
      // Omitir campos que son IDs o sensibles
      if (lowerKey === 'id' || lowerKey.endsWith('id') || key.startsWith('_')) {
        delete newItem[key];
      }
    });
    return newItem;
  });
};

export const exportToCSV = async (data: any[], filename: string) => {
  // Carga diferida de XLSX
  const XLSX = await import('xlsx');
  
  const filteredData = filterSensitiveFields(data);
  const worksheet = XLSX.utils.json_to_sheet(filteredData);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const exportToPDF = async (data: any[], title: string, filename: string) => {
  // Carga diferida de jsPDF y su plugin
  const { default: jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  const filteredData = filterSensitiveFields(data);
  if (filteredData.length === 0) return;

  const doc = new jsPDF();
  doc.text(title, 14, 15);
  const headers = Object.keys(filteredData[0]);
  const rows = filteredData.map(item => headers.map(header => String(item[header])));

  (doc as any).autoTable({
    head: [headers],
    body: rows,
    startY: 20,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 58, 95] }
  });

  doc.save(`${filename}.pdf`);
};

export const filterCSV = (csvText: string): string => {
  const rows = csvText.split('\n');
  if (rows.length === 0) return csvText;

  const headers = rows[0].split(',');
  const idIndexes = headers.reduce((acc: number[], header, index) => {
    const lowerHeader = header.trim().toLowerCase().replace(/^"|"$/g, '');
    if (lowerHeader === 'id' || lowerHeader.endsWith('id')) {
      acc.push(index);
    }
    return acc;
  }, []);

  if (idIndexes.length === 0) return csvText;

  return rows.map(row => {
    const columns = row.split(',');
    return columns.filter((_, index) => !idIndexes.includes(index)).join(',');
  }).join('\n');
};
