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
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [hasUnread, setHasUnread] = useState(false);
  const prevDemoLinksRef = useRef<Map<string, { views: number; expired: boolean }>>(new Map());
  const initializedRef = useRef(false);

  // Sync state with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('wizztech_notifications', JSON.stringify(notifications.slice(0, 30)));
    } catch (e) {
      console.warn('Failed to save notifications to localStorage:', e);
    }
    setHasUnread(notifications.some(n => !n.read));
  }, [notifications]);

  // Compute real notifications on state changes
  useEffect(() => {
    if (demoLinks.length === 0 && websites.length === 0) return;

    const now = new Date();
    const newNotifications: AppNotification[] = [];
    const currentMap = new Map<string, { views: number; expired: boolean }>();

    demoLinks.forEach(link => {
      const siteName = link.websites?.name || 'Protected Website';
      const isExpired = new Date(link.expiry_at) <= now;
      currentMap.set(link.id, { views: link.views_count, expired: isExpired });

      if (initializedRef.current) {
        const prev = prevDemoLinksRef.current.get(link.id);
        if (!prev) {
          // New link created
          newNotifications.unshift({
            id: `create_${link.id}_${Date.now()}`,
            title: 'Demo Link Created',
            message: `New temporary link generated for ${siteName}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'create',
            read: false,
          });
        } else {
          // View count incremented
          if (link.views_count > prev.views) {
            const diff = link.views_count - prev.views;
            newNotifications.unshift({
              id: `view_${link.id}_${Date.now()}`,
              title: 'Demo Link Opened',
              message: `${siteName} demo link opened ${diff > 1 ? diff + ' times' : ''} (Total: ${link.views_count} opens)`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'view',
              read: false,
            });
          }
          // Link expired
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
      // Build initial list from actual current data
      const initialItems: AppNotification[] = [];
      
      // Active link notifications
      demoLinks.forEach(link => {
        const siteName = link.websites?.name || 'Website';
        const isExpired = new Date(link.expiry_at) <= now;

        if (link.views_count > 0) {
          initialItems.push({
            id: `init_view_${link.id}`,
            title: 'Demo Link Opened',
            message: `${siteName} link has been opened ${link.views_count} time${link.views_count > 1 ? 's' : ''}`,
            timestamp: new Date(link.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'view',
            read: true,
          });
        }

        if (isExpired) {
          initialItems.push({
            id: `init_exp_${link.id}`,
            title: 'Demo Access Expired',
            message: `Temporary demo link for ${siteName} is expired`,
            timestamp: new Date(link.expiry_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'expire',
            read: true,
          });
        } else {
          initialItems.push({
            id: `init_create_${link.id}`,
            title: 'Active Demo Link',
            message: `Active demo link available for ${siteName}`,
            timestamp: new Date(link.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'create',
            read: true,
          });
        }
      });

      // System notification
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
        const existingIds = new Set(prevNotifs.map(n => n.id));
        const toAdd = initialItems.filter(item => !existingIds.has(item.id));
        return [...toAdd, ...prevNotifs].slice(0, 30);
      });
      initializedRef.current = true;
    }

    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev].slice(0, 30));
    }

    prevDemoLinksRef.current = currentMap;
  }, [demoLinks, websites]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setHasUnread(false);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setHasUnread(false);
    localStorage.removeItem('wizztech_notifications');
  };

  return {
    notifications,
    hasUnread,
    markAllAsRead,
    clearNotifications,
  };
};
