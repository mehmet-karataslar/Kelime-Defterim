import { useMemo, useState } from 'react';
import {
  BookOpen, Languages, Shapes, MessageSquare, Link2, Tag, Mic, GraduationCap,
  Plus, X, Save, AlertTriangle,
} from 'lucide-react';
import { useStore, newWord } from '../../core/store';
import { useNav } from '../../app/navigation';
import { useI18n } from '../../localization';
import {
  ARTICLES, Article, LEVELS, Level, WORD_TYPES, Word, WordType, normalizeGerman, uid,
} from '../../core/types';
import { TopBar, Modal, Switch } from '../../shared/ui';
import { toast } from '../../shared/toastStore';

export default function WordEditorScreen({ id }: { id?: string }) {
  const { t } = useI18n();
  const words = useStore((s) => s.words);
  const collections = useStore((s) => s.collections);
  const addWord = useStore((s) => s.addWord);
  const updateWord = useStore((s) => s.updateWord);
  const addSense = useStore((s) => s.addSense);
  const assignToCollection = useStore((s) => s.assignToCollection);
  const { back } = useNav();

  const existing = id ? words.find((w) => w.id === id) : undefined;
  const [draft, setDraft] = useState<Word>(() => existing ? structuredClone(existing) : newWord());
  const [mode, setMode] = useState<'quick' | 'detailed'>('quick');
  const [dirty, setDirty] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [dupOpen, setDupOpen] = useState(false);
  const [error, setError] = useState('');
  const [selCols, setSelCols] = useState<Set<string>>(
    new Set(collections.filter((c) => existing && c.wordIds.includes(existing.id)).map((c) => c.id)));
  const [tagsText, setTagsText] = useState(draft.tags.join(', '));
  const [synText, setSynText] = useState(draft.synonyms.join(', '));
  const [antText, setAntText] = useState(draft.antonyms.join(', '));
  const [relText, setRelText] = useState(draft.related.join(', '));

  const patch = (p: Partial<Word>) => { setDraft((d) => ({ ...d, ...p })); setDirty(true); };

  const duplicate = useMemo(() => {
    const g = normalizeGerman(draft.german).toLocaleLowerCase('de-DE');
    if (!g) return null;
    return words.find((w) => w.id !== draft.id && w.german.toLocaleLowerCase('de-DE') === g && w.type === draft.type) ?? null;
  }, [draft.german, draft.type, words, draft.id]);

  const capitalSuggestion =
    draft.type === 'noun' && draft.german.length > 1 && draft.german[0] === draft.german[0].toLocaleLowerCase('de-DE') && /[a-zäöüß]/.test(draft.german[0])
      ? draft.german[0].toLocaleUpperCase('de-DE') + draft.german.slice(1)
      : null;

  const validate = (): boolean => {
    if (!normalizeGerman(draft.german) || !draft.senses.some((s) => s.tr.trim())) {
      setError(t('editor.requiredFields'));
      return false;
    }
    setError('');
    return true;
  };

  const persist = (target: Word) => {
    const cleaned: Word = {
      ...target,
      german: normalizeGerman(target.german),
      senses: target.senses.filter((s) => s.tr.trim()).map((s) => ({ ...s, tr: s.tr.trim(), en: s.en?.trim() || undefined })),
      examples: target.examples.filter((e) => e.de.trim()),
      tags: tagsText.split(',').map((x) => x.trim()).filter(Boolean),
      synonyms: synText.split(',').map((x) => x.trim()).filter(Boolean),
      antonyms: antText.split(',').map((x) => x.trim()).filter(Boolean),
      related: relText.split(',').map((x) => x.trim()).filter(Boolean),
      article: target.type === 'noun' ? target.article : null,
    };
    if (existing) {
      updateWord(cleaned);
      toast(t('editor.updatedFeedback', { w: cleaned.german }));
    } else {
      addWord(cleaned);
      toast(t('editor.savedFeedback', { w: cleaned.german }));
    }
    for (const c of collections) {
      const should = selCols.has(c.id);
      const has = c.wordIds.includes(cleaned.id);
      if (should && !has) assignToCollection(c.id, [cleaned.id]);
      if (!should && has) {
        useStore.getState().setCollectionWords(c.id, c.wordIds.filter((x) => x !== cleaned.id));
      }
    }
    back();
  };

  const save = () => {
    if (!validate()) return;
    if (!existing && duplicate) { setDupOpen(true); return; }
    persist(draft);
  };

  const tryBack = () => (dirty ? setDiscardOpen(true) : back());

  const setType = (tp: WordType) => patch({ type: tp, article: tp === 'noun' ? draft.article : null });

  const sensePatch = (sid: string, p: Partial<{ tr: string; en: string; context: string }>) =>
    patch({ senses: draft.senses.map((s) => (s.id === sid ? { ...s, ...p } : s)) });
  const exPatch = (eid: string, p: Partial<{ de: string; tr: string }>) =>
    patch({ examples: draft.examples.map((e) => (e.id === eid ? { ...e, ...p } : e)) });

  return (
    <div className="screen">
      <TopBar title={existing ? t('editor.editTitle') : t('editor.addTitle')} icon={<BookOpen size={19} />} onBack={tryBack} />
      <div className="screen-body no-nav" style={{ paddingBottom: '1rem' }}>
        <div className="seg-inline" style={{ margin: '1rem 0', width: 'fit-content' }}>
          <button className={mode === 'quick' ? 'active' : ''} onClick={() => setMode('quick')}>{t('editor.quick')}</button>
          <button className={mode === 'detailed' ? 'active' : ''} onClick={() => setMode('detailed')}>{t('editor.detailed')}</button>
        </div>

        <div className="card form-section anim-in">
          <div className="form-section-title"><Languages size={16} /> {t('editor.germanWord')}</div>
          <div className="field">
            <input
              className="field-input" value={draft.german}
              onChange={(e) => patch({ german: e.target.value })}
              placeholder={t('editor.germanPlaceholder')} autoFocus={!existing}
            />
            {capitalSuggestion ? (
              <div className="suggest-banner">
                <AlertTriangle size={14} />
                {t('editor.capitalizeSuggestion', { w: capitalSuggestion })}
                <button onClick={() => patch({ german: capitalSuggestion })}>{t('editor.useSuggestion')}</button>
              </div>
            ) : null}
            {duplicate ? <div className="field-hint" style={{ color: 'var(--amber)' }}>⚠ {t('words.duplicateWarn')}: {duplicate.german}</div> : null}
          </div>

          <div className="field">
            <label className="field-label">{t('editor.wordType')}</label>
            <div className="type-scroll">
              {WORD_TYPES.map((tp) => (
                <button key={tp} className={`type-chip ${draft.type === tp ? 'on' : ''}`} onClick={() => setType(tp)}>
                  {t(`common.${tp}`)}
                </button>
              ))}
            </div>
          </div>

          {draft.type === 'noun' ? (
            <div className="field">
              <label className="field-label">{t('common.article')}</label>
              <div className="article-picker">
                {ARTICLES.map((a) => (
                  <button key={a} className={`article-pick ${a} ${draft.article === a ? 'on' : ''}`} onClick={() => patch({ article: draft.article === a ? null : a })}>
                    {a}
                  </button>
                ))}
                <button className={`article-pick none small ${draft.article === null ? 'on' : ''}`} onClick={() => patch({ article: null })}>
                  {t('editor.articleUnknown')}
                </button>
              </div>
            </div>
          ) : null}

          <div className="field" style={{ marginBottom: 0 }}>
            <label className="field-label">{t('editor.meanings')}</label>
            {draft.senses.map((s, i) => (
              <div className="sense-block" key={s.id}>
                {draft.senses.length > 1 ? (
                  <button className="block-remove" onClick={() => patch({ senses: draft.senses.filter((x) => x.id !== s.id) })}><X size={14} /></button>
                ) : null}
                <div className="field" style={{ marginBottom: '0.55rem' }}>
                  <input className="field-input" value={s.tr} onChange={(e) => sensePatch(s.id, { tr: e.target.value })} placeholder={`${t('editor.meaningTr')}${i === 0 ? ' *' : ''}`} />
                </div>
                <div className="field" style={{ marginBottom: mode === 'detailed' ? '0.55rem' : 0 }}>
                  <input className="field-input" value={s.en ?? ''} onChange={(e) => sensePatch(s.id, { en: e.target.value })} placeholder={`${t('editor.meaningEn')} (${t('common.optional')})`} />
                </div>
                {mode === 'detailed' ? (
                  <input className="field-input" value={s.context ?? ''} onChange={(e) => sensePatch(s.id, { context: e.target.value })} placeholder={t('editor.context')} />
                ) : null}
              </div>
            ))}
            <button className="add-inline" onClick={() => patch({ senses: [...draft.senses, { id: uid(), tr: '', en: '' }] })}>
              <Plus size={15} /> {t('editor.addMeaning')}
            </button>
          </div>
          {error ? <div className="field-error">{error}</div> : null}
        </div>

        {mode === 'detailed' ? (
          <>
            <GrammarSection draft={draft} patch={patch} />

            <div className="card form-section">
              <div className="form-section-title"><MessageSquare size={16} /> {t('common.examples')}</div>
              {draft.examples.map((e) => (
                <div className="example-block" key={e.id}>
                  <button className="block-remove" onClick={() => patch({ examples: draft.examples.filter((x) => x.id !== e.id) })}><X size={14} /></button>
                  <div className="field" style={{ marginBottom: '0.55rem' }}>
                    <input className="field-input" value={e.de} onChange={(ev) => exPatch(e.id, { de: ev.target.value })} placeholder={t('editor.exampleDe')} />
                  </div>
                  <input className="field-input" value={e.tr} onChange={(ev) => exPatch(e.id, { tr: ev.target.value })} placeholder={t('editor.exampleTr')} />
                </div>
              ))}
              <button className="add-inline" onClick={() => patch({ examples: [...draft.examples, { id: uid(), de: '', tr: '' }] })}>
                <Plus size={15} /> {t('editor.addExample')}
              </button>
              <div className="field" style={{ marginTop: '0.8rem', marginBottom: 0 }}>
                <label className="field-label">{t('editor.paragraph')}</label>
                <textarea className="field-textarea" value={draft.paragraph ?? ''} onChange={(e) => patch({ paragraph: e.target.value })} />
              </div>
            </div>

            <div className="card form-section">
              <div className="form-section-title"><Link2 size={16} /> {t('detail.relations')}</div>
              <div className="field">
                <label className="field-label">{t('editor.synonyms')}</label>
                <input className="field-input" value={synText} onChange={(e) => { setSynText(e.target.value); setDirty(true); }} placeholder={t('editor.commaSeparated')} />
              </div>
              <div className="field">
                <label className="field-label">{t('editor.antonyms')}</label>
                <input className="field-input" value={antText} onChange={(e) => { setAntText(e.target.value); setDirty(true); }} placeholder={t('editor.commaSeparated')} />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="field-label">{t('editor.related')}</label>
                <input className="field-input" value={relText} onChange={(e) => { setRelText(e.target.value); setDirty(true); }} placeholder={t('editor.commaSeparated')} />
              </div>
            </div>

            <div className="card form-section">
              <div className="form-section-title"><Tag size={16} /> {t('editor.tags')} · {t('common.collections')}</div>
              <div className="field">
                <input className="field-input" value={tagsText} onChange={(e) => { setTagsText(e.target.value); setDirty(true); }} placeholder={t('editor.commaSeparated')} />
              </div>
              {collections.length > 0 ? (
                <div className="type-scroll">
                  {collections.map((c) => (
                    <button
                      key={c.id}
                      className={`type-chip ${selCols.has(c.id) ? 'on' : ''}`}
                      onClick={() => {
                        setSelCols((prev) => {
                          const next = new Set(prev);
                          next.has(c.id) ? next.delete(c.id) : next.add(c.id);
                          return next;
                        });
                        setDirty(true);
                      }}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="card form-section">
              <div className="form-section-title"><Mic size={16} /> {t('editor.notes')}</div>
              <textarea className="field-textarea" value={draft.notes ?? ''} onChange={(e) => patch({ notes: e.target.value })} placeholder={t('editor.notesPlaceholder')} />
            </div>
          </>
        ) : null}

        <div className="card form-section">
          <div className="form-section-title"><GraduationCap size={16} /> {t('editor.levelSection')}</div>
          <div className="level-picker">
            <button className={`level-pick ${draft.level === null ? 'on' : ''}`} onClick={() => patch({ level: null })}>{t('editor.noLevel')}</button>
            {LEVELS.map((l) => (
              <button key={l} className={`level-pick ${draft.level === l ? 'on' : ''}`} onClick={() => patch({ level: draft.level === l ? null : l })}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="editor-footer">
        <button className="btn outline" onClick={tryBack}>{t('common.cancel')}</button>
        <button className="btn primary" onClick={save}><Save size={17} /> {t('common.save')}</button>
      </div>

      {discardOpen ? (
        <Modal title={t('editor.discardTitle')} desc={t('editor.discardDesc')} onClose={() => setDiscardOpen(false)}
          actions={
            <>
              <button className="btn outline" onClick={() => setDiscardOpen(false)}>{t('editor.keepEditing')}</button>
              <button className="btn danger" onClick={back}>{t('editor.discard')}</button>
            </>
          }
        />
      ) : null}

      {dupOpen ? (
        <Modal title={t('words.duplicateWarn')} desc={t('words.duplicateDesc')} onClose={() => setDupOpen(false)}
          actions={
            <>
              <button className="btn outline" onClick={() => {
                if (duplicate) {
                  const s = draft.senses.find((x) => x.tr.trim());
                  if (s) addSense(duplicate.id, s.tr.trim(), s.en?.trim());
                  toast(t('common.saved'));
                  back();
                }
              }}>{t('words.addSense')}</button>
              <button className="btn primary" onClick={() => { setDupOpen(false); persist(draft); }}>{t('words.saveAnyway')}</button>
            </>
          }
        />
      ) : null}
    </div>
  );
}

function GrammarSection({ draft, patch }: { draft: Word; patch: (p: Partial<Word>) => void }) {
  const { t } = useI18n();
  const noun = draft.noun ?? {};
  const verb = draft.verb ?? {};
  const adj = draft.adjective ?? {};
  const prep = draft.preposition ?? { cases: [] };

  if (draft.type === 'noun') {
    return (
      <div className="card form-section anim-in">
        <div className="form-section-title"><Shapes size={16} /> {t('editor.grammar')}</div>
        <div className="field-row">
          <div className="field">
            <label className="field-label">{t('common.plural')}</label>
            <input className="field-input" value={noun.plural ?? ''} disabled={noun.noPlural}
              onChange={(e) => patch({ noun: { ...noun, plural: e.target.value } })} placeholder="die Tische" />
          </div>
          <div className="field">
            <label className="field-label">{t('editor.genitiv')}</label>
            <input className="field-input" value={noun.genitiv ?? ''}
              onChange={(e) => patch({ noun: { ...noun, genitiv: e.target.value } })} placeholder="des Tisches" />
          </div>
        </div>
        <div className="toggle-line">
          {t('editor.noPlural')}
          <Switch on={!!noun.noPlural} onChange={(v) => patch({ noun: { ...noun, noPlural: v, plural: v ? undefined : noun.plural } })} />
        </div>
        <div className="toggle-line">
          {t('editor.pluralOnly')}
          <Switch on={!!noun.pluralOnly} onChange={(v) => patch({ noun: { ...noun, pluralOnly: v } })} />
        </div>
        <div className="toggle-line">
          {t('editor.nDecl')}
          <Switch on={!!noun.nDeclension} onChange={(v) => patch({ noun: { ...noun, nDeclension: v } })} />
        </div>
      </div>
    );
  }
  if (draft.type === 'verb') {
    return (
      <div className="card form-section anim-in">
        <div className="form-section-title"><Shapes size={16} /> {t('editor.grammar')}</div>
        <div className="field-row">
          <div className="field">
            <label className="field-label">{t('editor.praesens3')}</label>
            <input className="field-input" value={verb.praesens3 ?? ''} onChange={(e) => patch({ verb: { ...verb, praesens3: e.target.value } })} placeholder="fährt" />
          </div>
          <div className="field">
            <label className="field-label">{t('editor.praeteritum')}</label>
            <input className="field-input" value={verb.praeteritum ?? ''} onChange={(e) => patch({ verb: { ...verb, praeteritum: e.target.value } })} placeholder="fuhr" />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label className="field-label">{t('editor.partizip2')}</label>
            <input className="field-input" value={verb.partizip2 ?? ''} onChange={(e) => patch({ verb: { ...verb, partizip2: e.target.value } })} placeholder="gefahren" />
          </div>
          <div className="field">
            <label className="field-label">{t('editor.auxiliary')}</label>
            <select className="field-select" value={verb.auxiliary ?? ''} onChange={(e) => patch({ verb: { ...verb, auxiliary: (e.target.value || undefined) as 'haben' | 'sein' | undefined } })}>
              <option value="">—</option>
              <option value="haben">haben</option>
              <option value="sein">sein</option>
            </select>
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label className="field-label">{t('editor.requiredPrep')}</label>
            <input className="field-input" value={verb.preposition ?? ''} onChange={(e) => patch({ verb: { ...verb, preposition: e.target.value } })} placeholder="warten auf" />
          </div>
          <div className="field">
            <label className="field-label">{t('editor.prepCase')}</label>
            <select className="field-select" value={verb.prepCase ?? ''} onChange={(e) => patch({ verb: { ...verb, prepCase: e.target.value || undefined } })}>
              <option value="">—</option>
              <option>Akkusativ</option><option>Dativ</option><option>Genitiv</option>
            </select>
          </div>
        </div>
        {(['irregular', 'separable', 'reflexive', 'modal'] as const).map((k) => (
          <div className="toggle-line" key={k}>
            {t(`editor.${k}`)}
            <Switch on={!!verb[k]} onChange={(v) => patch({ verb: { ...verb, [k]: v } })} />
          </div>
        ))}
      </div>
    );
  }
  if (draft.type === 'adjective') {
    return (
      <div className="card form-section anim-in">
        <div className="form-section-title"><Shapes size={16} /> {t('editor.grammar')}</div>
        <div className="field-row">
          <div className="field">
            <label className="field-label">{t('editor.komparativ')}</label>
            <input className="field-input" value={adj.komparativ ?? ''} onChange={(e) => patch({ adjective: { ...adj, komparativ: e.target.value } })} placeholder="besser" />
          </div>
          <div className="field">
            <label className="field-label">{t('editor.superlativ')}</label>
            <input className="field-input" value={adj.superlativ ?? ''} onChange={(e) => patch({ adjective: { ...adj, superlativ: e.target.value } })} placeholder="am besten" />
          </div>
        </div>
      </div>
    );
  }
  if (draft.type === 'preposition') {
    const cases = ['Akkusativ', 'Dativ', 'Genitiv'];
    return (
      <div className="card form-section anim-in">
        <div className="form-section-title"><Shapes size={16} /> {t('editor.grammar')}</div>
        <div className="field">
          <label className="field-label">{t('editor.cases')}</label>
          <div className="type-scroll">
            {cases.map((c) => (
              <button key={c} className={`type-chip ${prep.cases.includes(c) ? 'on' : ''}`}
                onClick={() => patch({ preposition: { ...prep, cases: prep.cases.includes(c) ? prep.cases.filter((x) => x !== c) : [...prep.cases, c] } })}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="toggle-line">
          {t('editor.wechsel')}
          <Switch on={!!prep.wechsel} onChange={(v) => patch({ preposition: { ...prep, wechsel: v } })} />
        </div>
      </div>
    );
  }
  return null;
}