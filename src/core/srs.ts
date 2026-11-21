import { DAY, Rating, SrsData, SrsState, Word } from '../core/types';

export const freshSrs = (): SrsData => ({
  ease: 2.5,
  interval: 0,
  reps: 0,
  lapses: 0,
  due: null,
  lastReview: null,
  state: 'new',
});

const clampEase = (e: number) => Math.min(3.0, Math.max(1.3, e));

export function scheduleNext(srs: SrsData, rating: Rating, now: number): SrsData {
  let { ease, interval, reps, lapses } = srs;
  let state: SrsState;

  if (rating === 0) {
    lapses += 1;
    reps = 0;
    interval = 0;
    ease = clampEase(ease - 0.2);
    state = 'relearning';
    return { ease, interval, reps, lapses, due: now + 10 * 60_000, lastReview: now, state };
  }

  if (rating === 1) {
    ease = clampEase(ease - 0.15);
    interval = reps === 0 ? 0.5 : Math.max(1, interval * 1.2);
    reps += 1;
    state = interval >= 21 ? 'learned' : reps <= 1 ? 'learning' : 'review';
  } else if (rating === 2) {
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 3;
    else interval = Math.round(interval * ease);
    reps += 1;
    state = interval >= 21 ? 'learned' : reps <= 1 ? 'learning' : 'review';
  } else {
    ease = clampEase(ease + 0.15);
    interval = reps === 0 ? 3 : Math.max(4, Math.round(interval * ease * 1.3));
    reps += 1;
    state = interval >= 21 ? 'learned' : 'review';
  }

  return {
    ease, interval, reps, lapses,
    due: now + Math.round(interval * DAY),
    lastReview: now,
    state,
  };
}

export const isDue = (w: Word, now: number): boolean =>
  w.srs.due !== null && w.srs.due <= now;

export const isStruggling = (w: Word): boolean =>
  w.srs.lapses >= 3 || (w.stats.reviews >= 4 && w.stats.correct / w.stats.reviews < 0.5);

export const dueWords = (words: Word[], now: number): Word[] =>
  words.filter((w) => isDue(w, now));

export const overdueWords = (words: Word[], todayStart: number): Word[] =>
  words.filter((w) => w.srs.due !== null && w.srs.due < todayStart);

export function recallRate(words: Word[]): number {
  const totals = words.reduce(
    (a, w) => ({ r: a.r + w.stats.reviews, c: a.c + w.stats.correct }),
    { r: 0, c: 0 },
  );
  return totals.r === 0 ? 0 : Math.round((totals.c / totals.r) * 100);
}