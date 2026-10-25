/** Thư viện bản ghi lưu trong IndexedDB của trình duyệt (offline, không cần máy chủ). */
import { HistoryItem } from "../types";

const DB_NAME = 'vietvoice-studio';
const STORE = 'history';

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const run = async <T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

export const listHistory = async (): Promise<HistoryItem[]> => {
  const items = await run<HistoryItem[]>('readonly', (s) => s.getAll());
  return items.sort((a, b) => b.createdAt - a.createdAt);
};

export const saveHistory = (item: HistoryItem) => run('readwrite', (s) => s.put(item));

export const deleteHistory = (id: string) => run('readwrite', (s) => s.delete(id));

export const clearHistory = () => run('readwrite', (s) => s.clear());
