import type { AppData } from './types';

const REAL_DB_NAME = 'actuals-job-sequencer';
const DEMO_DB_NAME = 'demo:actuals-job-sequencer';
const STORE = 'app';
const KEY = 'current';

function openDatabase(demo: boolean): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(demo ? DEMO_DB_NAME : REAL_DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open local storage.'));
  });
}

export async function loadData(demo = false): Promise<AppData | undefined> {
  const db = await openDatabase(demo);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readonly');
    const request = transaction.objectStore(STORE).get(KEY);
    request.onsuccess = () => resolve(request.result as AppData | undefined);
    request.onerror = () => reject(request.error ?? new Error('Could not read local data.'));
    transaction.oncomplete = () => db.close();
  });
}

export async function saveData(data: AppData, demo = false): Promise<void> {
  const db = await openDatabase(demo);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(data, KEY);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error ?? new Error('Could not save local data.')); };
  });
}

export function deleteDemoData(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DEMO_DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error('Could not reset sample data.'));
    request.onblocked = () => reject(new Error('Close other demo tabs, then reset again.'));
  });
}
