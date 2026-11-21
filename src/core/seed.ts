import {
  Article, Collection, DAY, Level, ReviewLog, SessionRecord, SrsState,
  StudyMode, Word, WordType, uid, startOfDay,
} from './types';
import { freshSrs } from './srs';

interface SeedSpec {
  g: string; a: Article | null; t: WordType; l: Level | null;
  tr: string; en: string;
  ex?: [string, string][];
  plural?: string; genitiv?: string; nDecl?: boolean;
  verb?: Word['verb']; adj?: Word['adjective']; prep?: Word['preposition'];
  syn?: string[]; ant?: string[]; rel?: string[];
  senses?: { tr: string; en: string; context?: string }[];
  tags?: string[]; fav?: boolean;
}

const SPECS: SeedSpec[] = [
  { g: 'Möglichkeit', a: 'die', t: 'noun', l: 'B1', tr: 'İmkân, olasılık', en: 'possibility', plural: 'die Möglichkeiten', ex: [['Es gibt viele Möglichkeiten.', 'Birçok imkân var.']], syn: ['Chance', 'Option'], rel: ['möglich'], tags: ['soyut'], fav: true },
  { g: 'Alltag', a: 'der', t: 'noun', l: 'A2', tr: 'Günlük yaşam', en: 'everyday life', noPlural: true, ex: [['Der Alltag ist oft stressig.', 'Günlük yaşam çoğu zaman streslidir.']] } as SeedSpec,
  { g: 'Erfahrung', a: 'die', t: 'noun', l: 'B1', tr: 'Deneyim, tecrübe', en: 'experience', plural: 'die Erfahrungen', ex: [['Ich habe viel Erfahrung in diesem Bereich.', 'Bu alanda çok deneyimim var.']], rel: ['erfahren'], fav: true },
  { g: 'Verständnis', a: 'das', t: 'noun', l: 'B1', tr: 'Anlayış, kavrayış', en: 'understanding', plural: 'die Verständnisse', ex: [['Danke für dein Verständnis.', 'Anlayışın için teşekkürler.']], rel: ['verstehen'] },
  { g: 'Apfel', a: 'der', t: 'noun', l: 'A1', tr: 'Elma', en: 'apple', plural: 'die Äpfel', genitiv: 'des Apfels', ex: [['Der Apfel ist rot.', 'Elma kırmızıdır.']], tags: ['yiyecek'], fav: true },
  { g: 'Entscheidung', a: 'die', t: 'noun', l: 'B1', tr: 'Karar', en: 'decision', plural: 'die Entscheidungen', ex: [['Ich muss eine wichtige Entscheidung treffen.', 'Önemli bir karar vermem gerekiyor.']], rel: ['entscheiden', 'eine Entscheidung treffen'] },
  { g: 'Haus', a: 'das', t: 'noun', l: 'A1', tr: 'Ev', en: 'house', plural: 'die Häuser', genitiv: 'des Hauses', ex: [['Das Haus ist sehr groß.', 'Ev çok büyük.']], tags: ['ev'], fav: true },
  { g: 'gehen', a: null, t: 'verb', l: 'A1', tr: 'Gitmek, yürümek', en: 'to go, to walk', verb: { praesens3: 'geht', praeteritum: 'ging', partizip2: 'gegangen', auxiliary: 'sein', irregular: true }, ex: [['Ich gehe jeden Tag zur Schule.', 'Her gün okula gidiyorum.'], ['Wir gehen heute ins Kino.', 'Bugün sinemaya gidiyoruz.']] },
  { g: 'schön', a: null, t: 'adjective', l: 'A1', tr: 'Güzel', en: 'beautiful', adj: { komparativ: 'schöner', superlativ: 'am schönsten' }, syn: ['hübsch'], ant: ['hässlich'], ex: [['Das Wetter ist heute schön.', 'Bugün hava güzel.']] },
  { g: 'Tisch', a: 'der', t: 'noun', l: 'A1', tr: 'Masa', en: 'table', plural: 'die Tische', genitiv: 'des Tisches', ex: [['Der Tisch steht am Fenster.', 'Masa pencerenin yanında duruyor.']], tags: ['ev'] },
  { g: 'fahren', a: null, t: 'verb', l: 'A1', tr: 'Gitmek, araç sürmek', en: 'to drive, to go', verb: { praesens3: 'fährt', praeteritum: 'fuhr', partizip2: 'gefahren', auxiliary: 'sein', irregular: true }, ex: [['Ich fahre morgen nach Berlin.', 'Yarın Berlin’e gidiyorum.']], rel: ['Fahrt', 'Fahrer'] },
  { g: 'gut', a: null, t: 'adjective', l: 'A1', tr: 'İyi', en: 'good', adj: { komparativ: 'besser', superlativ: 'am besten' }, ant: ['schlecht'], ex: [['Das Essen schmeckt gut.', 'Yemek iyi tadıyor.']] },
  { g: 'mit', a: null, t: 'preposition', l: 'A1', tr: 'ile', en: 'with', prep: { cases: ['Dativ'] }, ex: [['Ich fahre mit dem Bus.', 'Otobüsle gidiyorum.']] },
  { g: 'Bank', a: 'die', t: 'noun', l: 'A2', tr: 'Bank, oturak', en: 'bench', plural: 'die Bänke', senses: [{ tr: 'Banka (finans kurumu)', en: 'bank (financial institution)', context: 'Finans' }], ex: [['Wir sitzen auf der Bank.', 'Bankta oturuyoruz.'], ['Ich gehe zur Bank.', 'Bankaya gidiyorum.']] },
  { g: 'Gedächtnis', a: 'das', t: 'noun', l: 'B2', tr: 'Hafıza, bellek', en: 'memory', plural: 'die Gedächtnisse', genitiv: 'des Gedächtnisses', ex: [['Er hat ein sehr gutes Gedächtnis.', 'Onun çok iyi bir hafızası var.']], rel: ['gedenken'], tags: ['soyut'] },
  { g: 'Wasser', a: 'das', t: 'noun', l: 'A1', tr: 'Su', en: 'water', plural: 'die Wässer', ex: [['Ich trinke ein Glas Wasser.', 'Bir bardak su içiyorum.']], tags: ['yiyecek'] },
  { g: 'Buch', a: 'das', t: 'noun', l: 'A1', tr: 'Kitap', en: 'book', plural: 'die Bücher', genitiv: 'des Buches', ex: [['Das Buch ist interessant.', 'Kitap ilginç.']], tags: ['okul'] },
  { g: 'Frau', a: 'die', t: 'noun', l: 'A1', tr: 'Kadın, bayan', en: 'woman, Mrs.', plural: 'die Frauen', ex: [['Die Frau liest ein Buch.', 'Kadın bir kitap okuyor.']], ant: ['Mann'] },
  { g: 'Mann', a: 'der', t: 'noun', l: 'A1', tr: 'Adam, erkek', en: 'man', plural: 'die Männer', genitiv: 'des Mannes', ex: [['Der Mann arbeitet viel.', 'Adam çok çalışıyor.']], ant: ['Frau'] },
  { g: 'Kind', a: 'das', t: 'noun', l: 'A1', tr: 'Çocuk', en: 'child', plural: 'die Kinder', genitiv: 'des Kindes', ex: [['Das Kind spielt im Garten.', 'Çocuk bahçede oynuyor.']], tags: ['aile'] },
  { g: 'Schule', a: 'die', t: 'noun', l: 'A1', tr: 'Okul', en: 'school', plural: 'die Schulen', ex: [['Die Schule beginnt um acht Uhr.', 'Okul saat sekizde başlıyor.']], tags: ['okul'] },
  { g: 'arbeiten', a: null, t: 'verb', l: 'A1', tr: 'Çalışmak', en: 'to work', verb: { praesens3: 'arbeitet', praeteritum: 'arbeitete', partizip2: 'gearbeitet', auxiliary: 'haben' }, ex: [['Sie arbeitet bei einer Firma.', 'Bir şirkette çalışıyor.']], rel: ['Arbeit', 'Arbeiter'] },
  { g: 'lernen', a: null, t: 'verb', l: 'A1', tr: 'Öğrenmek', en: 'to learn', verb: { praesens3: 'lernt', praeteritum: 'lernte', partizip2: 'gelernt', auxiliary: 'haben' }, ex: [['Ich lerne jeden Tag Deutsch.', 'Her gün Almanca öğreniyorum.']], fav: true },
  { g: 'sprechen', a: null, t: 'verb', l: 'A1', tr: 'Konuşmak', en: 'to speak', verb: { praesens3: 'spricht', praeteritum: 'sprach', partizip2: 'gesprochen', auxiliary: 'haben', irregular: true }, ex: [['Sprichst du Deutsch?', 'Almanca konuşuyor musun?']] },
  { g: 'schnell', a: null, t: 'adjective', l: 'A2', tr: 'Hızlı', en: 'fast', adj: { komparativ: 'schneller', superlativ: 'am schnellsten' }, ant: ['langsam'], ex: [['Der Zug ist sehr schnell.', 'Tren çok hızlı.']] },
  { g: 'langsam', a: null, t: 'adjective', l: 'A2', tr: 'Yavaş', en: 'slow', adj: { komparativ: 'langsamer', superlativ: 'am langsamsten' }, ant: ['schnell'], ex: [['Bitte sprich langsam.', 'Lütfen yavaş konuş.']] },
  { g: 'Freund', a: 'der', t: 'noun', l: 'A1', tr: 'Arkadaş', en: 'friend (male)', plural: 'die Freunde', genitiv: 'des Freundes', nDecl: true, ex: [['Mein Freund wohnt in München.', 'Arkadaşım Münih’te yaşıyor.']], tags: ['aile'] },
  { g: 'Zeit', a: 'die', t: 'noun', l: 'A2', tr: 'Zaman', en: 'time', plural: 'die Zeiten', ex: [['Ich habe keine Zeit.', 'Zamanım yok.']], tags: ['soyut'] },
  { g: 'Woche', a: 'die', t: 'noun', l: 'A1', tr: 'Hafta', en: 'week', plural: 'die Wochen', ex: [['Die Woche hat sieben Tage.', 'Haftanın yedi günü vardır.']] },
  { g: 'Stadt', a: 'die', t: 'noun', l: 'A2', tr: 'Şehir', en: 'city', plural: 'die Städte', ex: [['Berlin ist eine große Stadt.', 'Berlin büyük bir şehirdir.']], tags: ['seyahat'] },
  { g: 'Bahnhof', a: 'der', t: 'noun', l: 'A2', tr: 'Tren istasyonu', en: 'train station', plural: 'die Bahnhöfe', ex: [['Der Bahnhof ist in der Nähe.', 'Tren istasyonu yakında.']], tags: ['seyahat'] },
  { g: 'Frühstück', a: 'das', t: 'noun', l: 'A1', tr: 'Kahvaltı', en: 'breakfast', plural: 'die Frühstücke', ex: [['Das Frühstück ist fertig.', 'Kahvaltı hazır.']], tags: ['yiyecek'] },
  { g: 'Entwicklung', a: 'die', t: 'noun', l: 'B2', tr: 'Gelişim, gelişme', en: 'development', plural: 'die Entwicklungen', ex: [['Die Entwicklung geht schnell voran.', 'Gelişim hızla ilerliyor.']], rel: ['entwickeln'], tags: ['soyut'] },
  { g: 'Umgebung', a: 'die', t: 'noun', l: 'B1', tr: 'Çevre, ortam', en: 'surroundings', plural: 'die Umgebungen', ex: [['Die Umgebung ist sehr ruhig.', 'Çevre çok sakin.']], tags: ['seyahat'] },
  { g: 'Beziehung', a: 'die', t: 'noun', l: 'B1', tr: 'İlişki', en: 'relationship', plural: 'die Beziehungen', ex: [['Sie haben eine gute Beziehung.', 'İyi bir ilişkileri var.']], rel: ['beziehen'] },
  { g: 'wahrscheinlich', a: null, t: 'adverb', l: 'B1', tr: 'Muhtemelen', en: 'probably', ex: [['Es wird wahrscheinlich regnen.', 'Muhtemelen yağmur yağacak.']] },
];

