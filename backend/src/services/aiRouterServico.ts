/**
 * AI Router Service
 * Distribui requisições entre Gemini (imagens) e Groq (texto)
 */

import { aiConfig } from '../config/ai';
import { groqConfig } from '../config/groq';
import { logger } from '../utils/logger';

export type AIProvider = 'gemini' | 'groq' | 'auto';

export type TaskType =
    | 'image_extraction'    // Gemini - extração de dados de imagens
    | 'pdf_extraction'      // Gemini - extração de dados de PDFs
    | 'text_summary'        // Groq - resumos de texto
    | 'financial_analysis'  // Groq - análise financeira
    | 'recommendations'     // Groq - recomendações personalizadas
    | 'general_chat';       // Groq - chat geral

/**
 * Mapeia tipo de tarefa para provider recomendado
 */
const TASK_PROVIDER_MAP: Record<TaskType, AIProvider> = {
    'image_extraction': 'gemini',
    'pdf_extraction': 'gemini',
    'text_summary': 'groq',
    'financial_analysis': 'groq',
    'recommendations': 'groq',
    'general_chat': 'groq',
};

/**
 * Serviço de roteamento de IA
 */
export class AIRouterService {
    private static instance: AIRouterService;

    private constructor() { }

    public static getInstance(): AIRouterService {
        if (!AIRouterService.instance) {
            AIRouterService.instance = new AIRouterService();
        }
        return AIRouterService.instance;
    }

    /**
     * Verifica disponibilidade dos providers
     */
    public getAvailability(): { gemini: boolean; groq: boolean } {
        return {
            gemini: aiConfig.isAvailable(),
            groq: groqConfig.isAvailable(),
        };
    }

    /**
     * Seleciona o provider ideal para uma tarefa
     */
    public selectProvider(taskType: TaskType): AIProvider {
        const availability = this.getAvailability();
        const preferred = TASK_PROVIDER_MAP[taskType];

        // Se preferido está disponível, usa ele
        if (preferred === 'gemini' && availability.gemini) return 'gemini';
        if (preferred === 'groq' && availability.groq) return 'groq';

        // Fallback: usa o que estiver disponível
        if (preferred === 'gemini' && availability.groq) {
            logger.warn(`Gemini indisponível para ${taskType}, usando Groq como fallback`, 'AIRouter');
            return 'groq';
        }
        if (preferred === 'groq' && availability.gemini) {
            logger.warn(`Groq indisponível para ${taskType}, usando Gemini como fallback`, 'AIRouter');
            return 'gemini';
        }

        throw new Error(`Nenhum provider de IA disponível para a tarefa: ${taskType}`);
    }

    /**
     * Executa uma tarefa de texto usando Groq (preferencial) ou Gemini
     */
    public async generateText(
        systemPrompt: string,
        userPrompt: string,
        taskType: TaskType = 'general_chat'
    ): Promise<string> {
        const provider = this.selectProvider(taskType);

        logger.info(`Executando tarefa '${taskType}' via ${provider}`, 'AIRouter');

        if (provider === 'groq') {
            return groqConfig.chat([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ]);
        }

        // Fallback para Gemini
        const model = aiConfig.getModel();
        const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
        const response = await result.response;
        return response.text();
    }

    /**
     * Gera análise financeira usando Groq
     */
    public async generateFinancialAnalysis(
        data: {
            period: string;
            totalIncome: number;
            totalExpenses: number;
            categories: { name: string; amount: number; percentage: number }[];
            trends?: { category: string; change: number }[];
        }
    ): Promise<string> {
        const systemPrompt = `Você é um consultor financeiro pessoal especializado em finanças brasileiras.
Seu papel é analisar os dados financeiros do usuário e fornecer insights acionáveis.
Seja direto, prático e use linguagem simples. Evite jargões financeiros complexos.
Responda sempre em português brasileiro.
Foque em: padrões de gastos, oportunidades de economia, e alertas importantes.`;

        const userPrompt = `Analise os seguintes dados financeiros do período ${data.period}:

**Resumo:**
- Receita Total: R$ ${data.totalIncome.toFixed(2)}
- Despesas Totais: R$ ${data.totalExpenses.toFixed(2)}
- Saldo: R$ ${(data.totalIncome - data.totalExpenses).toFixed(2)}

**Gastos por Categoria:**
${data.categories.map(c => `- ${c.name}: R$ ${c.amount.toFixed(2)} (${c.percentage.toFixed(1)}%)`).join('\n')}

${data.trends ? `**Tendências:**\n${data.trends.map(t => `- ${t.category}: ${t.change > 0 ? '+' : ''}${t.change.toFixed(1)}% vs mês anterior`).join('\n')}` : ''}

Forneça:
1. Resumo da situação financeira (2-3 frases)
2. Top 3 insights ou alertas importantes
3. 2 sugestões práticas para economizar`;

        return this.generateText(systemPrompt, userPrompt, 'financial_analysis');
    }

