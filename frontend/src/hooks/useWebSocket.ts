/**
 * WebSocket Hook
 * Hook React para gerenciar conexão WebSocket com o servidor
 * 
 * IMPORTANTE: Este hook implementa:
 * - Conexão automática quando autenticado
 * - Reconexão automática com backoff exponencial
 * - Debouncing de eventos para evitar múltiplas atualizações
 * - Cleanup automático ao desmontar
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { transactionKeys } from './api/useTransactions';
import { allocationKeys } from './api/useBudgetAllocation';

// ============================================
// CONFIGURAÇÃO
// ============================================

const WS_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Tempo mínimo entre invalidações do mesmo tipo (ms)
const INVALIDATION_DEBOUNCE_MS = 500;

// Configuração de reconexão
const RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 1000;
const RECONNECT_DELAY_MAX_MS = 30000;

// ============================================
// TIPOS
// ============================================

export interface WebSocketEvent {
    type: string;
    dashboardId: string;
    userId?: string;
    data?: any;
    timestamp: number;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketOptions {
    dashboardId?: string;
    enabled?: boolean;
    onTransactionChange?: (event: WebSocketEvent) => void;
    onAllocationChange?: (event: WebSocketEvent) => void;
    onDataSync?: (event: WebSocketEvent) => void;
}

// ============================================
// EVENTOS
// ============================================

export const WS_EVENTS = {
    // Transações
    TRANSACTION_CREATED: 'transaction:created',
    TRANSACTION_UPDATED: 'transaction:updated',
    TRANSACTION_DELETED: 'transaction:deleted',
    TRANSACTIONS_IMPORTED: 'transactions:imported',

    // Alocações
    ALLOCATION_UPDATED: 'allocation:updated',
    ALLOCATION_PROFILE_CREATED: 'allocation:profile:created',

    // Contas
    ACCOUNT_CREATED: 'account:created',
    ACCOUNT_UPDATED: 'account:updated',
    ACCOUNT_DELETED: 'account:deleted',

    // Categorias
    CATEGORY_CREATED: 'category:created',
    CATEGORY_UPDATED: 'category:updated',
    CATEGORY_DELETED: 'category:deleted',

    // Metas
    GOAL_CREATED: 'goal:created',
    GOAL_UPDATED: 'goal:updated',
    GOAL_DELETED: 'goal:deleted',

    // Alertas
    ALERT_CREATED: 'alert:created',
    ALERT_TRIGGERED: 'alert:triggered',

    // Dashboard
    DASHBOARD_UPDATED: 'dashboard:updated',
    DASHBOARD_MEMBER_JOINED: 'dashboard:member:joined',
    DASHBOARD_MEMBER_LEFT: 'dashboard:member:left',

    // Sync geral
    DATA_SYNC: 'data:sync',
};

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useWebSocket(options: UseWebSocketOptions = {}) {
    const {
        dashboardId,
        enabled = true,
        onTransactionChange,
        onAllocationChange,
        onDataSync,
    } = options;

    const queryClient = useQueryClient();
    const socketRef = useRef<Socket | null>(null);
    const lastInvalidationRef = useRef<Map<string, number>>(new Map());
    const reconnectAttemptsRef = useRef(0);
    
    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null);

    /**
     * Verifica se deve invalidar (debouncing)
     */
    const shouldInvalidate = useCallback((key: string): boolean => {
        const now = Date.now();
        const lastTime = lastInvalidationRef.current.get(key) || 0;
        
        if (now - lastTime < INVALIDATION_DEBOUNCE_MS) {
            return false;
        }
        
        lastInvalidationRef.current.set(key, now);
        return true;
    }, []);

    /**
     * Handler para eventos de transação
     */
    const handleTransactionEvent = useCallback((event: WebSocketEvent) => {
        // Ignorar eventos do próprio usuário (já foi atualizado localmente)
        const currentUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        if (event.userId === currentUserId) {
            return;
        }

        setLastEvent(event);

        // Invalidar caches com debouncing
        if (shouldInvalidate('transactions')) {
            queryClient.invalidateQueries({ queryKey: transactionKeys.all });
            queryClient.invalidateQueries({ queryKey: transactionKeys.allStats() });
            queryClient.invalidateQueries({ queryKey: allocationKeys.all });
        }

        // Callback personalizado
        onTransactionChange?.(event);
    }, [queryClient, shouldInvalidate, onTransactionChange]);

    /**
     * Handler para eventos de alocação
     */
    const handleAllocationEvent = useCallback((event: WebSocketEvent) => {
        const currentUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        if (event.userId === currentUserId) {
            return;
        }

        setLastEvent(event);

        if (shouldInvalidate('allocations')) {
            queryClient.invalidateQueries({ queryKey: allocationKeys.all });
        }

        onAllocationChange?.(event);
    }, [queryClient, shouldInvalidate, onAllocationChange]);

    /**
     * Handler para sync geral
     */
    const handleDataSync = useCallback((event: WebSocketEvent) => {
        setLastEvent(event);

        if (shouldInvalidate('sync')) {
            // Invalidar todos os caches relevantes
            queryClient.invalidateQueries({ queryKey: transactionKeys.all });
            queryClient.invalidateQueries({ queryKey: allocationKeys.all });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        }

        onDataSync?.(event);
    }, [queryClient, shouldInvalidate, onDataSync]);

    /**
     * Conectar ao WebSocket
     */
    const connect = useCallback(() => {
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
        
        if (!token || !enabled) {
            return;
        }

        // Evitar conexões duplicadas
        if (socketRef.current?.connected) {
            return;
        }

        setStatus('connecting');

        const socket = io(WS_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: RECONNECT_ATTEMPTS,
            reconnectionDelay: RECONNECT_DELAY_MS,
            reconnectionDelayMax: RECONNECT_DELAY_MAX_MS,
            timeout: 20000,
        });

        // Handlers de conexão
        socket.on('connect', () => {
            setStatus('connected');
            reconnectAttemptsRef.current = 0;
            
            // Entrar na sala do dashboard
            if (dashboardId) {
                socket.emit('join:dashboard', dashboardId);
            }
        });

        socket.on('disconnect', (reason) => {
            setStatus('disconnected');
            console.log('[WebSocket] Disconnected:', reason);
        });

        socket.on('connect_error', (error) => {
            setStatus('error');
            reconnectAttemptsRef.current++;
            console.error('[WebSocket] Connection error:', error.message);
        });

        // Handlers de eventos de transação
        socket.on(WS_EVENTS.TRANSACTION_CREATED, handleTransactionEvent);
        socket.on(WS_EVENTS.TRANSACTION_UPDATED, handleTransactionEvent);
        socket.on(WS_EVENTS.TRANSACTION_DELETED, handleTransactionEvent);
        socket.on(WS_EVENTS.TRANSACTIONS_IMPORTED, handleTransactionEvent);

        // Handlers de eventos de alocação
        socket.on(WS_EVENTS.ALLOCATION_UPDATED, handleAllocationEvent);
        socket.on(WS_EVENTS.ALLOCATION_PROFILE_CREATED, handleAllocationEvent);

        // Handler de sync
        socket.on(WS_EVENTS.DATA_SYNC, handleDataSync);

        socketRef.current = socket;
    }, [enabled, dashboardId, handleTransactionEvent, handleAllocationEvent, handleDataSync]);

    /**
     * Desconectar do WebSocket
     */
    const disconnect = useCallback(() => {
        if (socketRef.current) {
            if (dashboardId) {
                socketRef.current.emit('leave:dashboard', dashboardId);
            }
            socketRef.current.disconnect();
            socketRef.current = null;
            setStatus('disconnected');
        }
    }, [dashboardId]);

    /**
     * Trocar de dashboard
     */
    const switchDashboard = useCallback((newDashboardId: string) => {
        if (!socketRef.current?.connected) return;

        // Sair do dashboard atual
        if (dashboardId) {
            socketRef.current.emit('leave:dashboard', dashboardId);
        }

        // Entrar no novo dashboard
        socketRef.current.emit('join:dashboard', newDashboardId);
    }, [dashboardId]);

    // Efeito para conectar/desconectar
    useEffect(() => {
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    // Efeito para trocar de dashboard quando o ID muda
    useEffect(() => {
        if (socketRef.current?.connected && dashboardId) {
            socketRef.current.emit('join:dashboard', dashboardId);
        }
    }, [dashboardId]);

    return {
        status,
        lastEvent,
        isConnected: status === 'connected',
        connect,
        disconnect,
        switchDashboard,
    };
}

// ============================================
// HOOK SIMPLIFICADO PARA DASHBOARD
// ============================================

/**
 * Hook simplificado que só precisa do dashboardId
 * Automaticamente gerencia a conexão e invalidação de caches
 */
export function useDashboardSync(dashboardId?: string) {
    const { status, isConnected, lastEvent } = useWebSocket({
        dashboardId,
        enabled: !!dashboardId,
    });

    return {
        syncStatus: status,
        isSyncing: isConnected,
        lastSyncEvent: lastEvent,
    };
}

export default useWebSocket;
