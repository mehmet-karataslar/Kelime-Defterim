import { useStore } from '../../core/store';
import { translate } from '../../localization';
import { Word } from '../../core/types';

let timer: ReturnType<typeof setInterval> | null = null;

function pickWord(): Word | null {
  const { words, settings } = useStore.getState();
  if (words.length === 0) return null;
  const pool = settings.notificationContent === 'quiz' ? words.filter((w) => w.article) : words;
  const list = pool.length > 0 ? pool : words;
  return list[Math.floor(Math.random() * list.length)];
}

export function buildNotification(): { title: string; body: string } | null {
  const { settings } = useStore.getState();
  const w = pickWord();
  if (!w) return null;
  const lang = settings.uiLang;
  const head = `${w.article ? w.article + ' ' : ''}${w.german}`;
  const meaning = settings.meaningLang === 'en' && w.senses[0]?.en ? w.senses[0].en : w.senses[0]?.tr ?? '';
  if (settings.notificationContent === 'word') return { title: 'Kelime Defterim', body: head };
  if (settings.notificationContent === 'quiz') {
    return {
      title: `Kelime Defterim · ${translate(lang, 'learn.whichArticle')}`,
      body: `___ ${w.german}\nder / die / das?`,
    };
  }
  const ex = w.examples[0] ? `\n${w.examples[0].de}` : '';
  return { title: `Kelime Defterim · ${head}`, body: `${meaning}${ex}` };
}

export async function sendTestNotification(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'default') await Notification.requestPermission();
  if (Notification.permission !== 'granted') return false;
  const n = buildNotification();
  if (!n) return false;
  new Notification(n.title, { body: n.body, icon: '/icon.png', tag: 'kelime-defterim-test' });
  return true;
}

export function syncNotificationSchedule(): void {
  if (timer) { clearInterval(timer); timer = null; }
  const { settings } = useStore.getState();
  if (!settings.notificationsOn || !('Notification' in window) || Notification.permission !== 'granted') return;
  const ms = Math.max(15, settings.notificationInterval) * 60_000;
  timer = setInterval(() => {
    const n = buildNotification();
    if (n && document.visibilityState === 'visible') {
      new Notification(n.title, { body: n.body, icon: '/icon.png', tag: 'kelime-defterim-reminder' });
    }
  }, ms);
}

export async function enableNotifications(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'default') await Notification.requestPermission();
  return Notification.permission === 'granted';
}