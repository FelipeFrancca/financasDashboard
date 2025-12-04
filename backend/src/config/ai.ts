/**
 * Configuração do Google Generative AI (Gemini)
 * Singleton para reutilização eficiente do modelo
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { InternalServerError } from '../utils/AppError';
import { logger } from '../utils/logger';

/**
 * Classe Singleton para gerenciar a conexão com o Google AI
 */
class AIConfig {
    private static instance: AIConfig;
    private genAI: GoogleGenerativeAI | null = null;
    private model: any = null;

    private constructor() {
        this.initialize();
    }

    /**
     * Inicializa a conexão com o Google AI
     */
    private initialize(): void {
        const apiKey = process.env.GOOGLE_AI_API_KEY;

        if (!apiKey) {
            logger.warn(
                'GOOGLE_AI_API_KEY não configurada. Funcionalidade de IA desabilitada.',
                'AIConfig'
            );
            return;
        }

        try {
            this.genAI = new GoogleGenerativeAI(apiKey);

            // Configura o modelo Gemini 2.5 Flash
            this.model = this.genAI.getGenerativeModel({
                model: 'gemini-2.5-flash',
                generationConfig: {
                    temperature: 0.1,
                },
            });

            logger.info('Google Gemini AI configurado com sucesso', 'AIConfig');
        } catch (error) {
            logger.error('Erro ao inicializar Google AI', error, 'AIConfig');
            throw new InternalServerError('Falha ao configurar serviço de IA');
        }
    }

    /**
     * Retorna a instância singleton
     */
    static getInstance(): AIConfig {
        if (!AIConfig.instance) {
            AIConfig.instance = new AIConfig();
        }
        return AIConfig.instance;
    }

    /**
     * Retorna o modelo configurado
     */
    getModel(): any {
        if (!this.model) {
            throw new InternalServerError(
                'Modelo de IA não disponível. Verifique a configuração da API key.'
            );
        }
        return this.model;
    }

    /**
     * Verifica se a IA está disponível
     */
    isAvailable(): boolean {
        return this.model !== null;
    }
}

// Exporta a instância singleton
export const aiConfig = AIConfig.getInstance();
