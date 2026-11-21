import { useMemo, useState } from 'react';
import {
  BookOpen, Flame, TrendingUp, CheckCircle2, Clock, Brain, Tag, Timer, AlertTriangle,
} from 'lucide-react';
import { useStore } from '../../core/store';
import { useI18n } from '../../localization';
import { DAY, startOfDay } from '../../core/types';
import { dueWords, recallRate, isStruggling } from '../../core/srs';
import {
  computeStreak, weeklyBars, heatCells, statusDistribution, cefrDistribution,
  articleAccuracy, hardestWords, addedThisWeek,
} from '../../core/selectors';
import { TopBar, ArticleBadge } from '../../shared/ui';
import { useNav } from '../../app/navigation';

type Period = 7 | 30 | 90 | 0;

const DONUT_COLORS: Record<string, string> = {
  learned: '#059669', review: '#4338CA', learning: '#E11D48', new: '#c7c9f4', struggling: '#dc2626',
};
const CEFR_COLORS = ['#10b981', '#4338ca', '#e11d48', '#a5b4fc', '#c7c9f4', '#ddd6fe'];

function Donut({ data, total }: { data: { state: string; count: number }[]; total: number }) {
  const size = 132, stroke = 17, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        {data.filter((d) => d.count > 0).map((d) => {
          const frac = total > 0 ? d.count / total : 0;
          const el = (
            <circle key={d.state} cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={DONUT_COLORS[d.state]} strokeWidth={stroke}
              strokeDasharray={`${Math.max(0, frac * c - 2)} ${c}`}
              strokeDashoffset={-offset * c}
              style={{ transition: 'stroke-dasharray 0.6s ease' }} />
          );
          offset += frac;
          return el;
        })}
      </svg>
      <div className="donut-center"><span className="n">{total}</span><span className="l">{useI18n().t('stats.total')}</span></div>
    </div>
  );
}

