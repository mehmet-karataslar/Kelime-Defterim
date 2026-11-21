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

const SIZES = {
  small: { w: '100%', maxWidth: 300, minH: 90, pad: 12 },
  medium: { w: '100%', maxWidth: 345, minH: 155, pad: 16 },
  large: { w: '100%', maxWidth: 360, minH: 220, pad: 20 },
};

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
  const pad = dim.pad;
  const align = config.align === 'center' ? 'center' : 'left';
  const muted = `color-mix(in srgb, ${config.text} 65%, transparent)`;

  const opacity = typeof config.bgOpacity === 'number' ? Math.max(20, Math.min(100, config.bgOpacity)) / 100 : 1;
  const bgColor = opacity < 1
    ? `color-mix(in srgb, ${config.bg} ${Math.round(opacity * 100)}%, transparent)`
    : config.bg;

  const articleChip = w && config.showArticle && w.article ? (
    <span style={{
      display: 'inline-block', fontSize: 11 * fs, fontWeight: 800, letterSpacing: '0.04em',
      color: artColor, background: `color-mix(in srgb, ${artColor} 16%, transparent)`,
      padding: '3px 10px', borderRadius: 999, marginBottom: 4,
    }}>{w.article}</span>
  ) : null;

  let body: ReactNode = null;
  if (config.type === 'word' || config.type === 'compact') {
    const compact = config.type === 'compact';
    body = w ? (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : 'flex-start', gap: 3, width: '100%', minWidth: 0 }}>
        {!compact && articleChip}
        <div style={{
          fontSize: (compact ? 16 : 24) * fs, fontWeight: 800, lineHeight: 1.15,
          color: config.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%'
        }}>
          {compact && w.article && config.showArticle ? <span style={{ color: artColor }}>{w.article} </span> : null}{w.german}
        </div>
        {config.showMeaning && meaning ? (
          <div style={{ fontSize: 14 * fs, fontWeight: 600, color: muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', marginTop: 2 }}>
            {meaning}
          </div>
        ) : null}
        {!compact && config.detailed && config.showExample && w.examples[0] ? (
          <div style={{ fontSize: 11.5 * fs, fontStyle: 'italic', color: muted, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
            {w.examples[0].de}
          </div>
        ) : null}
      </div>
    ) : <div style={{ fontSize: 13 * fs, color: muted }}>{t('settings.widgetNoWords')}</div>;
  } else if (config.type === 'list') {
    const count = config.listCount ?? 3;
    const listWords = pool.slice(0, count);
    body = listWords.length > 0 ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
        {listWords.map((item, idx) => {
          const itemArtColor = item.article === 'der' ? settings.articleColors.der : item.article === 'die' ? settings.articleColors.die : settings.articleColors.das;
          const itemMeaning = (settings.meaningLang === 'en' ? item.senses[0]?.en : item.senses[0]?.tr) || item.senses[0]?.tr || '';
          return (
            <div key={item.id || idx} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
              paddingBottom: idx < listWords.length - 1 ? 8 : 0,
              borderBottom: idx < listWords.length - 1 ? `1px solid color-mix(in srgb, ${config.text} 14%, transparent)` : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                {config.showArticle && item.article ? (
                  <span style={{
                    fontSize: 10 * fs, fontWeight: 800, color: itemArtColor,
                    background: `color-mix(in srgb, ${itemArtColor} 18%, transparent)`,
                    padding: '2px 8px', borderRadius: 999, flexShrink: 0
                  }}>{item.article}</span>
                ) : null}
                <span style={{ fontSize: 15 * fs, fontWeight: 700, color: config.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.german}
                </span>
              </div>
              {config.showMeaning && itemMeaning ? (
                <span style={{ fontSize: 12.5 * fs, fontWeight: 500, color: muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right', flexShrink: 0, maxWidth: '45%' }}>
                  {itemMeaning}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    ) : <div style={{ fontSize: 13 * fs, color: muted }}>{t('settings.widgetNoWords')}</div>;
  } else if (config.type === 'goal') {
    const pct = Math.min(100, Math.round((done / Math.max(1, settings.dailyGoal)) * 100));
    body = (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6, alignItems: align === 'center' ? 'center' : 'stretch' }}>
        <div style={{ fontSize: 11 * fs, fontWeight: 700, color: muted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{t('home.dailyGoal')}</div>
        <div style={{ fontSize: 22 * fs, fontWeight: 800, color: config.text }}>{done}<span style={{ color: muted, fontSize: 14 * fs }}> / {settings.dailyGoal}</span></div>
        <div style={{ height: 8 * fs, borderRadius: 999, background: `color-mix(in srgb, ${config.text} 14%, transparent)`, overflow: 'hidden', width: '100%' }}>
          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: config.accent, transition: 'width 0.3s ease' }} />
        </div>
      </div>
    );
  } else if (config.type === 'review') {
    body = (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6, alignItems: align === 'center' ? 'center' : 'flex-start' }}>
        <div style={{ fontSize: 26 * fs, fontWeight: 800, color: config.accent, lineHeight: 1 }}>{due}</div>
        <div style={{ fontSize: 12 * fs, fontWeight: 600, color: muted }}>{t('home.waitingWords', { n: due })}</div>
        {config.detailed ? (
          <span style={{ fontSize: 11 * fs, fontWeight: 800, color: '#fff', background: config.accent, padding: '5px 12px', borderRadius: 999 }}>{t('home.startReview')}</span>
        ) : null}
      </div>
    );
  } else {
    body = w ? (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, alignItems: align === 'center' ? 'center' : 'flex-start' }}>
        <div style={{ fontSize: 17 * fs, fontWeight: 800, color: config.text }}>___ {w.german}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['der', 'die', 'das'] as const).map((a) => (
            <span key={a} style={{
              fontSize: 11 * fs, fontWeight: 800, padding: '4px 12px', borderRadius: 999,
              color: settings.articleColors[a], background: `color-mix(in srgb, ${settings.articleColors[a]} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${settings.articleColors[a]} 35%, transparent)`,
            }}>{a}</span>
          ))}
        </div>
      </div>
    ) : <div style={{ fontSize: 13 * fs, color: muted }}>{t('settings.widgetNoWords')}</div>;
  }

  return (
    <div className="widget-stage">
      <div
        className="widget-card"
        style={{
          width: dim.w, maxWidth: dim.maxWidth, minHeight: dim.minH,
          background: bgColor, color: config.text,
          backdropFilter: opacity < 1 ? 'blur(14px)' : 'none',
          WebkitBackdropFilter: opacity < 1 ? 'blur(14px)' : 'none',
          borderRadius: config.radius, border: `${config.borderWidth}px solid ${config.border}`,
          fontFamily: FONTS[config.font], padding: pad, textAlign: align,
          display: 'flex', alignItems: 'center', justifyContent: align === 'center' ? 'center' : 'flex-start',
          boxShadow: '0 12px 28px -8px rgba(15,10,40,0.4)',
        }}
      >
        {body}
      </div>
      <span className="widget-stage-label">{t('settings.widgetPreview')}</span>
    </div>
  );
}
