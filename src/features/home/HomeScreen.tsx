import { useMemo, useState } from 'react';
import {
  BookOpen, GraduationCap, Flame, Bell, Pencil, Sparkles, Volume2, Heart,
  ChevronRight, Clock, PlusCircle, ClipboardList, Bookmark, ArrowDownRight,
} from 'lucide-react';
import { useStore } from '../../core/store';
import { useNav } from '../../app/navigation';
import { useI18n, useMeaning, formatLocaleDate } from '../../localization';
import { dueWords, overdueWords, recallRate, isStruggling } from '../../core/srs';
import { todayProgress, computeStreak, wordOfDay } from '../../core/selectors';
import { ArticleBadge, ProgressRing, TopBar, Modal, Stepper } from '../../shared/ui';
import { speakGerman } from '../../core/audio';
import { toast } from '../../shared/toastStore';
import { DAY, startOfDay } from '../../core/types';

export default function HomeScreen() {
  const { t, lang } = useI18n();
  const meaning = useMeaning();
  const words = useStore((s) => s.words);
  const logs = useStore((s) => s.reviewLogs);
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const { push, setTab } = useNav();
  const [goalModal, setGoalModal] = useState(false);
  const [goalDraft, setGoalDraft] = useState(settings.dailyGoal);

  const now = Date.now();
  const today = startOfDay(now);
  const done = todayProgress(logs, now);
  const goalPct = settings.dailyGoal > 0 ? Math.min(100, Math.round((done / settings.dailyGoal) * 100)) : 0;
  const due = dueWords(words, now);
  const overdue = overdueWords(words, today);
  const dueToday = due.length - overdue.length;
  const streak = computeStreak(logs, now);
  const wod = useMemo(() => wordOfDay(words, now), [words, today]);
  const learned = words.filter((w) => w.srs.state === 'learned').length;
  const recent = useMemo(() => [...words].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3), [words]);
  const hardCount = words.filter(isStruggling).length;

  const hour = new Date(now).getHours();
  const greeting =
    hour < 6 ? t('home.goodNight') : hour < 12 ? t('home.goodMorning')
    : hour < 18 ? t('home.goodDay') : t('home.goodEvening2');

  const speak = (text: string) => {
    speakGerman(text, settings.ttsRate, () => toast(t('learn.ttsMissing'), 'err'));
  };

  const startSmartReview = () => {
    const pool = due.length > 0 ? due : words.filter((w) => w.srs.state === 'new');
    if (pool.length === 0) {
      toast(t('home.noReview'), 'info');
      return;
    }
    push({ name: 'session', mode: 'flashcard', wordIds: pool.slice(0, 20).map((w) => w.id) });
  };

  return (
    <div className="screen">
      <TopBar title={t('tabs.home')} icon={<BookOpen size={19} />} />
      <div className="screen-body">
        <div className="greet-row anim-in">
          <div className="greet-avatar"><GraduationCap size={24} /></div>
          <div>
            <div className="greet-date">{formatLocaleDate(now, lang)}</div>
            <div className="greet-title">{greeting}</div>
          </div>
          <div className="greet-actions">
            <span className="streak-pill"><Flame size={14} /> {t('home.streakPill', { n: streak })}</span>
            <button className="bell-btn" onClick={() => setTab('settings')} aria-label={t('settings.notifications')}>
              <Bell size={17} />
              {due.length > 0 ? <span className="bell-dot" /> : null}
            </button>
          </div>
        </div>
        <p className="home-subtitle anim-in">{t('home.subtitle')}</p>

        <div className="card goal-card anim-in-1">
          <div className="goal-left">
            <div className="goal-head">
              {t('home.dailyGoal')}
              <button className="goal-edit" onClick={() => { setGoalDraft(settings.dailyGoal); setGoalModal(true); }} aria-label={t('home.editGoal')}>
                <Pencil size={12} />
              </button>
            </div>
            <div className="goal-num">{done}<span> {t('home.ofWords', { n: settings.dailyGoal })}</span></div>
            <div className="goal-meta">
              <span className="chip">{t('home.completedPct', { n: goalPct })}</span>
              <span className="remaining">
                {done >= settings.dailyGoal ? t('home.goalDone') : t('home.remaining', { n: settings.dailyGoal - done })}
              </span>
            </div>
          </div>
          <ProgressRing pct={goalPct} />
        </div>

        {wod ? (
          <div className="card wod-card anim-in-2">
            <div className="wod-head">
              <Sparkles size={15} /> {t('home.wordOfDay')}
              <div className="wod-actions">
                <button className="icon-btn" onClick={() => speak(wod.german)} aria-label={t('learn.playAudio')}>
                  <Volume2 size={16} />
                </button>
                <button
                  className={`icon-btn ${wod.favorite ? 'fav' : ''}`}
                  onClick={() => toggleFavorite(wod.id)}
                  aria-label={t('common.favorites')}
                >
                  <Heart size={16} fill={wod.favorite ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
            <button style={{ width: '100%', textAlign: 'left' }} onClick={() => push({ name: 'wordDetail', id: wod.id })}>
              <div className="wod-word-row">
                <ArticleBadge article={wod.article} solid lg />
                <span className="wod-word">{wod.german}</span>
              </div>
              <div className="wod-meaning-row">
                <div>
                  <div className="wod-meaning">{meaning(wod)}</div>
                  <div className="wod-type">{t(`common.${wod.type}`)}{wod.level ? ` · ${wod.level}` : ''}</div>
                </div>
                <ChevronRight size={19} className="wod-chevron" />
              </div>
              {wod.examples[0] ? <div className="wod-example">“{wod.examples[0].de}”</div> : null}
            </button>
          </div>
        ) : null}

        {due.length > 0 ? (
          <div className="review-banner anim-in-3">
            <div>
              <div className="review-banner-title"><Clock size={17} /> {t('home.reviewTime')}</div>
              <div className="review-banner-sub">{t('home.waitingWords', { n: due.length })}</div>
              <div className="review-banner-meta">{t('home.overdueToday', { o: overdue.length, t: dueToday })}</div>
            </div>
            <button className="btn white" onClick={startSmartReview}>{t('home.startReview')}</button>
          </div>
        ) : words.length > 0 ? (
          <div className="review-banner anim-in-3">
            <div>
              <div className="review-banner-title"><Sparkles size={17} /> {t('home.noReview')}</div>
            </div>
            <button className="btn white" onClick={() => setTab('learn')}>{t('tabs.learn')}</button>
          </div>
        ) : null}

        <div className="quick-grid anim-in-4">
          <button className="quick-card indigo" onClick={() => push({ name: 'wordEditor' })}>
            <span className="quick-icon"><PlusCircle size={19} /></span> {t('home.addWord')}
          </button>
          <button className="quick-card violet" onClick={() => push({ name: 'sessionSetup', mode: 'meaning' })}>
            <span className="quick-icon"><ClipboardList size={19} /></span> {t('home.solveTest')}
          </button>
          <button className="quick-card green" onClick={() => push({ name: 'collections' })}>
            <span className="quick-icon"><Bookmark size={19} /></span> {t('home.myCollections')}
          </button>
          <button
            className="quick-card rose"
            onClick={() => {
              const hard = words.filter(isStruggling);
              if (hard.length === 0) { toast(t('learn.noHard'), 'info'); return; }
              push({ name: 'session', mode: 'flashcard', wordIds: hard.map((w) => w.id) });
            }}
          >
            <span className="quick-icon"><ArrowDownRight size={19} /></span> {t('home.hardWords')}
          </button>
        </div>

        <div className="section-head"><span className="section-title">{t('home.summary')}</span></div>
        <div className="summary-grid">
          <div className="card summary-card"><div className="summary-num indigo">{words.length}</div><div className="summary-label">{t('home.totalWords')}</div></div>
          <div className="card summary-card"><div className="summary-num green">{learned}</div><div className="summary-label">{t('home.learnedWords')}</div></div>
          <div className="card summary-card"><div className="summary-num violet">{t('home.streakPill', { n: streak })}</div><div className="summary-label">{t('home.streak')}</div></div>
          <div className="card summary-card"><div className="summary-num indigo">%{recallRate(words)}</div><div className="summary-label">{t('home.recall')}</div></div>
        </div>

        <div className="section-head">
          <span className="section-title">{t('home.recent')}</span>
          <button className="link-btn" onClick={() => setTab('words')}>{t('common.seeAll')}</button>
        </div>
        {recent.map((w) => (
          <button key={w.id} className="card recent-row" onClick={() => push({ name: 'wordDetail', id: w.id })}>
            <ArticleBadge article={w.article} solid />
            <div>
              <div className="recent-word">{w.german}</div>
              <div className="recent-meaning">{meaning(w)}</div>
            </div>
            <span
              className="icon-btn"
              role="button"
              onClick={(e) => { e.stopPropagation(); speak(w.german); }}
              aria-label={t('learn.playAudio')}
            >
              <Volume2 size={15} />
            </span>
          </button>
        ))}
      </div>

      {goalModal ? (
        <Modal
          title={t('home.goalTitle')} onClose={() => setGoalModal(false)}
          actions={
            <>
              <button className="btn outline" onClick={() => setGoalModal(false)}>{t('common.cancel')}</button>
              <button className="btn primary" onClick={() => { updateSettings({ dailyGoal: goalDraft }); setGoalModal(false); toast(t('common.saved')); }}>
                {t('common.save')}
              </button>
            </>
          }
        >
          <div className="goal-big">
            <div className="n">{goalDraft}</div>
            <div className="l">{t('onboarding.perDay')}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Stepper value={goalDraft} min={1} max={100} step={1} onChange={setGoalDraft} />
          </div>
        </Modal>
      ) : null}
    </div>
  );
}