// deterministic RNG so seeded history is stable
function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SeedResult {
  words: Word[];
  collections: Collection[];
  reviewLogs: ReviewLog[];
  sessions: SessionRecord[];
}

export function buildSeed(now: number): SeedResult {
  const rnd = mulberry32(20261121);
  const today = startOfDay(now);
  const words: Word[] = SPECS.map((s, i) => {
    const createdAt = today - Math.round((SPECS.length - i) * 1.6 * DAY) - Math.round(rnd() * DAY * 0.5);
    const senses = [
      { id: uid(), tr: s.tr, en: s.en },
      ...(s.senses ?? []).map((x) => ({ id: uid(), tr: x.tr, en: x.en, context: x.context })),
    ];
    const examples = (s.ex ?? []).map(([de, tr]) => ({ id: uid(), de, tr }));
    const noun = s.t === 'noun'
      ? { plural: s.plural, genitiv: s.genitiv, nDeclension: s.nDecl, noPlural: (s as SeedSpec & { noPlural?: boolean }).noPlural }
      : undefined;
    return {
      id: 'seed-' + i,
      german: s.g, article: s.a, type: s.t, level: s.l,
      senses, examples, noun, verb: s.verb, adjective: s.adj, preposition: s.prep,
      synonyms: s.syn ?? [], antonyms: s.ant ?? [], related: s.rel ?? [],
      tags: s.tags ?? [], favorite: !!s.fav, createdAt,
      srs: freshSrs(), stats: { reviews: 0, correct: 0, wrong: 0 },
    };
  });

  // distribute SRS states: 22 learned, 6 review, 3 learning, 3 new, 2 relearning
  const states: SrsState[] = [
    ...Array(22).fill('learned'), ...Array(6).fill('review'),
    ...Array(3).fill('learning'), ...Array(3).fill('new'), ...Array(2).fill('relearning'),
  ];
  const order = words.map((_, i) => i).sort(() => rnd() - 0.5);
  order.forEach((wi, k) => {
    const w = words[wi];
    const st = states[k];
    if (st === 'new') return;
    const interval = st === 'learned' ? 21 + Math.round(rnd() * 40)
      : st === 'review' ? 4 + Math.round(rnd() * 12)
      : st === 'learning' ? 1 : 0;
    w.srs = {
      ease: 2.3 + rnd() * 0.5, interval,
      reps: st === 'learned' ? 5 + Math.round(rnd() * 6) : st === 'review' ? 3 : 1,
      lapses: st === 'relearning' ? 3 : Math.round(rnd() * 2),
      due: st === 'relearning' ? now - 2 * 3600_000 : today + interval * DAY - Math.round(rnd() * 4) * DAY,
      lastReview: today - Math.round(rnd() * 3) * DAY,
      state: st,
    };
    const reviews = w.srs.reps * 2 + Math.round(rnd() * 4);
    const wrong = st === 'relearning' ? Math.round(reviews * 0.6) : Math.round(reviews * (0.08 + rnd() * 0.15));
    w.stats = { reviews, correct: reviews - wrong, wrong };
  });

  // make exactly 12 due now: 4 overdue (incl. relearning), 8 later today
  const dueIdx = order.filter((i) => words[i].srs.state !== 'new').slice(0, 12);
  dueIdx.forEach((wi, k) => {
    words[wi].srs.due = k < 4 ? today - (1 + k) * DAY + 9 * 3600_000 : today + 6 * 3600_000;
  });
  // ensure two clear strugglers
  const ged = words.find((w) => w.german === 'Gedächtnis')!;
  ged.srs.lapses = 4; ged.stats = { reviews: 14, correct: 5, wrong: 9 };
  ged.srs.due = today + 5 * 3600_000; ged.srs.state = 'relearning';
  const ent = words.find((w) => w.german === 'Entwicklung')!;
  ent.srs.lapses = 3; ent.stats = { reviews: 11, correct: 4, wrong: 7 };
  ent.srs.state = 'relearning';

  // review history: last 28 days, 8–30 reviews/day, today ~14 covering 7 distinct words
  const modes: StudyMode[] = ['flashcard', 'article', 'meaning', 'writing', 'listening', 'matching', 'sentence'];
  const reviewLogs: ReviewLog[] = [];
  const active = words.filter((w) => w.srs.state !== 'new');
  for (let d = 28; d >= 1; d--) {
    const dayStart = today - d * DAY;
    const count = 8 + Math.round(rnd() * 22);
    for (let j = 0; j < count; j++) {
      const w = active[Math.floor(rnd() * active.length)];
      const correct = rnd() > (w.srs.lapses >= 3 ? 0.55 : 0.16);
      reviewLogs.push({
        id: uid(), wordId: w.id, ts: dayStart + (8 + Math.floor(rnd() * 13)) * 3600_000 + Math.floor(rnd() * 3500_000),
        mode: modes[Math.floor(rnd() * modes.length)],
        rating: correct ? (rnd() > 0.7 ? 3 : 2) : rnd() > 0.5 ? 1 : 0,
        correct,
      });
    }
  }
  const todayWords = active.slice(0, 7);
  todayWords.forEach((w, k) => {
    for (let j = 0; j < 2; j++) {
      reviewLogs.push({
        id: uid(), wordId: w.id, ts: today + (8 + k) * 3600_000 + j * 600_000,
        mode: modes[Math.floor(rnd() * modes.length)], rating: 2, correct: true,
      });
    }
  });
  reviewLogs.sort((a, b) => a.ts - b.ts);

  const sessions: SessionRecord[] = [
    { id: uid(), mode: 'flashcard', ts: today + 9 * 3600_000, total: 20, correct: 17, wrong: 3, hard: 2, durationSec: 312 },
    { id: uid(), mode: 'article', ts: today - DAY + 18 * 3600_000, total: 15, correct: 11, wrong: 4, hard: 3, durationSec: 205, level: 'A2' },
    { id: uid(), mode: 'listening', ts: today - 2 * DAY + 19 * 3600_000, total: 10, correct: 9, wrong: 1, hard: 1, durationSec: 168 },
    { id: uid(), mode: 'meaning', ts: today - 4 * DAY + 17 * 3600_000, total: 18, correct: 15, wrong: 3, hard: 2, durationSec: 260 },
    { id: uid(), mode: 'writing', ts: today - 6 * DAY + 20 * 3600_000, total: 12, correct: 8, wrong: 4, hard: 4, durationSec: 340, level: 'A1' },
  ];

  const pick = (names: string[]) => words.filter((w) => names.includes(w.german)).map((w) => w.id);
  const collections: Collection[] = [
    { id: 'col-a1', name: 'A1 Kelimeleri', description: 'Başlangıç seviyesi temel kelimeler', color: '#4338CA', icon: 'graduation', wordIds: words.filter((w) => w.level === 'A1').map((w) => w.id), createdAt: today - 40 * DAY },
    { id: 'col-daily', name: 'Günlük Konuşma', description: 'Her gün kullanılan kelimeler', color: '#059669', icon: 'message', wordIds: pick(['gehen', 'sprechen', 'gut', 'schön', 'Zeit', 'Alltag', 'mit', 'wahrscheinlich']), createdAt: today - 32 * DAY },
    { id: 'col-travel', name: 'Seyahat', description: 'Yolculukta işine yarayacak kelimeler', color: '#D97706', icon: 'plane', wordIds: pick(['Bahnhof', 'Stadt', 'fahren', 'Umgebung', 'Wasser', 'Frühstück']), createdAt: today - 25 * DAY },
    { id: 'col-verbs', name: 'Fiiller', description: 'Önemli fiiller ve çekimleri', color: '#7C3AED', icon: 'zap', wordIds: words.filter((w) => w.type === 'verb').map((w) => w.id), createdAt: today - 20 * DAY },
    { id: 'col-hard', name: 'Zor Kelimeler', description: 'Tekrar tekrar çalışılacaklar', color: '#E11D48', icon: 'flame', wordIds: pick(['Gedächtnis', 'Entwicklung', 'Verständnis', 'Beziehung', 'Möglichkeit']), createdAt: today - 12 * DAY },
  ];

  return { words, collections, reviewLogs, sessions };
}