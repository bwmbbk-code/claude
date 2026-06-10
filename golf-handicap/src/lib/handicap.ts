import { Round } from '../types';

// WHS: number of best differentials to use and initial adjustment
const WHS_TABLE: Record<number, { count: number; adjustment: number }> = {
  3:  { count: 1, adjustment: -2.0 },
  4:  { count: 1, adjustment: -1.0 },
  5:  { count: 1, adjustment:  0.0 },
  6:  { count: 2, adjustment: -1.0 },
  7:  { count: 2, adjustment: -0.5 },
  8:  { count: 2, adjustment:  0.0 },
  9:  { count: 3, adjustment:  0.0 },
  10: { count: 3, adjustment:  0.0 },
  11: { count: 3, adjustment:  0.0 },
  12: { count: 4, adjustment:  0.0 },
  13: { count: 4, adjustment:  0.0 },
  14: { count: 4, adjustment:  0.0 },
  15: { count: 5, adjustment:  0.0 },
  16: { count: 5, adjustment:  0.0 },
  17: { count: 5, adjustment:  0.0 },
  18: { count: 6, adjustment:  0.0 },
  19: { count: 7, adjustment:  0.0 },
  20: { count: 8, adjustment:  0.0 },
};

export function calcDifferential(
  adjustedScore: number,
  courseRating: number,
  slopeRating: number
): number {
  const raw = (adjustedScore - courseRating) * 113 / slopeRating;
  return Math.round(raw * 10) / 10;
}

export function calcHandicapIndex(rounds: Round[]): number | null {
  const n = Math.min(rounds.length, 20);
  if (n < 3) return null;

  // Use the most recent 20 rounds sorted by date desc, then pick best N by differential
  const recent = [...rounds]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 20);

  const sorted = [...recent].sort((a, b) => a.differential - b.differential);
  const { count, adjustment } = WHS_TABLE[n];
  const best = sorted.slice(0, count);
  const avg = best.reduce((s, r) => s + r.differential, 0) / best.length;

  const hi = avg * 0.96 + adjustment;
  return Math.round(hi * 10) / 10;
}

export function getUsedRoundIds(rounds: Round[]): Set<string> {
  const n = Math.min(rounds.length, 20);
  if (n < 3) return new Set();

  const recent = [...rounds]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 20);

  const sorted = [...recent].sort((a, b) => a.differential - b.differential);
  const { count } = WHS_TABLE[n];
  return new Set(sorted.slice(0, count).map(r => r.id));
}

export function calcCourseHandicap(
  handicapIndex: number,
  slopeRating: number,
  courseRating: number,
  par: number
): number {
  const ch = handicapIndex * (slopeRating / 113) + (courseRating - par);
  return Math.round(ch);
}

// WHS Net Double Bogey ESC: simplified whole-score table
// Returns max adjusted score for 18-hole round given estimated handicap
export function escMaxScore(courseHandicap: number): number {
  if (courseHandicap <= 9) return 7;
  if (courseHandicap <= 19) return 8;
  if (courseHandicap <= 29) return 9;
  if (courseHandicap <= 39) return 10;
  return 11;
}
