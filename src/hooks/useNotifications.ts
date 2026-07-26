import { useState, useEffect, useRef } from 'react';
import { useDemoLinks } from './useDemoLinks';
import { useWebsites } from './useWebsites';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'view' | 'create' | 'expire' | 'website';
  read: boolean;
}

export const useNotifications = () => {
  const { data: demoLinks = [] } = useDemoLinks();
  const { data: websites = [] } = useWebsites();

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const stored = localStorage.getItem('wizztech_notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error parsing stored notifications:', e);
    }
    return [];
  });

  const [hasUnread, setHasUnread] = useState(false);
  const prevDemoLinksRef = useRef<Map<string, { views: number; expired: boolean }>>(new Map());
  const initializedRef = useRef(false);

  // Sync state with localStorage safely
  useEffect(() => {
    try {
      if (Array.isArray(notifications)) {
        localStorage.setItem('wizztech_notifications', JSON.stringify(notifications.slice(0, 30)));
        setHasUnread(notifications.some(n => n && !n.read));
      }
    } catch (e) {
      console.warn('Failed to sync notifications state:', e);
    }
  }, [notifications]);

  // Compute real notifications on state changes
  useEffect(() => {
    if (!Array.isArray(demoLinks) || !Array.isArray(websites)) return;
    if (demoLinks.length === 0 && websites.length === 0) return;

    try {
      const now = new Date();
      const newNotifications: AppNotification[] = [];
      const currentMap = new Map<string, { views: number; expired: boolean }>();

      demoLinks.forEach(link => {
        if (!link || !link.id) return;
        const siteName = link.websites?.name || 'Protected Website';
        const isExpired = link.expiry_at ? new Date(link.expiry_at) <= now : false;
        currentMap.set(link.id, { views: link.views_count || 0, expired: isExpired });

        if (initializedRef.current) {
          const prev = prevDemoLinksRef.current.get(link.id);
          if (!prev) {
            newNotifications.unshift({
              id: `create_${link.id}_${Date.now()}`,
              title: 'Demo Link Created',
              message: `New temporary link generated for ${siteName}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'create',
              read: false,
            });
          } else {
            if ((link.views_count || 0) > prev.views) {
              const diff = (link.views_count || 0) - prev.views;
              newNotifications.unshift({
                id: `view_${link.id}_${Date.now()}`,
                title: 'Demo Link Opened',
                message: `${siteName} demo link opened ${diff > 1 ? diff + ' times' : ''} (Total: ${link.views_count} opens)`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: 'view',
                read: false,
              });
            }
            if (isExpired && !prev.expired) {
              newNotifications.unshift({
                id: `expire_${link.id}_${Date.now()}`,
                title: 'Demo Link Expired',
                message: `Demo link access token for ${siteName} has expired`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: 'expire',
                read: false,
              });
            }
          }
        }
      });

      if (!initializedRef.current) {
        const initialItems: AppNotification[] = [];

        demoLinks.forEach(link => {
          if (!link || !link.id) return;
          const siteName = link.websites?.name || 'Website';
          const isExpired = link.expiry_at ? new Date(link.expiry_at) <= now : false;

          if ((link.views_count || 0) > 0) {
            initialItems.push({
              id: `init_view_${link.id}`,
              title: 'Demo Link Opened',
              message: `${siteName} link has been opened ${link.views_count} time${link.views_count > 1 ? 's' : ''}`,
              timestamp: link.created_at ? new Date(link.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
              type: 'view',
              read: true,
            });
          }

          if (isExpired) {
            initialItems.push({
              id: `init_exp_${link.id}`,
              title: 'Demo Access Expired',
              message: `Temporary demo link for ${siteName} is expired`,
              timestamp: link.expiry_at ? new Date(link.expiry_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
              type: 'expire',
              read: true,
            });
          } else {
            initialItems.push({
              id: `init_create_${link.id}`,
              title: 'Active Demo Link',
              message: `Active demo link available for ${siteName}`,
              timestamp: link.created_at ? new Date(link.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
              type: 'create',
              read: true,
            });
          }
        });

        if (websites.length > 0) {
          initialItems.unshift({
            id: `init_system_${Date.now()}`,
            title: 'Protection System Active',
            message: `${websites.length} website${websites.length > 1 ? 's' : ''} currently registered for protection`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'website',
            read: true,
          });
        }

        setNotifications(prevNotifs => {
          const list = Array.isArray(prevNotifs) ? prevNotifs : [];
          const existingIds = new Set(list.map(n => n && n.id));
          const toAdd = initialItems.filter(item => item && !existingIds.has(item.id));
          return [...toAdd, ...list].slice(0, 30);
        });
        initializedRef.current = true;
      }

      if (newNotifications.length > 0) {
        setNotifications(prev => {
          const list = Array.isArray(prev) ? prev : [];
          return [...newNotifications, ...list].slice(0, 30);
        });
      }

      prevDemoLinksRef.current = currentMap;
    } catch (e) {
      console.warn('Error computing notifications:', e);
    }
  }, [demoLinks, websites]);

  const markAllAsRead = () => {
    setNotifications(prev => (Array.isArray(prev) ? prev.map(n => (n ? { ...n, read: true } : n)) : []));
    setHasUnread(false);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setHasUnread(false);
    try {
      localStorage.removeItem('wizztech_notifications');
    } catch (e) {
      console.warn(e);
    }
  };

  return {
    notifications: Array.isArray(notifications) ? notifications : [],
    hasUnread,
    markAllAsRead,
    clearNotifications,
  };
};
