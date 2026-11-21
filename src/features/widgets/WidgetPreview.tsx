import type { ReactNode } from 'react';
import { useStore } from '../../core/store';
import { useI18n } from '../../localization';
import { WidgetConfig } from '../../core/types';
import { widgetPool } from './service';

const FONTS: Record<WidgetConfig['font'], string> = {
  sans: "'Plus Jakarta Sans', sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "'Courier New', monospace",
};

const SIZES = { small: { w: 158, h: 70 }, medium: { w: 232, h: 128 }, large: { w: 296, h: 184 } };

export default function WidgetPreview({ config }: { config: WidgetConfig }) {
  const { t } = useI18n();
  const words = useStore((s) => s.words);
  const reviewLogs = useStore((s) => s.reviewLogs);
  const settings = useStore((s) => s.settings);

  const pool = widgetPool(words, config);
  const w = pool[Math.floor(Date.now() / (config.refreshMinutes * 60_000)) % Math.max(1, pool.length)] ?? null;
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  const done = reviewLogs.filter((l) => l.ts >= dayStart.getTime()).length;
  const due = words.filter((x) => x.srs.due !== null && x.srs.due <= Date.now()).length;
  const meaning = w ? ((settings.meaningLang === 'en' ? w.senses[0]?.en : w.senses[0]?.tr) || w.senses[0]?.tr || '') : '';
  const artColor = w?.article === 'der' ? settings.articleColors.der : w?.article === 'die' ? settings.articleColors.die : settings.articleColors.das;

  const dim = SIZES[config.size];
  const fs = config.fontScale;
  const pad = config.size === 'small' ? 10 : config.size === 'medium' ? 14 : 18;
  const align = config.align === 'center' ? 'center' : 'left';
  const muted = `color-mix(in srgb, ${config.text} 62%, transparent)`;

  const articleChip = w && config.showArticle && w.article ? (
    <span style={{
      display: 'inline-block', fontSize: 9.5 * fs, fontWeight: 800, letterSpacing: '0.04em',
      color: artColor, background: `color-mix(in srgb, ${artColor} 14%, transparent)`,
      padding: '2px 7px', borderRadius: 999, marginBottom: 3,
    }}>{w.article}</span>
  ) : null;

  let body: ReactNode = null;
  if (config.type === 'word' || config.type === 'compact') {
    const compact = config.type === 'compact';
    body = w ? (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : 'flex-start', gap: 1, minWidth: 0 }}>
        {!compact && articleChip}
        <div style={{ fontSize: (compact ? 14 : 17) * fs, fontWeight: 800, lineHeight: 1.15, color: config.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
          {compact && w.article && config.showArticle ? <span style={{ color: artColor }}>{w.article} </span> : null}{w.german}
        </div>
        {config.showMeaning && meaning ? (
          <div style={{ fontSize: 11 * fs, fontWeight: 600, color: muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{meaning}</div>
        ) : null}
        {!compact && config.detailed && config.showExample && w.examples[0] ? (
          <div style={{ fontSize: 9.5 * fs, fontStyle: 'italic', color: muted, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{w.examples[0].de}</div>
        ) : null}
      </div>
    ) : <div style={{ fontSize: 11 * fs, color: muted }}>{t('settings.widgetNoWords')}</div>;
  } else if (config.type === 'goal') {
    const pct = Math.min(100, Math.round((done / Math.max(1, settings.dailyGoal)) * 100));
    body = (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 5, alignItems: align === 'center' ? 'center' : 'stretch' }}>
        <div style={{ fontSize: 10 * fs, fontWeight: 700, color: muted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{t('home.dailyGoal')}</div>
        <div style={{ fontSize: 19 * fs, fontWeight: 800, color: config.text }}>{done}<span style={{ color: muted, fontSize: 12 * fs }}> / {settings.dailyGoal}</span></div>
        <div style={{ height: 7 * fs, borderRadius: 999, background: `color-mix(in srgb, ${config.text} 12%, transparent)`, overflow: 'hidden', width: '100%' }}>
          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: config.accent, transition: 'width 0.3s ease' }} />
        </div>
      </div>
    );
  } else if (config.type === 'review') {
    body = (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 5, alignItems: align === 'center' ? 'center' : 'flex-start' }}>
        <div style={{ fontSize: 22 * fs, fontWeight: 800, color: config.accent, lineHeight: 1 }}>{due}</div>
        <div style={{ fontSize: 10.5 * fs, fontWeight: 600, color: muted }}>{t('home.waitingWords', { n: due })}</div>
        {config.detailed ? (
          <span style={{ fontSize: 10 * fs, fontWeight: 800, color: '#fff', background: config.accent, padding: '4px 10px', borderRadius: 999 }}>{t('home.startReview')}</span>
        ) : null}
      </div>
    );
  } else {
    body = w ? (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6, alignItems: align === 'center' ? 'center' : 'flex-start' }}>
        <div style={{ fontSize: 14 * fs, fontWeight: 800, color: config.text }}>___ {w.german}</div>
        <div style={{ display: 'flex', gap: 5 }}>
          {(['der', 'die', 'das'] as const).map((a) => (
            <span key={a} style={{
              fontSize: 10 * fs, fontWeight: 800, padding: '3px 9px', borderRadius: 999,
              color: settings.articleColors[a], background: `color-mix(in srgb, ${settings.articleColors[a]} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${settings.articleColors[a]} 35%, transparent)`,
            }}>{a}</span>
          ))}
        </div>
      </div>
    ) : <div style={{ fontSize: 11 * fs, color: muted }}>{t('settings.widgetNoWords')}</div>;
  }

  return (
    <div className="widget-stage">
      <div
        className="widget-card"
        style={{
          width: dim.w, minHeight: dim.h, background: config.bg, color: config.text,
          borderRadius: config.radius, border: `${config.borderWidth}px solid ${config.border}`,
          fontFamily: FONTS[config.font], padding: pad, textAlign: align,
          display: 'flex', alignItems: 'center', justifyContent: align === 'center' ? 'center' : 'flex-start',
          boxShadow: '0 10px 24px -10px rgba(20,16,60,0.45)',
        }}
      >
        {body}
      </div>
      <span className="widget-stage-label">{t('settings.widgetPreview')} · {dim.w}×{dim.h}</span>
    </div>
  );
}