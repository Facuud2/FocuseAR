// Utilidades de fecha para evitar desfase un día al usar cadenas 'YYYY-MM-DD'
// El constructor Date('YYYY-MM-DD') interpreta la fecha como UTC y en zonas horarias negativas
// puede retroceder al día anterior. Esta función fuerza interpretación local.
export function formatLocalDate(
  dateStr: string,
  locale: string = 'es-ES',
): string {
  if (!dateStr) return '';
  // Si viene ya con tiempo (contiene 'T'), delegamos al Date normal
  if (dateStr.includes('T')) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(locale);
  }
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [yearStr, monthStr, dayStr] = parts;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if ([year, month, day].some((n) => isNaN(n))) return dateStr;
  // Construir como fecha local
  const localDate = new Date(year, month - 1, day);
  return localDate.toLocaleDateString(locale);
}

// Convierte una fecha local (Date) a cadena 'YYYY-MM-DD' preservando día local
export function toISODateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
