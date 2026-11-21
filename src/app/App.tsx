import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Home, BookOpen, GraduationCap, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import { useStore } from '../core/store';
import { useNav, Tab, Route } from './navigation';
import { useI18n } from '../localization';
import { ToastHost } from '../shared/ui';
import HomeScreen from '../features/home/HomeScreen';
import VocabularyScreen from '../features/vocabulary/VocabularyScreen';
import WordEditorScreen from '../features/vocabulary/WordEditorScreen';
import WordDetailScreen from '../features/vocabulary/WordDetailScreen';
import LearnScreen from '../features/learning/LearnScreen';
import SessionSetupScreen from '../features/learning/SessionSetupScreen';
import SessionScreen from '../features/learning/SessionScreen';
import StatsScreen from '../features/statistics/StatsScreen';
import SettingsScreen from '../features/settings/SettingsScreen';
import { CollectionsScreen, CollectionDetailScreen } from '../features/collections/CollectionsScreen';
import Onboarding from '../features/onboarding/Onboarding';
import { syncNotificationSchedule, notifyOnOpen } from '../features/notifications/service';
import { syncWidgetSnapshot } from '../features/widgets/service';
import { ensureBuiltInPackLoaded } from '../core/builtInPack';

function RouteView({ route }: { route: Route }) {
  switch (route.name) {
    case 'collections': return <CollectionsScreen />;
    case 'collectionDetail': return <CollectionDetailScreen id={route.id} />;
    case 'wordDetail': return <WordDetailScreen id={route.id} />;
    case 'wordEditor': return <WordEditorScreen id={route.id} />;
    case 'sessionSetup': return <SessionSetupScreen mode={route.mode} collectionId={route.collectionId} />;
    case 'session': return <SessionScreen mode={route.mode} wordIds={route.wordIds} collectionId={route.collectionId} level={route.level} />;
  }
}

const TAB_ICONS: Record<Tab, typeof Home> = {
  home: Home, words: BookOpen, learn: GraduationCap, stats: BarChart3, settings: SettingsIcon,
};

let openNotified = false;

export default function App() {
  const { t } = useI18n();
  const settings = useStore((s) => s.settings);
  const tab = useNav((s) => s.tab);
  const stack = useNav((s) => s.stack);
  const setTab = useNav((s) => s.setTab);
  const back = useNav((s) => s.back);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      document.documentElement.classList.add('is-native');
    }
  }, []);

  useEffect(() => {
    const runPack = () => {
      void ensureBuiltInPackLoaded();
    };
    if (useStore.persist.hasHydrated()) {
      runPack();
    } else {
      return useStore.persist.onFinishHydration(runPack);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = settings.theme === 'dark' || (settings.theme === 'system' && mq.matches);
      root.setAttribute('data-theme', dark ? 'dark' : 'light');
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [settings.theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-palette', settings.palette);
    root.setAttribute('data-density', settings.density);
    root.setAttribute('data-reduce-motion', String(settings.reduceMotion));
    root.style.setProperty('--fs', String(settings.fontScale));
    root.style.setProperty('--der', settings.articleColors.der);
    root.style.setProperty('--die', settings.articleColors.die);
    root.style.setProperty('--das', settings.articleColors.das);
    root.lang = settings.uiLang;
  }, [settings.palette, settings.density, settings.reduceMotion, settings.fontScale, settings.articleColors, settings.uiLang]);

  useEffect(() => {
    void syncNotificationSchedule();
  }, [settings.notificationsOn, settings.notificationInterval, settings.notificationContent,
      settings.notificationTimesOn, settings.notificationTimes, settings.quietHoursOn,
      settings.quietStart, settings.quietEnd]);

  useEffect(() => {
    if (settings.onboarded && !openNotified) {
      openNotified = true;
      void notifyOnOpen();
    }
  }, [settings.onboarded]);

  const words = useStore((s) => s.words);
  const reviewCount = useStore((s) => s.reviewLogs.length);
  useEffect(() => {
    const id = setTimeout(() => void syncWidgetSnapshot(), 400);
    return () => clearTimeout(id);
  }, [settings.widgets, words, reviewCount, settings.meaningLang, settings.dailyGoal]);

  useEffect(() => {
    const h = (e: PopStateEvent) => {
      if (useNav.getState().stack.length > 0) {
        e.preventDefault();
        back();
        history.pushState(null, '', location.href);
      }
    };
    history.pushState(null, '', location.href);
    window.addEventListener('popstate', h);
    return () => window.removeEventListener('popstate', h);
  }, [back]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab, stack.length]);

  if (!settings.onboarded) {
    return (
      <div className="app-frame">
        <Onboarding />
        <ToastHost />
      </div>
    );
  }

  const top = stack[stack.length - 1];
  const fullscreen = top?.name === 'session' || top?.name === 'wordEditor';

  const tabScreen =
    tab === 'home' ? <HomeScreen /> :
    tab === 'words' ? <VocabularyScreen /> :
    tab === 'learn' ? <LearnScreen /> :
    tab === 'stats' ? <StatsScreen /> :
    <SettingsScreen />;

  return (
    <div className="app-frame">
      {top ? <RouteView route={top} key={`${top.name}-${stack.length}`} /> : tabScreen}
      {!fullscreen ? (
        <nav className="bottomnav">
          {(Object.keys(TAB_ICONS) as Tab[]).map((tb) => {
            const Icon = TAB_ICONS[tb];
            const active = tab === tb && !top;
            return (
              <button key={tb} className={`nav-item ${active ? 'active' : ''}`} onClick={() => setTab(tb)}>
                <Icon size={21} strokeWidth={active ? 2.4 : 2} />
                <span>{t(`tabs.${tb}`)}</span>
              </button>
            );
          })}
        </nav>
      ) : null}
      <ToastHost />
    </div>
  );
}