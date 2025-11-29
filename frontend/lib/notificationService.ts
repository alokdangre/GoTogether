// Push Notification Service
class PushNotificationService {
    private static instance: PushNotificationService;
    private permission: NotificationPermission = 'default';

    private constructor() {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            this.permission = Notification.permission;
        }
    }

    static getInstance(): PushNotificationService {
        if (!PushNotificationService.instance) {
            PushNotificationService.instance = new PushNotificationService();
        }
        return PushNotificationService.instance;
    }

    async requestPermission(): Promise<boolean> {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            console.warn('Notifications not supported');
            return false;
        }

        if (this.permission === 'granted') {
            return true;
        }

        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            return permission === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    canShowNotifications(): boolean {
        return this.permission === 'granted';
    }

    showNotification(title: string, options?: NotificationOptions) {
        if (!this.canShowNotifications()) {
            console.warn('Notification permission not granted');
            return;
        }

        try {
            const notification = new Notification(title, {
                icon: '/icon-192x192.png',
                badge: '/icon-192x192.png',
                ...options,
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            return notification;
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }

    showGroupMessage(groupName: string, senderName: string, message: string) {
        this.showNotification(`New message in ${groupName}`, {
            body: `${senderName}: ${message}`,
            tag: 'group-message',
            requireInteraction: false,
            data: { type: 'group-message', groupName },
        });
    }

    showRideUpdate(title: string, message: string) {
        this.showNotification(title, {
            body: message,
            tag: 'ride-update',
            requireInteraction: true,
            data: { type: 'ride-update' },
        });
    }
}

export const notificationService = PushNotificationService.getInstance();
