export type Article = 'der' | 'die' | 'das';
export type WordType =
  | 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'pronoun'
  | 'conjunction' | 'numeral' | 'interjection' | 'phrase' | 'other';
export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type SrsState = 'new' | 'learning' | 'review' | 'relearning' | 'learned';
export type Rating = 0 | 1 | 2 | 3; // again, hard, good, easy
export type StudyMode =
  | 'flashcard' | 'article' | 'meaning' | 'writing' | 'listening'
  | 'matching' | 'sentence' | 'hard';
export type UiLang = 'tr' | 'de' | 'en';
export type MeaningLang = 'tr' | 'en';

export interface Sense {
  id: string;
  tr: string;
  en?: string;
  context?: string;
}

export interface Example {
  id: string;
  de: string;
  tr: string;
}

export interface NounDetails {
  plural?: string;
  genitiv?: string;
  pluralOnly?: boolean;
  noPlural?: boolean;
  nDeclension?: boolean;
}

export interface VerbDetails {
  praesens3?: string;
  praeteritum?: string;
  partizip2?: string;
  auxiliary?: 'haben' | 'sein';
  irregular?: boolean;
  separable?: boolean;
  reflexive?: boolean;
  modal?: boolean;
  preposition?: string;
  prepCase?: string;
}

export interface AdjectiveDetails {
  komparativ?: string;
  superlativ?: string;
}

export interface PrepositionDetails {
  cases: string[];
  wechsel?: boolean;
}

export interface SrsData {
  ease: number;
  interval: number; // days
  reps: number;
  lapses: number;
  due: number | null; // epoch ms
  lastReview: number | null;
  state: SrsState;
}

export interface WordStats {
  reviews: number;
  correct: number;
  wrong: number;
}

export interface Word {
  id: string;
  german: string;
  article: Article | null;
  type: WordType;
  level: Level | null;
  senses: Sense[];
  examples: Example[];
  paragraph?: string;
  noun?: NounDetails;
  verb?: VerbDetails;
  adjective?: AdjectiveDetails;
  preposition?: PrepositionDetails;
  synonyms: string[];
  antonyms: string[];
  related: string[];
  tags: string[];
  notes?: string;
  favorite: boolean;
  createdAt: number;
  srs: SrsData;
  stats: WordStats;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  wordIds: string[];
  createdAt: number;
}

export interface ReviewLog {
  id: string;
  wordId: string;
  ts: number;
  mode: StudyMode;
  rating: Rating;
  correct: boolean;
}

export interface SessionRecord {
  id: string;
  mode: StudyMode;
  ts: number;
  total: number;
  correct: number;
  wrong: number;
  hard: number;
  durationSec: number;
  level?: Level | null;
}

export interface Settings {
  uiLang: UiLang;
  meaningLang: MeaningLang;
  dailyGoal: number;
  theme: 'light' | 'dark' | 'system';
  palette: string;
  fontScale: number;
  density: 'comfortable' | 'compact';
  ttsRate: number;
  soundOn: boolean;
  reduceMotion: boolean;
  articleColors: { der: string; die: string; das: string };
  writingTolerance: 'strict' | 'case' | 'umlaut';
  onboarded: boolean;
  notificationsOn: boolean;
  notificationInterval: number; // minutes
  notificationContent: 'word' | 'wordMeaning' | 'quiz';
  notificationTimesOn: boolean;
  notificationTimes: string[]; // daily "HH:MM"
  notifyOnOpen: boolean;
  quietHoursOn: boolean;
  quietStart: string; // "HH:MM"
  quietEnd: string; // "HH:MM"
  widgets: WidgetDesign[];
  updateRepo: string; // "owner/repo" on GitHub
  updateChannel: 'stable' | 'beta';
}

export type WidgetType = 'word' | 'list' | 'compact' | 'goal' | 'review' | 'quiz';

export interface WidgetConfig {
  type: WidgetType;
  size: 'small' | 'medium' | 'large';
  bg: string;
  bgOpacity?: number; // 20 - 100
  text: string;
  accent: string;
  border: string;
  borderWidth: number;
  font: 'sans' | 'serif' | 'mono';
  fontScale: number;
  radius: number;
  align: 'left' | 'center';
  detailed: boolean;
  showArticle: boolean;
  showMeaning: boolean;
  showExample: boolean;
  listCount?: number; // 3, 4, 5
  source: 'all' | 'favorites' | 'daily' | 'collection';
  collectionId: string | null;
  refreshMinutes: number;
}

export interface WidgetDesign {
  id: string;
  name: string;
  config: WidgetConfig;
}

export const WORD_TYPES: WordType[] = [
  'noun', 'verb', 'adjective', 'adverb', 'preposition', 'pronoun',
  'conjunction', 'numeral', 'interjection', 'phrase', 'other',
];
export const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
export const ARTICLES: Article[] = ['der', 'die', 'das'];

export const uid = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 9);

export const DAY = 86_400_000;

export const startOfDay = (ts: number): number => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const normalizeGerman = (s: string): string => s.normalize('NFC').trim();

export const foldForSearch = (s: string): string =>
  s.normalize('NFC').toLocaleLowerCase('de-DE')
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss');