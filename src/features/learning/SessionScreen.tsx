import { useEffect, useMemo, useRef, useState } from 'react';
import {
  X, Volume2, RotateCcw, CheckCircle2, XCircle, Trophy, ArrowRight,
  Eye, Zap, Clock, Target,
} from 'lucide-react';
import { useStore } from '../../core/store';
import { useNav } from '../../app/navigation';
import { useI18n, useMeaning } from '../../localization';
import { ARTICLES, Level, Rating, StudyMode, Word, foldForSearch, uid } from '../../core/types';
import { isStruggling } from '../../core/srs';
import { TopBar, Modal, EmptyState } from '../../shared/ui';
import { playTone, speakGerman } from '../../core/audio';
import { toast } from '../../shared/toastStore';

interface Tally { correct: number; wrong: number; hard: number; answered: number; }

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  if (out.length > 1 && out[out.length - 1].length === 1) {
    out[out.length - 2].push(...out.pop()!);
  }
  return out;
}

export default function SessionScreen({
  mode, wordIds, level,
}: { mode: StudyMode; wordIds: string[]; collectionId?: string; level?: Level | null }) {
  const { t } = useI18n();
  const meaning = useMeaning();
  const allWords = useStore((s) => s.words);
  const settings = useStore((s) => s.settings);
  const review = useStore((s) => s.review);
  const addSession = useStore((s) => s.addSession);
  const { back, push } = useNav();

  const queue = useMemo(
    () => wordIds.map((id) => allWords.find((w) => w.id === id)).filter((w): w is Word => !!w),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wordIds.join(',')],
  );

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [feedback, setFeedback] = useState<null | { ok: boolean; answer: string }>(null);
  const [tally, setTally] = useState<Tally>({ correct: 0, wrong: 0, hard: 0, answered: 0 });
  const [done, setDone] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [hideArticle, setHideArticle] = useState(false);
  const [ttsFailed, setTtsFailed] = useState(false);
  const startedAt = useRef(Date.now());
  const savedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // matching state
  const rounds = useMemo(() => chunk(queue, 4), [queue]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [selWord, setSelWord] = useState<string | null>(null);
  const [selMeaning, setSelMeaning] = useState<string | null>(null);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const rightOrder = useMemo(
    () => shuffle((rounds[roundIdx] ?? []).map((w) => w.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roundIdx, mode],
  );

  const current = queue[index];
  const isMatching = mode === 'matching';
  const totalTarget = queue.length;
  const progress = isMatching
    ? (rounds.slice(0, roundIdx).reduce((a, r) => a + r.length, 0) + matched.size) / Math.max(1, totalTarget)
    : (index + (feedback || (mode === 'flashcard' && flipped) ? 0.5 : 0)) / Math.max(1, totalTarget);

  const speak = (text: string) => speakGerman(text, settings.ttsRate, () => { setTtsFailed(true); toast(t('learn.ttsMissing'), 'err'); });

  useEffect(() => {
    if (mode === 'listening' && current && !done) {
      const timer = setTimeout(() => speak(current.german), 350);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, mode, done]);

  useEffect(() => {
    if (mode === 'writing' && !feedback) inputRef.current?.focus();
  }, [index, mode, feedback]);

  const record = (w: Word, rating: Rating, correct: boolean) => {
    review(w.id, rating, mode === 'hard' ? 'flashcard' : mode, correct);
    playTone(correct ? 'correct' : 'wrong', settings.soundOn);
    setTally((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      wrong: prev.wrong + (correct ? 0 : 1),
      hard: prev.hard + (rating <= 1 ? 1 : 0),
      answered: prev.answered + 1,
    }));
  };

  const advance = () => {
    setFlipped(false);
    setPicked(null);
    setAnswerText('');
    setFeedback(null);
    if (index + 1 >= queue.length) finish();
    else setIndex((i) => i + 1);
  };

  const finish = () => {
    setDone(true);
    playTone('success', settings.soundOn);
  };

  useEffect(() => {
    if (done && !savedRef.current && tally.answered > 0) {
      savedRef.current = true;
      addSession({
        id: uid(), mode, ts: Date.now(),
        total: tally.answered, correct: tally.correct, wrong: tally.wrong, hard: tally.hard,
        durationSec: Math.round((Date.now() - startedAt.current) / 1000),
        level: level ?? null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const distractorMeanings = useMemo(() => {
    if (!current) return [];
    const target = meaning(current);
    const pool = shuffle(allWords.filter((w) => w.id !== current.id && meaning(w) && meaning(w) !== target));
    return pool.slice(0, 3).map((w) => meaning(w));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, allWords.length]);

  const distractorWords = useMemo(() => {
    if (!current) return [];
    const sameType = allWords.filter((w) => w.id !== current.id && w.type === current.type);
    const others = allWords.filter((w) => w.id !== current.id && w.type !== current.type);
    return shuffle([...shuffle(sameType).slice(0, 3), ...shuffle(others)]).slice(0, 3).map((w) => w.german);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, allWords.length]);

  const meaningOptions = useMemo(
    () => (current ? shuffle([meaning(current), ...distractorMeanings]) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [index, distractorMeanings],
  );
  const wordOptions = useMemo(
    () => (current ? shuffle([current.german, ...distractorWords]) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [index, distractorWords],
  );

  const sentenceData = useMemo(() => {
    if (!current || mode !== 'sentence') return null;
    const ex = current.examples.find((e) => e.de.toLocaleLowerCase('de-DE').includes(current.german.toLocaleLowerCase('de-DE')));
    if (!ex) return null;
    const re = new RegExp(current.german.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const parts = ex.de.split(re);
    return { before: parts[0], after: parts.slice(1).join(current.german), tr: ex.tr };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, mode]);

  const checkWriting = () => {
    if (!current || !answerText.trim() || feedback) return;
    const given = answerText.trim().normalize('NFC');
    const target = (current.article ? current.article + ' ' : '') + current.german;
    const bare = current.german;
    const tol = settings.writingTolerance;
    const eq = (a: string, b: string) =>
      tol === 'strict' ? a === b
      : tol === 'case' ? a.toLocaleLowerCase('de-DE') === b.toLocaleLowerCase('de-DE')
      : foldForSearch(a) === foldForSearch(b);
    const ok = eq(given, bare) || eq(given, target);
    record(current, ok ? 2 : 0, ok);
    setFeedback({ ok, answer: target });
  };

  const pickOption = (opt: string, correctValue: string) => {
    if (!current || feedback) return;
    const ok = opt === correctValue;
    setPicked(opt);
    record(current, ok ? 2 : 0, ok);
    setFeedback({ ok, answer: correctValue });
  };

  const rateFlashcard = (rating: Rating) => {
    if (!current) return;
    record(current, rating, rating >= 2);
    advance();
  };

  const tapMatch = (side: 'word' | 'meaning', id: string) => {
    if (matched.has(id)) return;
    if (side === 'word') { setSelWord(id); setSelMeaning(null); }
    else { setSelMeaning(id); }
    const wId = side === 'word' ? id : selWord;
    const mId = side === 'meaning' ? id : selMeaning;
    if (!wId || !mId) return;
    const w = queue.find((x) => x.id === wId)!;
    if (wId === mId) {
      record(w, 2, true);
      const next = new Set(matched);
      next.add(wId);
      setMatched(next);
      setSelWord(null); setSelMeaning(null);
      const round = rounds[roundIdx];
      if (round.every((x) => next.has(x.id))) {
        setTimeout(() => {
          if (roundIdx + 1 >= rounds.length) finish();
          else { setRoundIdx((r) => r + 1); setMatched(new Set()); }
        }, 650);
      }
    } else {
      record(w, 0, false);
      setShakeId(mId);
      setTimeout(() => { setShakeId(null); setSelWord(null); setSelMeaning(null); }, 400);
    }
  };

  if (queue.length === 0) {
    return (
      <div className="screen">
        <TopBar title={t(`learn.${mode}`)} onBack={back} />
        <div className="screen-body no-nav">
          <EmptyState icon={<Target size={28} />} title={t('learn.notEnough')} desc={t('learn.notEnoughDesc')} />
        </div>
      </div>
    );
  }

  if (done) {
    const pct = tally.answered > 0 ? Math.round((tally.correct / tally.answered) * 100) : 0;
    const hardWords = allWords.filter(isStruggling);
    const emoji = pct >= 85 ? '🏆' : pct >= 60 ? '🎉' : '💪';
    return (
      <div className="screen">
        <TopBar title={t('learn.results')} onBack={back} />
        <div className="screen-body no-nav">
          <div className="results-hero anim-in">
            <div className="results-emoji">{emoji}</div>
            <div className="results-title">{t('learn.results')}</div>
            <p className="muted" style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>
              {t(`learn.${mode}`)} · {Math.max(1, Math.round((Date.now() - startedAt.current) / 60000))} dk
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }} className="anim-in-1">
            <div className="card" style={{ padding: '1rem 1.6rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Trophy size={22} style={{ color: 'var(--amber)' }} />
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>%{pct}</div>
                <div className="muted-3" style={{ fontSize: '0.72rem', fontWeight: 600 }}>{t('learn.completion')}</div>
              </div>
            </div>
          </div>
          <div className="results-grid anim-in-2">
            <div className="card result-stat"><div className="n">{tally.answered}</div><div className="l">{t('learn.studied')}</div></div>
            <div className="card result-stat"><div className="n" style={{ color: 'var(--green)' }}>{tally.correct}</div><div className="l">{t('learn.correctCount')}</div></div>
            <div className="card result-stat"><div className="n" style={{ color: 'var(--rose)' }}>{tally.wrong}</div><div className="l">{t('learn.wrongCount')}</div></div>
            <div className="card result-stat"><div className="n" style={{ color: 'var(--amber)' }}>{tally.hard}</div><div className="l">{t('learn.hardOnes')}</div></div>
          </div>
          {pct < 70 && hardWords.length > 0 ? (
            <div className="card" style={{ padding: '0.9rem 1rem', marginTop: '0.85rem' }}>
              <div className="muted-3" style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('learn.nextSuggested')}</div>
              <button className="btn danger-outline block" style={{ marginTop: '0.6rem' }}
                onClick={() => push({ name: 'session', mode: 'flashcard', wordIds: hardWords.slice(0, 15).map((w) => w.id) })}>
                <Zap size={16} /> {t('learn.reviewHard')}
              </button>
            </div>
          ) : null}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1.2rem' }} className="anim-in-3">
            <button className="btn gradient block lg" onClick={() => push({ name: 'session', mode, wordIds: shuffle(wordIds) })}>
              <RotateCcw size={16} /> {t('learn.studyAgain')}
            </button>
            <button className="btn outline block" onClick={back}>{t('learn.backToLearn')}</button>
          </div>
        </div>
      </div>
    );
  }

  const accent = current?.article ? settings.articleColors[current.article] : 'var(--primary)';

  return (
    <div className="screen">
      <div className="session-top">
        <button className="topbar-back" onClick={() => setExitOpen(true)} aria-label={t('common.close')}><X size={20} /></button>
        <div className="session-progress-track">
          <div className="session-progress-fill" style={{ width: `${Math.min(100, progress * 100)}%` }} />
        </div>
        <span className="session-count">
          {isMatching ? t('learn.round', { n: roundIdx + 1 }) : t('learn.sessionProgress', { i: index + 1, n: queue.length })}
        </span>
      </div>

      <div className="screen-body no-nav">
        {isMatching ? (
          <>
            <p className="quiz-prompt" style={{ textAlign: 'center', marginTop: '0.8rem' }}>{t('learn.matchPairs')}</p>
            <div className="match-grid">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {(rounds[roundIdx] ?? []).map((w) => (
                  <button key={w.id}
                    className={`match-tile ${selWord === w.id ? 'sel' : ''} ${matched.has(w.id) ? 'done' : ''}`}
                    onClick={() => tapMatch('word', w.id)}>
                    {w.article ? `${w.article} ` : ''}{w.german}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {rightOrder.map((id) => {
                  const w = queue.find((x) => x.id === id)!;
                  return (
                    <button key={id}
                      className={`match-tile ${selMeaning === id ? 'sel' : ''} ${matched.has(id) ? 'done' : ''} ${shakeId === id ? 'shake' : ''}`}
                      onClick={() => tapMatch('meaning', id)}>
                      {meaning(w)}
                    </button>
                  );
                })}
              </div>
            </div>
            {matched.size === (rounds[roundIdx] ?? []).length ? (
              <p style={{ textAlign: 'center', color: 'var(--green-text)', fontWeight: 800 }} className="anim-in">✓ {t('learn.matchedAll')}</p>
            ) : null}
          </>
        ) : mode === 'flashcard' || mode === 'hard' ? (
          <>
            <div className="flashcard-scene">
              <div className={`flashcard ${flipped ? 'flipped' : ''}`} style={{ ['--accent' as string]: accent }}
                onClick={() => { if (!flipped) { setFlipped(true); playTone('flip', settings.soundOn); } }}>
                <div className="flash-face">
                  <button className="icon-btn flash-audio" onClick={(e) => { e.stopPropagation(); speak(current.german); }} aria-label={t('learn.playAudio')}>
                    <Volume2 size={17} />
                  </button>
                  {current.article && !hideArticle ? (
                    <span className="article-badge solid lg" style={{ background: accent }}>{current.article}</span>
                  ) : current.article ? (
                    <span className="chip gray">{t('learn.hideArticle')}</span>
                  ) : null}
                  <div className="flash-word">{current.german}</div>
                  <div className="muted-3" style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: '0.5rem' }}>
                    {t(`common.${current.type}`)}{current.level ? ` · ${current.level}` : ''}
                  </div>
                  <div className="flash-hint"><RotateCcw size={13} /> {t('learn.tapToFlip')}</div>
                </div>
                <div className="flash-face flash-back">
                  {current.article ? (
                    <span className="article-badge solid lg" style={{ background: accent }}>{current.article}</span>
                  ) : null}
                  <div className="flash-meaning">{meaning(current)}</div>
                  {current.noun?.plural ? <div className="muted" style={{ fontSize: '0.82rem', marginTop: '0.4rem' }}>{t('common.plural')}: {current.noun.plural}</div> : null}
                  {current.verb?.partizip2 ? <div className="muted" style={{ fontSize: '0.82rem', marginTop: '0.4rem' }}>Perfekt: {current.verb.auxiliary === 'sein' ? 'ist' : 'hat'} {current.verb.partizip2}</div> : null}
                  {current.examples[0] ? (
                    <div className="flash-example">
                      <div>“{current.examples[0].de}”</div>
                      {current.examples[0].tr ? (
                        <div className="flash-example-tr">{current.examples[0].tr}</div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            {flipped ? (
              <div className="rating-row anim-in">
                <button className="rating-btn again" onClick={() => rateFlashcard(0)}>{t('learn.again')}<small>10 dk</small></button>
                <button className="rating-btn hard" onClick={() => rateFlashcard(1)}>{t('learn.hardBtn')}<small>×1.2</small></button>
                <button className="rating-btn good" onClick={() => rateFlashcard(2)}>{t('learn.good')}<small>SRS</small></button>
                <button className="rating-btn easy" onClick={() => rateFlashcard(3)}>{t('learn.easy')}<small>×1.3</small></button>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem' }}>
                <button className="btn outline" onClick={() => setHideArticle((v) => !v)}>
                  <Eye size={15} /> {t('learn.hideArticle')}
                </button>
                <button className="btn primary" onClick={() => { setFlipped(true); playTone('flip', settings.soundOn); }}>
                  <RotateCcw size={15} /> {t('learn.flip')}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="card quiz-card anim-in" key={index}>
            {mode === 'article' ? (
              <>
                <div className="quiz-prompt">{t('learn.whichArticle')}</div>
                <div className="quiz-word">{current.german}</div>
                <div className="quiz-sub">{meaning(current)}</div>
                <div className="quiz-options" style={{ flexDirection: 'row' }}>
                  {ARTICLES.map((a) => (
                    <button key={a}
                      className={`quiz-option article-opt ${feedback ? (a === current.article ? 'correct' : picked === a ? 'wrong' : 'dim') : ''}`}
                      style={{ flex: 1, color: feedback ? undefined : settings.articleColors[a] }}
                      onClick={() => pickOption(a, current.article!)}>
                      {a}
                    </button>
                  ))}
                </div>
              </>
            ) : mode === 'meaning' ? (
              <>
                <div className="quiz-prompt">{t('learn.whatMeaning')}</div>
                <div className="quiz-word">
                  {current.article ? <span className="article-badge solid lg" style={{ background: accent, verticalAlign: 'middle', marginRight: '0.6rem' }}>{current.article}</span> : null}
                  {current.german}
                </div>
                <button className="icon-btn" style={{ margin: '0.4rem auto 0' }} onClick={() => speak(current.german)} aria-label={t('learn.playAudio')}><Volume2 size={16} /></button>
                <div className="quiz-options">
                  {meaningOptions.map((opt) => (
                    <button key={opt}
                      className={`quiz-option ${feedback ? (opt === meaning(current) ? 'correct' : picked === opt ? 'wrong' : 'dim') : ''}`}
                      onClick={() => pickOption(opt, meaning(current))}>
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            ) : mode === 'listening' ? (
              <>
                <div className="quiz-prompt">{t('learn.listenChoose')}</div>
                <button className="btn gradient" style={{ margin: '1rem auto 0.4rem', borderRadius: 999, width: '4.2rem', height: '4.2rem', padding: 0 }} onClick={() => speak(current.german)} aria-label={t('learn.playAudio')}>
                  <Volume2 size={26} />
                </button>
                {ttsFailed ? <div className="quiz-word" style={{ fontSize: '1.6rem', textAlign: 'center', fontWeight: 800 }}>{current.german}</div> : null}
                <div className="quiz-options">
                  {wordOptions.map((opt) => (
                    <button key={opt}
                      className={`quiz-option ${feedback ? (opt === current.german ? 'correct' : picked === opt ? 'wrong' : 'dim') : ''}`}
                      onClick={() => pickOption(opt, current.german)}>
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            ) : mode === 'writing' ? (
              <>
                <div className="quiz-prompt">{t('learn.writeGerman')}</div>
                <div className="quiz-word" style={{ fontSize: '1.5rem' }}>{meaning(current)}</div>
                <div className="quiz-sub">{t(`common.${current.type}`)}{current.level ? ` · ${current.level}` : ''}</div>
                <input
                  ref={inputRef}
                  className="writing-input" value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (feedback ? advance() : checkWriting())}
                  placeholder={t('learn.writePlaceholder')}
                  disabled={!!feedback}
                  autoCapitalize="off" autoCorrect="off" spellCheck={false}
                />
                <div className="umlaut-row">
                  {['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'].map((c) => (
                    <button key={c} className="umlaut-key" onClick={() => { setAnswerText((v) => v + c); inputRef.current?.focus(); }}>{c}</button>
                  ))}
                </div>
                {!feedback ? (
                  <button className="btn primary block" style={{ marginTop: '0.9rem' }} disabled={!answerText.trim()} onClick={checkWriting}>
                    {t('common.check')}
                  </button>
                ) : null}
              </>
            ) : mode === 'sentence' && sentenceData ? (
              <>
                <div className="quiz-prompt">{t('learn.fillBlank')}</div>
                <div className="sentence-text">
                  {sentenceData.before}
                  <span className="sentence-blank">{feedback ? current.german : '______'}</span>
                  {sentenceData.after}
                </div>
                <div className="quiz-sub" style={{ marginTop: '0.6rem', fontStyle: 'italic' }}>{sentenceData.tr}</div>
                <div className="quiz-options">
                  {wordOptions.map((opt) => (
                    <button key={opt}
                      className={`quiz-option ${feedback ? (opt === current.german ? 'correct' : picked === opt ? 'wrong' : 'dim') : ''}`}
                      onClick={() => pickOption(opt, current.german)}>
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {feedback && mode !== 'writing' ? (
              <div className={`quiz-feedback ${feedback.ok ? 'ok' : 'bad'}`}>
                <div className="quiz-feedback-title">
                  {feedback.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  {feedback.ok ? t('learn.wellDone') : t('learn.notQuite')}
                </div>
                <div className="quiz-feedback-body">
                  {current.article ? `${current.article} ` : ''}{current.german} — {meaning(current)}
                  {current.examples[0] ? <><br />“{current.examples[0].de}”</> : null}
                </div>
              </div>
            ) : null}
            {feedback && mode === 'writing' ? (
              <div className={`quiz-feedback ${feedback.ok ? 'ok' : 'bad'}`}>
                <div className="quiz-feedback-title">
                  {feedback.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  {feedback.ok ? t('learn.wellDone') : t('learn.notQuite')}
                </div>
                <div className="quiz-feedback-body">
                  {t('learn.correctAnswer')}: <strong>{feedback.answer}</strong>
                  {!feedback.ok ? <><br />{t('learn.yourAnswer')}: {answerText}</> : null}
                </div>
              </div>
            ) : null}
            {feedback ? (
              <button className="btn primary block" style={{ marginTop: '0.9rem' }} onClick={advance}>
                {index + 1 >= queue.length ? t('common.finish') : t('common.next')} <ArrowRight size={16} />
              </button>
            ) : null}
          </div>
        )}
      </div>

      {exitOpen ? (
        <Modal title={t('learn.exitConfirm')} onClose={() => setExitOpen(false)}
          actions={
            <>
              <button className="btn outline" onClick={() => setExitOpen(false)}>{t('learn.keepGoing')}</button>
              <button className="btn danger" onClick={back}>{t('learn.exit')}</button>
            </>
          }
        />
      ) : null}
    </div>
  );
}