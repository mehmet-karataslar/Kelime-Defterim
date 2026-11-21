import type { StateStorage } from 'zustand/middleware';

const DB_NAME = 'kelime-defterim-db';
const STORE_NAME = 'kv';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key: string): Promise<string | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(typeof req.result === 'string' ? req.result : null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbRemove(key: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * IndexedDB storage for Zustand persist with seamless one-time migration
 * from legacy localStorage (preserves 100% of existing user data).
 */
export const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      if (typeof indexedDB !== 'undefined') {
        const val = await idbGet(name);
        if (val !== null) return val;
        // Seamless migration from legacy localStorage on first upgrade
        const legacy = typeof localStorage !== 'undefined' ? localStorage.getItem(name) : null;
        if (legacy !== null) {
          await idbSet(name, legacy);
          return legacy;
        }
        return null;
      }
    } catch {
      // Fall back to localStorage below
    }
    return typeof localStorage !== 'undefined' ? localStorage.getItem(name) : null;
  },

  setItem: async (name: string, value: string): Promise<void> => {
    try {
      if (typeof indexedDB !== 'undefined') {
        await idbSet(name, value);
        return;
      }
    } catch {
      // Fall back to localStorage below
    }
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(name, value);
    } catch {
      // Ignore quota errors on fallback
    }
  },

  removeItem: async (name: string): Promise<void> => {
    try {
      if (typeof indexedDB !== 'undefined') await idbRemove(name);
    } catch {
      // ignore
    }
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};
