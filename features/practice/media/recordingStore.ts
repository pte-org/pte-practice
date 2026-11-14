/**
 * Keeps an unsubmitted recording on this device until its answer is saved, so closing the tab or reloading the page
 * does not lose it. A recording is a Blob (about 1 MB for 30 s of WAV), too big for localStorage, hence IndexedDB.
 * Every operation is best-effort: a browser without IndexedDB (or a blocked one) simply keeps nothing.
 */

export interface StoredRecording {
  sessionId: string;
  itemId: string;
  blob: Blob;
  durationSeconds: number;
  savedAt: number;
}

/** The storage the store needs; the browser one wraps IndexedDB, tests pass an in-memory one. */
export interface RecordingStoreBackend {
  put(key: string, record: StoredRecording): Promise<void>;
  getAll(): Promise<StoredRecording[]>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface RecordingStore {
  save(record: Omit<StoredRecording, "savedAt">): Promise<void>;
  /** Recordings kept for the session; older ones than {@link RECORDING_KEEP_MS} are dropped instead. */
  listForSession(sessionId: string): Promise<StoredRecording[]>;
  remove(sessionId: string, itemId: string): Promise<void>;
  clearAll(): Promise<void>;
}

/** A recording not submitted within a week belongs to a session that has long expired. */
export const RECORDING_KEEP_MS = 7 * 24 * 60 * 60 * 1000;
const DATABASE_NAME = "pte-practice-recordings";
const STORE_NAME = "recordings";
const DATABASE_VERSION = 1;

function keyOf(sessionId: string, itemId: string): string {
  return `${sessionId}:${itemId}`;
}

export function createRecordingStore(backend: RecordingStoreBackend | null, now: () => number = Date.now): RecordingStore {
  const quietly = async <T>(work: () => Promise<T>, fallback: T): Promise<T> => {
    if (!backend) return fallback;
    try {
      return await work();
    } catch {
      return fallback;
    }
  };
  return {
    save: (record) => quietly(() => backend!.put(keyOf(record.sessionId, record.itemId),
      { ...record, savedAt: now() }), undefined),
    listForSession: (sessionId) => quietly(async () => {
      const kept: StoredRecording[] = [];
      for (const record of await backend!.getAll()) {
        if (now() - record.savedAt > RECORDING_KEEP_MS) {
          await backend!.delete(keyOf(record.sessionId, record.itemId));
        } else if (record.sessionId === sessionId) {
          kept.push(record);
        }
      }
      return kept;
    }, []),
    remove: (sessionId, itemId) => quietly(() => backend!.delete(keyOf(sessionId, itemId)), undefined),
    clearAll: () => quietly(() => backend!.clear(), undefined),
  };
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** The browser backend; null where IndexedDB is missing (server render, some private modes). */
export function indexedDbRecordingBackend(): RecordingStoreBackend | null {
  if (typeof indexedDB === "undefined") return null;
  let opened: Promise<IDBDatabase> | null = null;
  const database = (): Promise<IDBDatabase> => {
    opened ??= new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    void opened.catch(() => { opened = null; });
    return opened;
  };
  const run = async <T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> =>
    requestResult(work((await database()).transaction(STORE_NAME, mode).objectStore(STORE_NAME)));
  return {
    put: async (key, record) => { await run("readwrite", (store) => store.put(record, key)); },
    // The store holds only StoredRecording values, written by `put` above.
    getAll: () => run("readonly", (store) => store.getAll() as IDBRequest<StoredRecording[]>),
    delete: async (key) => { await run("readwrite", (store) => store.delete(key)); },
    clear: async () => { await run("readwrite", (store) => store.clear()); },
  };
}

let browserStore: RecordingStore | null = null;

/** The store shared by the session screens of this tab. */
export function practiceRecordingStore(): RecordingStore {
  browserStore ??= createRecordingStore(indexedDbRecordingBackend());
  return browserStore;
}
