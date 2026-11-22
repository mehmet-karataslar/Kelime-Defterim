import { useState } from 'react';
import {
  Stethoscope, Volume2, Eye, EyeOff, Plus, CheckCircle2, XCircle, ChevronRight, Award,
} from 'lucide-react';
import { DOCTOR_DIALOGUES, DoctorDialogue, KeyVocab } from '../../data/doctorDialogues';
import { useNav } from '../../app/navigation';
import { useStore } from '../../core/store';
import { TopBar } from '../../shared/ui';
import { speakGerman } from '../../core/audio';
import { freshSrs } from '../../core/srs';
import { uid } from '../../core/types';
import { toast } from '../../shared/toastStore';

export default function DoctorDialoguesScreen() {
  const { back } = useNav();
  const words = useStore((s) => s.words);
  const addWord = useStore((s) => s.addWord);
  const addSession = useStore((s) => s.addSession);
  const ttsRate = useStore((s) => s.settings.ttsRate);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [showTr, setShowTr] = useState(true);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [savedQuiz, setSavedQuiz] = useState<Record<string, boolean>>({});

  const active: DoctorDialogue | undefined = DOCTOR_DIALOGUES.find((d) => d.id === activeId);

  const speak = (text: string) =>
    speakGerman(text, ttsRate, () => toast('Almanca seslendirme bu cihazda bulunamadı.', 'err'));

  const saveVocab = (v: KeyVocab) => {
    const exists = words.some(
      (w) => w.german.toLocaleLowerCase('de-DE') === v.german.toLocaleLowerCase('de-DE') && w.type === v.type,
    );
    if (exists) {
      toast(`"${v.german}" zaten defterinde kayıtlı.`, 'info');
      return;
    }
    addWord({
      id: `doc-${uid()}`,
      german: v.german,
      article: v.article,
      type: v.type,
      level: 'B2',
      senses: [{ id: uid(), tr: v.tr, context: 'Sağlık / Doktor' }],
      examples: [],
      synonyms: [],
      antonyms: [],
      related: [],
      tags: ['doktor', 'saglik', 'b2'],
      notes: v.note,
      favorite: false,
      createdAt: Date.now(),
      srs: freshSrs(),
      stats: { reviews: 0, correct: 0, wrong: 0 },
    });
    toast(`"${v.german}" defterine eklendi!`, 'ok');
  };

  const finishQuiz = (d: DoctorDialogue) => {
    if (savedQuiz[d.id]) return;
    const total = d.quizzes.length;
    const correct = d.quizzes.filter((q) => answers[q.id] === q.correctIndex).length;
    addSession({
      id: uid(),
      mode: 'sentence',
      ts: Date.now(),
      total,
      correct,
      wrong: total - correct,
      hard: 0,
      durationSec: 120,
      level: 'B2',
    });
    setSavedQuiz((p) => ({ ...p, [d.id]: true }));
    toast(`Test kaydedildi! (${correct}/${total} doğru)`, 'ok');
  };

  if (!active) {
    return (
      <div className="screen">
        <TopBar title="Hasta–Doktor Diyalogları" icon={<Stethoscope size={18} />} onBack={back} />
        <div className="screen-body no-nav">
          <p className="muted anim-in" style={{ fontSize: '0.84rem', margin: '0.9rem 0' }}>
            B2 seviyesinde gerçek muayenehane konuşmaları, seslendirme, önemli kelimeler ve okuduğunu anlama + gramer testleri.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {DOCTOR_DIALOGUES.map((d) => (
              <button
                key={d.id}
                className="card practice-card anim-in"
                onClick={() => { setActiveId(d.id); setAnswers({}); }}
              >
                <span className="mode-icon rose"><Stethoscope size={18} /></span>
                <div className="practice-card-body">
                  <div className="practice-card-title">
                    {d.title} <span className="level-chip">{d.level}</span>
                  </div>
                  <div className="practice-card-sub">{d.titleTr} · {d.category}</div>
                  <div className="practice-card-desc">{d.summaryTr}</div>
                </div>
                <ChevronRight size={18} className="muted-3" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const allAnswered = active.quizzes.every((q) => answers[q.id] !== undefined);
  const correctCount = active.quizzes.filter((q) => answers[q.id] === q.correctIndex).length;

  return (
    <div className="screen">
      <TopBar
        title={active.titleTr}
        icon={<Stethoscope size={18} />}
        onBack={() => setActiveId(null)}
        right={
          <button className="topbar-btn" onClick={() => setShowTr((v) => !v)} aria-label="Türkçe çeviri">
            {showTr ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        }
      />
      <div className="screen-body no-nav">
        <div className="card" style={{ padding: '1rem', marginTop: '0.9rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span className="level-chip">{active.level}</span>
            <span className="chip gray">{active.category}</span>
          </div>
          <div style={{ fontWeight: 800, fontSize: '1rem' }}>{active.title}</div>
          <p className="muted" style={{ fontSize: '0.8rem', marginTop: '0.3rem', lineHeight: 1.5 }}>{active.summaryTr}</p>
        </div>

        <div className="section-head">
          <span className="section-title">Diyalog</span>
          <button className="link-btn" onClick={() => setShowTr((v) => !v)}>
            {showTr ? 'Türkçeyi Gizle' : 'Türkçeyi Göster'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {active.lines.map((line, i) => {
            const isPatient = line.speaker === 'Patient';
            return (
              <div key={i} className={`card dialogue-bubble ${isPatient ? 'patient' : 'doctor'}`}>
                <div className="dialogue-head">
                  <span className={`chip ${isPatient ? 'green' : ''}`}>{line.speaker}</span>
                  <button className="icon-btn sm" onClick={() => speak(line.de)} aria-label="Seslendir">
                    <Volume2 size={15} />
                  </button>
                </div>
                <div className="dialogue-de">{line.de}</div>
                {showTr ? <div className="dialogue-tr">{line.tr}</div> : null}
              </div>
            );
          })}
        </div>

        <div className="section-head">
          <span className="section-title">Önemli Kelimeler</span>
          <span className="chip gray">{active.vocab.length} terim</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {active.vocab.map((v) => (
            <div key={v.german} className="card" style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '0.7rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                  {v.article ? <span style={{ color: 'var(--primary)', marginRight: '0.3rem' }}>{v.article}</span> : null}
                  {v.german}
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.82rem', marginTop: '0.15rem' }}>{v.tr}</div>
                <div className="muted" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>{v.note}</div>
              </div>
              <button className="btn outline" style={{ padding: '0.4rem 0.65rem', fontSize: '0.72rem' }} onClick={() => saveVocab(v)}>
                <Plus size={13} /> Ekle
              </button>
            </div>
          ))}
        </div>

        <div className="section-head">
          <span className="section-title">Anlama & Gramer Testi</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {active.quizzes.map((q, qi) => {
            const picked = answers[q.id];
            const answered = picked !== undefined;
            return (
              <div key={q.id} className="card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.45rem' }}>
                  <span className="chip">{q.kind === 'comprehension' ? 'Okuduğunu Anlama' : 'B2 Gramer'}</span>
                  <span className="muted-3" style={{ fontSize: '0.72rem', fontWeight: 700 }}>Soru {qi + 1}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.7rem', lineHeight: 1.45 }}>{q.question}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {q.options.map((opt, oi) => {
                    const cls = !answered
                      ? ''
                      : oi === q.correctIndex
                      ? 'correct'
                      : picked === oi
                      ? 'wrong'
                      : 'dim';
                    return (
                      <button
                        key={oi}
                        className={`quiz-option ${cls}`}
                        style={{ textAlign: 'left', padding: '0.65rem 0.85rem', fontSize: '0.82rem' }}
                        onClick={() => !answered && setAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {answered ? (
                  <div className="quiz-explain" style={{ marginTop: '0.65rem', fontSize: '0.78rem', display: 'flex', gap: '0.45rem', alignItems: 'flex-start' }}>
                    {picked === q.correctIndex ? <CheckCircle2 size={15} style={{ color: 'var(--green)', flexShrink: 0, marginTop: 2 }} /> : <XCircle size={15} style={{ color: 'var(--rose)', flexShrink: 0, marginTop: 2 }} />}
                    <span className="muted">{q.explanationTr}</span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {allAnswered ? (
          <button
            className="btn gradient block lg"
            style={{ marginTop: '1rem' }}
            disabled={savedQuiz[active.id]}
            onClick={() => finishQuiz(active)}
          >
            <Award size={17} />
            {savedQuiz[active.id]
              ? `İlerlemeye Kaydedildi (${correctCount}/${active.quizzes.length})`
              : `Sonucu İlerlemeye Kaydet (${correctCount}/${active.quizzes.length})`}
          </button>
        ) : null}
      </div>
    </div>
  );
}
