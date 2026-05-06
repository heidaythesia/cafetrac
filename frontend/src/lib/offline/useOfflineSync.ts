import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { client } from '@/lib/api/client';
import { db } from '@/lib/offline/db';

export const useOfflineSync = (wasOffline?: boolean) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const queryClient = useQueryClient();

  const loadPendingCount = useCallback(async () => {
    const count = await db.offlineMutations.where('url').equals('/waste-logs').count();
    setPendingCount(count);
  }, []);

  const syncPendingWasteLogs = useCallback(async () => {
    const pending = await db.offlineMutations.where('url').equals('/waste-logs').toArray();
    if (!pending.length) {
      setPendingCount(0);
      return;
    }

    let synced = 0;
    for (const entry of pending) {
      try {
        await client.post('/waste-logs', entry.body);
        if (entry.id) {
          await db.offlineMutations.delete(entry.id);
        }
        synced += 1;
      } catch {
        // Keep failed entries for the next reconnect retry.
      }
    }

    await loadPendingCount();
    if (synced > 0) {
      toast.success(`✅ ${synced} waste log(s) synced!`);
      queryClient.invalidateQueries();
    }
  }, [loadPendingCount, queryClient]);

  useEffect(() => {
    loadPendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      syncPendingWasteLogs();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are offline. Changes will be saved locally.', { id: 'offline-toast', duration: 10000 });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadPendingCount, syncPendingWasteLogs]);

  useEffect(() => {
    if (wasOffline) {
      syncPendingWasteLogs();
    }
  }, [syncPendingWasteLogs, wasOffline]);

  return { isOnline, pendingCount, refreshPendingCount: loadPendingCount, syncPendingWasteLogs };
};
