import { Level, Word } from './types';

export type ErrorCategory =
  | 'capitalization'
  | 'word_order'
  | 'article_case'
  | 'perfekt_aux'
  | 'spelling_register'
  | 'punctuation';

export interface TextIssue {
  id: string;
  category: ErrorCategory;
  categoryLabel: string;
  excerpt: string;
  suggestion: string;
  explanationTr: string;
}

export interface GrammarQuestion {
  id: string;
  category: ErrorCategory;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanationTr: string;
}

export interface AnalysisResult {
  wordCount: number;
  sentenceCount: number;
  estimatedLevel: Level;
  levelNoteTr: string;
  score: number; // 0..100
  issues: TextIssue[];
  quiz: GrammarQuestion[];
}

const SEIN_PARTICIPLES = [
  'gegangen', 'gefahren', 'gekommen', 'geblieben', 'geworden', 'passiert',
  'gestorben', 'geflogen', 'aufgestanden', 'eingeschlafen', 'umgezogen',
  'angekommen', 'abgefahren', 'eingestiegen', 'ausgestiegen', 'gewachsen',
];

const DATIV_PREPS = ['mit', 'nach', 'aus', 'zu', 'von', 'bei', 'seit', 'gegenüber'];
const AKK_PREPS = ['für', 'ohne', 'durch', 'gegen', 'um', 'bis'];
const SUBORDINATORS = ['weil', 'dass', 'obwohl', 'wenn', 'ob', 'damit', 'bevor', 'nachdem', 'während', 'sobald'];

const COMMON_CONJ_VERBS = new Set([
  'bin', 'bist', 'ist', 'sind', 'seid', 'war', 'waren',
  'habe', 'hast', 'hat', 'haben', 'habt', 'hatte', 'hatten',
  'kann', 'kannst', 'können', 'muss', 'musst', 'müssen', 'will', 'wollen', 'möchte', 'möchten', 'soll', 'sollen', 'darf', 'dürfen',
  'werde', 'wirst', 'wird', 'werden', 'würde', 'würden', 'könnte', 'könnten', 'hätte', 'wäre',
  'gehe', 'geht', 'gehen', 'komme', 'kommt', 'kommen', 'mache', 'macht', 'machen',
  'brauche', 'braucht', 'brauchen', 'suche', 'sucht', 'suchen', 'arbeite', 'arbeitet', 'arbeiten',
  'wohne', 'wohnt', 'wohnen', 'lerne', 'lernt', 'lernen', 'spreche', 'spricht', 'sprechen',
  'nehme', 'nimmt', 'nehmen', 'gebe', 'gibt', 'geben', 'sehe', 'sieht', 'sehen', 'finde', 'findet', 'finden',
  'schreibe', 'schreibt', 'schreiben', 'lese', 'liest', 'lesen', 'bleibe', 'bleibt', 'bleiben',
]);

