import {
  BookOpen, ArrowLeft, Flame, Play, ArrowRight, ChevronRight, SlidersHorizontal,
  Copy, Tag, ClipboardList, PenLine, Headphones, CircleDot, AlignLeft, Zap,
  Stethoscope, Building2, FileCheck2, Check,
} from 'lucide-react';
import { useStore } from '../../core/store';
import { useNav } from '../../app/navigation';
import { useI18n } from '../../localization';
import {
  StudyMode, DAY, LEARN_LEVELS, Level, matchesSelectedLevels, startOfDay,
} from '../../core/types';
import { dueWords, isStruggling } from '../../core/srs';
import { todayProgress, computeStreak } from '../../core/selectors';
import { ProgressRing } from '../../shared/ui';
import { toast } from '../../shared/toastStore';

const MODES: { mode: StudyMode; icon: typeof Copy; color: string }[] = [
  { mode: 'flashcard', icon: Copy, color: 'indigo' },
  { mode: 'article', icon: Tag, color: 'violet' },
  { mode: 'meaning', icon: ClipboardList, color: 'green' },
  { mode: 'writing', icon: PenLine, color: 'blue' },
  { mode: 'listening', icon: Headphones, color: 'magenta' },
  { mode: 'matching', icon: CircleDot, color: 'green' },
  { mode: 'sentence', icon: AlignLeft, color: 'blue' },
  { mode: 'hard', icon: Zap, color: 'rose' },
];

