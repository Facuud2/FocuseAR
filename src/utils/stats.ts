import { Timestamp } from 'firebase/firestore';

export const DEFAULT_SESSION_MINUTES = 25;

export type SessionDoc = {
  completedAt: Timestamp | Date | string | number;
  durationMinutes?: number;
};

export function isTimestamp(v: unknown): v is Timestamp {
  return v instanceof Timestamp;
}

export function getTotalSessions(sessions: SessionDoc[]): number {
  return sessions.length;
}

// returns array length 7 with counts Sunday..Saturday
export function groupSessionsByDayDomFirst(sessions: SessionDoc[]): number[] {
  const counts = new Array(7).fill(0);
  for (const s of sessions) {
    let date: Date;
    if (s.completedAt instanceof Timestamp) {
      date = s.completedAt.toDate();
    } else {
      date = new Date(s.completedAt as Date | string | number);
    }
    const idx = date.getDay();
    counts[idx] += 1;
  }
  return counts;
}

// returns array length 7 (Mon..Sun) of hours
export function getHoursPerDayMonFirst(sessions: SessionDoc[]): number[] {
  const hours = new Array(7).fill(0);
  for (const s of sessions) {
    let date: Date;
    if (s.completedAt instanceof Timestamp) {
      date = s.completedAt.toDate();
    } else {
      date = new Date(s.completedAt as Date | string | number);
    }
    const idx = (date.getDay() + 6) % 7; // 0 -> Mon, ... 6 -> Sun
    const minutes =
      typeof s.durationMinutes === 'number'
        ? s.durationMinutes
        : DEFAULT_SESSION_MINUTES;
    hours[idx] += minutes / 60;
  }
  return hours;
}

export function getPercentagesFromCounts(counts: number[]): number[] {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return counts.map(() => 0);
  return counts.map((c) => Math.round((c / total) * 100));
}

export function sumDurationMinutes(sessions: SessionDoc[]): number {
  return sessions.reduce(
    (acc, s) =>
      acc +
      (typeof s.durationMinutes === 'number'
        ? s.durationMinutes
        : DEFAULT_SESSION_MINUTES),
    0,
  );
}
