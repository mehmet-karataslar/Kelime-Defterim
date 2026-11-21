import { useRef, useState } from 'react';
import {
  Settings as SettingsIcon, Languages, GraduationCap, Target, Palette, Sun, Moon, Monitor,
  Type, LayoutList, Sparkles, Volume2, Bell, Database, Download, Upload, FileSpreadsheet,
  Trash2, Info, ChevronRight, Check, Eye, PenLine, Heart,
} from 'lucide-react';
import { useStore, BackupFile } from '../../core/store';
import { useI18n } from '../../localization';
import { Settings, UiLang } from '../../core/types';
import { TopBar, Switch, Stepper, Modal, ConfirmModal } from '../../shared/ui';
import { toast } from '../../shared/toastStore';
import { downloadJson, downloadCsv } from '../backup/exporters';
import { enableNotifications, sendTestNotification, syncNotificationSchedule } from '../notifications/service';
import { speakGerman } from '../../core/audio';

const PALETTES: { id: string; color: string; label: string }[] = [
  { id: 'ultramarine', color: '#4338CA', label: 'Ultramarine' },
  { id: 'sage', color: '#4D7C6F', label: 'Sage' },
  { id: 'orange', color: '#EA580C', label: 'Orange' },
  { id: 'ocean', color: '#0369A1', label: 'Ocean' },
  { id: 'lavender', color: '#7C3AED', label: 'Lavender' },
  { id: 'earth', color: '#A16207', label: 'Earth' },
  { id: 'bordo', color: '#9F1239', label: 'Bordo' },
  { id: 'gray', color: '#475569', label: 'Gray' },
];

