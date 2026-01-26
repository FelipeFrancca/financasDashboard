/**
 * WebSocket Service
 * Gerencia conexões WebSocket para atualizações em tempo real
 * 
 * IMPORTANTE: Este serviço usa throttling e debouncing para evitar
 * loops e perda de desempenho.
 */

import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { verifyAccessToken } from './autenticacaoServico';

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

interface ConnectedClient {
    socket: Socket;
    userId: string;
    dashboardIds: Set<string>;
    lastEventTime: Map<string, number>;
}

// ============================================
// CONFIGURAÇÃO DE THROTTLING
// ============================================

// Tempo mínimo entre eventos do mesmo tipo para o mesmo dashboard (ms)
const EVENT_THROTTLE_MS = 1000;

// Tempo máximo para agrupar eventos (debounce)
const EVENT_DEBOUNCE_MS = 500;

// Eventos pendentes para debouncing
const pendingEvents = new Map<string, NodeJS.Timeout>();

// ============================================
// CLASSE PRINCIPAL
// ============================================

class WebSocketService {
    private io: Server | null = null;
    private clients: Map<string, ConnectedClient> = new Map();
    private lastBroadcastTime: Map<string, number> = new Map();

    /**
     * Inicializa o servidor WebSocket
     */
    initialize(server: HttpServer): void {
        this.io = new Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || 'http://localhost:3000',
                methods: ['GET', 'POST'],
                credentials: true,
            },
            // Configurações de performance
            pingTimeout: 60000,
            pingInterval: 25000,
            transports: ['websocket', 'polling'],
        });

        this.io.use(this.authenticateSocket.bind(this));
        this.io.on('connection', this.handleConnection.bind(this));

        logger.info('WebSocket server initialized', 'WebSocket');
    }

    /**
     * Middleware de autenticação para WebSocket
     */
    private async authenticateSocket(socket: Socket, next: (err?: Error) => void): Promise<void> {
        try {
            const token = socket.handshake.auth.token || socket.handshake.query.token;

            if (!token) {
                return next(new Error('Token não fornecido'));
            }

            const payload = verifyAccessToken(token as string);
            (socket as any).userId = payload.userId;
            (socket as any).email = payload.email;

            next();
        } catch (error) {
            logger.warn('WebSocket auth failed', 'WebSocket', { error: (error as Error).message });
            next(new Error('Token inválido'));
        }
    }

    /**
     * Handler para novas conexões
     */
    private handleConnection(socket: Socket): void {
        const userId = (socket as any).userId;

        logger.info(`Client connected: ${socket.id}`, 'WebSocket', { userId });

        // Registrar cliente
        this.clients.set(socket.id, {
            socket,
            userId,
            dashboardIds: new Set(),
            lastEventTime: new Map(),
        });

        // Handlers de eventos do cliente
        socket.on('join:dashboard', (dashboardId: string) => {
            this.handleJoinDashboard(socket.id, dashboardId);
        });

        socket.on('leave:dashboard', (dashboardId: string) => {
            this.handleLeaveDashboard(socket.id, dashboardId);
        });

        socket.on('disconnect', () => {
            this.handleDisconnect(socket.id);
        });

        // Enviar confirmação de conexão
        socket.emit('connected', {
            socketId: socket.id,
            userId,
            timestamp: Date.now(),
        });
    }

    /**
     * Handler para entrar em uma sala de dashboard
     */
    private handleJoinDashboard(socketId: string, dashboardId: string): void {
        const client = this.clients.get(socketId);
        if (!client) return;

        client.dashboardIds.add(dashboardId);
        client.socket.join(`dashboard:${dashboardId}`);

        logger.debug(`Client ${socketId} joined dashboard ${dashboardId}`, 'WebSocket');
    }

    /**
     * Handler para sair de uma sala de dashboard
     */
    private handleLeaveDashboard(socketId: string, dashboardId: string): void {
        const client = this.clients.get(socketId);
        if (!client) return;

        client.dashboardIds.delete(dashboardId);
        client.socket.leave(`dashboard:${dashboardId}`);

        logger.debug(`Client ${socketId} left dashboard ${dashboardId}`, 'WebSocket');
    }

    /**
     * Handler para desconexão
     */
    private handleDisconnect(socketId: string): void {
        this.clients.delete(socketId);
        logger.info(`Client disconnected: ${socketId}`, 'WebSocket');
    }

    /**
     * Emite evento para todos os clientes em um dashboard
     * Com throttling para evitar spam de eventos
     */
    emitToDashboard(
        dashboardId: string,
        eventType: string,
        data?: any,
        options?: { skipThrottle?: boolean; excludeSocketId?: string }
    ): void {
        if (!this.io) return;

        const eventKey = `${dashboardId}:${eventType}`;
        const now = Date.now();

        // Verificar throttling
        if (!options?.skipThrottle) {
            const lastTime = this.lastBroadcastTime.get(eventKey) || 0;
            if (now - lastTime < EVENT_THROTTLE_MS) {
                // Agendar evento com debounce
                this.scheduleEvent(eventKey, dashboardId, eventType, data, options);
                return;
            }
        }

        // Atualizar timestamp
        this.lastBroadcastTime.set(eventKey, now);

        // Cancelar evento pendente se houver
        const pendingTimeout = pendingEvents.get(eventKey);
        if (pendingTimeout) {
            clearTimeout(pendingTimeout);
            pendingEvents.delete(eventKey);
        }

        // Emitir evento
        const event: WebSocketEvent = {
            type: eventType,
            dashboardId,
            data,
            timestamp: now,
        };

        if (options?.excludeSocketId) {
            this.io.to(`dashboard:${dashboardId}`)
                .except(options.excludeSocketId)
                .emit(eventType, event);
        } else {
            this.io.to(`dashboard:${dashboardId}`).emit(eventType, event);
        }

        logger.debug(`Event emitted: ${eventType} to dashboard ${dashboardId}`, 'WebSocket');
    }

    /**
     * Agenda evento com debounce para evitar múltiplas emissões
     */
    private scheduleEvent(
        eventKey: string,
        dashboardId: string,
        eventType: string,
        data?: any,
        options?: { skipThrottle?: boolean; excludeSocketId?: string }
    ): void {
        // Cancelar evento pendente anterior
        const existingTimeout = pendingEvents.get(eventKey);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        // Agendar novo evento
        const timeout = setTimeout(() => {
            pendingEvents.delete(eventKey);
            this.emitToDashboard(dashboardId, eventType, data, { ...options, skipThrottle: true });
        }, EVENT_DEBOUNCE_MS);

        pendingEvents.set(eventKey, timeout);
    }

    /**
     * Emite evento para um usuário específico
     */
    emitToUser(userId: string, eventType: string, data?: any): void {
        if (!this.io) return;

        for (const [, client] of this.clients) {
            if (client.userId === userId) {
                client.socket.emit(eventType, {
                    type: eventType,
                    userId,
                    data,
                    timestamp: Date.now(),
                });
            }
        }
    }

    /**
     * Obtém estatísticas de conexões
     */
    getStats(): { totalConnections: number; dashboardRooms: number } {
        const dashboards = new Set<string>();
        for (const [, client] of this.clients) {
            client.dashboardIds.forEach(id => dashboards.add(id));
        }

        return {
            totalConnections: this.clients.size,
            dashboardRooms: dashboards.size,
        };
    }

    /**
     * Fecha todas as conexões
     */
    async close(): Promise<void> {
        if (this.io) {
            // Limpar eventos pendentes
            pendingEvents.forEach(timeout => clearTimeout(timeout));
            pendingEvents.clear();

            await this.io.close();
            this.io = null;
            this.clients.clear();
            logger.info('WebSocket server closed', 'WebSocket');
        }
    }
}

// ============================================
// EVENTOS PRÉ-DEFINIDOS
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
// SINGLETON EXPORT
// ============================================

export const websocketService = new WebSocketService();
export default websocketService;
