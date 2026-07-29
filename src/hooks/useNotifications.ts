import { useState, useEffect, useCallback } from "react";

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) setPermission(Notification.permission);
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  }, []);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!("Notification" in window) || permission !== "granted") return null;
    if (document.visibilityState === "visible") return null;
    const n = new Notification(title, { icon: "/favicon.png", ...options });
    n.onclick = () => { window.focus(); n.close(); };
    setTimeout(() => n.close(), 5000);
    return n;
  }, [permission]);

  return { permission, requestPermission, showNotification, isSupported: "Notification" in window };
};
