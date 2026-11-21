import { useStore, BackupFile } from './store';

export const SHK_PACK_ID = 'shk-2000-v1';

let inFlight: Promise<number> | null = null;

/**
 * Lazily fetches the embedded SHK 2,025-word dataset from /datasets/shk-2000-v1.json
 * and idempotently merges it into the store without overwriting any existing user
 * words, collections, SRS progress, or settings.
 */
export function ensureBuiltInPackLoaded(): Promise<number> {
  const state = useStore.getState();
  if (state.installedPacks.includes(SHK_PACK_ID)) {
    return Promise.resolve(0);
  }
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const res = await fetch('./datasets/shk-2000-v1.json');
      if (!res.ok) return 0;
      const data = (await res.json()) as BackupFile;
      if (data.app !== 'kelime-defterim' || !Array.isArray(data.words)) return 0;
      return useStore.getState().installBuiltInPack(SHK_PACK_ID, data.words, data.collections ?? []);
    } catch {
      return 0;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
