import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  Collection, Rating, ReviewLog, SessionRecord, Settings, StudyMode, Word, uid,
} from './types';
import { freshSrs, scheduleNext } from './srs';
import { buildSeed } from './seed';
import { idbStorage } from './idbStorage';

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
  notificationTimesOn: false,
  notificationTimes: ['20:00'],
  notifyOnOpen: false,
  quietHoursOn: false,
  quietStart: '22:00',
  quietEnd: '08:00',
  widgets: [{
    id: 'w-default',
    name: 'Widget 1',
    config: {
      type: 'word', size: 'medium', bg: '#FFFFFF', text: '#1E1B2E', accent: '#4338CA',
      border: '#E5E1F5', borderWidth: 0, font: 'sans', fontScale: 1, radius: 20, align: 'left',
      detailed: true, showArticle: true, showMeaning: true, showExample: false,
      source: 'all', collectionId: null, refreshMinutes: 60,
    },
  }],
  updateRepo: 'mehmet-karataslar/Kelime-Defterim',
  updateChannel: 'stable',
  learnLevels: [],
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
  installedPacks: string[];
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
  installBuiltInPack: (packId: string, packWords: Word[], packCollections: Collection[]) => number;
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
      installedPacks: [],
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
      installBuiltInPack: (packId, packWords, packCollections) => {
        const s = get();
        if (s.installedPacks.includes(packId)) return 0;

        const existingIds = new Set(s.words.map((w) => w.id));
        const existingByKey = new Map<string, string>();
        for (const w of s.words) {
          existingByKey.set(`${w.german.normalize('NFC').toLocaleLowerCase('de-DE')}|${w.type}`, w.id);
        }

        const idRemap = new Map<string, string>();
        const toAdd: Word[] = [];
        for (const pw of packWords) {
          if (existingIds.has(pw.id)) {
            idRemap.set(pw.id, pw.id);
            continue;
          }
          const key = `${pw.german.normalize('NFC').toLocaleLowerCase('de-DE')}|${pw.type}`;
          const matchId = existingByKey.get(key);
          if (matchId) {
            // Preserve user's existing word & SRS progress; link collections to it
            idRemap.set(pw.id, matchId);
            continue;
          }
          idRemap.set(pw.id, pw.id);
          toAdd.push(pw);
        }

        const existingColMap = new Map(s.collections.map((c) => [c.id, c]));
        const nextCols = [...s.collections];
        for (const pc of packCollections) {
          const mappedWordIds = [...new Set(pc.wordIds.map((wid) => idRemap.get(wid) ?? wid))];
          const existingCol = existingColMap.get(pc.id);
          if (existingCol) {
            const idx = nextCols.findIndex((c) => c.id === pc.id);
            if (idx >= 0) {
              nextCols[idx] = {
                ...existingCol,
                wordIds: [...new Set([...existingCol.wordIds, ...mappedWordIds])],
              };
            }
          } else {
            nextCols.push({ ...pc, wordIds: mappedWordIds });
          }
        }

        set({
          words: [...s.words, ...toAdd],
          collections: nextCols,
          installedPacks: [...s.installedPacks, packId],
        });
        return toAdd.length;
      },
      resetAll: () =>
        set({
          words: [], collections: [], reviewLogs: [], sessions: [],
          sampleData: false, installedPacks: [], undoBuffer: null,
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
        const existingColsMap = new Map(s.collections.map((c) => [c.id, c]));
        const mergedCols = [...s.collections];
        for (const c of b.collections ?? []) {
          const ex = existingColsMap.get(c.id);
          if (ex) {
            const idx = mergedCols.findIndex((x) => x.id === c.id);
            if (idx >= 0) mergedCols[idx] = { ...ex, wordIds: [...new Set([...ex.wordIds, ...c.wordIds])] };
          } else {
            mergedCols.push(c);
          }
        }
        const existingLogs = new Set(s.reviewLogs.map((l) => l.id));
        set({
          words: [...newWords, ...s.words],
          collections: mergedCols,
          reviewLogs: [...s.reviewLogs, ...(b.reviewLogs ?? []).filter((l) => !existingLogs.has(l.id))],
          sessions: [...(b.sessions ?? []), ...s.sessions],
        });
        return newWords.length;
      },
    }),
    {
      name: 'kelime-defterim-v1',
      storage: createJSONStorage(() => idbStorage),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        return {
          ...current,
          ...p,
          installedPacks: Array.isArray(p.installedPacks) ? p.installedPacks : [],
          settings: { ...defaultSettings, ...(p.settings ?? {}) },
        };
      },
      partialize: (s) => ({
        words: s.words, collections: s.collections, reviewLogs: s.reviewLogs,
        sessions: s.sessions, settings: s.settings, sampleData: s.sampleData,
        installedPacks: s.installedPacks,
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