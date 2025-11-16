import type { Timestamp } from 'firebase/firestore';

export type SessionDoc = {
  id?: string;
  createdAt?: Timestamp | { seconds: number } | string | Date;
  [k: string]: unknown;
};

// Normaliza la fecha de un documento de sesión a Date | null
export function sessionDateToDate(s: SessionDoc): Date | null {
  if (!s || !s.createdAt) return null;
  const c = s.createdAt as unknown;
  if (c && typeof (c as { toDate?: unknown }).toDate === 'function') {
    return (c as { toDate: () => Date }).toDate();
  }
  if (c && typeof (c as { seconds?: unknown }).seconds === 'number') {
    return new Date((c as { seconds: number }).seconds * 1000);
  }
  const d = new Date(String(c));
  if (!isNaN(d.getTime())) return d;
  return null;
}

// Calcula el total de sesiones en la última semana (últimos 7 días desde ahora)
export function totalSessionsLast7Days(sessions: SessionDoc[]): number {
  if (!Array.isArray(sessions) || sessions.length === 0) return 0;
  const now = Date.now();
  const cutoff = now - 7 * 24 * 60 * 60 * 1000;
  return sessions.reduce((acc, s) => {
    const d = sessionDateToDate(s);
    if (!d) return acc;
    if (d.getTime() >= cutoff) return acc + 1;
    return acc;
  }, 0);
}

// Agrupa sesiones por día de la semana (0=Lun .. 6=Dom) y devuelve array de 7 números con porcentajes
export function groupSessionsByDayPercentages(
  sessions: SessionDoc[],
): number[] {
  const counts = new Array(7).fill(0);
  if (!Array.isArray(sessions) || sessions.length === 0)
    return counts.map(() => 0);

  for (const s of sessions) {
    const d = sessionDateToDate(s);
    if (!d) continue;
    const jsDay = d.getDay(); // 0=Dom,1=Lun,...6=Sáb
    // map JS day to 0=Lun .. 6=Dom
    const mapped = (jsDay + 6) % 7;
    counts[mapped] += 1;
  }

  const total = counts.reduce((a, b) => a + b, 0) || 0;
  if (total === 0) return counts.map(() => 0);
  return counts.map((c) => c / total);
}

// Devuelve la distribución (counts) por día Lun..Dom (entero)
export function groupSessionsByDayCounts(sessions: SessionDoc[]): number[] {
  const counts = new Array(7).fill(0);
  for (const s of sessions) {
    const d = sessionDateToDate(s);
    if (!d) continue;
    const jsDay = d.getDay();
    const mapped = (jsDay + 6) % 7;
    counts[mapped] += 1;
  }
  return counts;
}

// Calcula la racha actual de días consecutivos con al menos una sesión,
// contando hacia atrás desde hoy. Por ejemplo, si hoy y ayer hubo sesiones, devuelve 2.
export function computeCurrentStreak(
  sessions: SessionDoc[],
  maxLookbackDays = 365,
): number {
  if (!Array.isArray(sessions) || sessions.length === 0) return 0;

  // Construir un set de fechas en formato YYYY-MM-DD (local) con actividad
  const dateSet = new Set<string>();
  for (const s of sessions) {
    const d = sessionDateToDate(s);
    if (!d) continue;
    // usar fecha local para el usuario
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dateSet.add(`${y}-${m}-${day}`);
  }

  let streak = 0;
  const today = new Date();
  // Iterar hacia atrás día a día hasta encontrar un día sin actividad o llegar al límite
  for (let i = 0; i < maxLookbackDays; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${day}`;
    if (dateSet.has(key)) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}
