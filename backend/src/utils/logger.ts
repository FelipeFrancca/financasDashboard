/**
 * Sistema de Logging Estruturado
 * Níveis: error, warn, info, http, debug
 */

import fs from 'fs';
import path from 'path';

// Níveis de log
export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    HTTP = 'http',
    DEBUG = 'debug',
}

// Cores para console
const colors = {
    error: '\x1b[31m', // Red
    warn: '\x1b[33m',  // Yellow
    info: '\x1b[36m',  // Cyan
    http: '\x1b[35m',  // Magenta
    debug: '\x1b[32m', // Green
    reset: '\x1b[0m',
};

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: string;
    data?: any;
    error?: any;
}

class Logger {
    private static instance: Logger;
    private logsDir: string;
    private isDevelopment: boolean;

    private constructor() {
        this.isDevelopment = process.env.NODE_ENV !== 'production';
        this.logsDir = path.join(process.cwd(), 'logs');

        // Criar diretório de logs se não existir
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }
    }

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    /**
     * Formata timestamp
     */
    private getTimestamp(): string {
        return new Date().toISOString();
    }

    /**
     * Formata entrada de log
     */
    private formatLog(entry: LogEntry): string {
        const { timestamp, level, message, context, data, error } = entry;

        let logMessage = `[${timestamp}] [${level.toUpperCase()}]`;

        if (context) {
            logMessage += ` [${context}]`;
        }

        logMessage += ` ${message}`;

        if (data) {
            logMessage += ` ${JSON.stringify(data)}`;
        }

        if (error) {
            logMessage += `\nError: ${error.stack || error.message || error}`;
        }

        return logMessage;
    }

    /**
     * Escreve log no console com cores
     */
    private logToConsole(entry: LogEntry): void {
        const color = colors[entry.level] || colors.reset;
        const formatted = this.formatLog(entry);
        console.log(`${color}${formatted}${colors.reset}`);
    }

    /**
     * Escreve log em arquivo
     */
    private logToFile(entry: LogEntry): void {
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const filename = `${entry.level}-${date}.log`;
        const filepath = path.join(this.logsDir, filename);

        const formatted = this.formatLog(entry) + '\n';

        fs.appendFile(filepath, formatted, (err) => {
            if (err) {
                console.error('Erro ao escrever log em arquivo:', err);
            }
        });
    }

    /**
     * Escreve log
     */
    private log(level: LogLevel, message: string, context?: string, data?: any, error?: any): void {
        const entry: LogEntry = {
            timestamp: this.getTimestamp(),
            level,
            message,
            context,
            data,
            error,
        };

        // Sempre loga no console em desenvolvimento
        if (this.isDevelopment) {
            this.logToConsole(entry);
        }

        // Loga em arquivo em produção ou erros
        if (!this.isDevelopment || level === LogLevel.ERROR || level === LogLevel.WARN) {
            this.logToFile(entry);
        }
    }

    /**
     * Logs de erro
     */
    error(message: string, error?: any, context?: string, data?: any): void {
        this.log(LogLevel.ERROR, message, context, data, error);
    }

    /**
     * Logs de aviso
     */
    warn(message: string, context?: string, data?: any): void {
        this.log(LogLevel.WARN, message, context, data);
    }

    /**
     * Logs informativos
     */
    info(message: string, context?: string, data?: any): void {
        this.log(LogLevel.INFO, message, context, data);
    }

    /**
     * Logs de requisições HTTP
     */
    http(message: string, context?: string, data?: any): void {
        this.log(LogLevel.HTTP, message, context, data);
    }

    /**
     * Logs de debug
     */
    debug(message: string, context?: string, data?: any): void {
        if (this.isDevelopment) {
            this.log(LogLevel.DEBUG, message, context, data);
        }
    }

    /**
     * Limpar logs antigos (mais de 7 dias)
     */
    async cleanOldLogs(daysToKeep: number = 7): Promise<void> {
        const files = fs.readdirSync(this.logsDir);
        const now = Date.now();
        const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

        for (const file of files) {
            const filePath = path.join(this.logsDir, file);
            const stats = fs.statSync(filePath);

            if (now - stats.mtime.getTime() > maxAge) {
                fs.unlinkSync(filePath);
                this.info(`Log antigo removido: ${file}`, 'LogCleanup');
            }
        }
    }
}

// Exportar instância singleton
export const logger = Logger.getInstance();

// Limpar logs antigos a cada 24h
if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
        logger.cleanOldLogs(7).catch((err) => {
            logger.error('Erro ao limpar logs antigos', err, 'LogCleanup');
        });
    }, 24 * 60 * 60 * 1000); // 24 horas
}
