import { useMemo, useState } from 'react';
import { SlidersHorizontal, Play, BookOpen, Check } from 'lucide-react';
import { useStore } from '../../core/store';
import { useNav } from '../../app/navigation';
import { useI18n } from '../../localization';
import { LEARN_LEVELS, Level, StudyMode, Word, matchesSelectedLevels } from '../../core/types';
import { dueWords, isStruggling } from '../../core/srs';
import { TopBar, Stepper, EmptyState } from '../../shared/ui';

const MODE_LIST: StudyMode[] = ['flashcard', 'article', 'meaning', 'writing', 'listening', 'matching', 'sentence', 'hard'];

export function eligibleWords(words: Word[], mode: StudyMode): Word[] {
  switch (mode) {
    case 'article': return words.filter((w) => w.type === 'noun' && w.article && !w.noun?.pluralOnly);
    case 'sentence': return words.filter((w) => w.examples.some((e) => e.de.toLocaleLowerCase('de-DE').includes(w.german.toLocaleLowerCase('de-DE'))));
    case 'hard': return words.filter(isStruggling);
    case 'meaning': return words.filter((w) => w.senses.some((s) => s.tr.trim()));
    default: return words;
  }
}

export default function SessionSetupScreen({ mode: initialMode, collectionId: initialCol }: { mode?: StudyMode; collectionId?: string }) {
  const { t } = useI18n();
  const words = useStore((s) => s.words);
  const collections = useStore((s) => s.collections);
  const savedLevels = useStore((s) => s.settings.learnLevels ?? []);
  const updateSettings = useStore((s) => s.updateSettings);
  const { push, back } = useNav();

  const [mode, setMode] = useState<StudyMode>(initialMode ?? 'flashcard');
  const [count, setCount] = useState(10);
  const [source, setSource] = useState<'all' | 'due' | 'new' | 'fav'>('all');
  const [colId, setColId] = useState<string>(initialCol ?? '');
  const [levels, setLevels] = useState<Level[]>(savedLevels);

  const toggleLevel = (lvl: Level) => {
    const next = levels.includes(lvl) ? levels.filter((x) => x !== lvl) : [...levels, lvl];
    setLevels(next);
    updateSettings({ learnLevels: next });
  };
  const clearLevels = () => {
    setLevels([]);
    updateSettings({ learnLevels: [] });
  };

  const pool = useMemo(() => {
    let list = eligibleWords(words, mode);
    if (source === 'due') list = dueWords(list, Date.now());
    if (source === 'new') list = list.filter((w) => w.srs.state === 'new');
    if (source === 'fav') list = list.filter((w) => w.favorite);
    if (colId) {
      const ids = new Set(collections.find((c) => c.id === colId)?.wordIds ?? []);
      list = list.filter((w) => ids.has(w.id));
    }
    if (levels.length > 0) {
      list = list.filter((w) => matchesSelectedLevels(w.level, levels));
    }
    return list;
  }, [words, mode, source, colId, levels, collections]);

  const start = () => {
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
    push({
      name: 'session',
      mode,
      wordIds: shuffled.map((w) => w.id),
      collectionId: colId || undefined,
      level: levels.length === 1 ? levels[0] : null,
    });
  };

  const emptyMsg =
    mode === 'article' ? t('learn.noNouns')
      : mode === 'sentence' ? t('learn.noExamples')
        : mode === 'hard' ? t('learn.noHard')
          : t('learn.notEnough');

  return (
    <div className="screen">
      <TopBar title={t('learn.setup')} icon={<SlidersHorizontal size={18} />} onBack={back} />
      <div className="screen-body no-nav">
        <div className="card form-section anim-in" style={{ marginTop: '1rem' }}>
          <div className="field">
            <label className="field-label">{t('learn.mode')}</label>
            <div className="type-scroll">
              {MODE_LIST.map((m) => (
                <button key={m} className={`type-chip ${mode === m ? 'on' : ''}`} onClick={() => setMode(m)}>{t(`learn.${m}`)}</button>
              ))}
            </div>
          </div>
          <div className="field">
            <label className="field-label">{t('learn.source')}</label>
            <div className="type-scroll">
              {(['all', 'due', 'new', 'fav'] as const).map((s) => (
                <button key={s} className={`type-chip ${source === s ? 'on' : ''}`} onClick={() => setSource(s)}>
                  {t(`learn.${s === 'all' ? 'allWords' : s === 'due' ? 'dueOnly' : s === 'new' ? 'newOnly' : 'favOnly'}`)}
                </button>
              ))}
            </div>
          </div>
          {collections.length > 0 ? (
            <div className="field">
              <label className="field-label">{t('common.collection')}</label>
              <select className="field-select" value={colId} onChange={(e) => setColId(e.target.value)}>
                <option value="">{t('learn.allWords')}</option>
                {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          ) : null}
          <div className="field">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label className="field-label" style={{ margin: 0 }}>{t('learn.levelFilter')}</label>
              {levels.length > 0 ? (
                <button type="button" className="link-btn" style={{ fontSize: '0.72rem' }} onClick={clearLevels}>
                  {t('learn.allLevels')}
                </button>
              ) : null}
            </div>
            <div className="level-check-grid">
              {LEARN_LEVELS.map((l) => {
                const checked = levels.includes(l);
                return (
                  <button
                    key={l}
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    className={`level-check-pill ${checked ? 'on' : ''}`}
                    onClick={() => toggleLevel(l)}
                  >
                    <span className={`mini-cb ${checked ? 'on' : ''}`}>
                      {checked ? <Check size={11} strokeWidth={3.2} /> : null}
                    </span>
                    <span>{l}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="toggle-line" style={{ paddingTop: '0.8rem' }}>
            <span style={{ fontWeight: 700 }}>{t('learn.wordCount')}</span>
            <Stepper value={count} min={4} max={50} step={2} onChange={setCount} />
          </div>
        </div>

        {pool.length === 0 ? (
          <EmptyState icon={<BookOpen size={28} />} title={emptyMsg} desc={t('learn.notEnoughDesc')} />
        ) : (
          <div className="card" style={{ padding: '1rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <span className="chip">{t('collections.wordsCount', { n: Math.min(pool.length, count) })}</span>
            <span className="muted-3" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              {t(`learn.${mode}`)} · {pool.length} uygun kelime
            </span>
          </div>
        )}

        <button className="btn gradient block lg" style={{ marginTop: '1rem' }} disabled={pool.length === 0} onClick={start}>
          <Play size={17} fill="currentColor" /> {t('learn.startSession')}
        </button>
      </div>
    </div>
  );
}
