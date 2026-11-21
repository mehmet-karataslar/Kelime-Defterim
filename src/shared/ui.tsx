import { ReactNode, useEffect } from 'react';
import {
  ArrowLeft, Check, CheckCircle2, AlertCircle, Info, X, Minus, Plus,
} from 'lucide-react';
import { Article, SrsState, Word } from '../core/types';
import { isStruggling } from '../core/srs';
import { useStore } from '../core/store';
import { useToasts } from './toastStore';
import { useNav } from '../app/navigation';
import { useI18n } from '../localization';

export function ArticleBadge({ article, solid, lg }: { article: Article | null; solid?: boolean; lg?: boolean }) {
  const colors = useStore((s) => s.settings.articleColors);
  if (!article) return null;
  const cls = `article-badge ${solid ? 'solid' : 'tint'} ${article} ${lg ? 'lg' : ''}`;
  return (
    <span className={cls} style={solid ? { background: colors[article] } : undefined}>
      {article}
    </span>
  );
}

export function statusOf(w: Word): SrsState | 'struggling' {
  return isStruggling(w) ? 'struggling' : w.srs.state;
}

export function StatusDot({ word }: { word: Word }) {
  return <span className={`status-dot ${statusOf(word)}`} />;
}

export function ProgressRing({
  pct, size = 76, stroke = 8, label, small,
}: { pct: number; size?: number; stroke?: number; label?: string; small?: boolean }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--tint-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="var(--primary)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - clamped / 100)}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.3,0.8,0.3,1)' }}
        />
      </svg>
      <div className={`ring-label ${small ? 'sm' : ''}`}>{label ?? `%${Math.round(clamped)}`}</div>
    </div>
  );
}

export function TopBar({
  title, icon, onBack, right, solidProfile,
}: { title: string; icon?: ReactNode; onBack?: () => void; right?: ReactNode; solidProfile?: boolean }) {
  const { t } = useI18n();
  const setTab = useNav((s) => s.setTab);
  return (
    <header className="topbar">
      {onBack ? (
        <button className="topbar-back" onClick={onBack} aria-label={t('common.back')}>
          <ArrowLeft size={21} />
        </button>
      ) : null}
      <div className="topbar-title">
        {icon ? <span className="topbar-tile">{icon}</span> : null}
        {title}
      </div>
      {right ?? (
        <button
          className={`topbar-btn ${solidProfile ? 'solid' : ''}`}
          onClick={() => setTab('settings')}
          aria-label={t('tabs.settings')}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
          </svg>
        </button>
      )}
    </header>
  );
}

export function Modal({
  title, desc, onClose, children, actions,
}: { title: string; desc?: string; onClose: () => void; children?: ReactNode; actions?: ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal>
        <div className="modal-handle" />
        <div className="modal-title">{title}</div>
        {desc ? <div className="modal-desc">{desc}</div> : null}
        {children}
        {actions ? <div className="modal-actions">{actions}</div> : null}
      </div>
    </div>
  );
}

export function ConfirmModal({
  title, desc, confirmLabel, danger, onConfirm, onClose,
}: { title: string; desc?: string; confirmLabel: string; danger?: boolean; onConfirm: () => void; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <Modal
      title={title} desc={desc} onClose={onClose}
      actions={
        <>
          <button className="btn outline" onClick={onClose}>{t('common.cancel')}</button>
          <button className={`btn ${danger ? 'danger' : 'primary'}`} onClick={() => { onConfirm(); onClose(); }}>
            {confirmLabel}
          </button>
        </>
      }
    />
  );
}

export function ToastHost() {
  const { toasts, dismiss } = useToasts();
  return (
    <div className="toast-wrap">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>
          {t.kind === 'ok' ? <CheckCircle2 size={17} /> : t.kind === 'err' ? <AlertCircle size={17} /> : <Info size={17} />}
          <span>{t.message}</span>
          {t.actionLabel ? (
            <button className="toast-action" onClick={() => { t.onAction?.(); dismiss(t.id); }}>
              {t.actionLabel}
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon, title, desc, actionLabel, onAction,
}: { icon: ReactNode; title: string; desc: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="empty-state anim-in">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      <div className="empty-desc">{desc}</div>
      {actionLabel ? (
        <button className="btn primary" onClick={onAction}>
          <Plus size={17} /> {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button className={`switch ${on ? 'on' : ''}`} role="switch" aria-checked={on} onClick={() => onChange(!on)} />
  );
}

export function Stepper({ value, min, max, step = 1, onChange }: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return (
    <div className="stepper">
      <button onClick={() => onChange(Math.max(min, value - step))} disabled={value <= min} aria-label="minus"><Minus size={15} /></button>
      <span className="val">{value}</span>
      <button onClick={() => onChange(Math.min(max, value + step))} disabled={value >= max} aria-label="plus"><Plus size={15} /></button>
    </div>
  );
}

export function CheckBox({ on }: { on: boolean }) {
  return <span className={`word-check ${on ? 'on' : ''}`}>{on ? <Check size={13} strokeWidth={3.5} /> : null}</span>;
}

export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="icon-btn ghost sm" onClick={onClick} aria-label="close">
      <X size={16} />
    </button>
  );
}