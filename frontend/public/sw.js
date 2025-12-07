/**
 * Service Worker for FinChart Push Notifications
 * Handles push events and notification display
 */

// eslint-disable-next-line no-restricted-globals
const sw = self;

// Install event - cache static assets if needed
sw.addEventListener('install', (event) => {
    console.log('[SW] Service Worker installed');
    sw.skipWaiting();
});

// Activate event - clean up old caches
sw.addEventListener('activate', (event) => {
    console.log('[SW] Service Worker activated');
    event.waitUntil(sw.clients.claim());
});

// Push event - receive and display push notifications
sw.addEventListener('push', (event) => {
    console.log('[SW] Push received:', event);

    if (!event.data) {
        console.log('[SW] No data in push event');
        return;
    }

    const data = event.data.json();
    console.log('[SW] Push data:', data);

    const options = {
        body: data.body || 'Nova notificação do FinChart',
        icon: data.icon || '/finchart-logo.png',
        badge: data.badge || '/finchart-logo.png',
        tag: data.tag || 'finchart-notification',
        renotify: true,
        requireInteraction: data.requireInteraction || false,
        data: data.data || {},
        actions: data.actions || [],
        vibrate: [200, 100, 200],
        timestamp: Date.now(),
    };

    event.waitUntil(
        sw.registration.showNotification(data.title || 'FinChart', options)
    );
});

// Notification click event - handle user interaction
sw.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event);

    const notification = event.notification;
    const action = event.action;
    const data = notification.data || {};

    notification.close();

    // Handle specific actions
    if (action === 'dismiss') {
        return;
    }

    // Determine URL to open
    let targetUrl = '/';
    
    if (data.url) {
        targetUrl = data.url;
    } else if (data.type === 'BUDGET_ALERT') {
        targetUrl = '/dashboard/alerts';
    } else if (data.type === 'GOAL_MILESTONE') {
        targetUrl = '/dashboard/goals';
    } else if (data.type === 'DASHBOARD_INVITE') {
        targetUrl = '/dashboards';
    } else if (data.type === 'DASHBOARD_ACTIVITY') {
        targetUrl = '/dashboards';
    }

    event.waitUntil(
        sw.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if there's already a window open
                for (const client of clientList) {
                    if (client.url.includes(sw.location.origin) && 'focus' in client) {
                        client.focus();
                        client.navigate(targetUrl);
                        return;
                    }
                }
                // If no window is open, open a new one
                if (sw.clients.openWindow) {
                    return sw.clients.openWindow(targetUrl);
                }
            })
    );
});

// Notification close event
sw.addEventListener('notificationclose', (event) => {
    console.log('[SW] Notification closed:', event);
});

// Background sync (for offline queuing)
sw.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);
});

console.log('[SW] Service Worker loaded');
