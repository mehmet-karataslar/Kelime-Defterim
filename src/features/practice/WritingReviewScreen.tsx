import { useState } from 'react';
import {
  FileCheck2, Sparkles, AlertTriangle, CheckCircle2, XCircle, RotateCcw, Award,
} from 'lucide-react';
import { useNav } from '../../app/navigation';
import { useStore } from '../../core/store';
import { Level, uid } from '../../core/types';
import { AnalysisResult, analyzeGermanText } from '../../core/germanAnalyzer';
import { TopBar } from '../../shared/ui';
import { toast } from '../../shared/toastStore';

const SAMPLE_PROMPTS: { title: string; desc: string; level: Level; formal: boolean }[] = [
  {
    title: 'Doktordan Randevu Alma (B2)',
    desc: 'Şikâyetlerini ve belirtilerini açıklayarak aile hekiminden yakın tarihli randevu isteyen kısa bir metin yaz.',
    level: 'B2',
    formal: true,
  },
  {
    title: 'Bürgeramt’a Resmî E-Posta (B1.2)',
    desc: 'Yeni taşındığın dairenin adres kaydı (Anmeldung) için randevu talep eden resmî bir e-posta yaz.',
    level: 'B1.2',
    formal: true,
  },
  {
    title: 'Ustaya Günlük İş Raporu (B2)',
    desc: 'Bugün şantiyede ısı pompası veya tesisat kurulumunda yaptığın işleri ve bir sorunu ustana anlat.',
    level: 'B2',
    formal: false,
  },
];

