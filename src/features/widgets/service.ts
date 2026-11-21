import { Capacitor, registerPlugin } from '@capacitor/core';
import { useStore } from '../../core/store';
import { dueWords } from '../../core/srs';
import { WidgetConfig, Word } from '../../core/types';

interface WidgetBridgePlugin {
  updateWidget(opts: { designs: string; data: string; lastDesign: string }): Promise<void>;
  pinWidget(opts: { designId: string }): Promise<{ supported: boolean; requested?: boolean }>;
}

const WidgetBridge = registerPlugin<WidgetBridgePlugin>('WidgetBridge');

export function widgetPool(words: Word[], cfg: WidgetConfig): Word[] {
  let pool = words;
  if (cfg.source === 'favorites') pool = words.filter((w) => w.favorite);
  else if (cfg.source === 'daily') pool = dueWords(words, Date.now());
  else if (cfg.source === 'collection' && cfg.collectionId) {
    const col = useStore.getState().collections.find((c) => c.id === cfg.collectionId);
    const ids = new Set(col?.wordIds ?? []);
    pool = words.filter((w) => ids.has(w.id));
  }
  return pool.length > 0 ? pool : words;
}

function slim(w: Word, meaningLang: 'tr' | 'en') {
  return {
    g: w.german,
    a: w.article ?? '',
    m: (meaningLang === 'en' ? w.senses[0]?.en : w.senses[0]?.tr) || w.senses[0]?.tr || '',
    e: w.examples[0]?.de ?? '',
  };
}

export async function syncWidgetSnapshot(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const { words, reviewLogs, settings } = useStore.getState();
  const now = Date.now();
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  const pools: Record<string, ReturnType<typeof slim>[]> = {};
  for (const d of settings.widgets) {
    pools[d.id] = widgetPool(words, d.config).slice(0, 40).map((w) => slim(w, settings.meaningLang));
  }
  const data = {
    pools,
    due: dueWords(words, now).length,
    done: reviewLogs.filter((l) => l.ts >= dayStart.getTime()).length,
    goal: settings.dailyGoal,
    lang: settings.uiLang,
  };
  try {
    await WidgetBridge.updateWidget({
      designs: JSON.stringify(settings.widgets),
      data: JSON.stringify(data),
      lastDesign: settings.widgets[0]?.id ?? '',
    });
  } catch { /* native bridge unavailable */ }
}

export async function pinWidget(designId: string): Promise<{ supported: boolean; requested: boolean }> {
  if (!Capacitor.isNativePlatform()) return { supported: false, requested: false };
  try {
    const res = await WidgetBridge.pinWidget({ designId });
    return { supported: res.supported, requested: !!res.requested };
  } catch {
    return { supported: false, requested: false };
  }
}