    /**
     * Gera resumo semanal usando Groq
     */
    public async generateWeeklySummary(
        data: {
            userName: string;
            weekNumber: number;
            totalSpent: number;
            topCategories: { name: string; amount: number }[];
            unusualTransactions?: { description: string; amount: number }[];
            budgetAlerts?: { category: string; percentage: number }[];
        }
    ): Promise<string> {
        const systemPrompt = `Você é um assistente financeiro amigável que envia resumos semanais.
Seja breve, positivo quando possível, mas honesto sobre problemas.
Use emojis moderadamente para tornar a leitura agradável.
Responda em português brasileiro.`;

        const userPrompt = `Crie um resumo semanal para ${data.userName} (Semana ${data.weekNumber}):

**Gastos da Semana:** R$ ${data.totalSpent.toFixed(2)}

**Principais Categorias:**
${data.topCategories.map(c => `- ${c.name}: R$ ${c.amount.toFixed(2)}`).join('\n')}

${data.unusualTransactions?.length ? `**Transações Incomuns:**\n${data.unusualTransactions.map(t => `- ${t.description}: R$ ${t.amount.toFixed(2)}`).join('\n')}` : ''}

${data.budgetAlerts?.length ? `**Alertas de Orçamento:**\n${data.budgetAlerts.map(a => `- ${a.category}: ${a.percentage}% do limite`).join('\n')}` : ''}

Crie um resumo curto (máximo 150 palavras) destacando os pontos principais e uma dica útil.`;

        return this.generateText(systemPrompt, userPrompt, 'text_summary');
    }

    /**
     * Gera análise de alocação de orçamento usando Groq
     */
    public async generateAllocationAnalysis(
        data: {
            monthlyIncome: number;
            allocations: {
                name: string;
                targetPercentage: number;
                actualPercentage: number;
                targetAmount: number;
                actualAmount: number;
                status: 'under' | 'on_track' | 'over';
            }[];
            unallocatedExpenses: { category: string; amount: number }[];
            overallStatus: 'healthy' | 'warning' | 'critical';
        }
    ): Promise<string> {
        const systemPrompt = `Você é um consultor financeiro especializado em orçamento pessoal.
Analise a distribuição de gastos do usuário em relação às metas de alocação definidas.
Seja direto, prático e construtivo. Foque em ações que o usuário pode tomar.
Responda em português brasileiro.`;

        const statusEmoji = {
            under: '✅',
            on_track: '✅',
            over: '⚠️',
        };

        const overallStatusText = {
            healthy: 'Saudável ✅',
            warning: 'Atenção ⚠️',
            critical: 'Crítico 🚨',
        };

        const userPrompt = `Analise a distribuição de orçamento deste mês:

**Receita Mensal:** R$ ${data.monthlyIncome.toFixed(2)}
**Status Geral:** ${overallStatusText[data.overallStatus]}

**Alocações vs Realizado:**
${data.allocations.map(a => `${statusEmoji[a.status]} ${a.name}: Meta ${a.targetPercentage}% (R$ ${a.targetAmount.toFixed(2)}) → Real ${a.actualPercentage.toFixed(1)}% (R$ ${a.actualAmount.toFixed(2)})`).join('\n')}

${data.unallocatedExpenses.length > 0 ? `**Gastos Não Classificados:**\n${data.unallocatedExpenses.slice(0, 5).map(e => `- ${e.category}: R$ ${e.amount.toFixed(2)}`).join('\n')}` : ''}

Por favor, forneça:
1. Avaliação geral da distribuição (2-3 frases)
2. As 2 áreas que mais precisam de atenção
3. 2 sugestões práticas para melhorar a distribuição
4. Uma meta realista para o próximo mês`;

        return this.generateText(systemPrompt, userPrompt, 'financial_analysis');
    }
}

// Exporta a instância singleton
export const aiRouter = AIRouterService.getInstance();
