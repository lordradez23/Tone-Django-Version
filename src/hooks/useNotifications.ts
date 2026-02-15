import { useState, useEffect, useCallback } from 'react';

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!('Notification' in window)) {
      return null;
    }

    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return null;
    }

    // Don't show notification if user is on the page
    if (document.visibilityState === 'visible') {
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.png',
        badge: '/favicon.png',
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }, [permission]);

  return {
    permission,
    requestPermission,
    showNotification,
    isSupported: 'Notification' in window
  };
};
