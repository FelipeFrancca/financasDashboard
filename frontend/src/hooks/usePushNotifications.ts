/**
 * Custom hook for managing Push Notifications
 * Handles subscription, permission requests, and status checks
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

interface PushNotificationState {
    isSupported: boolean;
    permission: NotificationPermission | 'unsupported';
    isSubscribed: boolean;
    isLoading: boolean;
    error: string | null;
}

interface UsePushNotificationsReturn extends PushNotificationState {
    subscribe: () => Promise<boolean>;
    unsubscribe: () => Promise<boolean>;
    sendTestNotification: () => Promise<void>;
    refresh: () => Promise<void>;
}

// Convert a base64 string to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications(): UsePushNotificationsReturn {
    const [state, setState] = useState<PushNotificationState>({
        isSupported: false,
        permission: 'unsupported',
        isSubscribed: false,
        isLoading: true,
        error: null,
    });

    const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);

    // Check if push notifications are supported
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;

    // Fetch VAPID public key from backend
    const fetchVapidKey = useCallback(async () => {
        try {
            const response = await api.get('/push/vapid-public-key');
            if (response.data.success && response.data.data.enabled) {
                setVapidPublicKey(response.data.data.publicKey);
                return response.data.data.publicKey;
            }
            return null;
        } catch (error) {
            console.error('Failed to fetch VAPID key:', error);
            return null;
        }
    }, []);

    // Check current subscription status
    const checkSubscription = useCallback(async () => {
        if (!isSupported) {
            setState(prev => ({
                ...prev,
                isSupported: false,
                permission: 'unsupported',
                isLoading: false,
            }));
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            // Also check with backend
            const response = await api.get('/push/status');
            const backendSubscribed = response.data.data?.subscribed || false;

            setState(prev => ({
                ...prev,
                isSupported: true,
                permission: Notification.permission,
                isSubscribed: !!subscription && backendSubscribed,
                isLoading: false,
                error: null,
            }));
        } catch (error: any) {
            console.error('Error checking subscription:', error);
            setState(prev => ({
                ...prev,
                isSupported: true,
                permission: Notification.permission,
                isLoading: false,
                error: error.message,
            }));
        }
    }, [isSupported]);

    // Initialize on mount
    useEffect(() => {
        const init = async () => {
            await fetchVapidKey();
            await checkSubscription();
        };
        init();
    }, [fetchVapidKey, checkSubscription]);

    // Subscribe to push notifications
    const subscribe = useCallback(async (): Promise<boolean> => {
        if (!isSupported) {
            setState(prev => ({ ...prev, error: 'Push notifications not supported' }));
            return false;
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            // Request notification permission
            const permission = await Notification.requestPermission();

            if (permission !== 'granted') {
                setState(prev => ({
                    ...prev,
                    permission,
                    isLoading: false,
                    error: 'Permissão de notificação negada',
                }));
                return false;
            }

            // Get VAPID key if not already fetched
            let key = vapidPublicKey;
            if (!key) {
                key = await fetchVapidKey();
            }

            if (!key) {
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: 'Push notifications não estão configuradas no servidor',
                }));
                return false;
            }

            // Register service worker if not already registered
            const registration = await navigator.serviceWorker.ready;

            // Subscribe to push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
            });

            // Send subscription to backend
            await api.post('/push/subscribe', {
                subscription: subscription.toJSON(),
                userAgent: navigator.userAgent,
            });

            setState(prev => ({
                ...prev,
                permission: 'granted',
                isSubscribed: true,
                isLoading: false,
                error: null,
            }));

            return true;
        } catch (error: any) {
            console.error('Error subscribing:', error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error.message || 'Erro ao ativar notificações',
            }));
            return false;
        }
    }, [isSupported, vapidPublicKey, fetchVapidKey]);

    // Unsubscribe from push notifications
    const unsubscribe = useCallback(async (): Promise<boolean> => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                // Unsubscribe from browser
                await subscription.unsubscribe();

                // Remove from backend
                await api.delete('/push/unsubscribe', {
                    data: { endpoint: subscription.endpoint },
                });
            } else {
                // Just remove from backend (all subscriptions)
                await api.delete('/push/unsubscribe');
            }

            setState(prev => ({
                ...prev,
                isSubscribed: false,
                isLoading: false,
                error: null,
            }));

            return true;
        } catch (error: any) {
            console.error('Error unsubscribing:', error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error.message || 'Erro ao desativar notificações',
            }));
            return false;
        }
    }, []);

    // Send a test notification
    const sendTestNotification = useCallback(async () => {
        try {
            await api.post('/push/test');
        } catch (error: any) {
            console.error('Error sending test notification:', error);
            throw error;
        }
    }, []);

    // Refresh subscription status
    const refresh = useCallback(async () => {
        await checkSubscription();
    }, [checkSubscription]);

    return {
        ...state,
        subscribe,
        unsubscribe,
        sendTestNotification,
        refresh,
    };
}