const QUIZ_BANK: Record<ErrorCategory, GrammarQuestion[]> = {
  capitalization: [
    {
      id: 'q-cap-1',
      category: 'capitalization',
      prompt: 'Hangi cümlede büyük/küçük harf (Groß-/Kleinschreibung) tamamen doğrudur?',
      options: [
        'Ich brauche einen termin beim Bürgeramt.',
        'Ich brauche einen Termin beim Bürgeramt.',
        'Ich Brauche einen Termin beim bürgeramt.',
        'ich brauche einen Termin beim Bürgeramt.',
      ],
      correctIndex: 1,
      explanationTr: 'Almancada tüm isimler (Termin, Bürgeramt) ve cümle başı büyük harfle, fiiller (brauche) ise küçük harfle yazılır.',
    },
    {
      id: 'q-cap-2',
      category: 'capitalization',
      prompt: 'Resmî bir e-postada hitap zamiri nasıl yazılmalıdır?',
      options: [
        'Können sie mir bitte helfen?',
        'Können Sie mir bitte helfen?',
        'Können Sie Mir bitte helfen?',
        'können Sie mir bitte Helfen?',
      ],
      correctIndex: 1,
      explanationTr: 'Resmî hitap olan "Sie / Ihnen / Ihr" cümle içinde her zaman büyük harfle yazılır.',
    },
  ],
  word_order: [
    {
      id: 'q-wo-1',
      category: 'word_order',
      prompt: 'Yan cümle (Nebensatz) dizilimi hangisinde doğrudur?',
      options: [
        'Ich bleibe zu Hause, weil ich habe starke Kopfschmerzen.',
        'Ich bleibe zu Hause, weil ich starke Kopfschmerzen habe.',
        'Ich bleibe zu Hause, weil habe ich starke Kopfschmerzen.',
        'Ich bleibe zu Hause, weil starke Kopfschmerzen ich habe.',
      ],
      correctIndex: 1,
      explanationTr: '"weil, dass, obwohl, wenn" gibi yan cümle bağlaçlarında çekimli fiil her zaman cümlenin en sonuna gider.',
    },
    {
      id: 'q-wo-2',
      category: 'word_order',
      prompt: 'Zaman/neden zarfı başta olduğunda doğru fiil sırası (V2) hangisidir?',
      options: [
        'Deshalb ich möchte den Termin verschieben.',
        'Deshalb möchte ich den Termin verschieben.',
        'Deshalb den Termin ich verschieben möchte.',
        'Deshalb verschieben möchte ich den Termin.',
      ],
      correctIndex: 1,
      explanationTr: 'Ana cümlede çekimli fiil her zaman 2. pozisyonda (Position 2) yer alır: Deshalb (1) möchte (2) ich (3)...',
    },
  ],
  article_case: [
    {
      id: 'q-ac-1',
      category: 'article_case',
      prompt: 'Boşluğa doğru artikel/hâl hangisidir? "Ich fahre mit ___ Bus zum Arzt."',
      options: ['den', 'dem', 'der', 'das'],
      correctIndex: 1,
      explanationTr: '"mit" edatı her zaman Dativ ister. "der Bus" → Dativ tekilde "dem Bus" olur.',
    },
    {
      id: 'q-ac-2',
      category: 'article_case',
      prompt: 'Boşluğa doğru artikel/hâl hangisidir? "Vielen Dank für ___ schnelle Antwort."',
      options: ['der', 'dem', 'die', 'den'],
      correctIndex: 2,
      explanationTr: '"für" edatı her zaman Akkusativ ister. "die Antwort" (feminin) Akkusativ hâlde "die" olarak kalır.',
    },
  ],
  perfekt_aux: [
    {
      id: 'q-pa-1',
      category: 'perfekt_aux',
      prompt: 'Perfekt yardımcı fiili (haben / sein) hangi cümlede doğrudur?',
      options: [
        'Gestern habe ich zum Arzt gegangen.',
        'Gestern bin ich zum Arzt gegangen.',
        'Gestern habe ich im Bett geblieben.',
        'Gestern bin ich das Formular ausgefüllt.',
      ],
      correctIndex: 1,
      explanationTr: 'Yer değiştirme (gehen, fahren, kommen) ve durum değişikliği/kalma (bleiben, werden) fiilleri Perfekt’te "sein" ile çekilir.',
    },
  ],
  spelling_register: [
    {
      id: 'q-sr-1',
      category: 'spelling_register',
      prompt: 'Hangi cümlede "seit" ve "seid" doğru kullanılmıştır?',
      options: [
        'Ich habe seid drei Tagen Fieber.',
        'Ich habe seit drei Tagen Fieber.',
        'Wann seit ihr beim Bürgeramt?',
        'Seid letzter Woche arbeite ich dort.',
      ],
      correctIndex: 1,
      explanationTr: 'Zaman edatı olan "-den beri" her zaman "seit" (t ile) yazılır; "seid" yalnızca "ihr seid" (siz ...siniz) fiil çekimidir.',
    },
    {
      id: 'q-sr-2',
      category: 'spelling_register',
      prompt: 'Resmî bir e-postada en uygun kapanış ifadesi hangisidir?',
      options: [
        'Tschüss und bis bald,',
        'Liebe Grüße,',
        'Mit freundlichen Grüßen',
        'Mach’s gut,',
      ],
      correctIndex: 2,
      explanationTr: 'Resmî yazışmalarda (Bürgeramt, Ausländerbehörde vb.) "Mit freundlichen Grüßen" (sonunda virgül olmadan) kullanılır.',
    },
  ],
  punctuation: [
    {
      id: 'q-pu-1',
      category: 'punctuation',
      prompt: 'Hangi cümlede virgül kullanımı doğrudur?',
      options: [
        'Ich schreibe Ihnen weil ich eine Frage habe.',
        'Ich schreibe Ihnen, weil ich eine Frage habe.',
        'Ich schreibe, Ihnen weil ich eine Frage habe.',
        'Ich schreibe Ihnen weil, ich eine Frage habe.',
      ],
      correctIndex: 1,
      explanationTr: 'Almancada yan cümle bağlacından ("weil", "dass", "obwohl", "wenn") önce mutlaka virgül konur.',
    },
  ],
};

