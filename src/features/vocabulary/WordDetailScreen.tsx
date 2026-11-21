import { useState } from 'react';
import {
  BookOpen, Volume2, Heart, Pencil, Trash2, Share2, Clock, Bookmark,
  ChevronRight, CheckCircle2,
} from 'lucide-react';
import { useStore } from '../../core/store';
import { useNav } from '../../app/navigation';
import { useI18n, useMeaning } from '../../localization';
import { DAY, startOfDay } from '../../core/types';
import { ArticleBadge, TopBar, ConfirmModal, Modal, statusOf } from '../../shared/ui';
import { speakGerman } from '../../core/audio';
import { toast } from '../../shared/toastStore';

export default function WordDetailScreen({ id }: { id: string }) {
  const { t, lang } = useI18n();
  const meaning = useMeaning();
  const words = useStore((s) => s.words);
  const collections = useStore((s) => s.collections);
  const settings = useStore((s) => s.settings);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const deleteWords = useStore((s) => s.deleteWords);
  const undoDelete = useStore((s) => s.undoDelete);
  const addToReviewList = useStore((s) => s.addToReviewList);
  const assignToCollection = useStore((s) => s.assignToCollection);
  const { push, back } = useNav();
  const [confirmDel, setConfirmDel] = useState(false);
  const [colPicker, setColPicker] = useState(false);

  const w = words.find((x) => x.id === id);
  if (!w) {
    return (
      <div className="screen">
        <TopBar title={t('detail.title')} onBack={back} />
        <div className="screen-body"><p className="modal-desc" style={{ padding: '2rem 0' }}>{t('words.noResults')}</p></div>
      </div>
    );
  }

  const accent = w.article ? settings.articleColors[w.article] : 'var(--primary)';
  const speak = (text: string) => speakGerman(text, settings.ttsRate, () => toast(t('learn.ttsMissing'), 'err'));
  const state = statusOf(w);
  const accuracy = w.stats.reviews > 0 ? Math.round((w.stats.correct / w.stats.reviews) * 100) : 0;
  const wordCols = collections.filter((c) => c.wordIds.includes(w.id));
  const locales = { tr: 'tr-TR', de: 'de-DE', en: 'en-US' };
  const fmtDate = (ts: number) => new Date(ts).toLocaleDateString(locales[lang], { day: 'numeric', month: 'short' });

  const dueLabel = () => {
    if (w.srs.due === null) return t('detail.notReviewed');
    const now = Date.now();
    if (w.srs.due <= now) return t('detail.dueNow');
    if (w.srs.due < startOfDay(now) + DAY) return t('detail.dueToday');
    return t('detail.dueIn', { n: Math.ceil((w.srs.due - now) / DAY) });
  };

  const share = async () => {
    const text = `${w.article ? w.article + ' ' : ''}${w.german} — ${meaning(w)}${w.examples[0] ? `\n${w.examples[0].de}` : ''}\n\nKelime Defterim`;
    try {
      if (navigator.share) await navigator.share({ text });
      else { await navigator.clipboard.writeText(text); toast(t('detail.copied')); }
    } catch { /* user cancelled */ }
  };

  const grammarRows: [string, string][] = [];
  if (w.type === 'noun' && w.noun) {
    if (w.noun.pluralOnly) grammarRows.push([t('common.plural'), `${w.noun.plural ?? ''} (${t('editor.pluralOnly')})`]);
    else if (w.noun.noPlural) grammarRows.push([t('common.plural'), t('editor.noPlural')]);
    else if (w.noun.plural) grammarRows.push([t('common.plural'), w.noun.plural]);
    if (w.noun.genitiv) grammarRows.push(['Genitiv', w.noun.genitiv]);
    if (w.noun.nDeclension) grammarRows.push(['N-Deklination', '✓']);
  }
  if (w.type === 'verb' && w.verb) {
    if (w.verb.praesens3) grammarRows.push(['Präsens (er/sie/es)', w.verb.praesens3]);
    if (w.verb.praeteritum) grammarRows.push(['Präteritum', w.verb.praeteritum]);
    if (w.verb.partizip2) grammarRows.push(['Partizip II', w.verb.partizip2]);
    if (w.verb.partizip2 && w.verb.auxiliary) grammarRows.push([t('detail.perfect'), `${w.verb.auxiliary === 'sein' ? 'ist' : 'hat'} ${w.verb.partizip2}`]);
    if (w.verb.preposition) grammarRows.push([t('editor.requiredPrep'), `${w.verb.preposition}${w.verb.prepCase ? ` + ${w.verb.prepCase}` : ''}`]);
    const flags = [w.verb.irregular && t('editor.irregular'), w.verb.separable && t('editor.separable'), w.verb.reflexive && t('editor.reflexive'), w.verb.modal && t('editor.modal')].filter(Boolean);
    if (flags.length) grammarRows.push([t('detail.forms'), flags.join(' · ')]);
  }
  if (w.type === 'adjective' && w.adjective) {
    if (w.adjective.komparativ) grammarRows.push(['Komparativ', w.adjective.komparativ]);
    if (w.adjective.superlativ) grammarRows.push(['Superlativ', w.adjective.superlativ]);
  }
  if (w.type === 'preposition' && w.preposition) {
    if (w.preposition.cases.length) grammarRows.push(['Kasus', w.preposition.cases.join(' / ')]);
    if (w.preposition.wechsel) grammarRows.push([t('editor.wechsel'), 'Akkusativ (yönelme) · Dativ (konum)']);
  }

  return (
    <div className="screen">
      <TopBar title={t('detail.title')} icon={<BookOpen size={19} />} onBack={back} solidProfile />
      <div className="screen-body no-nav">
        <div className="card detail-hero anim-in" style={{ ['--accent' as string]: accent }}>
          <div className="detail-word-row">
            <ArticleBadge article={w.article} solid lg />
            <span className="detail-word">{w.german}</span>
            <button className="icon-btn" onClick={() => speak(w.german)} aria-label={t('learn.playAudio')}><Volume2 size={17} /></button>
            <button className={`icon-btn ${w.favorite ? 'fav' : 'fav-off'}`} onClick={() => toggleFavorite(w.id)} aria-label={t('common.favorites')}>
              <Heart size={17} fill={w.favorite ? 'currentColor' : 'none'} />
            </button>
          </div>
          <div className="detail-meta">
            <span className="level-chip">{t(`common.${w.type}`)}</span>
            {w.level ? <span className="level-chip">{w.level}</span> : null}
            <span className={`chip ${state === 'learned' ? 'green' : state === 'struggling' ? 'rose' : ''}`}>{t(`common.${state}`)}</span>
          </div>
          <div className="detail-actions">
            <button className="btn outline" style={{ padding: '0.55rem 0.9rem', fontSize: '0.8rem' }} onClick={() => push({ name: 'wordEditor', id: w.id })}>
              <Pencil size={14} /> {t('common.edit')}
            </button>
            <button className="btn outline" style={{ padding: '0.55rem 0.9rem', fontSize: '0.8rem' }} onClick={share}>
              <Share2 size={14} /> {t('detail.share')}
            </button>
            <button className="btn outline" style={{ padding: '0.55rem 0.9rem', fontSize: '0.8rem' }} onClick={() => { addToReviewList([w.id]); toast(t('detail.addedToReview')); }}>
              <Clock size={14} /> {t('detail.addToReviewList')}
            </button>
            <button className="btn danger-outline" style={{ padding: '0.55rem 0.9rem', fontSize: '0.8rem' }} onClick={() => setConfirmDel(true)}>
              <Trash2 size={14} /> {t('common.delete')}
            </button>
          </div>
        </div>

        <div className="card detail-section anim-in-1">
          <div className="detail-section-title">{t('detail.primaryMeaning')}</div>
          <div className="detail-meaning">{w.senses[0]?.tr}</div>
          {w.senses[0]?.en ? <div className="detail-meaning-en">{w.senses[0].en}</div> : null}
          {w.senses.length > 1 ? (
            <>
              <div className="detail-section-title" style={{ marginTop: '0.9rem' }}>{t('detail.altMeanings')}</div>
              {w.senses.slice(1).map((s) => (
                <div className="sense-item" key={s.id}>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{s.tr}</span>
                  {s.context ? <span className="sense-context">{s.context}</span> : null}
                  {s.en ? <div className="detail-meaning-en">{s.en}</div> : null}
                </div>
              ))}
            </>
          ) : null}
        </div>

        {grammarRows.length > 0 ? (
          <div className="card detail-section anim-in-2">
            <div className="detail-section-title">{w.type === 'verb' ? t('detail.conjugation') : t('editor.grammar')}</div>
            <table className="grammar-table">
              <tbody>
                {grammarRows.map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}
              </tbody>
            </table>
          </div>
        ) : null}

        {w.examples.length > 0 ? (
          <div className="card detail-section anim-in-2">
            <div className="detail-section-title">{t('common.examples')}</div>
            {w.examples.map((e) => (
              <div className="example-item" key={e.id}>
                <div className="example-de">
                  <button onClick={() => speak(e.de)} aria-label={t('learn.playAudio')}><Volume2 size={14} /></button>
                  <span>“{e.de}”</span>
                </div>
                {e.tr ? <div className="example-tr">{e.tr}</div> : null}
              </div>
            ))}
            {w.paragraph ? <div className="example-item" style={{ fontStyle: 'italic', fontSize: '0.85rem', lineHeight: 1.6 }}>{w.paragraph}</div> : null}
          </div>
        ) : null}

        {(w.synonyms.length > 0 || w.antonyms.length > 0 || w.related.length > 0) ? (
          <div className="card detail-section">
            <div className="detail-section-title">{t('detail.relations')}</div>
            <div className="tag-wrap">
              {w.synonyms.map((s) => <span key={'s' + s} className="relation-chip syn">≈ {s}</span>)}
              {w.antonyms.map((s) => <span key={'a' + s} className="relation-chip ant">↔ {s}</span>)}
              {w.related.map((s) => <span key={'r' + s} className="relation-chip">{s}</span>)}
            </div>
          </div>
        ) : null}

        {(w.tags.length > 0 || wordCols.length > 0) ? (
          <div className="card detail-section">
            <div className="detail-section-title">{t('detail.tags')} · {t('common.collections')}</div>
            <div className="tag-wrap">
              {w.tags.map((tag) => <span key={tag} className="chip gray">#{tag}</span>)}
              {wordCols.map((c) => (
                <button key={c.id} className="chip" style={{ background: c.color + '22', color: c.color }} onClick={() => push({ name: 'collectionDetail', id: c.id })}>
                  <Bookmark size={11} /> {c.name}
                </button>
              ))}
              <button className="chip gray" onClick={() => setColPicker(true)}>+ {t('detail.moveToCollection')}</button>
            </div>
          </div>
        ) : (
          <div className="card detail-section">
            <button className="add-inline" onClick={() => setColPicker(true)}><Bookmark size={14} /> {t('detail.moveToCollection')}</button>
          </div>
        )}

        {w.notes ? (
          <div className="card detail-section">
            <div className="detail-section-title">{t('detail.notes')}</div>
            <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-2)' }}>{w.notes}</p>
          </div>
        ) : null}

        <div className="card detail-section">
          <div className="detail-section-title">{t('detail.learningStatus')}</div>
          <div className="learn-state-row">
            <span className={`status-dot ${state}`} style={{ width: '0.7rem', height: '0.7rem' }} />
            <span className="learn-state-label">{t(`common.${state}`)}</span>
            <span className="chip gray" style={{ marginLeft: 'auto' }}>{dueLabel()}</span>
          </div>
          <table className="grammar-table" style={{ marginTop: '0.6rem' }}>
            <tbody>
              <tr><td>{t('detail.lastReview')}</td><td>{w.srs.lastReview ? fmtDate(w.srs.lastReview) : '—'}</td></tr>
              <tr><td>{t('detail.nextReview')}</td><td>{w.srs.due ? fmtDate(w.srs.due) : '—'}</td></tr>
              <tr><td>{t('detail.performance')}</td><td>{t('detail.reviewsCount', { n: w.stats.reviews })} · {t('detail.accuracy', { n: accuracy })}</td></tr>
            </tbody>
          </table>
          {w.stats.reviews > 0 ? (
            <div className="perf-bar"><div className="perf-fill" style={{ width: `${accuracy}%` }} /></div>
          ) : null}
          <button className="btn gradient block" style={{ marginTop: '0.9rem' }} onClick={() => push({ name: 'session', mode: 'flashcard', wordIds: [w.id] })}>
            <CheckCircle2 size={16} /> {t('home.startReview')}
          </button>
        </div>
      </div>

      {confirmDel ? (
        <ConfirmModal
          title={t('common.delete')} desc={t('detail.deleteWordConfirm', { w: w.german })}
          confirmLabel={t('common.delete')} danger
          onConfirm={() => {
            deleteWords([w.id]);
            back();
            toast(t('words.wordDeleted'), 'ok', t('common.undo'), undoDelete);
          }}
          onClose={() => setConfirmDel(false)}
        />
      ) : null}

      {colPicker ? (
        <Modal title={t('detail.moveToCollection')} onClose={() => setColPicker(false)}>
          {collections.length === 0 ? <p className="modal-desc">{t('collections.emptyDesc')}</p> : collections.map((c) => (
            <button key={c.id} className="lang-option" onClick={() => { assignToCollection(c.id, [w.id]); toast(t('common.saved')); setColPicker(false); }}>
              <span className="legend-dot" style={{ background: c.color, width: '0.8rem', height: '0.8rem' }} />
              {c.name}
              {c.wordIds.includes(w.id) ? <CheckCircle2 size={17} className="check" /> : <ChevronRight size={16} style={{ marginLeft: 'auto', color: 'var(--text-3)' }} />}
            </button>
          ))}
        </Modal>
      ) : null}
    </div>
  );
}