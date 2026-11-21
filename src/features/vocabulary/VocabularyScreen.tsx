import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen, Search, X, SlidersHorizontal, FolderOpen, ArrowUpDown,
  List, LayoutGrid, Volume2, Heart, Plus, Trash2, Bookmark, Star, Clock, Download,
} from 'lucide-react';
import { useStore } from '../../core/store';
import { useNav } from '../../app/navigation';
import { useI18n, useMeaning } from '../../localization';
import { Article, LEVELS, Level, SrsState, WORD_TYPES, Word, WordType, foldForSearch } from '../../core/types';
import { isStruggling } from '../../core/srs';
import { ArticleBadge, StatusDot, TopBar, Modal, ConfirmModal, CheckBox, EmptyState, statusOf } from '../../shared/ui';
import { speakGerman } from '../../core/audio';
import { toast } from '../../shared/toastStore';
import { downloadCsv } from '../backup/exporters';

type SortKey = 'newest' | 'oldest' | 'alpha' | 'reviewed' | 'wrong' | 'due';

function WordCard({
  w, grid, selecting, selected, onOpen, onLongPress, onToggle,
}: {
  w: Word; grid: boolean; selecting: boolean; selected: boolean;
  onOpen: () => void; onLongPress: () => void; onToggle: () => void;
}) {
  const { t } = useI18n();
  const meaning = useMeaning();
  const settings = useStore((s) => s.settings);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longFired = useRef(false);
  const accent = w.article ? settings.articleColors[w.article] : 'transparent';

  const startPress = () => {
    longFired.current = false;
    timer.current = setTimeout(() => { longFired.current = true; onLongPress(); }, 450);
  };
  const endPress = () => { if (timer.current) clearTimeout(timer.current); };

  return (
    <div
      className={`card word-card ${selected ? 'selected' : ''}`}
      style={{ ['--accent' as string]: accent }}
      role="button"
      tabIndex={0}
      onPointerDown={startPress}
      onPointerUp={endPress}
      onPointerLeave={endPress}
      onClick={() => {
        if (longFired.current) return;
        selecting ? onToggle() : onOpen();
      }}
      onKeyDown={(e) => e.key === 'Enter' && (selecting ? onToggle() : onOpen())}
    >
      {selecting ? <CheckBox on={selected} /> : null}
      <div className="word-main">
        <div className="word-top">
          <ArticleBadge article={w.article} />
          <span className="word-german">{w.german}</span>
          <StatusDot word={w} />
        </div>
        <div className="word-meaning">{meaning(w)}</div>
        <div className="word-meta">
          {t(`common.${w.type}`)}
          {w.level ? <> · <span className="level-chip">{w.level}</span></> : null}
        </div>
      </div>
      <div className="word-actions">
        <button
          className="icon-btn sm"
          onClick={(e) => { e.stopPropagation(); speakGerman(w.german, settings.ttsRate, () => toast(t('learn.ttsMissing'), 'err')); }}
          aria-label={t('learn.playAudio')}
        >
          <Volume2 size={15} />
        </button>
        <button
          className={`icon-btn sm ${w.favorite ? 'fav' : 'fav-off'}`}
          onClick={(e) => { e.stopPropagation(); toggleFavorite(w.id); }}
          aria-label={t('common.favorites')}
        >
          <Heart size={15} fill={w.favorite ? 'currentColor' : 'none'} />
        </button>
      </div>
    </div>
  );
}