export default function WritingReviewScreen({
  promptTitle,
  promptDesc,
  targetLevel = 'B1.2',
  formal = true,
}: {
  promptTitle?: string;
  promptDesc?: string;
  targetLevel?: Level;
  formal?: boolean;
}) {
  const { back } = useNav();
  const words = useStore((s) => s.words);
  const addSession = useStore((s) => s.addSession);

  const [selectedPrompt, setSelectedPrompt] = useState(
    promptTitle
      ? { title: promptTitle, desc: promptDesc ?? '', level: targetLevel, formal }
      : SAMPLE_PROMPTS[0],
  );
  const [text, setText] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState(false);

  const runAnalysis = () => {
    if (text.trim().length < 10) {
      toast('Lütfen incelenecek en az bir tam Almanca cümle yaz.', 'info');
      return;
    }
    const res = analyzeGermanText(text, words, {
      formal: selectedPrompt.formal,
      targetLevel: selectedPrompt.level,
    });
    setResult(res);
    setQuizAnswers({});
    setSaved(false);
  };

  const retryEdit = () => {
    setResult(null);
    setQuizAnswers({});
    setSaved(false);
  };

  const saveProgress = () => {
    if (!result || saved) return;
    const total = result.quiz.length;
    const correct = result.quiz.filter((q) => quizAnswers[q.id] === q.correctIndex).length;
    addSession({
      id: uid(),
      mode: 'writing',
      ts: Date.now(),
      total,
      correct,
      wrong: total - correct,
      hard: result.issues.length,
      durationSec: 180,
      level: result.estimatedLevel,
    });
    setSaved(true);
    toast(`Yazma & gramer testi ilerlemene kaydedildi! (${correct}/${total})`, 'ok');
  };

  const allQuizDone = result ? result.quiz.every((q) => quizAnswers[q.id] !== undefined) : false;
  const quizCorrect = result ? result.quiz.filter((q) => quizAnswers[q.id] === q.correctIndex).length : 0;

  return (
    <div className="screen">
      <TopBar title="Metin Yazma & İnceleme" icon={<FileCheck2 size={18} />} onBack={back} />
      <div className="screen-body no-nav">
        {!promptTitle ? (
          <div className="type-scroll" style={{ marginTop: '0.9rem', marginBottom: '0.7rem' }}>
            {SAMPLE_PROMPTS.map((p) => (
              <button
                key={p.title}
                className={`type-chip ${selectedPrompt.title === p.title ? 'on' : ''}`}
                onClick={() => { setSelectedPrompt(p); setResult(null); }}
              >
                {p.title}
              </button>
            ))}
          </div>
        ) : null}

        <div className="card" style={{ padding: '0.95rem 1rem', marginTop: promptTitle ? '0.9rem' : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.3rem' }}>
            <span className="level-chip">Hedef: {selectedPrompt.level}</span>
            <span className="chip gray">{selectedPrompt.formal ? 'Resmî (Sie)' : 'Yarı Resmî / İş'}</span>
          </div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{selectedPrompt.title}</div>
          <p className="muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem', lineHeight: 1.5 }}>{selectedPrompt.desc}</p>
        </div>

        <div className="card" style={{ padding: '0.9rem', marginTop: '0.8rem' }}>
          <label className="field-label">Almanca Metnin</label>
          <textarea
            className="writing-area"
            rows={7}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Sehr geehrte Damen und Herren,&#10;&#10;ich schreibe Ihnen, weil..."
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.55rem' }}>
            <span className="muted-3" style={{ fontSize: '0.74rem', fontWeight: 600 }}>
              {text.trim() ? text.trim().split(/\s+/).length : 0} kelime
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {result ? (
                <button className="btn outline" style={{ padding: '0.5rem 0.85rem', fontSize: '0.78rem' }} onClick={retryEdit}>
                  <RotateCcw size={14} /> Düzelt & Yeniden Dene
                </button>
              ) : null}
              <button className="btn gradient" style={{ padding: '0.55rem 1rem', fontSize: '0.82rem' }} onClick={runAnalysis}>
                <Sparkles size={15} /> Metni İncele
              </button>
            </div>
          </div>
        </div>

        {result ? (
          <div className="anim-in" style={{ marginTop: '0.9rem' }}>
            <div className="card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div className="eyebrow">DEĞERLENDİRME</div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', marginTop: '0.15rem' }}>
                    Tahmini Seviye: <span style={{ color: 'var(--primary)' }}>{result.estimatedLevel}</span>
                  </div>
                </div>
                <div className="score-badge">%{result.score}</div>
              </div>
              <p className="muted" style={{ fontSize: '0.8rem', marginTop: '0.45rem', lineHeight: 1.5 }}>{result.levelNoteTr}</p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
                <span className="chip gray">{result.wordCount} kelime</span>
                <span className="chip gray">{result.sentenceCount} cümle</span>
                <span className={`chip ${result.issues.length === 0 ? 'green' : ''}`}>
                  {result.issues.length === 0 ? 'Hata bulunmadı ✓' : `${result.issues.length} inceleme noktası`}
                </span>
              </div>
            </div>

            <div className="section-head">
              <span className="section-title">Tespit Edilen Hatalar & Öneriler</span>
            </div>
            {result.issues.length === 0 ? (
              <div className="card" style={{ padding: '1rem', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <CheckCircle2 size={20} style={{ color: 'var(--green)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>
                  Harika! Temel yazım, büyük/küçük harf, yan cümle dizilimi ve edat-hâl kurallarında belirgin bir hata tespit edilmedi.
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {result.issues.map((iss) => (
                  <div key={iss.id} className="card issue-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                      <AlertTriangle size={15} style={{ color: 'var(--rose)' }} />
                      <span style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--rose-text)' }}>{iss.categoryLabel}</span>
                    </div>
                    <div className="issue-diff">
                      <span className="issue-wrong">{iss.excerpt}</span>
                      <span>→</span>
                      <span className="issue-right">{iss.suggestion}</span>
                    </div>
                    <p className="muted" style={{ fontSize: '0.78rem', marginTop: '0.35rem', lineHeight: 1.45 }}>{iss.explanationTr}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="section-head">
              <span className="section-title">Kişiselleştirilmiş Gramer Testi</span>
              <span className="chip">{result.quiz.length} soru</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {result.quiz.map((q, qi) => {
                const picked = quizAnswers[q.id];
                const answered = picked !== undefined;
                return (
                  <div key={q.id} className="card" style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem', marginBottom: '0.65rem', lineHeight: 1.45 }}>
                      {qi + 1}. {q.prompt}
                    </div>
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
                            onClick={() => !answered && setQuizAnswers((p) => ({ ...p, [q.id]: oi }))}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {answered ? (
                      <div style={{ marginTop: '0.6rem', fontSize: '0.78rem', display: 'flex', gap: '0.45rem', alignItems: 'flex-start' }}>
                        {picked === q.correctIndex ? <CheckCircle2 size={15} style={{ color: 'var(--green)', flexShrink: 0, marginTop: 2 }} /> : <XCircle size={15} style={{ color: 'var(--rose)', flexShrink: 0, marginTop: 2 }} />}
                        <span className="muted">{q.explanationTr}</span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {allQuizDone ? (
              <button
                className="btn gradient block lg"
                style={{ marginTop: '1rem' }}
                disabled={saved}
                onClick={saveProgress}
              >
                <Award size={17} />
                {saved
                  ? `İlerlemeye Kaydedildi (${quizCorrect}/${result.quiz.length})`
                  : `Sonucu İlerlemeye Kaydet (${quizCorrect}/${result.quiz.length})`}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
