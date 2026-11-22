import { useState } from 'react';
import {
  Building2, BookOpen, Mail, Volume2, Eye, EyeOff, ChevronRight, PenLine, CheckCircle2,
} from 'lucide-react';
import { FORMAL_WRITING_RULES, OFFICIAL_SCENARIOS, OfficialScenario } from '../../data/officialComms';
import { useNav } from '../../app/navigation';
import { useStore } from '../../core/store';
import { TopBar } from '../../shared/ui';
import { speakGerman } from '../../core/audio';
import { toast } from '../../shared/toastStore';

export default function OfficialCommsScreen() {
  const { push, back } = useNav();
  const ttsRate = useStore((s) => s.settings.ttsRate);

  const [tab, setTab] = useState<'scenarios' | 'rules'>('scenarios');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showTr, setShowTr] = useState(true);

  const active: OfficialScenario | undefined = OFFICIAL_SCENARIOS.find((s) => s.id === activeId);
  const speak = (text: string) =>
    speakGerman(text, ttsRate, () => toast('Almanca seslendirme bu cihazda bulunamadı.', 'err'));

  if (active) {
    return (
      <div className="screen">
        <TopBar
          title={active.authority}
          icon={<Building2 size={18} />}
          onBack={() => setActiveId(null)}
          right={
            <button className="topbar-btn" onClick={() => setShowTr((v) => !v)} aria-label="Türkçe çeviri">
              {showTr ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          }
        />
        <div className="screen-body no-nav">
          <div className="card" style={{ padding: '1rem', marginTop: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem' }}>
              <span className="level-chip">{active.level}</span>
              <span className="chip">{active.authority}</span>
              <span className="chip gray">{active.kind === 'email' ? 'Resmî E-Posta' : 'Resmî Dilekçe'}</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.98rem' }}>{active.title}</div>
            <div className="muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>{active.contextTr}</div>
          </div>

          <div className="section-head">
            <span className="section-title">Almanca Örnek Metin</span>
            <button className="btn outline" style={{ padding: '0.35rem 0.65rem', fontSize: '0.74rem' }} onClick={() => speak(active.germanText)}>
              <Volume2 size={14} /> Dinle
            </button>
          </div>
          <div className="card formal-box">
            <pre className="formal-pre">{active.germanText}</pre>
          </div>

          {showTr ? (
            <>
              <div className="section-head"><span className="section-title">Türkçe Karşılığı</span></div>
              <div className="card formal-box tr">
                <pre className="formal-pre">{active.turkishText}</pre>
              </div>
            </>
          ) : null}

          <div className="section-head"><span className="section-title">Önemli Dil Bilgisi Notları</span></div>
          <div className="card" style={{ padding: '0.95rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {active.grammarNotes.map((note, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.82rem', lineHeight: 1.5 }}>
                <CheckCircle2 size={15} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 3 }} />
                <span>{note}</span>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: '1rem', marginTop: '1rem', borderColor: 'var(--primary-soft)' }}>
            <div className="eyebrow">YAZMA ALIŞTIRMASI</div>
            <div style={{ fontWeight: 800, fontSize: '0.94rem', marginTop: '0.2rem' }}>{active.writingTaskTitle}</div>
            <p className="muted" style={{ fontSize: '0.8rem', marginTop: '0.3rem', lineHeight: 1.5 }}>{active.writingTaskDesc}</p>
            <button
              className="btn gradient block"
              style={{ marginTop: '0.8rem' }}
              onClick={() =>
                push({
                  name: 'writingReview',
                  promptTitle: active.writingTaskTitle,
                  promptDesc: active.writingTaskDesc,
                  targetLevel: 'B1.2',
                  formal: true,
                })
              }
            >
              <PenLine size={16} /> Kendin Yaz ve Gramerini Kontrol Et
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <TopBar title="Resmî Kurumlarla İletişim" icon={<Building2 size={18} />} onBack={back} />
      <div className="screen-body no-nav">
        <p className="muted anim-in" style={{ fontSize: '0.84rem', margin: '0.9rem 0 0.7rem' }}>
          B1.2 seviyesinde Bürgeramt, Ausländerbehörde, Jobcenter, Finanzamt ve Krankenkasse yazışmaları ile resmî mektup kuralları.
        </p>

        <div className="segmented" style={{ marginBottom: '0.9rem' }}>
          <button className={tab === 'scenarios' ? 'active' : ''} onClick={() => setTab('scenarios')}>
            <Mail size={14} style={{ marginRight: 4, verticalAlign: -2 }} /> Kurum Örnekleri ({OFFICIAL_SCENARIOS.length})
          </button>
          <button className={tab === 'rules' ? 'active' : ''} onClick={() => setTab('rules')}>
            <BookOpen size={14} style={{ marginRight: 4, verticalAlign: -2 }} /> Yazım Kuralları
          </button>
        </div>

        {tab === 'scenarios' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {OFFICIAL_SCENARIOS.map((s) => (
              <button key={s.id} className="card practice-card anim-in" onClick={() => setActiveId(s.id)}>
                <span className="mode-icon blue"><Building2 size={18} /></span>
                <div className="practice-card-body">
                  <div className="practice-card-title">
                    {s.authority} <span className="level-chip">{s.level}</span>
                  </div>
                  <div className="practice-card-sub">{s.titleTr}</div>
                  <div className="practice-card-desc">{s.contextTr}</div>
                </div>
                <ChevronRight size={18} className="muted-3" />
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {FORMAL_WRITING_RULES.map((r, i) => (
              <div key={i} className="card anim-in" style={{ padding: '1rem' }}>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--primary)' }}>{r.section}</div>
                <div className="muted" style={{ fontSize: '0.78rem', marginTop: '0.15rem', marginBottom: '0.6rem' }}>{r.sectionTr}</div>
                {r.examplesDe.map((ex, j) => (
                  <div key={j} className="rule-ex-box">
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'pre-line' }}>{ex}</div>
                    <div className="muted" style={{ fontSize: '0.76rem', marginTop: '0.2rem', whiteSpace: 'pre-line' }}>{r.examplesTr[j]}</div>
                  </div>
                ))}
                <div className="muted" style={{ fontSize: '0.76rem', marginTop: '0.55rem', lineHeight: 1.45 }}>
                  💡 {r.grammarTipTr}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
