import { useEffect, useState } from 'react';
import { client } from '@/lib/api/client';

export const usePushNotifications = () => {
  const [permission, setPermission] = useState(Notification.permission);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        setIsSubscribed(!!subscription);
      })
      .catch((error) => {
        console.error('Failed to check push subscription', error);
      });
  }, []);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribe = async () => {
    setIsLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') throw new Error('Permission denied');

      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // ArrayBuffer to Base64 conversions for keys
      const p256dhObj = subscription.getKey('p256dh');
      const authObj = subscription.getKey('auth');
      
      let p256dh = '', auth = '';
      if (p256dhObj) p256dh = btoa(String.fromCharCode(...Array.from(new Uint8Array(p256dhObj))));
      if (authObj) auth = btoa(String.fromCharCode(...Array.from(new Uint8Array(authObj))));

      await client.post('/notifications/subscribe', {
        endpoint: subscription.endpoint,
        keys: { p256dh, auth },
        deviceName: navigator.userAgent
      });

      setIsSubscribed(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await client.delete('/notifications/unsubscribe', { data: { endpoint: subscription.endpoint } });
        await subscription.unsubscribe();
      }
      setIsSubscribed(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return { permission, isSubscribed, isLoading, subscribe, unsubscribe };
};
