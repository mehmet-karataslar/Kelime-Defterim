import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Collection, Rating, ReviewLog, SessionRecord, Settings, StudyMode, Word, uid,
} from './types';
import { freshSrs, scheduleNext } from './srs';
import { buildSeed } from './seed';

export const defaultSettings: Settings = {
  uiLang: 'tr',
  meaningLang: 'tr',
  dailyGoal: 10,
  theme: 'light',
  palette: 'ultramarine',
  fontScale: 1,
  density: 'comfortable',
  ttsRate: 0.9,
  soundOn: true,
  reduceMotion: false,
  articleColors: { der: '#2563EB', die: '#E11D48', das: '#059669' },
  writingTolerance: 'case',
  onboarded: false,
  notificationsOn: false,
  notificationInterval: 60,
  notificationContent: 'wordMeaning',
};

interface UndoBuffer {
  words: Word[];
  logs: ReviewLog[];
  collections: Collection[];
}

export interface BackupFile {
  app: 'kelime-defterim';
  version: 1;
  exportedAt: number;
  words: Word[];
  collections: Collection[];
  reviewLogs: ReviewLog[];
  sessions: SessionRecord[];
  settings: Settings;
}

interface AppState {
  words: Word[];
  collections: Collection[];
  reviewLogs: ReviewLog[];
  sessions: SessionRecord[];
  settings: Settings;
  sampleData: boolean;
  undoBuffer: UndoBuffer | null;

  addWord: (w: Word) => void;
  updateWord: (w: Word) => void;
  deleteWords: (ids: string[]) => void;
  undoDelete: () => void;
  clearUndo: () => void;
  toggleFavorite: (id: string) => void;
  setFavoriteBulk: (ids: string[], fav: boolean) => void;
  addSense: (wordId: string, tr: string, en?: string) => void;
  review: (wordId: string, rating: Rating, mode: StudyMode, correct: boolean) => void;
  addToReviewList: (ids: string[]) => void;
  addSession: (s: SessionRecord) => void;

  saveCollection: (c: Collection) => void;
  deleteCollection: (id: string) => void;
  setCollectionWords: (id: string, wordIds: string[]) => void;
  assignToCollection: (collectionId: string, wordIds: string[]) => void;

  updateSettings: (patch: Partial<Settings>) => void;
  seedSample: () => void;
  removeSample: () => void;
  resetAll: () => void;
  exportBackup: () => BackupFile;
  importBackup: (b: BackupFile, mode: 'merge' | 'replace') => number;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      words: [],
      collections: [],
      reviewLogs: [],
      sessions: [],
      settings: defaultSettings,
      sampleData: false,
      undoBuffer: null,

      addWord: (w) => set((s) => ({ words: [w, ...s.words] })),
      updateWord: (w) => set((s) => ({ words: s.words.map((x) => (x.id === w.id ? w : x)) })),

      deleteWords: (ids) => {
        const s = get();
        const idSet = new Set(ids);
        set({
          undoBuffer: {
            words: s.words.filter((w) => idSet.has(w.id)),
            logs: s.reviewLogs.filter((l) => idSet.has(l.wordId)),
            collections: s.collections,
          },
          words: s.words.filter((w) => !idSet.has(w.id)),
          reviewLogs: s.reviewLogs.filter((l) => !idSet.has(l.wordId)),
          collections: s.collections.map((c) => ({ ...c, wordIds: c.wordIds.filter((id) => !idSet.has(id)) })),
        });
      },
      undoDelete: () => {
        const s = get();
        if (!s.undoBuffer) return;
        const existing = new Set(s.words.map((w) => w.id));
        set({
          words: [...s.undoBuffer.words.filter((w) => !existing.has(w.id)), ...s.words],
          reviewLogs: [...s.reviewLogs, ...s.undoBuffer.logs],
          collections: s.undoBuffer.collections,
          undoBuffer: null,
        });
      },
      clearUndo: () => set({ undoBuffer: null }),

      toggleFavorite: (id) =>
        set((s) => ({ words: s.words.map((w) => (w.id === id ? { ...w, favorite: !w.favorite } : w)) })),
      setFavoriteBulk: (ids, fav) => {
        const idSet = new Set(ids);
        set((s) => ({ words: s.words.map((w) => (idSet.has(w.id) ? { ...w, favorite: fav } : w)) }));
      },
      addSense: (wordId, tr, en) =>
        set((s) => ({
          words: s.words.map((w) =>
            w.id === wordId ? { ...w, senses: [...w.senses, { id: uid(), tr, en }] } : w),
        })),

