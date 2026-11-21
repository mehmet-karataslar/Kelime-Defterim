import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useStore } from '../../core/store';
import { translate } from '../../localization';
import { Settings, Word } from '../../core/types';

const isNative = Capacitor.isNativePlatform();
const INTERVAL_ID = 1001;
const TIME_ID_BASE = 2000;
const TEST_ID = 9990;
const OPEN_ID = 9991;
const CHANNEL_ID = 'kelime-reminders';

let webTimers: ReturnType<typeof setTimeout>[] = [];

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

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function inQuietHours(s: Settings, d = new Date()): boolean {
  if (!s.quietHoursOn) return false;
  const now = d.getHours() * 60 + d.getMinutes();
  const start = minutesOf(s.quietStart);
  const end = minutesOf(s.quietEnd);
  if (start === end) return false;
  return start < end ? now >= start && now < end : now >= start || now < end;
}

async function nativeEnsurePermission(): Promise<boolean> {
  const perm = await LocalNotifications.checkPermissions();
  if (perm.display === 'granted') return true;
  const req = await LocalNotifications.requestPermissions();
  return req.display === 'granted';
}

async function nativeSchedule(items: { id: number; title: string; body: string; schedule?: object }[]): Promise<void> {
  try {
    await LocalNotifications.createChannel({
      id: CHANNEL_ID, name: 'Kelime Defterim', description: 'Kelime hatırlatmaları',
      importance: 4, vibration: true, lights: true, lightColor: '#4338CA',
    });
  } catch { /* channel already exists or unsupported */ }
  const base = items.map((it) => ({
    id: it.id, title: it.title, body: it.body, channelId: CHANNEL_ID,
    smallIcon: 'ic_launcher', iconColor: '#4338CA',
    schedule: it.schedule ? { allowWhileIdle: true, ...it.schedule } : undefined,
  }));
  try {
    await LocalNotifications.schedule({ notifications: base });
  } catch {
    // exact-alarm permission may be denied; fall back to inexact scheduling
    await LocalNotifications.schedule({
      notifications: base.map((n) => ({ ...n, schedule: n.schedule ? { ...n.schedule, allowWhileIdle: false } : undefined })),
    });
  }
}

async function nativeCancelAll(): Promise<void> {
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
    }
  } catch { /* nothing pending */ }
}

export async function sendTestNotification(): Promise<boolean> {
  const n = buildNotification();
  if (!n) return false;
  if (isNative) {
    if (!(await nativeEnsurePermission())) return false;
    await nativeSchedule([{ id: TEST_ID, title: n.title, body: n.body }]);
    return true;
  }
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'default') await Notification.requestPermission();
  if (Notification.permission !== 'granted') return false;
  new Notification(n.title, { body: n.body, icon: '/icon.png', tag: 'kelime-defterim-test' });
  return true;
}

export async function notifyOnOpen(): Promise<void> {
  const { settings } = useStore.getState();
  if (!settings.notificationsOn || !settings.notifyOnOpen || inQuietHours(settings)) return;
  const n = buildNotification();
  if (!n) return;
  if (isNative) {
    if (!(await nativeEnsurePermission())) return;
    await nativeSchedule([{ id: OPEN_ID, title: n.title, body: n.body }]);
    return;
  }
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(n.title, { body: n.body, icon: '/icon.png', tag: 'kelime-defterim-open' });
  }
}

function clearWebTimers(): void {
  webTimers.forEach(clearTimeout);
  webTimers = [];
}

function webFire(tag: string): void {
  const { settings } = useStore.getState();
  if (!settings.notificationsOn || inQuietHours(settings)) return;
  const n = buildNotification();
  if (n) new Notification(n.title, { body: n.body, icon: '/icon.png', tag });
}

function scheduleWebDaily(hhmm: string): void {
  const [h, m] = hhmm.split(':').map(Number);
  const next = new Date();
  next.setHours(h || 0, m || 0, 0, 0);
  if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
  const id = setTimeout(() => {
    webFire(`kelime-defterim-time-${hhmm}`);
    scheduleWebDaily(hhmm);
  }, next.getTime() - Date.now());
  webTimers.push(id);
}

export async function syncNotificationSchedule(): Promise<void> {
  clearWebTimers();
  const { settings } = useStore.getState();

  if (isNative) {
    await nativeCancelAll();
    if (!settings.notificationsOn || !(await nativeEnsurePermission())) return;
    const items: { id: number; title: string; body: string; schedule?: object }[] = [];
    const interval = Math.max(1, Math.round(settings.notificationInterval));
    const nInt = buildNotification();
    if (nInt) {
      items.push({
        id: INTERVAL_ID, title: nInt.title, body: nInt.body,
        schedule: { every: 'minute', count: interval, repeats: true },
      });
    }
    if (settings.notificationTimesOn) {
      settings.notificationTimes.forEach((hhmm, i) => {
        const n = buildNotification();
        if (!n) return;
        const [h, m] = hhmm.split(':').map(Number);
        items.push({
          id: TIME_ID_BASE + i, title: n.title, body: n.body,
          schedule: { on: { hour: h || 0, minute: m || 0 }, repeats: true },
        });
      });
    }
    if (items.length > 0) await nativeSchedule(items);
    return;
  }

  if (!settings.notificationsOn || !('Notification' in window) || Notification.permission !== 'granted') return;
  const ms = Math.max(1, settings.notificationInterval) * 60_000;
  const id = setInterval(() => webFire('kelime-defterim-reminder'), ms);
  webTimers.push(id as unknown as ReturnType<typeof setTimeout>);
  if (settings.notificationTimesOn) settings.notificationTimes.forEach(scheduleWebDaily);
}

export async function enableNotifications(): Promise<boolean> {
  if (isNative) return nativeEnsurePermission();
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'default') await Notification.requestPermission();
  return Notification.permission === 'granted';
}