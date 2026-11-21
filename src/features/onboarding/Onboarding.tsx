import { useState } from 'react';
import { Check, Sparkles, BookOpen, ArrowRight, ArrowLeft } from 'lucide-react';
import { useStore } from '../../core/store';
import { useI18n } from '../../localization';
import { UiLang } from '../../core/types';
import { Stepper } from '../../shared/ui';

const TOTAL = 4;

export default function Onboarding() {
  const { t } = useI18n();
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const seedSample = useStore((s) => s.seedSample);

  const [step, setStep] = useState(0);

  const finish = (withSample: boolean) => {
    if (withSample) seedSample();
    updateSettings({ onboarded: true });
  };

  const uiLangs: { id: UiLang; flag: string; label: string }[] = [
    { id: 'tr', flag: '🇹🇷', label: t('settings.turkish') },
    { id: 'de', flag: '🇩🇪', label: t('settings.german') },
    { id: 'en', flag: '🇬🇧', label: t('settings.english') },
  ];

  return (
    <div className="onboard">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img src="/icon.png" alt="Kelime Defterim" className="onboard-logo" style={{ background: 'none', boxShadow: '0 14px 30px -12px rgba(30,27,75,0.45)' }} />
        <button className="link-btn" onClick={() => finish(false)}>{t('onboarding.skip')}</button>
      </div>

      <div className="onboard-step">{t('onboarding.step', { i: step + 1, n: TOTAL })}</div>

      {step === 0 ? (
        <div className="anim-in" key="s0">
          <div className="onboard-title">{t('onboarding.welcome')}</div>
          <div className="onboard-desc">{t('onboarding.welcomeDesc2')}</div>
          <div className="onboard-body">
            <div className="settings-group-title" style={{ marginTop: '0.4rem' }}>{t('onboarding.chooseLang')}</div>
            {uiLangs.map((l) => (
              <button key={l.id} className={`lang-option ${settings.uiLang === l.id ? 'on' : ''}`}
                onClick={() => updateSettings({ uiLang: l.id })}>
                <span className="flag">{l.flag}</span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{l.label}</span>
                {settings.uiLang === l.id ? <Check size={18} className="check" strokeWidth={3} /> : null}
              </button>
            ))}
          </div>
        </div>
      ) : step === 1 ? (
        <div className="anim-in" key="s1">
          <div className="onboard-title">{t('onboarding.chooseMeaning')}</div>
          <div className="onboard-desc">{t('onboarding.learnGerman')}</div>
          <div className="onboard-body">
            {uiLangs.filter((l) => l.id !== 'de').map((l) => (
              <button key={l.id} className={`lang-option ${settings.meaningLang === l.id ? 'on' : ''}`}
                onClick={() => updateSettings({ meaningLang: l.id as 'tr' | 'en' })}>
                <span className="flag">{l.flag}</span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{l.label}</span>
                {settings.meaningLang === l.id ? <Check size={18} className="check" strokeWidth={3} /> : null}
              </button>
            ))}
          </div>
        </div>
      ) : step === 2 ? (
        <div className="anim-in" key="s2">
          <div className="onboard-title">{t('onboarding.goalTitle')}</div>
          <div className="onboard-desc">{t('onboarding.goalDesc')}</div>
          <div className="onboard-body">
            <div className="goal-big">
              <div className="n">{settings.dailyGoal}</div>
              <div className="l">{t('onboarding.perDay')}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Stepper value={settings.dailyGoal} min={1} max={100} step={5} onChange={(v) => updateSettings({ dailyGoal: v })} />
            </div>
            <div className="goal-presets">
              {[5, 10, 15, 20, 30].map((n) => (
                <button key={n} className="chip"
                  style={settings.dailyGoal === n
                    ? { background: 'var(--primary)', color: '#fff' }
                    : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
                  onClick={() => updateSettings({ dailyGoal: n })}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="anim-in" key="s3">
          <div className="onboard-title">{t('onboarding.sampleTitle')}</div>
          <div className="onboard-desc">{t('onboarding.sampleDesc')}</div>
          <div className="onboard-body">
            <button className="card" style={{ width: '100%', padding: '1.1rem', display: 'flex', gap: '0.9rem', alignItems: 'center', textAlign: 'left' }}
              onClick={() => finish(true)}>
              <span className="setting-icon" style={{ background: 'var(--tint)', color: 'var(--primary)', width: '2.8rem', height: '2.8rem' }}><Sparkles size={20} /></span>
              <span>
                <span style={{ display: 'block', fontWeight: 800, fontSize: '0.95rem' }}>{t('onboarding.withSample')}</span>
                <span className="muted" style={{ fontSize: '0.78rem' }}>36 · A1–B2 · 5 {t('common.collections').toLowerCase()}</span>
              </span>
            </button>
            <button className="card" style={{ width: '100%', padding: '1.1rem', display: 'flex', gap: '0.9rem', alignItems: 'center', textAlign: 'left', marginTop: '0.7rem' }}
              onClick={() => finish(false)}>
              <span className="setting-icon" style={{ background: 'var(--surface-2)', color: 'var(--text-2)', width: '2.8rem', height: '2.8rem' }}><BookOpen size={20} /></span>
              <span>
                <span style={{ display: 'block', fontWeight: 800, fontSize: '0.95rem' }}>{t('onboarding.empty2')}</span>
                <span className="muted" style={{ fontSize: '0.78rem' }}>{t('words.emptyDesc')}</span>
              </span>
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 'auto' }}>
        <div className="onboard-dots">
          {Array.from({ length: TOTAL }, (_, i) => (
            <span key={i} className={`onboard-dot ${i === step ? 'on' : ''}`} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          {step > 0 ? (
            <button className="btn outline lg" onClick={() => setStep(step - 1)} aria-label={t('common.back')}>
              <ArrowLeft size={18} />
            </button>
          ) : null}
          {step < TOTAL - 1 ? (
            <button className="btn gradient lg block" onClick={() => setStep(step + 1)}>
              {t('common.continue')} <ArrowRight size={18} />
            </button>
          ) : (
            <button className="btn gradient lg block" onClick={() => finish(true)}>
              {t('onboarding.startJourney')} <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}