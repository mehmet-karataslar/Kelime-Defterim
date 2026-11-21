import { useRef, useState } from 'react';
import {
  Settings as SettingsIcon, Languages, GraduationCap, Target, Palette, Sun, Moon, Monitor,
  Type, LayoutList, Sparkles, Volume2, Bell, Database, Download, Upload, FileSpreadsheet,
  Trash2, Info, ChevronRight, Check, Eye, PenLine, Heart, Clock, MoonStar, Smartphone, Plus, X,
  RefreshCw, CheckCircle2, AlertCircle, MonitorSmartphone,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useStore, BackupFile } from '../../core/store';
import { useI18n } from '../../localization';
import { Settings, UiLang, WidgetConfig, uid } from '../../core/types';
import { TopBar, Switch, Stepper, Modal, ConfirmModal } from '../../shared/ui';
import { toast } from '../../shared/toastStore';
import { downloadJson, downloadCsv } from '../backup/exporters';
import { enableNotifications, sendTestNotification, syncNotificationSchedule } from '../notifications/service';
import { speakGerman } from '../../core/audio';
import WidgetPreview from '../widgets/WidgetPreview';
import { pinWidget, syncWidgetSnapshot } from '../widgets/service';
import {
  APP_VERSION, ReleaseInfo, UpdatePhase, fetchLatestRelease, isNewer, resolveRelease,
  downloadAndInstall, retryInstall, formatBytes,
} from '../updater/service';

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
  const [designId, setDesignId] = useState<string>(settings.widgets[0]?.id ?? '');
  const [manualOpen, setManualOpen] = useState(false);
  const [delDesignOpen, setDelDesignOpen] = useState(false);
  const [updPhase, setUpdPhase] = useState<UpdatePhase>('idle');
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [updProgress, setUpdProgress] = useState(0);
  const [updError, setUpdError] = useState('');

  const set = (p: Partial<Settings>) => updateSettings(p);

  const design = settings.widgets.find((w) => w.id === designId) ?? settings.widgets[0];
  const patchDesign = (p: Partial<WidgetConfig>) => {
    if (!design) return;
    set({ widgets: settings.widgets.map((w) => (w.id === design.id ? { ...w, config: { ...w.config, ...p } } : w)) });
    void syncWidgetSnapshot();
  };
  const addDesign = () => {
    const id = uid();
    const base = design?.config ?? settings.widgets[0].config;
    set({ widgets: [...settings.widgets, { id, name: `Widget ${settings.widgets.length + 1}`, config: { ...base } }] });
    setDesignId(id);
    void syncWidgetSnapshot();
  };
  const removeDesign = () => {
    if (!design || settings.widgets.length <= 1) return;
    const next = settings.widgets.filter((w) => w.id !== design.id);
    set({ widgets: next });
    setDesignId(next[0].id);
    void syncWidgetSnapshot();
  };
  const addToHome = async () => {
    if (!design) return;
    await syncWidgetSnapshot();
    const res = await pinWidget(design.id);
    if (res.supported && res.requested) toast(t('settings.widgetAdded'), 'ok');
    else setManualOpen(true);
  };

  const checkUpdate = async () => {
    const targetRepo = settings.updateRepo?.trim() || 'mehmet-karataslar/Kelime-Defterim';
    setUpdPhase('checking'); setUpdError(''); setRelease(null); setUpdProgress(0);
    try {
      const rel = await fetchLatestRelease(targetRepo, settings.updateChannel || 'stable');
      if (!rel) { setUpdPhase('failed'); setUpdError(t('settings.updateNoReleases')); return; }
      if (!isNewer(rel.tag_name)) { setUpdPhase('uptodate'); return; }
      const info = await resolveRelease(rel);
      if ('error' in info) {
        setUpdPhase('failed');
        setUpdError(t(info.error === 'no-asset' ? 'settings.updateNoAsset' : 'settings.updateNoChecksum'));
        return;
      }
      setRelease(info); setUpdPhase('found');
    } catch (e) {
      setUpdPhase('failed');
      setUpdError(e instanceof Error && e.message === 'invalid-repo' ? t('settings.updateNoRepo') : t('settings.updateNetErr'));
    }
  };
  const startDownload = () => {
    if (!release) return;
    void downloadAndInstall(release, setUpdProgress, (p, err) => { setUpdPhase(p); if (err) setUpdError(err); });
  };

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
                    {[1, 5, 10, 15, 30, 45, 60, 120, 180, 360].map((m) => (
                      <option key={m} value={m}>{m < 60 ? t('settings.minutesN', { n: m }) : t('settings.hoursN', { n: m / 60 })}</option>
                    ))}
                  </select>
                </div>
                <div className="setting-row">
                  <span className="setting-icon" style={{ background: 'var(--amber-tint)', color: 'var(--amber)' }}><Smartphone size={16} /></span>
                  <span className="setting-label">{t('settings.notifOnOpen')}<small className="setting-desc">{t('settings.notifOnOpenDesc')}</small></span>
                  <Switch on={settings.notifyOnOpen} onChange={(v) => set({ notifyOnOpen: v })} />
                </div>
                <div className="setting-row">
                  <span className="setting-icon" style={{ background: 'var(--tint)', color: 'var(--primary)' }}><Clock size={16} /></span>
                  <span className="setting-label">{t('settings.notifTimes')}<small className="setting-desc">{t('settings.notifTimesDesc')}</small></span>
                  <Switch on={settings.notificationTimesOn} onChange={(v) => { set({ notificationTimesOn: v }); setTimeout(syncNotificationSchedule, 0); }} />
                </div>
                {settings.notificationTimesOn ? (
                  <div className="notif-sub">
                    {settings.notificationTimes.map((tm, i) => (
                      <span className="time-chip" key={`${tm}-${i}`}>
                        <input type="time" className="time-input" value={tm}
                          onChange={(e) => {
                            const next = settings.notificationTimes.map((x, j) => (j === i ? e.target.value : x)).sort();
                            set({ notificationTimes: next }); setTimeout(syncNotificationSchedule, 0);
                          }} />
                        <button className="chip-x" aria-label="remove"
                          onClick={() => { set({ notificationTimes: settings.notificationTimes.filter((_, j) => j !== i) }); setTimeout(syncNotificationSchedule, 0); }}>
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    {settings.notificationTimes.length < 6 ? (
                      <button className="add-time" onClick={() => { set({ notificationTimes: [...settings.notificationTimes, '09:00'].sort() }); setTimeout(syncNotificationSchedule, 0); }}>
                        <Plus size={13} /> {t('settings.addTime')}
                      </button>
                    ) : null}
                  </div>
                ) : null}
                <div className="setting-row">
                  <span className="setting-icon" style={{ background: 'var(--violet-tint)', color: 'var(--violet)' }}><MoonStar size={16} /></span>
                  <span className="setting-label">{t('settings.quietHours')}<small className="setting-desc">{t('settings.quietHoursDesc')}</small></span>
                  <Switch on={settings.quietHoursOn} onChange={(v) => { set({ quietHoursOn: v }); setTimeout(syncNotificationSchedule, 0); }} />
                </div>
                {settings.quietHoursOn ? (
                  <div className="notif-sub">
                    <label className="quiet-field">
                      <span>{t('settings.quietFrom')}</span>
                      <span className="time-chip"><input type="time" className="time-input" value={settings.quietStart}
                        onChange={(e) => { set({ quietStart: e.target.value }); setTimeout(syncNotificationSchedule, 0); }} /></span>
                    </label>
                    <label className="quiet-field">
                      <span>{t('settings.quietTo')}</span>
                      <span className="time-chip"><input type="time" className="time-input" value={settings.quietEnd}
                        onChange={(e) => { set({ quietEnd: e.target.value }); setTimeout(syncNotificationSchedule, 0); }} /></span>
                    </label>
                  </div>
                ) : null}
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
          <div className="settings-group-title">{t('settings.widget')}</div>
          <div className="card settings-card" style={{ padding: '1rem' }}>
            <p className="muted" style={{ fontSize: '0.78rem', margin: '0 0 0.8rem' }}>{t('settings.widgetHint')}</p>
            <div className="design-list">
              {settings.widgets.map((w) => (
                <button key={w.id} className={`design-chip${w.id === design?.id ? ' active' : ''}`} onClick={() => setDesignId(w.id)}>
                  <span className="dc-name">{w.name}</span>
                  <span className="dc-type">{t(`settings.wType${w.config.type === 'word' ? 'Word' : w.config.type === 'compact' ? 'Compact' : w.config.type === 'goal' ? 'Goal' : w.config.type === 'review' ? 'Review' : 'Quiz'}`)}</span>
                </button>
              ))}
              <button className="design-chip add" onClick={addDesign}><Plus size={14} /> {t('settings.widgetNew')}</button>
            </div>

            {design ? (
              <>
                <WidgetPreview config={design.config} />
                <div className="field" style={{ marginTop: '0.9rem' }}>
                  <label className="field-label">{t('settings.widgetName')}</label>
                  <input className="field-input" value={design.name} maxLength={24}
                    onChange={(e) => set({ widgets: settings.widgets.map((w) => (w.id === design.id ? { ...w, name: e.target.value } : w)) })} />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label className="field-label">{t('settings.widgetType')}</label>
                    <select className="field-select" value={design.config.type} onChange={(e) => patchDesign({ type: e.target.value as WidgetConfig['type'] })}>
                      <option value="word">{t('settings.wTypeWord')}</option>
                      <option value="compact">{t('settings.wTypeCompact')}</option>
                      <option value="goal">{t('settings.wTypeGoal')}</option>
                      <option value="review">{t('settings.wTypeReview')}</option>
                      <option value="quiz">{t('settings.wTypeQuiz')}</option>
                    </select>
                  </div>
                  <div className="field">
                    <label className="field-label">{t('settings.widgetSize')}</label>
                    <div className="seg-inline">
                      {(['small', 'medium', 'large'] as const).map((s) => (
                        <button key={s} className={design.config.size === s ? 'active' : ''} onClick={() => patchDesign({ size: s })}>
                          {t(s === 'small' ? 'settings.sizeS' : s === 'medium' ? 'settings.sizeM' : 'settings.sizeL')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label className="field-label">{t('settings.widgetAlign')}</label>
                    <div className="seg-inline">
                      <button className={design.config.align === 'left' ? 'active' : ''} onClick={() => patchDesign({ align: 'left' })}>{t('settings.alignLeft')}</button>
                      <button className={design.config.align === 'center' ? 'active' : ''} onClick={() => patchDesign({ align: 'center' })}>{t('settings.alignCenter')}</button>
                    </div>
                  </div>
                  <div className="field">
                    <label className="field-label">{t('settings.widgetFont')}</label>
                    <select className="field-select" value={design.config.font} onChange={(e) => patchDesign({ font: e.target.value as WidgetConfig['font'] })}>
                      <option value="sans">{t('settings.fontSans')}</option>
                      <option value="serif">{t('settings.fontSerif')}</option>
                      <option value="mono">{t('settings.fontMono')}</option>
                    </select>
                  </div>
                </div>
                <div className="color-grid">
                  {([['bg', 'widgetBg'], ['text', 'widgetText'], ['accent', 'widgetAccent'], ['border', 'widgetBorder']] as const).map(([k, label]) => (
                    <label className="color-field" key={k}>
                      <span>{t(`settings.${label}`)}</span>
                      <input type="color" value={design.config[k]} onChange={(e) => patchDesign({ [k]: e.target.value } as Partial<WidgetConfig>)} />
                    </label>
                  ))}
                </div>
                {([
                  ['fontScale', 'widgetFontScale', 0.8, 1.4, 0.05, `${Math.round(design.config.fontScale * 100)}%`],
                  ['radius', 'widgetRadius', 0, 28, 1, `${design.config.radius}px`],
                  ['borderWidth', 'widgetBorderW', 0, 4, 0.5, `${design.config.borderWidth}px`],
                ] as const).map(([k, label, min, max, step, val]) => (
                  <div className="w-slider" key={k}>
                    <div className="w-slider-head"><span>{t(`settings.${label}`)}</span><b>{val}</b></div>
                    <input type="range" min={min} max={max} step={step} value={design.config[k]}
                      onChange={(e) => patchDesign({ [k]: Number(e.target.value) } as Partial<WidgetConfig>)} />
                  </div>
                ))}
                <div className="widget-toggle-grid">
                  {([['detailed', 'widgetDetailed'], ['showArticle', 'widgetArticle'], ['showMeaning', 'widgetMeaning'], ['showExample', 'widgetExample']] as const).map(([k, label]) => (
                    <div className="mini-toggle" key={k}>
                      <span>{t(`settings.${label}`)}</span>
                      <Switch on={design.config[k]} onChange={(v) => patchDesign({ [k]: v } as Partial<WidgetConfig>)} />
                    </div>
                  ))}
                </div>
                <div className="field-row" style={{ marginTop: '0.7rem' }}>
                  <div className="field">
                    <label className="field-label">{t('settings.widgetSource')}</label>
                    <select className="field-select" value={design.config.source} onChange={(e) => patchDesign({ source: e.target.value as WidgetConfig['source'] })}>
                      <option value="all">{t('settings.srcAll')}</option>
                      <option value="favorites">{t('settings.srcFav')}</option>
                      <option value="daily">{t('settings.srcDaily')}</option>
                      <option value="collection">{t('settings.srcCol')}</option>
                    </select>
                  </div>
                  <div className="field">
                    <label className="field-label">{t('settings.widgetRefresh')}</label>
                    <select className="field-select" value={design.config.refreshMinutes} onChange={(e) => patchDesign({ refreshMinutes: Number(e.target.value) })}>
                      {[30, 60, 180, 360, 720, 1440].map((m) => (
                        <option key={m} value={m}>{m < 60 ? t('settings.minutesN', { n: m }) : t('settings.hoursN', { n: m / 60 })}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {design.config.source === 'collection' ? (
                  <div className="field">
                    <label className="field-label">{t('settings.srcCol')}</label>
                    <select className="field-select" value={design.config.collectionId ?? ''} onChange={(e) => patchDesign({ collectionId: e.target.value || null })}>
                      <option value="">—</option>
                      {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                ) : null}
                <button className="btn gradient block" onClick={() => void addToHome()}>
                  <MonitorSmartphone size={17} /> {t('settings.widgetAdd')}
                </button>
                {settings.widgets.length > 1 ? (
                  <button className="btn danger-outline block" style={{ marginTop: '0.5rem' }} onClick={() => setDelDesignOpen(true)}>
                    <Trash2 size={15} /> {t('settings.widgetDelete')}
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        <div className="settings-group">
          <div className="settings-group-title">{t('settings.update')}</div>
          <div className="card settings-card" style={{ padding: '1rem' }}>
            <div className="upd-current">
              <span className="setting-icon" style={{ background: 'var(--green-tint)', color: 'var(--green)' }}><RefreshCw size={16} /></span>
              <span className="setting-label">{t('settings.updateCurrent')}</span>
              <span className="setting-value">v{APP_VERSION}</span>
            </div>
            <button className="btn primary block" style={{ marginTop: '0.8rem' }} onClick={() => void checkUpdate()} disabled={updPhase === 'checking' || updPhase === 'downloading' || updPhase === 'verifying'}>
              <RefreshCw size={16} className={updPhase === 'checking' ? 'spin' : ''} />
              {updPhase === 'checking' ? t('settings.updateChecking') : t('settings.updateCheck')}
            </button>

            {updPhase === 'uptodate' ? (
              <div className="upd-status ok"><CheckCircle2 size={16} /> {t('settings.updateUpToDate')}</div>
            ) : null}
            {updPhase === 'found' && release ? (
              <div className="upd-release">
                <div className="upd-release-head">
                  <span className="upd-tag">{release.tag}</span>
                  <b>{t('settings.updateFound')}</b>
                </div>
                <div className="upd-size">{t('settings.updateSize')}: {formatBytes(release.apkSize)}</div>
                {release.notes ? (
                  <>
                    <div className="field-label" style={{ marginTop: '0.6rem' }}>{t('settings.updateNotes')}</div>
                    <pre className="upd-notes">{release.notes}</pre>
                  </>
                ) : null}
                {!Capacitor.isNativePlatform() ? (
                  <p className="muted-3" style={{ fontSize: '0.7rem', margin: '0.5rem 0' }}>{t('settings.updateWebNote')}</p>
                ) : null}
                <button className="btn gradient block" onClick={startDownload}>{t('settings.updateDownload')}</button>
              </div>
            ) : null}
            {updPhase === 'downloading' ? (
              <div className="upd-status">
                <div className="upd-progress-head"><span>{t('settings.updateDownloading')}</span><b>{updProgress}%</b></div>
                <div className="upd-track"><div className="upd-fill" style={{ width: `${updProgress}%` }} /></div>
              </div>
            ) : null}
            {updPhase === 'verifying' ? <div className="upd-status">{t('settings.updateVerifying')}</div> : null}
            {updPhase === 'installing' ? <div className="upd-status ok"><CheckCircle2 size={16} /> {t('settings.updateInstalling')}</div> : null}
            {updPhase === 'permission' ? (
              <div className="upd-status warn">
                <AlertCircle size={16} /> {t('settings.updatePermission')}
                <button className="btn outline" style={{ marginTop: '0.5rem', padding: '0.5rem 0.9rem', fontSize: '0.78rem' }}
                  onClick={async () => { const ok = await retryInstall(); if (ok) setUpdPhase('installing'); }}>{t('settings.updateRetry')}</button>
              </div>
            ) : null}
            {updPhase === 'failed' ? (
              <div className="upd-status err">
                <AlertCircle size={16} /> {t('settings.updateFailed')}{updError ? ` — ${updError}` : ''}
                <button className="btn outline" style={{ marginTop: '0.5rem', padding: '0.5rem 0.9rem', fontSize: '0.78rem' }} onClick={() => void checkUpdate()}>{t('settings.updateRetry')}</button>
              </div>
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
      {manualOpen ? (
        <Modal title={t('settings.widgetManualTitle')} onClose={() => setManualOpen(false)}>
          <p className="modal-desc" style={{ marginBottom: 0, lineHeight: 1.7 }}>{t('settings.widgetManual')}</p>
        </Modal>
      ) : null}
      {delDesignOpen ? (
        <ConfirmModal title={t('settings.widgetDelete')} desc={t('settings.widgetDeleteConfirm')}
          confirmLabel={t('common.delete')} danger
          onConfirm={() => { removeDesign(); toast(t('common.deleted')); }}
          onClose={() => setDelDesignOpen(false)} />
      ) : null}
    </div>
  );
}