import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SHK_PATH = path.join(ROOT, 'public', 'datasets', 'shk-2000-v1.json');
const PART1_PATH = path.join(ROOT, 'data', 'packs', 'b12-verbs-part1.json');
const PART2_PATH = path.join(ROOT, 'data', 'packs', 'b12-verbs-part2.json');
const PART3_PATH = path.join(ROOT, 'data', 'packs', 'b12-verbs-part3.json');
const OUT_PUBLIC = path.join(ROOT, 'public', 'datasets', 'b12-verbs-500-v1.json');
const OUT_DATA = path.join(ROOT, 'data', 'b12-verbs-500-backup.json');
const OUT_REPORT = path.join(ROOT, 'data', 'b12-verbs-validation-report.json');

const nfc = (s) => (typeof s === 'string' ? s.normalize('NFC').trim() : '');

function makeSlug(german) {
  const base = german
    .normalize('NFC')
    .toLocaleLowerCase('de-DE')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `b12v-${base}`;
}

function dedupeStrings(arr) {
  const seen = new Set();
  const out = [];
  for (const item of arr || []) {
    const v = nfc(item);
    if (!v) continue;
    const k = v.toLocaleLowerCase('de-DE');
    if (!seen.has(k)) {
      seen.add(k);
      out.push(v);
    }
  }
  return out;
}

const B12_COLLECTIONS = [
  { id: 'col-b12-verben', name: 'B1.2 Fiiller – 500 Temel Fiil', description: 'Günlük yaşam, iş, sağlık, eğitim, resmî işlemler, iletişim ve sosyal yaşam B1.2 fiilleri', color: '#7C3AED', icon: 'zap' },
  { id: 'col-b12-alltag', name: 'B1.2 Fiiller – Günlük Yaşam', description: 'Ev, alışveriş, ulaşım, banka ve günlük rutin B1.2 fiilleri', color: '#059669', icon: 'message' },
  { id: 'col-b12-beruf', name: 'B1.2 Fiiller – İş Hayatı', description: 'Başvuru, sözleşme, iş yeri ve kariyer B1.2 fiilleri', color: '#4338CA', icon: 'briefcase' },
  { id: 'col-b12-gesundheit', name: 'B1.2 Fiiller – Sağlık & Doktor', description: 'Muayene, belirtiler, tedavi ve ilaç B1.2 fiilleri', color: '#E11D48', icon: 'heart' },
  { id: 'col-b12-bildung', name: 'B1.2 Fiiller – Eğitim & Sınav', description: 'Okul, meslek okulu, araştırma ve sınav B1.2 fiilleri', color: '#D97706', icon: 'graduation' },
  { id: 'col-b12-behoerden', name: 'B1.2 Fiiller – Resmî İşlemler', description: 'Bürgeramt, Ausländerbehörde, Jobcenter, Finanzamt B1.2 fiilleri', color: '#0369A1', icon: 'book' },
  { id: 'col-b12-kommunikation', name: 'B1.2 Fiiller – İletişim', description: 'Tartışma, ikna, görüş bildirme ve yazışma B1.2 fiilleri', color: '#C026D3', icon: 'message' },
  { id: 'col-b12-soziales', name: 'B1.2 Fiiller – Sosyal Yaşam', description: 'İlişkiler, toplum, dayanışma ve kültür B1.2 fiilleri', color: '#475569', icon: 'star' },
];

const CONTEXT_TO_COL = {
  'günlük yaşam': 'col-b12-alltag',
  'iş hayatı': 'col-b12-beruf',
  'sağlık': 'col-b12-gesundheit',
  'eğitim': 'col-b12-bildung',
  'resmî işlemler': 'col-b12-behoerden',
  'iletişim': 'col-b12-kommunikation',
  'sosyal yaşam': 'col-b12-soziales',
};

