import { DAY, Level, ReviewLog, SrsState, Word, startOfDay } from './types';
import { isStruggling, recallRate } from './srs';

export function todayProgress(logs: ReviewLog[], now: number): number {
  const today = startOfDay(now);
  const ids = new Set(logs.filter((l) => l.ts >= today && l.rating >= 2).map((l) => l.wordId));
  return ids.size;
}

export function computeStreak(logs: ReviewLog[], now: number): number {
  if (logs.length === 0) return 0;
  const days = new Set(logs.map((l) => startOfDay(l.ts)));
  const today = startOfDay(now);
  let streak = 0;
  let cursor = days.has(today) ? today : today - DAY;
  while (days.has(cursor)) {
    streak += 1;
    cursor -= DAY;
  }
  return streak;
}

export function weeklyBars(logs: ReviewLog[], now: number): { label: number; count: number; ts: number }[] {
  const today = startOfDay(now);
  const dow = (new Date(today).getDay() + 6) % 7; // Monday=0
  const monday = today - dow * DAY;
  return Array.from({ length: 7 }, (_, i) => {
    const ts = monday + i * DAY;
    const count = new Set(logs.filter((l) => l.ts >= ts && l.ts < ts + DAY).map((l) => l.wordId)).size;
    return { label: i, count, ts };
  });
}

export function heatCells(logs: ReviewLog[], now: number, weeks = 4): { ts: number; count: number }[] {
  const today = startOfDay(now);
  const dow = (new Date(today).getDay() + 6) % 7;
  const end = today - dow * DAY + 6 * DAY; // end of this week
  const start = end - (weeks * 7 - 1) * DAY;
  const counts = new Map<number, number>();
  for (const l of logs) {
    const d = startOfDay(l.ts);
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  return Array.from({ length: weeks * 7 }, (_, i) => {
    const ts = start + i * DAY;
    return { ts, count: ts > today ? -1 : counts.get(ts) ?? 0 };
  });
}

export interface Distribution { state: SrsState | 'struggling'; count: number; }

export function statusDistribution(words: Word[]): Distribution[] {
  const buckets: Record<string, number> = { learned: 0, review: 0, learning: 0, new: 0, struggling: 0 };
  for (const w of words) {
    if (isStruggling(w)) buckets.struggling += 1;
    else if (w.srs.state === 'relearning') buckets.learning += 1;
    else buckets[w.srs.state] += 1;
  }
  return [
    { state: 'learned', count: buckets.learned },
    { state: 'review', count: buckets.review },
    { state: 'learning', count: buckets.learning },
    { state: 'new', count: buckets.new },
    { state: 'struggling', count: buckets.struggling },
  ];
}

export function cefrDistribution(words: Word[]): { level: Level; count: number; learned: number }[] {
  const levels: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  return levels.map((level) => {
    const ws = words.filter((w) => w.level === level);
    return { level, count: ws.length, learned: ws.filter((w) => w.srs.state === 'learned').length };
  });
}

export function articleAccuracy(logs: ReviewLog[]): number {
  const arts = logs.filter((l) => l.mode === 'article');
  if (arts.length === 0) return 0;
  return Math.round((arts.filter((l) => l.correct).length / arts.length) * 100);
}

export function hardestWords(words: Word[], n = 5): Word[] {
  return [...words]
    .filter((w) => w.stats.wrong > 0)
    .sort((a, b) => b.stats.wrong - a.stats.wrong || b.srs.lapses - a.srs.lapses)
    .slice(0, n);
}

export function wordOfDay(words: Word[], now: number): Word | null {
  if (words.length === 0) return null;
  const day = Math.floor(startOfDay(now) / DAY);
  const favs = words.filter((w) => w.favorite);
  const pool = favs.length > 0 ? favs : words;
  return pool[day % pool.length];
}

export function addedThisWeek(words: Word[], now: number): number {
  const today = startOfDay(now);
  const dow = (new Date(today).getDay() + 6) % 7;
  const monday = today - dow * DAY;
  return words.filter((w) => w.createdAt >= monday).length;
}

export { recallRate };