import Dexie, { type Table } from 'dexie';

export interface OfflineMutation {
  id?: number;
  url: string;
  method: string;
  body: any;
  createdAt: number;
}

export interface CachedData {
  key: string;
  data: any;
  updatedAt: number;
}

export class CafeTracDB extends Dexie {
  offlineMutations!: Table<OfflineMutation>;
  cache!: Table<CachedData>;

  constructor() {
    super('CafeTracDB');
    this.version(1).stores({
      offlineMutations: '++id, url, method, createdAt',
      cache: 'key, updatedAt'
    });
  }
}

export const db = new CafeTracDB();

// Adapter for older saveOfflineLog used in WastePage
export const saveOfflineLog = async (logData: any) => {
  await db.offlineMutations.add({
    url: '/waste-logs',
    method: 'POST',
    body: logData,
    createdAt: Date.now()
  });
};

export const getOfflineLogs = async () => {
  const logs = await db.offlineMutations.where('url').equals('/waste-logs').toArray();
  return logs.map(l => ({ ...l.body, _offlineId: l.id }));
};

export const removeOfflineLog = async (id: number) => {
  await db.offlineMutations.delete(id);
};
