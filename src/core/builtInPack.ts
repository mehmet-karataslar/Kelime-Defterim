import { useStore, BackupFile } from './store';

export const SHK_PACK_ID = 'shk-2000-v1';
export const B12_VERBS_PACK_ID = 'b12-verbs-500-v1';

const BUILT_IN_PACKS = [
  { id: SHK_PACK_ID, url: './datasets/shk-2000-v1.json' },
  { id: B12_VERBS_PACK_ID, url: './datasets/b12-verbs-500-v1.json' },
];

let inFlight: Promise<number> | null = null;

/**
 * Lazily fetches embedded vocabulary packs and idempotently merges them into
 * the store without overwriting any existing user words, collections, SRS
 * progress, or settings.
 */
export function ensureBuiltInPackLoaded(): Promise<number> {
  const state = useStore.getState();
  const missing = BUILT_IN_PACKS.filter((p) => !state.installedPacks.includes(p.id));
  if (missing.length === 0) {
    return Promise.resolve(0);
  }
  if (inFlight) return inFlight;

  inFlight = (async () => {
    let addedTotal = 0;
    try {
      for (const pack of missing) {
        try {
          const res = await fetch(pack.url);
          if (!res.ok) continue;
          const data = (await res.json()) as BackupFile;
          if (data.app !== 'kelime-defterim' || !Array.isArray(data.words)) continue;
          addedTotal += useStore.getState().installBuiltInPack(pack.id, data.words, data.collections ?? []);
        } catch {
          // Continue with remaining packs if one fails
        }
      }
      return addedTotal;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
