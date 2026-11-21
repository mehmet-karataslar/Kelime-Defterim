import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PACKS_DIR = path.join(ROOT, 'data', 'packs');
const OUT_DIR = path.join(ROOT, 'data');
const IMPORT_PACKS_DIR = path.join(OUT_DIR, 'import-packs');

const VALID_TYPES = new Set([
  'noun', 'verb', 'adjective', 'adverb', 'preposition', 'pronoun',
  'conjunction', 'numeral', 'interjection', 'phrase', 'other',
]);
const VALID_LEVELS = new Set(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
const VALID_ARTICLES = new Set(['der', 'die', 'das']);

const COLLECTION_DEFS = [
  // 12 Vocational SHK Collections
  { id: 'col-heizung', name: 'Heizungstechnik – Isıtma Sistemleri', description: 'Kazanlar, radyatörler, yerden ısıtma, hidrolik dengeleme ve ısıtma kontrol sistemleri (A1–C1)', color: '#E11D48', icon: 'flame', target: 220, category: 'mesleki' },
  { id: 'col-sanitaer', name: 'Sanitärtechnik – Sıhhi Tesisat', description: 'İçme suyu, atık su, banyo armatürleri, sıhhi tesisat hijyeni ve su arıtma (A1–C1)', color: '#0369A1', icon: 'star', target: 220, category: 'mesleki' },
  { id: 'col-waermepumpe', name: 'Wärmepumpentechnik – Isı Pompaları', description: 'Isı pompaları, soğutma çevrimi, COP/JAZ, enerji verimliliği ve PV entegrasyonu (A1–C1)', color: '#059669', icon: 'zap', target: 250, category: 'mesleki' },
  { id: 'col-werkzeuge', name: 'Werkzeuge und Maschinen – Aletler ve Makineler', description: 'El aletleri, pres makineleri, ölçüm cihazları ve atölye ekipmanları (A1–C1)', color: '#D97706', icon: 'briefcase', target: 180, category: 'mesleki' },
  { id: 'col-rohre', name: 'Rohre, Ventile und Verbindungen – Borular ve Bağlantılar', description: 'Boru türleri, fittingler, vanalar, contalar ve bağlantı teknikleri (A1–C1)', color: '#475569', icon: 'book', target: 170, category: 'mesleki' },
  { id: 'col-montage', name: 'Installation und Montage – Kurulum ve Montaj', description: 'Şantiye kurulumu, sabitleme, yalıtım, basınç testi ve devreye alma (A1–C1)', color: '#4338CA', icon: 'briefcase', target: 180, category: 'mesleki' },
  { id: 'col-wartung', name: 'Wartung und Reparatur – Bakım ve Onarım', description: 'Periyodik bakım, arıza tespiti, yedek parça değişimi ve onarım süreçleri (A1–C1)', color: '#7C3AED', icon: 'zap', target: 160, category: 'mesleki' },
  { id: 'col-sicherheit', name: 'Arbeitssicherheit – İş Güvenliği', description: 'KKD (PSA), tehlikeli maddeler, gaz/elektrik güvenliği ve iş kazası önleme (A1–C1)', color: '#E11D48', icon: 'flame', target: 140, category: 'mesleki' },
  { id: 'col-techkom', name: 'Technische Kommunikation – Teknik İletişim', description: 'Teknik tanımlar, arıza açıklamaları, diğer ustalar ve şantiye ekibiyle koordinasyon (A2–C1)', color: '#0369A1', icon: 'message', target: 160, category: 'mesleki' },
  { id: 'col-kunden', name: 'Kundenkommunikation – Müşteri İletişimi', description: 'Müşteri karşılama, danışmanlık, teslimat bilgilendirmesi ve şikâyet yönetimi (A1–B2)', color: '#059669', icon: 'heart', target: 130, category: 'mesleki' },
  { id: 'col-meister', name: 'Arbeitsalltag mit dem Meister – Ustayla Günlük Çalışma', description: 'Usta-çırak iletişimi, günlük talimatlar, atölye ve şantiye rutini (A1–B2)', color: '#D97706', icon: 'graduation', target: 180, category: 'mesleki' },
  { id: 'col-doku', name: 'Technische Dokumentation – Teknik Dokümantasyon', description: 'Şemalar, DIN/VDE normları, test protokolleri ve günlük iş raporları (B1–C1)', color: '#475569', icon: 'book', target: 160, category: 'mesleki' },

  // 7 General German Support Collections
  { id: 'col-alltag', name: 'Alltag und Kommunikation – Günlük Yaşam', description: 'Almanya’da günlük yaşam, iletişim ve temel ifadeler (A1–B2)', color: '#059669', icon: 'message', target: 0, category: 'genel' },
  { id: 'col-verben', name: 'Häufige Verben – Sık Kullanılan Fiiller', description: 'Günlük ve mesleki Almancada en sık kullanılan fiiller ve çekimleri (A1–C1)', color: '#7C3AED', icon: 'zap', target: 0, category: 'genel' },
  { id: 'col-adj-adv', name: 'Adjektive und Adverbien – Sıfatlar ve Zarflar', description: 'Niteleyici sıfatlar, derecelendirmeler ve zarflar (A1–C1)', color: '#C026D3', icon: 'star', target: 0, category: 'genel' },
  { id: 'col-grammatik', name: 'Grammatik und Präpositionen – Dil Bilgisi ve Edatlar', description: 'Edatlar (Kasus yönetimi), bağlaçlar ve temel dil bilgisi yapıları (A1–C1)', color: '#4338CA', icon: 'graduation', target: 0, category: 'genel' },
  { id: 'col-beruf', name: 'Berufliche Gespräche – Mesleki Görüşmeler', description: 'İş görüşmeleri, toplantılar, telefon ve mesleki diyalog ifadeleri (A2–C1)', color: '#0369A1', icon: 'briefcase', target: 0, category: 'genel' },
  { id: 'col-b2', name: 'B2 Prüfungsvorbereitung – B2 Sınav Hazırlığı', description: 'B2 seviyesi hedef kelimeler ve mesleki sınav hazırlık dağarcığı (B2)', color: '#4338CA', icon: 'graduation', target: 0, category: 'genel' },
  { id: 'col-c1', name: 'Technisches Deutsch C1 – Teknik Almanca C1', description: 'İleri düzey teknik terimler, normlar ve mühendislik kavramları (C1)', color: '#475569', icon: 'book', target: 0, category: 'genel' },
];

const VALID_COL_IDS = new Set(COLLECTION_DEFS.map((c) => c.id));

const nfc = (s) => (typeof s === 'string' ? s.normalize('NFC').trim() : '');

function makeSlug(german, type) {
  const base = german
    .normalize('NFC')
    .toLocaleLowerCase('de-DE')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `shk-${base}-${type}`;
}

function freshSrs() {
  return { ease: 2.5, interval: 0, reps: 0, lapses: 0, due: null, lastReview: null, state: 'new' };
}

function dedupeStrings(arr) {
  const seen = new Set();
  const out = [];
  for (const item of arr || []) {
    const v = nfc(item);
    if (!v) continue;
    const key = v.toLocaleLowerCase('de-DE');
    if (!seen.has(key)) {
      seen.add(key);
      out.push(v);
    }
  }
  return out;
}

function run() {
  if (!fs.existsSync(PACKS_DIR)) {
    console.error('Packs directory not found:', PACKS_DIR);
    process.exit(1);
  }

  const packFiles = fs.readdirSync(PACKS_DIR)
    .filter((f) => f.startsWith('pack-') && f.endsWith('.json'))
    .sort();

  const rawEntries = [];
  const packStats = {};

  for (const file of packFiles) {
    const fullPath = path.join(PACKS_DIR, file);
    const arr = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    if (!Array.isArray(arr)) throw new Error(`${file} is not a JSON array`);
    packStats[file] = arr.length;
    for (const item of arr) {
      rawEntries.push({ ...item, _sourcePack: file });
    }
  }

  const mergedMap = new Map();
  const crossPackMerges = [];
  const warnings = [];
  const errors = [];

  for (const raw of rawEntries) {
    let german = nfc(raw.german);
    let article = raw.article ?? null;
    const type = nfc(raw.type);
    const level = nfc(raw.level);

    // Strip accidental leading article from noun
    if (type === 'noun') {
      const m = german.match(/^(der|die|das)\s+(.+)$/i);
      if (m) {
        if (!article) article = m[1].toLowerCase();
        german = m[2].trim();
        warnings.push(`Stripped leading article from "${raw.german}" -> "${german}" (${raw._sourcePack})`);
      }
    } else {
      article = null;
    }

    if (!german) {
      errors.push(`Empty german field in ${raw._sourcePack}`);
      continue;
    }
    if (!VALID_TYPES.has(type)) {
      errors.push(`Invalid type "${type}" for "${german}" in ${raw._sourcePack}`);
      continue;
    }
    if (!VALID_LEVELS.has(level)) {
      errors.push(`Invalid level "${level}" for "${german}" in ${raw._sourcePack}`);
      continue;
    }

    const dedupeKey = `${german.toLocaleLowerCase('de-DE')}||${type}`;
    const cols = new Set((raw.collections || []).filter((c) => VALID_COL_IDS.has(c)));

    // Auto-enrich general support collections accurately
    if (level === 'B2') cols.add('col-b2');
    if (level === 'C1') cols.add('col-c1');
    if (type === 'verb') cols.add('col-verben');
    if (type === 'adjective' || type === 'adverb') cols.add('col-adj-adv');
    if (type === 'preposition' || type === 'conjunction' || type === 'pronoun') cols.add('col-grammatik');

    if (mergedMap.has(dedupeKey)) {
      const existing = mergedMap.get(dedupeKey);
      crossPackMerges.push({ german, type, keptFrom: existing._sourcePack, mergedFrom: raw._sourcePack });
      for (const c of cols) existing._collections.add(c);
      existing.tags = dedupeStrings([...existing.tags, ...(raw.tags || [])]);
      existing.synonyms = dedupeStrings([...existing.synonyms, ...(raw.synonyms || [])]);
      existing.antonyms = dedupeStrings([...existing.antonyms, ...(raw.antonyms || [])]);
      existing.related = dedupeStrings([...existing.related, ...(raw.related || [])]);
      // Merge unique senses
      const existingTrs = new Set(existing.senses.map((s) => s.tr.toLocaleLowerCase('tr-TR')));
      for (const s of raw.senses || []) {
        const tr = nfc(s.tr);
        if (tr && !existingTrs.has(tr.toLocaleLowerCase('tr-TR'))) {
          existingTrs.add(tr.toLocaleLowerCase('tr-TR'));
          existing.senses.push({ tr, en: nfc(s.en) || undefined, context: nfc(s.context) || undefined });
        }
      }
      // Merge unique examples
      const existingDes = new Set(existing.examples.map((e) => e.de.toLocaleLowerCase('de-DE')));
      for (const e of raw.examples || []) {
        const de = nfc(e.de);
        const tr = nfc(e.tr);
        if (de && tr && !existingDes.has(de.toLocaleLowerCase('de-DE'))) {
          existingDes.add(de.toLocaleLowerCase('de-DE'));
          existing.examples.push({ de, tr });
        }
      }
      continue;
    }

    const senses = (raw.senses || [])
      .map((s) => ({
        tr: nfc(s.tr),
        ...(nfc(s.en) ? { en: nfc(s.en) } : {}),
        ...(nfc(s.context) ? { context: nfc(s.context) } : {}),
      }))
      .filter((s) => s.tr.length > 0);

    const examples = (raw.examples || [])
      .map((e) => ({ de: nfc(e.de), tr: nfc(e.tr) }))
      .filter((e) => e.de.length > 0 && e.tr.length > 0);

    const entry = {
      german,
      article,
      type,
      level,
      senses,
      examples,
      ...(type === 'noun' && raw.noun ? { noun: raw.noun } : {}),
      ...(type === 'verb' && raw.verb ? { verb: raw.verb } : {}),
      ...(type === 'adjective' && raw.adjective ? { adjective: raw.adjective } : {}),
      ...(type === 'preposition' && raw.preposition ? { preposition: raw.preposition } : {}),
      synonyms: dedupeStrings(raw.synonyms),
      antonyms: dedupeStrings(raw.antonyms),
      related: dedupeStrings(raw.related),
      tags: dedupeStrings(raw.tags),
      ...(nfc(raw.notes) ? { notes: nfc(raw.notes) } : {}),
      _collections: cols,
      _sourcePack: raw._sourcePack,
    };

    mergedMap.set(dedupeKey, entry);
  }

  // Build final Word[] and Collection[] strictly matching src/core/types.ts
  const now = 1763760000000; // Deterministic base timestamp (2025-11-21T21:20:00Z)
  const usedIds = new Set();
  const words = [];
  const colWordMap = new Map(COLLECTION_DEFS.map((c) => [c.id, []]));

  const levelCounts = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
  const typeCounts = {};
  let totalExamples = 0;
  let totalRelations = 0;
  const globalExampleDe = new Map();
  const duplicateExamples = [];

  let idx = 0;
  for (const item of mergedMap.values()) {
    idx += 1;
    let id = makeSlug(item.german, item.type);
    if (usedIds.has(id)) {
      let n = 2;
      while (usedIds.has(`${id}-${n}`)) n += 1;
      id = `${id}-${n}`;
    }
    usedIds.add(id);

    // Validation checks per word
    if (item.senses.length === 0) errors.push(`Missing Turkish sense: ${item.german} (${item._sourcePack})`);
    if (item.examples.length < 2) errors.push(`Fewer than 2 examples (${item.examples.length}): ${item.german} (${item._sourcePack})`);
    if (item.type === 'noun') {
      if (!VALID_ARTICLES.has(item.article)) errors.push(`Missing/invalid article for noun: ${item.german}`);
      if (!/^[A-ZÄÖÜ0-9]/.test(item.german)) warnings.push(`Noun not capitalized: ${item.german}`);
    }
    if (item.type === 'verb') {
      if (!item.verb || !item.verb.praesens3 || !item.verb.praeteritum || !item.verb.partizip2 || !item.verb.auxiliary) {
        errors.push(`Incomplete verb conjugation: ${item.german} (${item._sourcePack})`);
      }
    }
    if (item._collections.size === 0) {
      errors.push(`No collection assigned: ${item.german}`);
    }

    for (const ex of item.examples) {
      const k = ex.de.toLocaleLowerCase('de-DE');
      if (globalExampleDe.has(k)) {
        duplicateExamples.push({ de: ex.de, word1: globalExampleDe.get(k), word2: item.german });
      } else {
        globalExampleDe.set(k, item.german);
      }
    }

    const word = {
      id,
      german: item.german,
      article: item.article,
      type: item.type,
      level: item.level,
      senses: item.senses.map((s, i) => ({ id: `${id}-s${i + 1}`, ...s })),
      examples: item.examples.map((e, i) => ({ id: `${id}-e${i + 1}`, ...e })),
      ...(item.noun ? { noun: item.noun } : {}),
      ...(item.verb ? { verb: item.verb } : {}),
      ...(item.adjective ? { adjective: item.adjective } : {}),
      ...(item.preposition ? { preposition: item.preposition } : {}),
      synonyms: item.synonyms,
      antonyms: item.antonyms,
      related: item.related,
      tags: item.tags,
      ...(item.notes ? { notes: item.notes } : {}),
      favorite: false,
      createdAt: now - idx * 1000,
      srs: freshSrs(),
      stats: { reviews: 0, correct: 0, wrong: 0 },
    };

    words.push(word);
    levelCounts[word.level] = (levelCounts[word.level] || 0) + 1;
    typeCounts[word.type] = (typeCounts[word.type] || 0) + 1;
    totalExamples += word.examples.length;
    totalRelations += word.synonyms.length + word.antonyms.length + word.related.length;

    for (const cid of item._collections) {
      colWordMap.get(cid).push(word.id);
    }
  }

  const collections = COLLECTION_DEFS.map((c, i) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    color: c.color,
    icon: c.icon,
    wordIds: colWordMap.get(c.id),
    createdAt: now - (i + 1) * 60_000,
  }));

  // Verify foreign keys
  const wordIdSet = new Set(words.map((w) => w.id));
  let invalidForeignKeys = 0;
  for (const col of collections) {
    for (const wid of col.wordIds) {
      if (!wordIdSet.has(wid)) invalidForeignKeys += 1;
    }
  }

  // Check targets
  const targetChecks = {
    totalUniqueWords: { actual: words.length, target: 2000, pass: words.length >= 2000 },
    A1: { actual: levelCounts.A1, target: 150, pass: levelCounts.A1 >= 150 },
    A2: { actual: levelCounts.A2, target: 250, pass: levelCounts.A2 >= 250 },
    B1: { actual: levelCounts.B1, target: 450, pass: levelCounts.B1 >= 450 },
    B2: { actual: levelCounts.B2, target: 900, pass: levelCounts.B2 >= 900 },
    C1: { actual: levelCounts.C1, target: 250, pass: levelCounts.C1 >= 250 },
  };

  const collectionChecks = COLLECTION_DEFS.map((c) => {
    const actual = colWordMap.get(c.id).length;
    return { id: c.id, name: c.name, category: c.category, actual, target: c.target, pass: actual >= c.target };
  });

  // Write full BackupFile v1 (compatible with src/core/store.ts importBackup)
  const fullBackup = {
    app: 'kelime-defterim',
    version: 1,
    exportedAt: Date.now(),
    words,
    collections,
    reviewLogs: [],
    sessions: [],
  };

  fs.mkdirSync(IMPORT_PACKS_DIR, { recursive: true });
  const fullBackupPath = path.join(OUT_DIR, 'kelime-defterim-shk-2000-backup.json');
  const fullBackupJson = JSON.stringify(fullBackup);
  fs.writeFileSync(fullBackupPath, fullBackupJson, 'utf8');

  // Write standalone collections.json
  fs.writeFileSync(path.join(OUT_DIR, 'collections.json'), JSON.stringify(collections, null, 2), 'utf8');

  // Write 4 chunked BackupFile v1 import packs (~500 words each)
  const chunkSize = Math.ceil(words.length / 4);
  const chunkFiles = [];
  for (let p = 0; p < 4; p++) {
    const slice = words.slice(p * chunkSize, (p + 1) * chunkSize);
    const sliceIds = new Set(slice.map((w) => w.id));
    const sliceCols = collections
      .map((c) => ({ ...c, wordIds: c.wordIds.filter((wid) => sliceIds.has(wid)) }))
      .filter((c) => c.wordIds.length > 0);
    const chunkBackup = {
      app: 'kelime-defterim',
      version: 1,
      exportedAt: Date.now(),
      words: slice,
      collections: sliceCols,
      reviewLogs: [],
      sessions: [],
    };
    const fname = `kelime-defterim-part-0${p + 1}.json`;
    const fpath = path.join(IMPORT_PACKS_DIR, fname);
    const jsonStr = JSON.stringify(chunkBackup);
    fs.writeFileSync(fpath, jsonStr, 'utf8');
    chunkFiles.push({ file: fname, words: slice.length, collections: sliceCols.length, bytes: Buffer.byteLength(jsonStr, 'utf8') });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    packStats,
    totalRawEntries: rawEntries.length,
    crossPackMergesCount: crossPackMerges.length,
    crossPackMerges,
    summary: {
      totalUniqueWords: words.length,
      levelCounts,
      typeCounts,
      totalCollections: collections.length,
      totalExamples,
      totalRelations,
      invalidForeignKeys,
      errorsCount: errors.length,
      warningsCount: warnings.length,
      duplicateExamplesCount: duplicateExamples.length,
      fullBackupBytes: Buffer.byteLength(fullBackupJson, 'utf8'),
      fullBackupMB: +(Buffer.byteLength(fullBackupJson, 'utf8') / (1024 * 1024)).toFixed(2),
    },
    targetChecks,
    collectionChecks,
    chunkFiles,
    errors: errors.slice(0, 100),
    warnings: warnings.slice(0, 100),
    duplicateExamples: duplicateExamples.slice(0, 50),
  };

  fs.writeFileSync(path.join(OUT_DIR, 'validation-report.json'), JSON.stringify(report, null, 2), 'utf8');

  console.log('=== VALIDATION SUMMARY ===');
  console.log('Total Unique Words:', words.length);
  console.log('CEFR:', levelCounts);
  console.log('Types:', typeCounts);
  console.log('Examples:', totalExamples, '| Relations:', totalRelations);
  console.log('Cross-pack merges:', crossPackMerges.length);
  console.log('Errors:', errors.length, '| Warnings:', warnings.length, '| Duplicate examples:', duplicateExamples.length);
  console.log('Full Backup Size:', report.summary.fullBackupMB, 'MB');
  const failedCols = collectionChecks.filter((c) => !c.pass);
  if (failedCols.length > 0) {
    console.log('Collections below target:', failedCols.map((c) => `${c.id}: ${c.actual}/${c.target}`));
  } else {
    console.log('All 19 collections PASSED targets!');
  }
}

run();