function run() {
  const shk = JSON.parse(fs.readFileSync(SHK_PATH, 'utf8'));
  const existingKeys = new Set(shk.words.map((w) => w.german.normalize('NFC').toLocaleLowerCase('de-DE')));

  const raw = [
    ...JSON.parse(fs.readFileSync(PART1_PATH, 'utf8')),
    ...JSON.parse(fs.readFileSync(PART2_PATH, 'utf8')),
    ...(fs.existsSync(PART3_PATH) ? JSON.parse(fs.readFileSync(PART3_PATH, 'utf8')) : []),
  ];

  const seen = new Set();
  const words = [];
  const errors = [];
  const skippedOverlap = [];
  const skippedInternalDup = [];
  const colMap = new Map(B12_COLLECTIONS.map((c) => [c.id, []]));
  const verbenIds = [];
  const categoryCounts = {};
  const now = 1763800000000;

  let idx = 0;
  for (const item of raw) {
    const german = nfc(item.german);
    if (!german) { errors.push('Empty german'); continue; }
    const key = german.toLocaleLowerCase('de-DE');
    if (existingKeys.has(key)) { skippedOverlap.push(german); continue; }
    if (seen.has(key)) { skippedInternalDup.push(german); continue; }
    seen.add(key);

    const v = item.verb || {};
    if (!v.praesens3 || !v.praeteritum || !v.partizip2 || !v.auxiliary) {
      errors.push(`Incomplete conjugation: ${german}`);
      continue;
    }
    const senses = (item.senses || [])
      .map((s) => ({
        tr: nfc(s.tr),
        ...(nfc(s.en) ? { en: nfc(s.en) } : {}),
        ...(nfc(s.context) ? { context: nfc(s.context) } : {}),
      }))
      .filter((s) => s.tr.length > 0);
    if (senses.length === 0) { errors.push(`Missing TR sense: ${german}`); continue; }

    const examples = (item.examples || [])
      .map((e) => ({ de: nfc(e.de), tr: nfc(e.tr) }))
      .filter((e) => e.de.length > 0 && e.tr.length > 0);
    if (examples.length < 1) { errors.push(`Missing example: ${german}`); continue; }

    idx += 1;
    const id = makeSlug(german);
    const word = {
      id,
      german,
      article: null,
      type: 'verb',
      level: 'B1.2',
      senses: senses.map((s, i) => ({ id: `${id}-s${i + 1}`, ...s })),
      examples: examples.map((e, i) => ({ id: `${id}-e${i + 1}`, ...e })),
      verb: {
        praesens3: nfc(v.praesens3),
        praeteritum: nfc(v.praeteritum),
        partizip2: nfc(v.partizip2),
        auxiliary: v.auxiliary === 'sein' ? 'sein' : 'haben',
        ...(v.irregular ? { irregular: true } : {}),
        ...(v.separable ? { separable: true } : {}),
        ...(v.reflexive ? { reflexive: true } : {}),
        ...(nfc(v.preposition) ? { preposition: nfc(v.preposition) } : {}),
        ...(nfc(v.prepCase) ? { prepCase: nfc(v.prepCase) } : {}),
      },
      synonyms: dedupeStrings(item.synonyms),
      antonyms: dedupeStrings(item.antonyms),
      related: dedupeStrings(item.related),
      tags: dedupeStrings(['b1.2', 'fiil', ...(item.tags || [])]),
      ...(nfc(item.notes) ? { notes: nfc(item.notes) } : {}),
      favorite: false,
      createdAt: now - idx * 1000,
      srs: { ease: 2.5, interval: 0, reps: 0, lapses: 0, due: null, lastReview: null, state: 'new' },
      stats: { reviews: 0, correct: 0, wrong: 0 },
    };

    words.push(word);
    colMap.get('col-b12-verben').push(id);
    verbenIds.push(id);

    const ctx = (senses[0].context || '').toLocaleLowerCase('tr-TR');
    categoryCounts[senses[0].context || 'Diğer'] = (categoryCounts[senses[0].context || 'Diğer'] || 0) + 1;
    const catCol = CONTEXT_TO_COL[ctx];
    if (catCol) colMap.get(catCol).push(id);
  }

  const collections = [
    ...B12_COLLECTIONS.map((c, i) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      color: c.color,
      icon: c.icon,
      wordIds: colMap.get(c.id),
      createdAt: now - (i + 1) * 60_000,
    })),
    {
      id: 'col-verben',
      name: 'Häufige Verben – Sık Kullanılan Fiiller',
      description: 'Günlük ve mesleki Almancada en sık kullanılan fiiller ve çekimleri (A1–C1)',
      color: '#7C3AED',
      icon: 'zap',
      wordIds: verbenIds,
      createdAt: now - 999_000,
    },
  ];

  const backup = {
    app: 'kelime-defterim',
    version: 1,
    exportedAt: Date.now(),
    words,
    collections,
    reviewLogs: [],
    sessions: [],
  };

  const jsonStr = JSON.stringify(backup);
  fs.writeFileSync(OUT_PUBLIC, jsonStr, 'utf8');
  fs.writeFileSync(OUT_DATA, jsonStr, 'utf8');

  const report = {
    generatedAt: new Date().toISOString(),
    rawCount: raw.length,
    uniqueB12Verbs: words.length,
    targetMet: words.length >= 500,
    categoryCounts,
    skippedOverlapCount: skippedOverlap.length,
    skippedInternalDupCount: skippedInternalDup.length,
    errorsCount: errors.length,
    errors,
    packBytes: Buffer.byteLength(jsonStr, 'utf8'),
    packKB: Math.round(Buffer.byteLength(jsonStr, 'utf8') / 1024),
  };
  fs.writeFileSync(OUT_REPORT, JSON.stringify(report, null, 2), 'utf8');

  console.log('=== B1.2 VERBS PACK SUMMARY ===');
  console.log('Unique B1.2 Verbs:', words.length, words.length >= 500 ? 'PASS' : 'BELOW 500');
  console.log('Categories:', categoryCounts);
  console.log('Skipped overlap:', skippedOverlap.length, '| Internal dup:', skippedInternalDup.length);
  console.log('Errors:', errors.length, '| Size:', report.packKB, 'KB');
}

run();
