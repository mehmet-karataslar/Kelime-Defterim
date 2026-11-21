import { useState } from 'react';
import {
  FolderOpen, Plus, GraduationCap, MessageCircle, Plane, Zap, Flame, BookOpen,
  Briefcase, Music, Heart, Star, Trash2, Pencil, Play, Check, Search,
} from 'lucide-react';
import { useStore } from '../../core/store';
import { useNav } from '../../app/navigation';
import { useI18n, useMeaning } from '../../localization';
import { Collection, uid, foldForSearch } from '../../core/types';
import { TopBar, Modal, ConfirmModal, EmptyState, ArticleBadge, CheckBox } from '../../shared/ui';
import { toast } from '../../shared/toastStore';

const COLORS = ['#4338CA', '#7C3AED', '#059669', '#D97706', '#E11D48', '#0369A1', '#C026D3', '#475569'];
const ICONS: Record<string, typeof BookOpen> = {
  graduation: GraduationCap, message: MessageCircle, plane: Plane, zap: Zap,
  flame: Flame, book: BookOpen, briefcase: Briefcase, music: Music, heart: Heart, star: Star,
};

export function CollectionIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = ICONS[name] ?? BookOpen;
  return <Icon size={size} />;
}

function CollectionEditor({ existing, onClose }: { existing?: Collection; onClose: () => void }) {
  const { t } = useI18n();
  const saveCollection = useStore((s) => s.saveCollection);
  const [name, setName] = useState(existing?.name ?? '');
  const [desc, setDesc] = useState(existing?.description ?? '');
  const [color, setColor] = useState(existing?.color ?? COLORS[0]);
  const [icon, setIcon] = useState(existing?.icon ?? 'book');

  const save = () => {
    if (!name.trim()) return;
    saveCollection({
      id: existing?.id ?? uid(),
      name: name.trim(), description: desc.trim() || undefined,
      color, icon, wordIds: existing?.wordIds ?? [], createdAt: existing?.createdAt ?? Date.now(),
    });
    toast(t('collections.created'));
    onClose();
  };

  return (
    <Modal title={existing ? t('collections.editTitle') : t('collections.create')} onClose={onClose}
      actions={
        <>
          <button className="btn outline" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn primary" disabled={!name.trim()} onClick={save}>{t('common.save')}</button>
        </>
      }
    >
      <div className="field">
        <label className="field-label">{t('collections.name')}</label>
        <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('collections.namePlaceholder')} autoFocus />
      </div>
      <div className="field">
        <label className="field-label">{t('collections.description')}</label>
        <input className="field-input" value={desc} onChange={(e) => setDesc(e.target.value)} />
      </div>
      <div className="field">
        <label className="field-label">{t('collections.color')}</label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {COLORS.map((c) => (
            <button key={c} className={`color-dot ${color === c ? 'on' : ''}`} style={{ background: c }} onClick={() => setColor(c)} aria-label={c} />
          ))}
        </div>
      </div>
      <div className="field">
        <label className="field-label">{t('collections.icon')}</label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {Object.keys(ICONS).map((k) => (
            <button key={k} className={`icon-pick ${icon === k ? 'on' : ''}`} onClick={() => setIcon(k)}>
              <CollectionIcon name={k} size={17} />
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}

export function CollectionsScreen() {
  const { t } = useI18n();
  const collections = useStore((s) => s.collections);
  const words = useStore((s) => s.words);
  const { push, back } = useNav();
  const [editorOpen, setEditorOpen] = useState(false);

  return (
    <div className="screen">
      <TopBar title={t('collections.title')} icon={<FolderOpen size={18} />} onBack={back} />
      <div className="screen-body no-nav">
        <p className="muted anim-in" style={{ fontSize: '0.85rem', margin: '0.9rem 0' }}>{t('collections.subtitle')}</p>
        {collections.length === 0 ? (
          <EmptyState icon={<FolderOpen size={28} />} title={t('collections.empty')} desc={t('collections.emptyDesc')}
            actionLabel={t('collections.create')} onAction={() => setEditorOpen(true)} />
        ) : collections.map((c) => {
          const ws = words.filter((w) => c.wordIds.includes(w.id));
          const learned = ws.filter((w) => w.srs.state === 'learned').length;
          const pct = ws.length > 0 ? Math.round((learned / ws.length) * 100) : 0;
          return (
            <button key={c.id} className="card collection-card anim-in" style={{ ['--accent' as string]: c.color }}
              onClick={() => push({ name: 'collectionDetail', id: c.id })}>
              <div className="collection-head">
                <span className="collection-icon"><CollectionIcon name={c.icon} /></span>
                <div>
                  <div className="collection-name">{c.name}</div>
                  {c.description ? <div className="collection-desc">{c.description}</div> : null}
                </div>
              </div>
              <div className="collection-meta">
                <span>{t('collections.wordsCount', { n: ws.length })}</span>
                <div className="collection-track"><div className="collection-fill" style={{ width: `${pct}%` }} /></div>
                <span>{t('collections.progress', { n: pct })}</span>
              </div>
            </button>
          );
        })}
        {collections.length > 0 ? (
          <button className="btn primary block" style={{ marginTop: '0.5rem' }} onClick={() => setEditorOpen(true)}>
            <Plus size={17} /> {t('collections.create')}
          </button>
        ) : null}
      </div>
      {editorOpen ? <CollectionEditor onClose={() => setEditorOpen(false)} /> : null}
    </div>
  );
}

export function CollectionDetailScreen({ id }: { id: string }) {
  const { t } = useI18n();
  const meaning = useMeaning();
  const collections = useStore((s) => s.collections);
  const words = useStore((s) => s.words);
  const setCollectionWords = useStore((s) => s.setCollectionWords);
  const deleteCollection = useStore((s) => s.deleteCollection);
  const { push, back } = useNav();
  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [query, setQuery] = useState('');

  const c = collections.find((x) => x.id === id);
  if (!c) {
    return (
      <div className="screen">
        <TopBar title={t('common.collection')} onBack={back} />
        <div className="screen-body no-nav"><EmptyState icon={<FolderOpen size={28} />} title={t('words.noResults')} desc="" /></div>
      </div>
    );
  }
  const ws = words.filter((w) => c.wordIds.includes(w.id));
  const learned = ws.filter((w) => w.srs.state === 'learned').length;
  const pct = ws.length > 0 ? Math.round((learned / ws.length) * 100) : 0;
  const manageList = query.trim()
    ? words.filter((w) => foldForSearch(w.german).includes(foldForSearch(query)) || w.senses.some((s) => foldForSearch(s.tr).includes(foldForSearch(query))))
    : words;

  return (
    <div className="screen">
      <TopBar title={c.name} icon={<CollectionIcon name={c.icon} size={18} />} onBack={back}
        right={
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button className="topbar-btn" onClick={() => setEditOpen(true)} aria-label={t('common.edit')}><Pencil size={15} /></button>
            <button className="topbar-btn" style={{ borderColor: 'var(--rose)', color: 'var(--rose)' }} onClick={() => setDelOpen(true)} aria-label={t('common.delete')}><Trash2 size={15} /></button>
          </div>
        }
      />
      <div className="screen-body no-nav">
        <div className="card collection-card anim-in" style={{ ['--accent' as string]: c.color, marginTop: '1rem' }}>
          {c.description ? <div className="collection-desc" style={{ marginBottom: '0.6rem' }}>{c.description}</div> : null}
          <div className="collection-meta" style={{ marginTop: 0 }}>
            <span>{t('collections.wordsCount', { n: ws.length })}</span>
            <div className="collection-track"><div className="collection-fill" style={{ width: `${pct}%` }} /></div>
            <span>{t('collections.progress', { n: pct })}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.9rem' }}>
            <button className="btn gradient" style={{ flex: 1 }} disabled={ws.length === 0}
              onClick={() => push({ name: 'session', mode: 'flashcard', wordIds: ws.map((w) => w.id), collectionId: c.id })}>
              <Play size={15} fill="currentColor" /> {t('collections.study')}
            </button>
            <button className="btn outline" onClick={() => setManageOpen(true)}><Plus size={15} /> {t('collections.addWords')}</button>
          </div>
        </div>

        {ws.map((w) => (
          <button key={w.id} className="card recent-row" onClick={() => push({ name: 'wordDetail', id: w.id })}>
            <ArticleBadge article={w.article} solid />
            <div>
              <div className="recent-word">{w.german}</div>
              <div className="recent-meaning">{meaning(w)}</div>
            </div>
            {w.level ? <span className="level-chip" style={{ marginLeft: 'auto' }}>{w.level}</span> : null}
          </button>
        ))}
        {ws.length === 0 ? <EmptyState icon={<BookOpen size={26} />} title={t('words.empty')} desc={t('collections.emptyDesc')} actionLabel={t('collections.addWords')} onAction={() => setManageOpen(true)} /> : null}
      </div>

      {editOpen ? <CollectionEditor existing={c} onClose={() => setEditOpen(false)} /> : null}
      {delOpen ? (
        <ConfirmModal title={t('common.delete')} desc={t('collections.deleteConfirm', { n: c.name })}
          confirmLabel={t('common.delete')} danger
          onConfirm={() => { deleteCollection(c.id); back(); toast(t('common.deleted')); }}
          onClose={() => setDelOpen(false)} />
      ) : null}
      {manageOpen ? (
        <Modal title={t('collections.manageWords')} onClose={() => setManageOpen(false)}>
          <div className="search-bar" style={{ marginBottom: '0.8rem' }}>
            <Search size={16} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('words.searchPlaceholder')} />
          </div>
          <div className="card" style={{ maxHeight: '45dvh', overflowY: 'auto' }}>
            {manageList.map((w) => {
              const inCol = c.wordIds.includes(w.id);
              return (
                <button key={w.id} className="word-pick-row"
                  onClick={() => setCollectionWords(c.id, inCol ? c.wordIds.filter((x) => x !== w.id) : [...c.wordIds, w.id])}>
                  <CheckBox on={inCol} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{w.article ? `${w.article} ` : ''}{w.german}</div>
                    <div className="muted-3" style={{ fontSize: '0.72rem' }}>{meaning(w)}</div>
                  </div>
                  {inCol ? <Check size={15} style={{ marginLeft: 'auto', color: 'var(--primary)' }} /> : null}
                </button>
              );
            })}
          </div>
        </Modal>
      ) : null}
    </div>
  );
}