export default function SettingsScreen() {
  const { t } = useI18n();
  const settings = useStore((s) => s.settings);
  const words = useStore((s) => s.words);
  const collections = useStore((s) => s.collections);
  const reviewLogs = useStore((s) => s.reviewLogs);
  const sessions = useStore((s) => s.sessions);
  const sampleData = useStore((s) => s.sampleData);
  const updateSettings = useStore((s) => s.updateSettings);
  const exportBackup = useStore((s) => s.exportBackup);
  const importBackup = useStore((s) => s.importBackup);
  const resetAll = useStore((s) => s.resetAll);
  const removeSample = useStore((s) => s.removeSample);

  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<BackupFile | null>(null);
  const [delAllOpen, setDelAllOpen] = useState(false);
  const [delSampleOpen, setDelSampleOpen] = useState(false);
  const [dbInfoOpen, setDbInfoOpen] = useState(false);

  const set = (p: Partial<Settings>) => updateSettings(p);

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupFile;
      if (data.app !== 'kelime-defterim' || data.version !== 1 || !Array.isArray(data.words)) {
        toast(t('settings.importInvalid'), 'err');
        return;
      }
      setPendingImport(data);
    } catch {
      toast(t('settings.importInvalid'), 'err');
    }
  };

  const doImport = (mode: 'merge' | 'replace') => {
    if (!pendingImport) return;
    const n = importBackup(pendingImport, mode);
    toast(t('settings.importDone', { n }));
    setPendingImport(null);
  };

  const notifToggle = async (on: boolean) => {
    if (on) {
      const ok = await enableNotifications();
      if (!ok) { toast(t('settings.notifPermission'), 'err'); return; }
    }
    set({ notificationsOn: on });
    setTimeout(syncNotificationSchedule, 0);
  };

  const langNames: Record<UiLang, string> = { tr: t('settings.turkish'), de: t('settings.german'), en: t('settings.english') };

  return (
    <div className="screen">
      <TopBar title={t('settings.title')} icon={<SettingsIcon size={18} />} solidProfile />
      <div className="screen-body">
        <p className="muted anim-in" style={{ fontSize: '0.85rem', margin: '0.9rem 0 0' }}>{t('settings.subtitle')}</p>

        <div className="settings-group anim-in-1">
          <div className="settings-group-title">{t('settings.langLearning')}</div>
          <div className="card settings-card">
            <div className="setting-row">
              <span className="setting-icon" style={{ background: 'var(--tint)', color: 'var(--primary)' }}><Languages size={16} /></span>
              <span className="setting-label">{t('settings.uiLang')}</span>
              <div className="seg-inline">
                {(['tr', 'de', 'en'] as UiLang[]).map((l) => (
                  <button key={l} className={settings.uiLang === l ? 'active' : ''} onClick={() => set({ uiLang: l })}>{l.toUpperCase()}</button>
                ))}
              </div>
            </div>
            <div className="setting-row">
              <span className="setting-icon" style={{ background: 'var(--green-tint)', color: 'var(--green)' }}><GraduationCap size={16} /></span>
              <span className="setting-label">{t('settings.learnLang')}</span>
              <span className="setting-value">🇩🇪 {t('settings.german')}</span>
            </div>
            <div className="setting-row">
              <span className="setting-icon" style={{ background: 'var(--violet-tint)', color: 'var(--violet)' }}><Languages size={16} /></span>
              <span className="setting-label">{t('settings.meaningLang')}</span>
              <div className="seg-inline">
                {(['tr', 'en'] as const).map((l) => (
                  <button key={l} className={settings.meaningLang === l ? 'active' : ''} onClick={() => set({ meaningLang: l })}>{l.toUpperCase()}</button>
                ))}
              </div>
            </div>
            <div className="setting-row">
              <span className="setting-icon" style={{ background: 'var(--amber-tint)', color: 'var(--amber)' }}><Target size={16} /></span>
              <span className="setting-label">{t('settings.dailyGoal')}</span>
              <Stepper value={settings.dailyGoal} min={1} max={100} onChange={(v) => set({ dailyGoal: v })} />
            </div>
            <div className="setting-row">
              <span className="setting-icon" style={{ background: 'var(--blue-tint)', color: 'var(--blue)' }}><PenLine size={16} /></span>
              <span className="setting-label">{t('settings.writingTolerance')}</span>
              <select className="field-select" style={{ width: 'auto', padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                value={settings.writingTolerance} onChange={(e) => set({ writingTolerance: e.target.value as Settings['writingTolerance'] })}>
                <option value="strict">{t('settings.tolStrict')}</option>
                <option value="case">{t('settings.tolCase')}</option>
                <option value="umlaut">{t('settings.tolUmlaut')}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="settings-group anim-in-2">
          <div className="settings-group-title">{t('settings.appearance')}</div>
          <div className="card settings-card">
            <div className="setting-row">
              <span className="setting-icon" style={{ background: 'var(--tint)', color: 'var(--primary)' }}>
                {settings.theme === 'dark' ? <Moon size={16} /> : settings.theme === 'system' ? <Monitor size={16} /> : <Sun size={16} />}
              </span>
              <span className="setting-label">{t('settings.theme')}</span>
              <div className="seg-inline">
                {(['light', 'dark', 'system'] as const).map((th) => (
                  <button key={th} className={settings.theme === th ? 'active' : ''} onClick={() => set({ theme: th })}>
                    {t(`settings.${th}`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-row" style={{ display: 'block' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.7rem' }}>
                <span className="setting-icon" style={{ background: 'var(--magenta-tint)', color: 'var(--magenta)' }}><Palette size={16} /></span>
                <span className="setting-label">{t('settings.palette')}</span>
              </div>
              <div className="palette-row" style={{ padding: 0 }}>
                {PALETTES.map((p) => (
                  <button key={p.id} className={`palette-dot ${settings.palette === p.id ? 'active' : ''}`}
                    style={{ background: p.color }} onClick={() => set({ palette: p.id })} aria-label={p.label} title={p.label}>
                    {settings.palette === p.id ? <Check size={14} strokeWidth={3} /> : null}
                  </button>
                ))}
              </div>
            </div>
            <div className="slider-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span className="setting-icon" style={{ background: 'var(--blue-tint)', color: 'var(--blue)' }}><Type size={16} /></span>
                <span className="setting-label">{t('settings.fontScale')}</span>
                <span className="setting-value">%{Math.round(settings.fontScale * 100)}</span>
              </div>
              <input type="range" min={0.85} max={1.2} step={0.05} value={settings.fontScale}
                onChange={(e) => set({ fontScale: Number(e.target.value) })} />
            </div>
            <div className="setting-row">
              <span className="setting-icon" style={{ background: 'var(--green-tint)', color: 'var(--green)' }}><LayoutList size={16} /></span>
              <span className="setting-label">{t('settings.density')}</span>
              <div className="seg-inline">
                {(['comfortable', 'compact'] as const).map((d) => (
                  <button key={d} className={settings.density === d ? 'active' : ''} onClick={() => set({ density: d })}>{t(`settings.${d}`)}</button>
                ))}
              </div>
            </div>
            <div className="setting-row">
              <span className="setting-icon" style={{ background: 'var(--amber-tint)', color: 'var(--amber)' }}><Sparkles size={16} /></span>
              <span className="setting-label">{t('settings.reduceMotion')}</span>
              <Switch on={settings.reduceMotion} onChange={(v) => set({ reduceMotion: v })} />
            </div>
            <div className="setting-row" style={{ display: 'block' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.7rem' }}>
                <span className="setting-icon" style={{ background: 'var(--rose-tint)', color: 'var(--rose)' }}><Heart size={16} /></span>
                <span className="setting-label">{t('settings.articleColors')}</span>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {(['der', 'die', 'das'] as const).map((a) => (
                  <label key={a} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', fontWeight: 700 }}>
                    <input type="color" value={settings.articleColors[a]}
                      onChange={(e) => set({ articleColors: { ...settings.articleColors, [a]: e.target.value } })}
                      style={{ width: '2.1rem', height: '2.1rem', border: 'none', borderRadius: '0.5rem', background: 'none', cursor: 'pointer', padding: 0 }} />
                    {a}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="settings-group">
          <div className="settings-group-title">{t('settings.sound')}</div>
          <div className="card settings-card">
            <div className="setting-row">
              <span className="setting-icon" style={{ background: 'var(--tint)', color: 'var(--primary)' }}><Volume2 size={16} /></span>
              <span className="setting-label">{t('settings.soundOn')}</span>
              <Switch on={settings.soundOn} onChange={(v) => set({ soundOn: v })} />
            </div>
            <div className="slider-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span className="setting-icon" style={{ background: 'var(--violet-tint)', color: 'var(--violet)' }}><Volume2 size={16} /></span>
                <span className="setting-label">{t('settings.ttsRate')}</span>
                <span className="setting-value">×{settings.ttsRate.toFixed(1)}</span>
              </div>
              <input type="range" min={0.5} max={1.5} step={0.1} value={settings.ttsRate}
                onChange={(e) => set({ ttsRate: Number(e.target.value) })} />
              <button className="btn outline" style={{ marginTop: '0.6rem', padding: '0.5rem 0.9rem', fontSize: '0.78rem' }}
                onClick={() => speakGerman('Guten Tag! Ich lerne Deutsch.', settings.ttsRate, () => toast(t('learn.ttsMissing'), 'err'))}>
                <Volume2 size={14} /> {t('settings.testVoice')}
              </button>
            </div>
          </div>
        </div>

        <div className="settings-group">
          <div className="settings-group-title">{t('settings.notifications')}</div>
          <div className="card settings-card">
            <div className="setting-row">
              <span className="setting-icon" style={{ background: 'var(--rose-tint)', color: 'var(--rose)' }}><Bell size={16} /></span>
              <span className="setting-label">{t('settings.notifOn')}</span>
              <Switch on={settings.notificationsOn} onChange={notifToggle} />
            </div>
            {settings.notificationsOn ? (
              <>
                <div className="setting-row">
                  <span className="setting-label" style={{ paddingLeft: '2.95rem' }}>{t('settings.notifInterval')}</span>
                  <select className="field-select" style={{ width: 'auto', padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                    value={settings.notificationInterval}
                    onChange={(e) => { set({ notificationInterval: Number(e.target.value) }); setTimeout(syncNotificationSchedule, 0); }}>
                    {[15, 30, 45, 60, 120, 180].map((m) => (
                      <option key={m} value={m}>{m < 60 ? t('settings.minutesN', { n: m }) : t('settings.hoursN', { n: m / 60 })}</option>
                    ))}
                  </select>
                </div>
                <div className="setting-row">
                  <span className="setting-label" style={{ paddingLeft: '2.95rem' }}>{t('settings.notifContent')}</span>
                  <select className="field-select" style={{ width: 'auto', padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                    value={settings.notificationContent} onChange={(e) => set({ notificationContent: e.target.value as Settings['notificationContent'] })}>
                    <option value="word">{t('settings.contentWord')}</option>
                    <option value="wordMeaning">{t('settings.contentWordMeaning')}</option>
                    <option value="quiz">{t('settings.contentQuiz')}</option>
                  </select>
                </div>
                <button className="setting-row" onClick={async () => {
                  const ok = await sendTestNotification();
                  toast(ok ? t('settings.notifTest') : t('settings.notifPermission'), ok ? 'ok' : 'err');
                }}>
                  <span className="setting-label" style={{ paddingLeft: '2.95rem', color: 'var(--primary)' }}>{t('settings.notifTest')}</span>
                  <ChevronRight size={16} style={{ color: 'var(--text-3)' }} />
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="settings-group">
          <div className="settings-group-title">{t('settings.data')}</div>
          <div className="card settings-card">
            <button className="setting-row" onClick={() => { downloadJson(exportBackup(), `kelime-defterim-backup-${new Date().toISOString().slice(0, 10)}.json`); toast(t('settings.backupDone')); }}>
              <span className="setting-icon" style={{ background: 'var(--green-tint)', color: 'var(--green)' }}><Download size={16} /></span>
              <span className="setting-label">{t('settings.exportJson')}</span>
              <ChevronRight size={16} style={{ color: 'var(--text-3)' }} />
            </button>
            <button className="setting-row" onClick={() => fileRef.current?.click()}>
              <span className="setting-icon" style={{ background: 'var(--blue-tint)', color: 'var(--blue)' }}><Upload size={16} /></span>
              <span className="setting-label">{t('settings.importJson')}</span>
              <ChevronRight size={16} style={{ color: 'var(--text-3)' }} />
            </button>
            <button className="setting-row" onClick={() => { downloadCsv(words); toast(t('settings.backupDone')); }}>
              <span className="setting-icon" style={{ background: 'var(--amber-tint)', color: 'var(--amber)' }}><FileSpreadsheet size={16} /></span>
              <span className="setting-label">{t('settings.exportCsv')}</span>
              <ChevronRight size={16} style={{ color: 'var(--text-3)' }} />
            </button>
            <button className="setting-row" onClick={() => setDbInfoOpen(true)}>
              <span className="setting-icon" style={{ background: 'var(--violet-tint)', color: 'var(--violet)' }}><Database size={16} /></span>
              <span className="setting-label">{t('settings.dbInfo')}</span>
              <ChevronRight size={16} style={{ color: 'var(--text-3)' }} />
            </button>
            {sampleData ? (
              <button className="setting-row" onClick={() => setDelSampleOpen(true)}>
                <span className="setting-icon" style={{ background: 'var(--amber-tint)', color: 'var(--amber)' }}><Eye size={16} /></span>
                <span className="setting-label">{t('onboarding.removeSample')}</span>
                <ChevronRight size={16} style={{ color: 'var(--text-3)' }} />
              </button>
            ) : null}
            <button className="setting-row danger" onClick={() => setDelAllOpen(true)}>
              <span className="setting-icon" style={{ background: 'var(--rose-tint)', color: 'var(--rose)' }}><Trash2 size={16} /></span>
              <span className="setting-label">{t('settings.deleteAll')}</span>
              <ChevronRight size={16} style={{ color: 'var(--text-3)' }} />
            </button>
          </div>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleImportFile(f); e.target.value = ''; }} />
        </div>

        <div className="settings-group">
          <div className="settings-group-title">{t('settings.about')}</div>
          <div className="card settings-card" style={{ padding: '1.1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <img src="/icon.png" alt="Kelime Defterim" style={{ width: '3rem', height: '3rem', borderRadius: '0.9rem' }} />
              <div>
                <div style={{ fontWeight: 800 }}>Kelime Defterim</div>
                <div className="muted-3" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{t('settings.version')} 1.0.0 · {t('settings.storageInfo')}</div>
              </div>
            </div>
            <p className="muted" style={{ fontSize: '0.8rem', lineHeight: 1.6, marginTop: '0.8rem' }}>{t('settings.aboutDesc')}</p>
            <p className="muted-3" style={{ fontSize: '0.72rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Info size={12} /> {t('settings.madeWith')}
            </p>
          </div>
        </div>
      </div>

      {pendingImport ? (
        <Modal title={t('settings.importPreview')}
          desc={t('settings.importWords', { w: pendingImport.words.length, c: pendingImport.collections?.length ?? 0, r: pendingImport.reviewLogs?.length ?? 0 })}
          onClose={() => setPendingImport(null)}
          actions={
            <>
              <button className="btn outline" onClick={() => doImport('merge')}>{t('settings.merge')}</button>
              <button className="btn danger" onClick={() => doImport('replace')}>{t('settings.replace')}</button>
            </>
          }
        >
          <p className="modal-desc" style={{ marginBottom: 0 }}>⚠ {t('settings.importReplaceWarn')}</p>
        </Modal>
      ) : null}

      {dbInfoOpen ? (
        <Modal title={t('settings.dbInfo')} onClose={() => setDbInfoOpen(false)}>
          <table className="grammar-table">
            <tbody>
              <tr><td>{t('common.words')}</td><td>{words.length}</td></tr>
              <tr><td>{t('common.collections')}</td><td>{collections.length}</td></tr>
              <tr><td>{t('settings.reviewsN', { n: reviewLogs.length })}</td><td>{reviewLogs.length}</td></tr>
              <tr><td>{t('settings.sessionsN', { n: sessions.length })}</td><td>{sessions.length}</td></tr>
              <tr><td>{t('settings.storageInfo')}</td><td>localStorage</td></tr>
            </tbody>
          </table>
        </Modal>
      ) : null}

      {delAllOpen ? (
        <ConfirmModal title={t('settings.deleteAll')} desc={t('settings.deleteAllConfirm')}
          confirmLabel={t('common.delete')} danger
          onConfirm={() => { resetAll(); toast(t('settings.deleteAllDone')); }}
          onClose={() => setDelAllOpen(false)} />
      ) : null}
      {delSampleOpen ? (
        <ConfirmModal title={t('onboarding.removeSample')} desc={t('onboarding.removeSampleConfirm')}
          confirmLabel={t('common.delete')} danger
          onConfirm={() => { removeSample(); toast(t('common.deleted')); }}
          onClose={() => setDelSampleOpen(false)} />
      ) : null}
    </div>
  );
}