export default function LearnScreen() {
  const { t } = useI18n();
  const words = useStore((s) => s.words);
  const logs = useStore((s) => s.reviewLogs);
  const sessions = useStore((s) => s.sessions);
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const { push, back, stack } = useNav();

  const selectedLevels: Level[] = settings.learnLevels ?? [];
  const toggleLevel = (lvl: Level) => {
    const next = selectedLevels.includes(lvl)
      ? selectedLevels.filter((x) => x !== lvl)
      : [...selectedLevels, lvl];
    updateSettings({ learnLevels: next });
  };
  const clearLevels = () => updateSettings({ learnLevels: [] });

  const scopedWords = words.filter((w) => matchesSelectedLevels(w.level, selectedLevels));
  const now = Date.now();
  const due = dueWords(scopedWords, now);
  const newWords = scopedWords.filter((w) => w.srs.state === 'new');
  const hard = scopedWords.filter(isStruggling);
  const done = todayProgress(logs, now);
  const goalPct = settings.dailyGoal > 0 ? Math.min(100, Math.round((done / settings.dailyGoal) * 100)) : 0;
  const streak = computeStreak(logs, now);

  const smartStart = () => {
    const pool = [...due, ...newWords].slice(0, 20);
    if (pool.length === 0) { toast(t('learn.notEnough'), 'info'); return; }
    push({
      name: 'session',
      mode: 'flashcard',
      wordIds: pool.map((w) => w.id),
      level: selectedLevels.length === 1 ? selectedLevels[0] : null,
    });
  };

  const relTime = (ts: number): string => {
    const today = startOfDay(now);
    if (ts >= today) return t('common.today');
    if (ts >= today - DAY) return t('common.yesterday');
    return t('common.daysAgo', { n: Math.round((today - startOfDay(ts)) / DAY) });
  };

  return (
    <div className="screen">
      <header className="topbar">
        {stack.length > 0 ? (
          <button className="topbar-back" onClick={back} aria-label={t('common.back')}><ArrowLeft size={21} /></button>
        ) : null}
        <div className="topbar-title"><span className="topbar-tile"><BookOpen size={19} /></span>{t('learn.title')}</div>
        <button className="topbar-btn solid" onClick={() => useNav.getState().setTab('settings')} aria-label={t('tabs.settings')}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" /></svg>
        </button>
      </header>
      <div className="screen-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.9rem' }} className="anim-in">
          <p className="muted" style={{ fontSize: '0.85rem' }}>{t('learn.subtitle')}</p>
          <span className="streak-pill"><Flame size={14} /> {t('home.streakPill', { n: streak })}</span>
        </div>

        <div className="card learn-summary anim-in-1">
          <div className="learn-summary-head">
            <div>
              <div className="eyebrow">{t('learn.dailySummary')}</div>
              <div className="learn-summary-title">{t('learn.goalReady')}</div>
            </div>
            <ProgressRing pct={goalPct} size={62} stroke={7} small />
          </div>

          <div className="level-check-section">
            <div className="level-check-head">
              <span className="eyebrow" style={{ margin: 0 }}>SEVİYE SEÇİMİ</span>
              {selectedLevels.length > 0 ? (
                <button className="link-btn" style={{ fontSize: '0.72rem' }} onClick={clearLevels}>
                  Tümü ({words.length})
                </button>
              ) : (
                <span className="muted-3" style={{ fontSize: '0.72rem', fontWeight: 600 }}>Tümü aktif</span>
              )}
            </div>
            <div className="level-check-grid">
              {LEARN_LEVELS.map((lvl) => {
                const checked = selectedLevels.includes(lvl);
                return (
                  <button
                    key={lvl}
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    className={`level-check-pill ${checked ? 'on' : ''}`}
                    onClick={() => toggleLevel(lvl)}
                  >
                    <span className={`mini-cb ${checked ? 'on' : ''}`}>
                      {checked ? <Check size={11} strokeWidth={3.2} /> : null}
                    </span>
                    <span>{lvl}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="learn-stats">
            <div className="learn-stat indigo"><div className="n">{due.length}</div><div className="l">{t('learn.dueCount')}</div></div>
            <div className="learn-stat green"><div className="n">{newWords.length}</div><div className="l">{t('learn.newCount')}</div></div>
            <div className="learn-stat rose"><div className="n">{hard.length}</div><div className="l">{t('learn.hardCount')}</div></div>
          </div>
          <button className="btn gradient block lg" onClick={smartStart}>
            <Play size={17} fill="currentColor" /> {t('learn.smartReview')}
            {selectedLevels.length > 0 ? ` (${selectedLevels.join(', ')})` : ''}
          </button>
        </div>

        <div className="section-head">
          <span className="section-title">Pratik & İletişim</span>
          <span className="chip">B1.2 – B2</span>
        </div>
        <div className="practice-hub anim-in-1">
          <button className="card practice-card" onClick={() => push({ name: 'doctorDialogues' })}>
            <span className="mode-icon rose"><Stethoscope size={20} /></span>
            <div className="practice-card-body">
              <div className="practice-card-title">Hasta–Doktor Diyalogları <span className="level-chip">B2</span></div>
              <div className="practice-card-desc">Randevu, şikâyet, muayene, teşhis, ilaç ve kontrol testleri</div>
            </div>
            <ChevronRight size={18} className="muted-3" />
          </button>
          <button className="card practice-card" onClick={() => push({ name: 'officialComms' })}>
            <span className="mode-icon blue"><Building2 size={20} /></span>
            <div className="practice-card-body">
              <div className="practice-card-title">Resmî Kurumlarla İletişim <span className="level-chip">B1.2</span></div>
              <div className="practice-card-desc">Bürgeramt, Ausländerbehörde, Jobcenter, Finanzamt & e-posta rehberi</div>
            </div>
            <ChevronRight size={18} className="muted-3" />
          </button>
          <button className="card practice-card" onClick={() => push({ name: 'writingReview' })}>
            <span className="mode-icon green"><FileCheck2 size={20} /></span>
            <div className="practice-card-body">
              <div className="practice-card-title">Metin Yazma & Gramer İnceleme</div>
              <div className="practice-card-desc">Almanca metin yaz, hatalarını gör, kişiselleştirilmiş gramer testi çöz</div>
            </div>
            <ChevronRight size={18} className="muted-3" />
          </button>
        </div>

        <div className="section-head">
          <span className="section-title">{t('learn.modes')}</span>
          <span className="chip gray">{t('learn.modesCount', { n: MODES.length })}</span>
        </div>
        <div className="mode-grid anim-in-2">
          {MODES.map(({ mode, icon: Icon, color }) => (
            <button key={mode} className="card mode-card" onClick={() => push({ name: 'sessionSetup', mode })}>
              <span className={`mode-icon ${color}`}><Icon size={19} /></span>
              <ArrowRight size={16} className="mode-arrow" />
              <div className="mode-title">{t(`learn.${mode}`)}</div>
              <div className="mode-desc">{t(`learn.${mode}Desc`)}</div>
            </button>
          ))}
        </div>

        <button className="custom-banner anim-in-3" onClick={() => push({ name: 'sessionSetup' })}>
          <span className="custom-icon"><SlidersHorizontal size={19} /></span>
          <span>
            <span className="custom-title">{t('learn.custom')}</span>
            <div className="custom-desc">{t('learn.customDesc')}</div>
          </span>
          <ChevronRight size={19} />
        </button>

        <div className="section-head"><span className="section-title">{t('learn.recentSessions')}</span></div>
        {sessions.length === 0 ? (
          <div className="card" style={{ padding: '1.2rem', textAlign: 'center' }}>
            <p className="muted" style={{ fontSize: '0.85rem' }}>{t('learn.noSessionsDesc')}</p>
          </div>
        ) : sessions.slice(0, 5).map((s) => {
          const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
          const meta = MODES.find((m) => m.mode === s.mode) ?? MODES[0];
          const Icon = meta.icon;
          return (
            <div key={s.id} className="card session-row">
              <span className={`mode-icon ${meta.color}`} style={{ width: '2.3rem', height: '2.3rem' }}><Icon size={16} /></span>
              <div>
                <div className="session-title">{t(`learn.${s.mode}`)} · %{pct}</div>
                <div className="session-meta">{t('collections.wordsCount', { n: s.total })} · {relTime(s.ts)}</div>
              </div>
              {pct >= 85 ? <span className="chip green">{t('learn.great')}</span>
                : s.level ? <span className="chip">{s.level}</span>
                : <span className="chip green">{t('learn.completed')}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
