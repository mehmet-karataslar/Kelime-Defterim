import { create } from 'zustand';
import { StudyMode, Level } from '../core/types';

export type Tab = 'home' | 'words' | 'learn' | 'stats' | 'settings';

export type Route =
  | { name: 'collections' }
  | { name: 'collectionDetail'; id: string }
  | { name: 'wordDetail'; id: string }
  | { name: 'wordEditor'; id?: string }
  | { name: 'sessionSetup'; mode?: StudyMode; collectionId?: string }
  | { name: 'session'; mode: StudyMode; wordIds: string[]; collectionId?: string; level?: Level | null }
  | { name: 'doctorDialogues' }
  | { name: 'officialComms' }
  | { name: 'writingReview'; promptTitle?: string; promptDesc?: string; targetLevel?: Level; formal?: boolean };

interface NavState {
  tab: Tab;
  stack: Route[];
  setTab: (t: Tab) => void;
  push: (r: Route) => void;
  back: () => void;
  reset: () => void;
}

export const useNav = create<NavState>((set) => ({
  tab: 'home',
  stack: [],
  setTab: (t) => set({ tab: t, stack: [] }),
  push: (r) => set((s) => ({ stack: [...s.stack, r] })),
  back: () => set((s) => ({ stack: s.stack.slice(0, -1) })),
  reset: () => set({ stack: [] }),
}));