      review: (wordId, rating, mode, correct) => {
        const now = Date.now();
        set((s) => ({
          words: s.words.map((w) => {
            if (w.id !== wordId) return w;
            return {
              ...w,
              srs: scheduleNext(w.srs, rating, now),
              stats: {
                reviews: w.stats.reviews + 1,
                correct: w.stats.correct + (correct ? 1 : 0),
                wrong: w.stats.wrong + (correct ? 0 : 1),
              },
            };
          }),
          reviewLogs: [...s.reviewLogs, { id: uid(), wordId, ts: now, mode, rating, correct }],
        }));
      },
      addToReviewList: (ids) => {
        const idSet = new Set(ids);
        const now = Date.now();
        set((s) => ({
          words: s.words.map((w) =>
            idSet.has(w.id) ? { ...w, srs: { ...w.srs, due: now, state: w.srs.state === 'new' ? 'learning' : w.srs.state } } : w),
        }));
      },
      addSession: (sess) => set((s) => ({ sessions: [sess, ...s.sessions] })),

      saveCollection: (c) =>
        set((s) => {
          const exists = s.collections.some((x) => x.id === c.id);
          return { collections: exists ? s.collections.map((x) => (x.id === c.id ? c : x)) : [...s.collections, c] };
        }),
      deleteCollection: (id) => set((s) => ({ collections: s.collections.filter((c) => c.id !== id) })),
      setCollectionWords: (id, wordIds) =>
        set((s) => ({ collections: s.collections.map((c) => (c.id === id ? { ...c, wordIds } : c)) })),
      assignToCollection: (collectionId, wordIds) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id === collectionId ? { ...c, wordIds: [...new Set([...c.wordIds, ...wordIds])] } : c),
        })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      seedSample: () => {
        const seed = buildSeed(Date.now());
        set({ ...seed, sampleData: true });
      },
      removeSample: () => {
        const s = get();
        const seedIds = new Set(s.words.filter((w) => w.id.startsWith('seed-')).map((w) => w.id));
        set({
          words: s.words.filter((w) => !seedIds.has(w.id)),
          reviewLogs: s.reviewLogs.filter((l) => !seedIds.has(l.wordId)),
          collections: s.collections
            .filter((c) => !c.id.startsWith('col-'))
            .map((c) => ({ ...c, wordIds: c.wordIds.filter((id) => !seedIds.has(id)) })),
          sessions: [],
          sampleData: false,
        });
      },
      resetAll: () =>
        set({
          words: [], collections: [], reviewLogs: [], sessions: [],
          sampleData: false, undoBuffer: null,
          settings: { ...get().settings, onboarded: true },
        }),

      exportBackup: () => {
        const s = get();
        return {
          app: 'kelime-defterim', version: 1, exportedAt: Date.now(),
          words: s.words, collections: s.collections,
          reviewLogs: s.reviewLogs, sessions: s.sessions, settings: s.settings,
        };
      },
      importBackup: (b, mode) => {
        if (mode === 'replace') {
          set({
            words: b.words, collections: b.collections,
            reviewLogs: b.reviewLogs ?? [], sessions: b.sessions ?? [],
            sampleData: false,
          });
          return b.words.length;
        }
        const s = get();
        const existing = new Set(s.words.map((w) => w.id));
        const newWords = b.words.filter((w) => !existing.has(w.id));
        const existingCols = new Set(s.collections.map((c) => c.id));
        const existingLogs = new Set(s.reviewLogs.map((l) => l.id));
        set({
          words: [...newWords, ...s.words],
          collections: [...s.collections, ...(b.collections ?? []).filter((c) => !existingCols.has(c.id))],
          reviewLogs: [...s.reviewLogs, ...(b.reviewLogs ?? []).filter((l) => !existingLogs.has(l.id))],
          sessions: [...(b.sessions ?? []), ...s.sessions],
        });
        return newWords.length;
      },
    }),
    {
      name: 'kelime-defterim-v1',
      partialize: (s) => ({
        words: s.words, collections: s.collections, reviewLogs: s.reviewLogs,
        sessions: s.sessions, settings: s.settings, sampleData: s.sampleData,
      }),
    },
  ),
);

export const newWord = (): Word => ({
  id: uid(),
  german: '', article: null, type: 'noun', level: null,
  senses: [{ id: uid(), tr: '', en: '' }],
  examples: [], synonyms: [], antonyms: [], related: [], tags: [],
  favorite: false, createdAt: Date.now(),
  srs: freshSrs(), stats: { reviews: 0, correct: 0, wrong: 0 },
});