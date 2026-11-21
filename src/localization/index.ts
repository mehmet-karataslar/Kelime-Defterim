import { useStore } from '../core/store';
import { tr } from './tr';
import { de } from './de';
import { en } from './en';
import { UiLang } from '../core/types';

const dicts = { tr, de, en };

function resolve(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj);
}

export function translate(lang: UiLang, key: string, vars?: Record<string, string | number>): string {
  let val = resolve(dicts[lang], key) ?? resolve(tr, key);
  if (Array.isArray(val)) return val.join(',');
  if (typeof val !== 'string') return key;
  let out: string = val;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{{${k}}}`, String(v));
  }
  return out;
}

export function useI18n() {
  const lang = useStore((s) => s.settings.uiLang);
  return {
    lang,
    t: (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars),
    weekdays: dicts[lang].stats.weekdays,
  };
}

export function useMeaning() {
  const meaningLang = useStore((s) => s.settings.meaningLang);
  return (w: { senses: { tr: string; en?: string }[] }, index = 0): string => {
    const s = w.senses[index];
    if (!s) return '';
    return meaningLang === 'en' && s.en ? s.en : s.tr;
  };
}

export function formatLocaleDate(ts: number, lang: UiLang): string {
  const locales = { tr: 'tr-TR', de: 'de-DE', en: 'en-US' };
  return new Date(ts).toLocaleDateString(locales[lang], { day: 'numeric', month: 'long', weekday: 'long' });
}