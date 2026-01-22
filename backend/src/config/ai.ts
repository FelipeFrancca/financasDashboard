/**
 * Configuração do Google Generative AI (Gemini)
 * Singleton para reutilização eficiente do modelo
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { InternalServerError } from '../utils/AppError';
import { logger } from '../utils/logger';

/**
 * Classe Singleton para gerenciar a conexão com o Google AI
 */
export class AIConfig {
    private static instance: AIConfig;
    private genAI: GoogleGenerativeAI | null = null;
    private model: GenerativeModel | null = null;

    // Pool de chaves e modelos
    private apiKeys: string[] = [];
    private currentKeyIndex: number = 0;

    private models: string[] = [
        'gemini-2.5-flash',
        'gemini-2.0-flash-exp',
        'gemini-2.0-flash',
        'gemini-2.0-flash-001'
    ];
    private currentModelIndex: number = 0;

    // Lock para evitar race conditions na rotação
    private rotationLock: boolean = false;

    private constructor() {
        this.loadApiKeys();
        this.initializeClient();
    }

    private loadApiKeys() {
        // Carrega a chave principal
        if (process.env.GOOGLE_AI_API_KEY) {
            this.apiKeys.push(process.env.GOOGLE_AI_API_KEY);
        }

        // Carrega chaves reservas (GOOGLE_AI_API_KEY_2, _3, etc)
        let i = 2;
        while (process.env[`GOOGLE_AI_API_KEY_${i}`]) {
            this.apiKeys.push(process.env[`GOOGLE_AI_API_KEY_${i}`]!);
            i++;
        }

        if (this.apiKeys.length === 0) {
            console.warn('Nenhuma chave de API do Google AI encontrada!');
        } else {
            console.log(`Carregadas ${this.apiKeys.length} chaves de API.`);
        }
    }

    private initializeClient() {
        if (this.apiKeys.length === 0) return;

        const currentKey = this.apiKeys[this.currentKeyIndex];
        const currentModelName = this.models[this.currentModelIndex];

        console.log(`Inicializando AI com Chave ${this.currentKeyIndex + 1}/${this.apiKeys.length} e Modelo ${currentModelName}`);

        try {
            this.genAI = new GoogleGenerativeAI(currentKey);
            this.model = this.genAI.getGenerativeModel({
                model: currentModelName,
                generationConfig: {
                    temperature: 0.1,
                },
            });
        } catch (error) {
            console.error(`Erro ao inicializar cliente AI (Key ${this.currentKeyIndex}, Model ${currentModelName}):`, error);
        }
    }

    public static getInstance(): AIConfig {
        if (!AIConfig.instance) {
            AIConfig.instance = new AIConfig();
        }
        return AIConfig.instance;
    }

    public getModel(): GenerativeModel {
        if (!this.model) {
            // Tenta inicializar se ainda não estiver (ex: chaves carregadas tardiamente ou erro anterior)
            this.initializeClient();
            if (!this.model) {
                throw new InternalServerError(
                    'Modelo de IA não disponível. Verifique as chaves de API.'
                );
            }
        }
        return this.model;
    }

    public isAvailable(): boolean {
        return this.apiKeys.length > 0;
    }

    /**
     * Tenta rotacionar para o próximo modelo ou próxima chave.
     * Retorna true se conseguiu rotacionar, false se esgotou todas as opções.
     * Usa lock para evitar race conditions em alta concorrência.
     */
    public rotateStrategy(): boolean {
        // Evita race condition - se já está rotacionando, retorna false
        if (this.rotationLock) {
            console.log('Rotação já em andamento, aguardando...');
            return false;
        }

        this.rotationLock = true;

        try {
            // 1. Tenta próximo modelo com a mesma chave
            if (this.currentModelIndex < this.models.length - 1) {
                this.currentModelIndex++;
                console.log(`Rotacionando para próximo modelo: ${this.models[this.currentModelIndex]}`);
                this.initializeClient();
                return true;
            }

            // 2. Se esgotou modelos, tenta próxima chave (e reseta modelos)
            if (this.currentKeyIndex < this.apiKeys.length - 1) {
                this.currentKeyIndex++;
                this.currentModelIndex = 0; // Volta para o primeiro/melhor modelo
                console.log(`Rotacionando para próxima chave de API: ${this.currentKeyIndex + 1}`);
                this.initializeClient();
                return true;
            }

            // 3. Esgotou tudo
            console.error('Todas as combinações de chaves e modelos falharam.');
            return false;
        } finally {
            this.rotationLock = false;
        }
    }

    public getCurrentConfig() {
        return {
            keyIndex: this.currentKeyIndex,
            model: this.models[this.currentModelIndex]
        };
    }
}

// Exporta a instância singleton
export const aiConfig = AIConfig.getInstance();
