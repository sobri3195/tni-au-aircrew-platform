export const exportCsv = <T extends object>(filename: string, rows: T[]) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]) as Array<keyof T>;
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

export const exportSimplePdf = (title: string, lines: string[]) => {
  const content = `${title}\n\n${lines.join('\n')}`;
  const blob = new Blob([content], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${title.replace(/\s+/g, '_')}.pdf`;
  link.click();
};
