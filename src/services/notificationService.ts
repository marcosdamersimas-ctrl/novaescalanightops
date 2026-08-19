import { PushSubscriptionInfo, UserSession } from '../types';
import { savePushSubscription } from '../lib/firebase';

export class NotificationService {
  /**
   * Check if browser supports ServiceWorker and Push Notifications
   */
  static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'Notification' in window
    );
  }

  /**
   * Get current Notification permission status
   */
  static getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  /**
   * Register service worker
   */
  static async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) return null;
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      return reg;
    } catch (err) {
      console.warn('Service worker registration failed:', err);
      return null;
    }
  }

  /**
   * Request permission and register Push Subscription
   */
  static async requestPermissionAndSubscribe(
    session: UserSession
  ): Promise<{ success: boolean; message: string }> {
    if (!this.isSupported()) {
      return {
        success: false,
        message: 'Notificações Push não são suportadas neste navegador/dispositivo.'
      };
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return {
          success: false,
          message: 'Permissão de notificação negada pelo usuário.'
        };
      }

      const registration = await this.registerServiceWorker();
      if (!registration) {
        return {
          success: false,
          message: 'Falha ao registrar Service Worker do SGE.'
        };
      }

      // Generate device fingerprint/subscription record
      const deviceInfo = `${navigator.userAgent.slice(0, 100)}`;
      const subId = `sub_${session.username.toLowerCase()}_${Date.now().toString(36)}`;

      const subInfo: PushSubscriptionInfo = {
        id: subId,
        userId: session.username,
        orgId: session.orgId,
        endpoint: `pwa://device/${subId}`,
        deviceInfo,
        subscribedAt: new Date().toISOString(),
        active: true
      };

      await savePushSubscription(subInfo, session.orgId);

      // Trigger test confirmation notification
      this.sendLocalNotification(
        'SGE - Notificações Ativadas',
        'Seu dispositivo está pronto para receber alertas operacionais e avisos de missão.'
      );

      return {
        success: true,
        message: 'Notificações Push ativadas com sucesso para esta conta.'
      };
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return {
        success: false,
        message: `Erro ao ativar notificações: ${err instanceof Error ? err.message : String(err)}`
      };
    }
  }

  /**
   * Trigger immediate local notification if permitted
   */
  static sendLocalNotification(title: string, body: string, icon = '/icon-192.png') {
    if (!this.isSupported() || Notification.permission !== 'granted') return;

    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body,
            icon,
            badge: icon,
            tag: 'sge-local-alert'
          } as NotificationOptions);
        });
      } else {
        new Notification(title, { body, icon });
      }
    } catch (e) {
      console.warn('Could not display notification:', e);
    }
  }
}

/**
 * Initialize Push Notifications on login if already granted
 */
export async function initPushNotifications(userId: string, nomeGuerra: string, orgId: string) {
  if (!NotificationService.isSupported()) return;
  if (Notification.permission !== 'granted') return;

  try {
    const registration = await NotificationService.registerServiceWorker();
    if (registration) {
      const subId = `sub_${userId.toLowerCase()}_${Date.now().toString(36)}`;
      const subInfo: PushSubscriptionInfo = {
        id: subId,
        userId,
        orgId,
        endpoint: `pwa://device/${subId}`,
        deviceInfo: navigator.userAgent.slice(0, 100),
        subscribedAt: new Date().toISOString(),
        active: true
      };
      await savePushSubscription(subInfo, orgId);
    }
  } catch (err) {
    console.warn('Silent push sync error:', err);
  }
}