export default function VocabularyScreen() {
  const { t } = useI18n();
  const meaning = useMeaning();
  const words = useStore((s) => s.words);
  const collections = useStore((s) => s.collections);
  const deleteWords = useStore((s) => s.deleteWords);
  const undoDelete = useStore((s) => s.undoDelete);
  const setFavoriteBulk = useStore((s) => s.setFavoriteBulk);
  const assignToCollection = useStore((s) => s.assignToCollection);
  const addToReviewList = useStore((s) => s.addToReviewList);
  const { push } = useNav();

  const [query, setQuery] = useState('');
  const [quick, setQuick] = useState<'all' | 'fav' | Level>('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [grid, setGrid] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<WordType | null>(null);
  const [statusFilter, setStatusFilter] = useState<SrsState | 'struggling' | null>(null);
  const [articleFilter, setArticleFilter] = useState<Article | null>(null);
  const [colFilter, setColFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [colPicker, setColPicker] = useState(false);
  const [visibleCount, setVisibleCount] = useState(60);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const selecting = selected.size > 0;
  const extraFilters = [typeFilter, statusFilter, articleFilter, colFilter].filter(Boolean).length;

  const filtered = useMemo(() => {
    let list = words;
    if (quick === 'fav') list = list.filter((w) => w.favorite);
    else if (quick !== 'all') list = list.filter((w) => w.level === quick);
    if (typeFilter) list = list.filter((w) => w.type === typeFilter);
    if (articleFilter) list = list.filter((w) => w.article === articleFilter);
    if (statusFilter) list = list.filter((w) => statusOf(w) === statusFilter);
    if (colFilter) {
      const col = collections.find((c) => c.id === colFilter);
      const ids = new Set(col?.wordIds ?? []);
      list = list.filter((w) => ids.has(w.id));
    }
    if (query.trim()) {
      const q = foldForSearch(query);
      list = list.filter((w) =>
        foldForSearch(w.german).includes(q) ||
        w.senses.some((s) => foldForSearch(s.tr).includes(q) || (s.en && foldForSearch(s.en).includes(q))) ||
        w.tags.some((tag) => foldForSearch(tag).includes(q)) ||
        w.examples.some((e) => foldForSearch(e.de).includes(q)));
    }
    const sorted = [...list];
    switch (sort) {
      case 'newest': sorted.sort((a, b) => b.createdAt - a.createdAt); break;
      case 'oldest': sorted.sort((a, b) => a.createdAt - b.createdAt); break;
      case 'alpha': sorted.sort((a, b) => a.german.localeCompare(b.german, 'de')); break;
      case 'reviewed': sorted.sort((a, b) => b.stats.reviews - a.stats.reviews); break;
      case 'wrong': sorted.sort((a, b) => b.stats.wrong - a.stats.wrong); break;
      case 'due': sorted.sort((a, b) => (a.srs.due ?? Infinity) - (b.srs.due ?? Infinity)); break;
    }
    return sorted;
  }, [words, collections, query, quick, sort, typeFilter, statusFilter, articleFilter, colFilter]);

  useEffect(() => {
    setVisibleCount(60);
  }, [query, quick, sort, typeFilter, statusFilter, articleFilter, colFilter]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || visibleCount >= filtered.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => Math.min(filtered.length, c + 60));
        }
      },
      { rootMargin: '300px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visibleCount, filtered.length]);

  const visibleWords = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const doDelete = () => {
    const ids = [...selected];
    deleteWords(ids);
    setSelected(new Set());
    toast(t('words.wordsDeleted', { n: ids.length }), 'ok', t('common.undo'), undoDelete);
  };

  const sortLabels: Record<SortKey, string> = {
    newest: t('words.sortNewest'), oldest: t('words.sortOldest'), alpha: t('words.sortAlpha'),
    reviewed: t('words.sortReviewed'), wrong: t('words.sortWrong'), due: t('words.sortDue'),
  };

  return (
    <div className="screen">
      <TopBar title={t('tabs.words')} icon={<BookOpen size={19} />} solidProfile />
      <div className="screen-body">
        <div className="words-head anim-in">
          <div>
            <div className="words-title">{t('words.title')}</div>
            <div className="words-count"><span className="status-dot learned" /> {t('words.registered', { n: words.length })}</div>
          </div>
          <button className="folder-btn" onClick={() => push({ name: 'collections' })} aria-label={t('common.collections')}>
            <FolderOpen size={21} />
          </button>
        </div>

        <div className="search-bar anim-in-1">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('words.searchPlaceholder')}
            aria-label={t('common.search')}
          />
          {query ? <button className="search-clear" onClick={() => setQuery('')}><X size={16} /></button> : null}
        </div>

        <div className="filter-row anim-in-2">
          <button className={`filter-chip ${quick === 'all' ? 'active' : ''}`} onClick={() => setQuick('all')}>{t('common.all')}</button>
          <button className={`filter-chip ${quick === 'fav' ? 'active' : ''}`} onClick={() => setQuick('fav')}>{t('common.favorites')}</button>
          {(['A1', 'A2', 'B1', 'B2', 'C1'] as Level[]).map((l) => (
            <button key={l} className={`filter-chip ${quick === l ? 'active' : ''}`} onClick={() => setQuick(quick === l ? 'all' : l)}>{l}</button>
          ))}
          <button className={`filter-icon-btn ${extraFilters > 0 ? 'on' : ''}`} onClick={() => setFilterOpen(true)} aria-label={t('words.filterTitle')}>
            <SlidersHorizontal size={17} />
            {extraFilters > 0 ? <span className="filter-badge">{extraFilters}</span> : null}
          </button>
        </div>

        <div className="sort-row anim-in-2">
          <div className="sort-select-wrap">
            <span className="sort-icon"><ArrowUpDown size={14} /></span>
            <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="sort">
              {(Object.keys(sortLabels) as SortKey[]).map((k) => <option key={k} value={k}>{sortLabels[k]}</option>)}
            </select>
          </div>
          <div className="view-toggle">
            <button className={!grid ? 'active' : ''} onClick={() => setGrid(false)} aria-label="list"><List size={16} /></button>
            <button className={grid ? 'active' : ''} onClick={() => setGrid(true)} aria-label="grid"><LayoutGrid size={16} /></button>
          </div>
        </div>

        {words.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={30} />}
            title={t('words.empty')} desc={t('words.emptyDesc')}
            actionLabel={t('words.addFirst')} onAction={() => push({ name: 'wordEditor' })}
          />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Search size={28} />} title={t('words.noResults')} desc={t('words.noResultsDesc')} />
        ) : (
          <>
            <div className={grid ? 'words-grid' : ''}>
              {visibleWords.map((w) => (
                <WordCard
                  key={w.id} w={w} grid={grid}
                  selecting={selecting} selected={selected.has(w.id)}
                  onOpen={() => push({ name: 'wordDetail', id: w.id })}
                  onLongPress={() => toggleSelect(w.id)}
                  onToggle={() => toggleSelect(w.id)}
                />
              ))}
            </div>
            {visibleCount < filtered.length ? (
              <div ref={loadMoreRef} style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0 2rem' }}>
                <button className="btn outline" onClick={() => setVisibleCount((c) => Math.min(filtered.length, c + 60))}>
                  +{Math.min(60, filtered.length - visibleCount)} ({visibleCount}/{filtered.length})
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>

      {!selecting ? (
        <button className="fab" onClick={() => push({ name: 'wordEditor' })}>
          <Plus size={19} strokeWidth={2.6} /> {t('home.addWord')}
        </button>
      ) : (
        <div className="selection-bar">
          <span className="selection-count">{t('words.selected', { n: selected.size })}</span>
          <button onClick={() => { setFavoriteBulk([...selected], true); toast(t('words.addedToFav')); setSelected(new Set()); }} aria-label={t('common.favorites')}>
            <Star size={17} />
          </button>
          <button onClick={() => setColPicker(true)} aria-label={t('words.addToCollection')}>
            <Bookmark size={17} />
          </button>
          <button onClick={() => { addToReviewList([...selected]); toast(t('detail.addedToReview')); setSelected(new Set()); }} aria-label={t('words.addToReview')}>
            <Clock size={17} />
          </button>
          <button
            onClick={() => {
              downloadCsv(words.filter((w) => selected.has(w.id)));
              toast(t('settings.backupDone'));
            }}
            aria-label={t('words.exportSelected')}
          >
            <Download size={17} />
          </button>
          <button className="danger" onClick={() => setConfirmDelete(true)} aria-label={t('words.deleteSelected')}>
            <Trash2 size={17} />
          </button>
          <button onClick={() => setSelected(new Set())} aria-label={t('common.close')}><X size={17} /></button>
        </div>
      )}

      {filterOpen ? (
        <Modal title={t('words.filterTitle')} onClose={() => setFilterOpen(false)}
          actions={
            <>
              <button className="btn outline" onClick={() => { setTypeFilter(null); setStatusFilter(null); setArticleFilter(null); setColFilter(null); }}>
                {t('words.clear')}
              </button>
              <button className="btn primary" onClick={() => setFilterOpen(false)}>{t('words.apply')}</button>
            </>
          }
        >
          <div className="field">
            <label className="field-label">{t('common.article')}</label>
            <div className="article-picker" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
              {([null, 'der', 'die', 'das'] as (Article | null)[]).map((a) => (
                <button
                  key={a ?? 'none'}
                  className={`article-pick ${a ?? 'none'} small ${articleFilter === a ? 'on' : ''}`}
                  onClick={() => setArticleFilter(articleFilter === a ? null : a)}
                >
                  {a ?? t('common.all')}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label className="field-label">{t('words.type')}</label>
            <div className="type-scroll">
              {WORD_TYPES.map((tp) => (
                <button key={tp} className={`type-chip ${typeFilter === tp ? 'on' : ''}`} onClick={() => setTypeFilter(typeFilter === tp ? null : tp)}>
                  {t(`common.${tp}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label className="field-label">{t('words.status')}</label>
            <div className="type-scroll">
              {(['new', 'learning', 'review', 'learned', 'struggling'] as const).map((st) => (
                <button key={st} className={`type-chip ${statusFilter === st ? 'on' : ''}`} onClick={() => setStatusFilter(statusFilter === st ? null : st)}>
                  {t(`common.${st}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label className="field-label">{t('common.level')}</label>
            <div className="level-picker">
              {LEVELS.map((l) => (
                <button key={l} className={`level-pick ${quick === l ? 'on' : ''}`} onClick={() => setQuick(quick === l ? 'all' : l)}>{l}</button>
              ))}
            </div>
          </div>
          {collections.length > 0 ? (
            <div className="field">
              <label className="field-label">{t('common.collection')}</label>
              <div className="type-scroll">
                {collections.map((c) => (
                  <button key={c.id} className={`type-chip ${colFilter === c.id ? 'on' : ''}`} onClick={() => setColFilter(colFilter === c.id ? null : c.id)}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </Modal>
      ) : null}

      {colPicker ? (
        <Modal title={t('words.addToCollection')} onClose={() => setColPicker(false)}>
          {collections.length === 0 ? (
            <p className="modal-desc">{t('collections.emptyDesc')}</p>
          ) : collections.map((c) => (
            <button
              key={c.id} className="lang-option"
              onClick={() => {
                assignToCollection(c.id, [...selected]);
                toast(t('common.saved'));
                setColPicker(false);
                setSelected(new Set());
              }}
            >
              <span className="legend-dot" style={{ background: c.color, width: '0.8rem', height: '0.8rem' }} />
              {c.name}
              <span className="setting-value">{t('collections.wordsCount', { n: c.wordIds.length })}</span>
            </button>
          ))}
        </Modal>
      ) : null}

      {confirmDelete ? (
        <ConfirmModal
          title={t('words.deleteSelected')}
          desc={t('words.deleteConfirm', { n: selected.size })}
          confirmLabel={t('common.delete')} danger
          onConfirm={doDelete} onClose={() => setConfirmDelete(false)}
        />
      ) : null}
    </div>
  );
}