export default function StatsScreen() {
  const { t, weekdays } = useI18n();
  const words = useStore((s) => s.words);
  const allLogs = useStore((s) => s.reviewLogs);
  const sessions = useStore((s) => s.sessions);
  const { push } = useNav();
  const [period, setPeriod] = useState<Period>(7);

  const now = Date.now();
  const today = startOfDay(now);
  const logs = useMemo(
    () => (period === 0 ? allLogs : allLogs.filter((l) => l.ts >= today - (period - 1) * DAY)),
    [allLogs, period, today],
  );

  const learned = words.filter((w) => w.srs.state === 'learned').length;
  const due = dueWords(words, now).length;
  const streak = computeStreak(allLogs, now);
  const bars = weeklyBars(logs, now);
  const weekTotal = bars.reduce((a, b) => a + b.count, 0);
  const maxBar = Math.max(1, ...bars.map((b) => b.count));
  const todayIdx = (new Date(today).getDay() + 6) % 7;
  const bestIdx = bars.reduce((best, b, i) => (b.count > bars[best].count ? i : best), 0);
  const dist = statusDistribution(words);
  const cefr = cefrDistribution(words);
  const maxCefr = Math.max(1, ...cefr.map((c) => c.count));
  const heat = heatCells(logs, now, 4);
  const maxHeat = Math.max(1, ...heat.map((h) => h.count));
  const hard = hardestWords(words, 5);
  const artAcc = articleAccuracy(logs);
  const avgMin = sessions.length > 0
    ? Math.max(1, Math.round(sessions.reduce((a, s) => a + s.durationSec, 0) / sessions.length / 60))
    : 0;
  const learnedPct = words.length > 0 ? Math.round((learned / words.length) * 1000) / 10 : 0;

  const heatColor = (count: number): string => {
    if (count < 0) return 'var(--surface-2)';
    if (count === 0) return 'var(--tint)';
    const level = Math.min(4, Math.ceil((count / maxHeat) * 4));
    return ['#a7f3d0', '#6ee7b7', '#34d399', '#059669', '#065f46'][level];
  };

  return (
    <div className="screen">
      <TopBar title={t('tabs.stats')} icon={<BookOpen size={19} />} solidProfile />
      <div className="screen-body">
        <div className="words-head anim-in" style={{ paddingBottom: '0.4rem' }}>
          <div>
            <div className="words-title">{t('stats.title')}</div>
            <div className="words-count">{t('stats.subtitle')}</div>
          </div>
          <span className="streak-pill"><Flame size={14} /> {t('stats.streakPill', { n: streak })}</span>
        </div>

        <div className="segmented anim-in-1">
          {([7, 30, 90, 0] as Period[]).map((p) => (
            <button key={p} className={period === p ? 'active' : ''} onClick={() => setPeriod(p)}>
              {t(p === 7 ? 'stats.period7' : p === 30 ? 'stats.period30' : p === 90 ? 'stats.period90' : 'stats.periodAll')}
            </button>
          ))}
        </div>

        <div className="stat-grid anim-in-2">
          <div className="card stat-card">
            <div className="stat-card-head">
              <span className="stat-card-label">{t('stats.totalWords')}</span>
              <span className="stat-icon" style={{ background: 'var(--tint)', color: 'var(--primary)' }}><BookOpen size={15} /></span>
            </div>
            <div className="stat-num">{words.length}</div>
            <span className="chip green"><TrendingUp size={11} /> {t('stats.thisWeek', { n: addedThisWeek(words, now) })}</span>
          </div>
          <div className="card stat-card">
            <div className="stat-card-head">
              <span className="stat-card-label">{t('stats.learned')}</span>
              <span className="stat-icon" style={{ background: 'var(--green-tint)', color: 'var(--green)' }}><CheckCircle2 size={15} /></span>
            </div>
            <div className="stat-num">{learned}</div>
            <span className="chip green">{t('stats.pctCompleted', { n: Math.round(learnedPct) })}</span>
          </div>
          <div className="card stat-card">
            <div className="stat-card-head">
              <span className="stat-card-label">{t('stats.dueNow')}</span>
              <span className="stat-icon" style={{ background: 'var(--rose-tint)', color: 'var(--rose)' }}><Clock size={15} /></span>
            </div>
            <div className="stat-num rose">{due}</div>
            <span className="chip rose">{t('stats.readyToday')}</span>
          </div>
          <div className="card stat-card">
            <div className="stat-card-head">
              <span className="stat-card-label">{t('stats.recallRate')}</span>
              <span className="stat-icon" style={{ background: 'var(--tint)', color: 'var(--primary)' }}><Brain size={15} /></span>
            </div>
            <div className="stat-num indigo">%{recallRate(words)}</div>
            <span className="chip green">{t('stats.goingGreat')}</span>
          </div>
        </div>

        <div className="card chart-card anim-in-3">
          <div className="chart-head">
            <div>
              <div className="chart-title">{t('stats.weekly')}</div>
              <div className="chart-sub">{t('stats.weeklyDesc')}</div>
            </div>
            <span className="chip">{t('stats.wordsChip', { n: weekTotal })}</span>
          </div>
          <div className="bars">
            {bars.map((b, i) => (
              <div className="bar-col" key={i}>
                {i === todayIdx || (i === bestIdx && b.count > 0) ? (
                  <span className={`bar-val ${i === bestIdx && i !== todayIdx ? 'green' : ''}`}>{b.count}</span>
                ) : null}
                <div
                  className={`bar ${i === todayIdx ? 'today' : i === bestIdx && b.count > 0 ? 'best' : ''}`}
                  style={{ height: `${Math.max(6, (b.count / maxBar) * 100)}%` }}
                />
                <span className={`bar-label ${i === todayIdx ? 'today' : i === bestIdx && b.count > 0 ? 'best' : ''}`}>{weekdays[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card chart-card">
          <div className="chart-head">
            <div className="chart-title">{t('stats.distribution')}</div>
            <span className="chip">{t('collections.wordsCount', { n: words.length })}</span>
          </div>
          <div className="donut-row">
            <Donut data={dist} total={words.length} />
            <div className="legend">
              {dist.map((d) => (
                <div className="legend-row" key={d.state}>
                  <span className="legend-dot" style={{ background: DONUT_COLORS[d.state] }} />
                  {t(`common.${d.state}`)}
                  <span className={`legend-pct ${d.state === 'struggling' ? 'rose' : ''}`}>
                    %{words.length > 0 ? Math.round((d.count / words.length) * 100) : 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card chart-card">
          <div className="chart-head">
            <div className="chart-title">{t('stats.cefr')}</div>
            <span className="chip">A1 – C2</span>
          </div>
          {cefr.map((c, i) => (
            <div className="cefr-row" key={c.level}>
              <span className="cefr-label">{c.level}</span>
              <div className="cefr-track">
                <div className="cefr-fill" style={{ width: `${(c.count / maxCefr) * 100}%`, background: CEFR_COLORS[i] }} />
              </div>
              <span className="cefr-count">{c.learned}/{c.count}</span>
            </div>
          ))}
        </div>

        <div className="card chart-card">
          <div className="chart-head">
            <div className="chart-title">{t('stats.calendar')}</div>
            <span className="chip">{t('stats.last4Weeks')}</span>
          </div>
          <div className="heat-grid">
            {heat.map((h) => (
              <div key={h.ts} className="heat-cell" style={{ background: heatColor(h.count) }}
                title={h.count >= 0 ? `${new Date(h.ts).toLocaleDateString()} · ${h.count}` : ''} />
            ))}
          </div>
          <div className="heat-legend">
            {t('stats.less')}
            {[0, 1, 2, 3, 4].map((l) => (
              <span key={l} className="heat-cell" style={{ background: ['#eef0fe', '#a7f3d0', '#6ee7b7', '#34d399', '#065f46'][l] }} />
            ))}
            {t('stats.more')}
          </div>
        </div>

        <div className="stat-grid" style={{ marginTop: '0.85rem' }}>
          <div className="card mini-stat">
            <span className="stat-icon" style={{ background: 'var(--tint)', color: 'var(--primary)' }}><Tag size={15} /></span>
            <div className="l">{t('stats.articleSuccess')}</div>
            <div className="v indigo">%{artAcc}</div>
          </div>
          <div className="card mini-stat">
            <span className="stat-icon" style={{ background: 'var(--rose-tint)', color: 'var(--rose)' }}><Timer size={15} /></span>
            <div className="l">{t('stats.avgTime')}</div>
            <div className="v red">{t('stats.minutes', { n: avgMin })}</div>
          </div>
          <div className="card mini-stat">
            <span className="stat-icon" style={{ background: 'var(--green-tint)', color: 'var(--green)' }}><Flame size={15} /></span>
            <div className="l">{t('stats.currentStreak')}</div>
            <div className="v green">{t('home.streakPill', { n: streak })}</div>
          </div>
          <div className="card mini-stat">
            <span className="stat-icon" style={{ background: 'var(--rose-tint)', color: 'var(--rose)' }}><AlertTriangle size={15} /></span>
            <div className="l">{t('stats.hardestWords')}</div>
            <div className="v red word">
              {hard[0] ? `${hard[0].article ? hard[0].article + ' ' : ''}${hard[0].german}` : t('stats.noHard')}
            </div>
          </div>
        </div>

        {hard.length > 0 ? (
          <div className="card chart-card">
            <div className="chart-title" style={{ marginBottom: '0.4rem' }}>{t('stats.topMistakes')}</div>
            {hard.map((w) => (
              <button key={w.id} className="mistake-row" style={{ width: '100%', textAlign: 'left' }} onClick={() => push({ name: 'wordDetail', id: w.id })}>
                <ArticleBadge article={w.article} />
                <span className="mistake-word">{w.german}</span>
                <span className="mistake-count">{t('stats.mistakesCount', { n: w.stats.wrong })}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}