export function analyzeGermanText(
  text: string,
  dictionary: Word[],
  opts?: { formal?: boolean; targetLevel?: Level },
): AnalysisResult {
  const clean = text.normalize('NFC').trim();
  const issues: TextIssue[] = [];
  let issueIdx = 0;
  const pushIssue = (
    category: ErrorCategory,
    categoryLabel: string,
    excerpt: string,
    suggestion: string,
    explanationTr: string,
  ) => {
    if (issues.some((i) => i.excerpt === excerpt && i.category === category)) return;
    issueIdx += 1;
    issues.push({ id: `iss-${issueIdx}`, category, categoryLabel, excerpt, suggestion, explanationTr });
  };

  // Build quick noun lookup from app's 2,000+ word dictionary
  const nounMap = new Map<string, Word>();
  const wordLevelMap = new Map<string, Level>();
  for (const w of dictionary) {
    const low = w.german.normalize('NFC').toLocaleLowerCase('de-DE');
    if (w.type === 'noun' && w.german.length >= 3 && !w.german.includes(' ')) {
      nounMap.set(low, w);
    }
    if (w.level) wordLevelMap.set(low, w.level);
  }

  const wordsRaw = clean.split(/\s+/).filter(Boolean);
  const sentences = clean.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);

  // 1. Sentence start capitalization & ending punctuation
  for (const s of sentences) {
    if (/^[a-zäöü]/.test(s)) {
      const firstWord = s.split(/\s+/)[0];
      pushIssue(
        'capitalization',
        'Büyük/Küçük Harf',
        firstWord,
        firstWord[0].toLocaleUpperCase('de-DE') + firstWord.slice(1),
        'Almancada her cümle büyük harfle başlamalıdır.',
      );
    }
    if (s.length > 15 && !/[.!?]$/.test(s) && !/^(Sehr geehrte|Guten Tag|Hallo|Liebe|Mit freundlichen)/i.test(s)) {
      pushIssue(
        'punctuation',
        'Noktalama',
        s.slice(-24),
        `${s.slice(-24)}.`,
        'Tamamlanmış cümlelerin sonuna nokta (.), soru işareti (?) veya ünlem (!) eklemelisin.',
      );
    }
  }

  // 2. Lowercase German nouns (checked against dictionary)
  const tokenMatches = clean.matchAll(/\b([a-zäöüß]{3,})\b/g);
  for (const m of tokenMatches) {
    const tok = m[1];
    if (COMMON_CONJ_VERBS.has(tok)) continue;
    const noun = nounMap.get(tok);
    if (noun && noun.german !== tok && /^[A-ZÄÖÜ]/.test(noun.german)) {
      pushIssue(
        'capitalization',
        'İsim Büyük Harf',
        tok,
        noun.german,
        `"${noun.german}" (${noun.article ?? ''} ${noun.german}) bir isimdir; Almancada tüm isimler büyük harfle başlar.`,
      );
    }
  }

  // 3. Perfekt auxiliary errors (haben + sein-verbs)
  for (const part of SEIN_PARTICIPLES) {
    const re = new RegExp(`\\b(habe|hast|hat|haben|habt)\\b([^.!?]{0,45})\\b${part}\\b`, 'gi');
    const match = re.exec(clean);
    if (match) {
      const auxMap: Record<string, string> = { habe: 'bin', hast: 'bist', hat: 'ist', haben: 'sind', habt: 'seid' };
      const wrongAux = match[1].toLowerCase();
      pushIssue(
        'perfekt_aux',
        'Perfekt Yardımcı Fiil',
        match[0],
        `${auxMap[wrongAux] ?? 'ist'}${match[2]}${part}`,
        `"${part}" fiili yer/durum değişikliği bildirdiği için Perfekt zamanında "haben" yerine "sein" (${auxMap[wrongAux] ?? 'ist'}) yardımcı fiiliyle kullanılır.`,
      );
    }
  }

  // 4. Subordinate clause word order (weil/dass/obwohl + subject + verb right away)
  for (const conj of SUBORDINATORS) {
    const re = new RegExp(`\\b${conj}\\s+(ich|du|er|sie|es|wir|ihr|Sie|man)\\s+(bin|bist|ist|sind|habe|hast|hat|haben|kann|muss|will|möchte|gehe|komme|brauche|arbeite|wohne)\\s+([a-zA-ZäöüÄÖÜß]+)`, 'gi');
    const m = re.exec(clean);
    if (m) {
      pushIssue(
        'word_order',
        'Yan Cümle Dizilimi',
        m[0],
        `${conj} ${m[1]} ... ${m[2]}`,
        `"${conj}" bağlacı yan cümle (Nebensatz) kurar; çekimli fiil ("${m[2]}") özneden hemen sonra değil, yan cümlenin en sonunda yer almalıdır.`,
      );
    }
    // Missing comma before subordinator
    const commaRe = new RegExp(`[a-zäöüß]\\s+${conj}\\s+(ich|du|er|sie|es|wir|ihr|Sie|man|der|die|das)\\b`, 'i');
    const cm = commaRe.exec(clean);
    if (cm) {
      pushIssue(
        'punctuation',
        'Virgül Kuralı',
        cm[0],
        cm[0].replace(new RegExp(`\\s+(${conj})`, 'i'), ', $1'),
        `"${conj}" yan cümle bağlacından önce mutlaka virgül (,) koymalısın.`,
      );
    }
  }

  // 5. Preposition + wrong case (Dativ / Akkusativ)
  for (const p of DATIV_PREPS) {
    const re = new RegExp(`\\b${p}\\s+(den|einen|meinen|keinen)\\s+([A-ZÄÖÜ][a-zäöüß]+)`, 'gi');
    const m = re.exec(clean);
    if (m) {
      const noun = nounMap.get(m[2].toLocaleLowerCase('de-DE'));
      // Allow plural Dativ "den + plural" if noun looks plural, otherwise flag
      if (!noun || !noun.noun?.plural?.endsWith(m[2])) {
        pushIssue(
          'article_case',
          'Edat ve Hâl (Kasus)',
          m[0],
          `${p} ${m[1].replace(/en$/, 'em').replace(/^den$/, 'dem')} ${m[2]}`,
          `"${p}" edatı her zaman Dativ ister. Tekil maskulin/neutrum isimlerde "${m[1]}" yerine Dativ biçimi (dem/einem) kullanılmalıdır.`,
        );
      }
    }
  }
  for (const p of AKK_PREPS) {
    const re = new RegExp(`\\b${p}\\s+(dem|einem|meinem|keinem)\\s+([A-ZÄÖÜ][a-zäöüß]+)`, 'gi');
    const m = re.exec(clean);
    if (m) {
      pushIssue(
        'article_case',
        'Edat ve Hâl (Kasus)',
        m[0],
        `${p} ${m[1].replace(/em$/, 'en').replace(/^dem$/, 'den')} ${m[2]}`,
        `"${p}" edatı her zaman Akkusativ ister. "${m[1]}" Dativ biçimidir; Akkusativ için "den/einen" (veya neutrum için "das/ein") kullanılmalıdır.`,
      );
    }
  }

  // 6. Common spelling & register checks
  if (/\bseid\s+(einem|einer|zwei|drei|vier|fünf|vielen|letzter|letztem|gestern|heute|einigen)\b/i.test(clean)) {
    const m = clean.match(/\bseid\s+\S+/i);
    if (m) {
      pushIssue(
        'spelling_register',
        'Yazım Hatası (seit / seid)',
        m[0],
        m[0].replace(/^seid/i, 'seit'),
        'Zaman bildiren "-den beri" edatı "seit" (t ile) yazılır. "seid" yalnızca "ihr seid" fiil çekimidir.',
      );
    }
  }

  if (/\bmöchte\s+zu\s+[a-zäöüß]+en\b/i.test(clean)) {
    const m = clean.match(/\bmöchte\s+zu\s+[a-zäöüß]+en\b/i);
    if (m) {
      pushIssue(
        'word_order',
        'Modal Fiil + Infinitiv',
        m[0],
        m[0].replace(/\s+zu\s+/i, ' '),
        'Modal fiiller (möchten, können, müssen, wollen, sollen, dürfen) "zu" olmadan yalın mastar (Infinitiv) ile kullanılır.',
      );
    }
  }

  if (opts?.formal) {
    if (/\b(du|dich|dir|dein|deine)\b/i.test(clean)) {
      const m = clean.match(/\b(du|dich|dir|dein|deine)\b/i);
      if (m) {
        pushIssue(
          'spelling_register',
          'Resmî Hitap (Siezen)',
          m[0],
          'Sie / Ihnen / Ihr',
          'Resmî kurum ve iş yazışmalarında "du" yerine her zaman büyük harfli "Sie / Ihnen / Ihr" hitabı kullanılır.',
        );
      }
    }
    if (!/(Sehr geehrte|Guten Tag)/i.test(clean) && wordsRaw.length >= 12) {
      pushIssue(
        'spelling_register',
        'Resmî Hitap Eksik',
        'Hitap satırı',
        'Sehr geehrte Damen und Herren,',
        'Resmî e-posta veya dilekçelerde girişte "Sehr geehrte Damen und Herren," veya "Sehr geehrte/r Frau/Herr …," hitabı bulunmalıdır.',
      );
    }
    if (!/(Mit freundlichen Grüßen|Freundliche Grüße)/i.test(clean) && wordsRaw.length >= 12) {
      pushIssue(
        'spelling_register',
        'Resmî Kapanış Eksik',
        'Kapanış satırı',
        'Mit freundlichen Grüßen',
        'Resmî yazışmalar "Mit freundlichen Grüßen" ifadesiyle (sonuna virgül koymadan) kapatılır.',
      );
    }
  }

  // 7. CEFR Level Estimation
  let advancedCount = 0;
  let subCount = 0;
  for (const w of wordsRaw) {
    const low = w.replace(/[^a-zA-ZäöüÄÖÜß]/g, '').toLocaleLowerCase('de-DE');
    const lvl = wordLevelMap.get(low);
    if (lvl === 'B2' || lvl === 'C1' || lvl === 'B1.2') advancedCount += 1;
    if (SUBORDINATORS.includes(low)) subCount += 1;
  }
  const hasKonjunktiv = /\b(würde|könnte|hätte|wäre|möchte)\b/i.test(clean);
  const avgSentLen = sentences.length > 0 ? wordsRaw.length / sentences.length : 0;

  let estimatedLevel: Level = 'A2';
  let levelNoteTr = 'Kısa ve temel cümle yapısı. Yan cümle bağlaçları (weil, obwohl, damit) ve B1.2/B2 fiilleri ekleyerek metni güçlendirebilirsin.';
  if (wordsRaw.length < 10) {
    estimatedLevel = 'A1';
    levelNoteTr = 'Metin oldukça kısa; en az 2–3 tam cümle yazarak daha kapsamlı bir seviye ve gramer analizi alabilirsin.';
  } else if (subCount >= 2 && (hasKonjunktiv || advancedCount >= 4) && avgSentLen >= 10) {
    estimatedLevel = 'B2';
    levelNoteTr = 'Güçlü B2 düzeyi! Yan cümleler, nazik/resmî ifadeler ve ileri düzey kelime seçimi dengeli kullanılmış.';
  } else if (subCount >= 1 || hasKonjunktiv || advancedCount >= 2 || avgSentLen >= 8) {
    estimatedLevel = 'B1.2';
    levelNoteTr = 'B1.2 seviyesine uygun, anlaşılır bir metin. Daha fazla bağlaç (außerdem, jedoch, obwohl) ve Konjunktiv II kullanarak B2 düzeyine çıkabilirsin.';
  }

  // 8. Build personalized grammar quiz based on detected issue categories
  const detectedCats = [...new Set(issues.map((i) => i.category))];
  const quiz: GrammarQuestion[] = [];
  for (const cat of detectedCats) {
    for (const q of QUIZ_BANK[cat] ?? []) {
      if (quiz.length < 5) quiz.push(q);
    }
  }
  // Top up to at least 4 relevant questions if few/no issues were detected
  const fallbackCats: ErrorCategory[] = ['word_order', 'article_case', 'perfekt_aux', 'spelling_register', 'punctuation'];
  for (const cat of fallbackCats) {
    for (const q of QUIZ_BANK[cat] ?? []) {
      if (quiz.length < 4 && !quiz.some((x) => x.id === q.id)) quiz.push(q);
    }
  }

  const score = Math.max(25, Math.min(100, 100 - issues.length * 12));

  return {
    wordCount: wordsRaw.length,
    sentenceCount: sentences.length,
    estimatedLevel,
    levelNoteTr,
    score,
    issues,
    quiz,
  };
}
