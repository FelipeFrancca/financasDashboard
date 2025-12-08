import Swal from 'sweetalert2';
import type { AxiosError } from 'axios';

// Configure SweetAlert2 defaults to prevent aria-hidden warnings
const MySwal = Swal.mixin({
    heightAuto: false, // Prevents body scroll issues
    didOpen: () => {
        // Remove aria-hidden from root to prevent accessibility warnings
        const root = document.getElementById('root');
        if (root && root.getAttribute('aria-hidden') === 'true') {
            root.removeAttribute('aria-hidden');
        }
    },
});

/**
 * Estrutura de erro da API
 */
interface ApiError {
    message: string;
    code?: string;
    details?: any;
    stack?: string;
}

/**
 * Mapeia códigos de erro para mensagens amigáveis
 */
const errorMessages: Record<string, string> = {
    // Erros de autenticação
    'INVALID_CREDENTIALS': 'Email ou senha incorretos',
    'EMAIL_ALREADY_EXISTS': 'Este email já está cadastrado',
    'USER_NOT_FOUND': 'Usuário não encontrado',
    'INVALID_TOKEN': 'Sessão expirada. Por favor, faça login novamente',
    'TOKEN_EXPIRED': 'Sua sessão expirou. Por favor, faça login novamente',

    // Erros de validação
    'VALIDATION_ERROR': 'Os dados enviados não são válidos',
    'INVALID_EMAIL': 'Email inválido',
    'INVALID_PASSWORD': 'Senha inválida',
    'PASSWORD_TOO_SHORT': 'A senha deve ter pelo menos 8 caracteres',
    'PASSWORD_REQUIREMENTS': 'A senha deve conter maiúscula, minúscula e número',

    // Erros de rede
    'NETWORK_ERROR': 'Erro de conexão. Verifique sua internet',
    'TIMEOUT_ERROR': 'A requisição demorou muito. Tente novamente',

    // Erros gerais
    'NOT_FOUND': 'Recurso não encontrado',
    'FORBIDDEN': 'Você não tem permissão para acessar este recurso',
    'INTERNAL_SERVER_ERROR': 'Erro no servidor. Tente novamente mais tarde',
    'SERVICE_UNAVAILABLE': 'Serviço temporariamente indisponível',

    // Erros de IA/Ingestão de documentos
    'AI_EXTRACTION_ERROR': 'Não foi possível extrair dados do documento. Tente uma imagem mais nítida ou um PDF de melhor qualidade.',
    'AI_SERVICE_UNAVAILABLE': 'Serviço de análise de documentos temporariamente indisponível. Tente novamente em alguns minutos.',
    'DOCUMENT_PARSE_ERROR': 'O documento não pôde ser lido corretamente. Verifique se o arquivo não está corrompido.',
    'AI_TIMEOUT': 'A análise do documento demorou muito. Tente com uma imagem menor ou mais simples.',
};

/**
 * Mapeia status HTTP para mensagens humanizadas
 */
const httpStatusMessages: Record<number, { title: string; message: string }> = {
    400: {
        title: 'Dados Inválidos',
        message: 'Algumas informações não estão corretas. Verifique os campos e tente novamente.'
    },
    401: {
        title: 'Sessão Expirada',
        message: 'Sua sessão terminou. Por favor, faça login novamente para continuar.'
    },
    403: {
        title: 'Acesso Negado',
        message: 'Você não tem permissão para realizar esta ação.'
    },
    404: {
        title: 'Não Encontrado',
        message: 'O recurso que você procura não foi encontrado.'
    },
    408: {
        title: 'Tempo Esgotado',
        message: 'A operação demorou mais do que o esperado. Tente novamente.'
    },
    409: {
        title: 'Conflito',
        message: 'Este item já existe ou está em uso.'
    },
    422: {
        title: 'Dados Inválidos',
        message: 'Verifique os dados informados e tente novamente.'
    },
    429: {
        title: 'Muitas Tentativas',
        message: 'Você fez muitas tentativas. Aguarde um momento e tente novamente.'
    },
    500: {
        title: 'Erro no Servidor',
        message: 'Algo deu errado do nosso lado. Nossa equipe foi notificada.'
    },
    502: {
        title: 'Servidor Indisponível',
        message: 'O servidor está temporariamente fora do ar. Tente em alguns minutos.'
    },
    503: {
        title: 'Serviço Indisponível',
        message: 'O serviço está em manutenção. Tente novamente em alguns minutos.'
    },
    504: {
        title: 'Servidor Ocupado',
        message: 'O servidor está demorando para responder. Tente novamente em alguns instantes.'
    },
};

/**
 * Extrai mensagem humanizada de um erro
 */
export function extractErrorMessage(error: any): string {
    // Se já é uma string, retorna
    if (typeof error === 'string') return error;

    // Se é um AxiosError
    if (error.isAxiosError || error.response) {
        const axiosError = error as AxiosError<ApiError>;

        // Erro de rede
        if (!axiosError.response) {
            if (axiosError.code === 'ERR_NETWORK') {
                return 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.';
            }
            if (axiosError.code === 'ECONNABORTED') {
                return 'A operação demorou muito. Verifique sua conexão e tente novamente.';
            }
            return 'Erro de conexão com o servidor. Verifique sua internet.';
        }

        // Erro da API
        const apiError = axiosError.response.data;

        // Se a API retornou um error object
        if (apiError && typeof apiError === 'object') {
            const errorObj = apiError as any;

            // Verifica se tem error.error.message (formato aninhado)
            if (errorObj.error) {
                if (typeof errorObj.error === 'string') {
                    return errorObj.error;
                }
                if (errorObj.error.message) {
                    return errorObj.error.message;
                }
                if (errorObj.error.code && errorMessages[errorObj.error.code]) {
                    return errorMessages[errorObj.error.code];
                }
            }

            // Verifica se tem message direto (mas não mostre se parece técnico)
            if (errorObj.message && !errorObj.message.includes('status code')) {
                // Não mostra mensagens que pareçam códigos técnicos
                const technicalPatterns = [/status code \d+/, /Error:/, /\d{3}$/, /undefined/i];
                const isTechnical = technicalPatterns.some(p => p.test(errorObj.message));
                if (!isTechnical) {
                    return errorObj.message;
                }
            }

            // Verifica se tem code mapeado
            if (errorObj.code && errorMessages[errorObj.code]) {
                return errorMessages[errorObj.code];
            }
        }

        // Mensagem humanizada por status code
        const status = axiosError.response.status;
        const statusMessage = httpStatusMessages[status];
        if (statusMessage) {
            return statusMessage.message;
        }

        // Fallback genérico (sem mostrar código)
        return 'Ocorreu um erro inesperado. Tente novamente.';
    }

    // Se tem uma mensagem de erro
    if (error.message) {
        // Filtra mensagens técnicas
        if (error.message.includes('status code') ||
            error.message.includes('Error:') ||
            /^\d{3}$/.test(error.message)) {
            return 'Ocorreu um erro inesperado. Tente novamente.';
        }
        return error.message;
    }

    // Fallback
    return 'Ocorreu um erro inesperado. Tente novamente.';
}

/**
 * Extrai título humanizado de um erro
 */
export function extractErrorTitle(error: any): string {
    if (error.isAxiosError || error.response) {
        const axiosError = error as AxiosError<ApiError>;

        if (!axiosError.response) {
            return 'Erro de Conexão';
        }

        const status = axiosError.response.status;
        const statusMessage = httpStatusMessages[status];
        if (statusMessage) {
            return statusMessage.title;
        }
    }

    return 'Algo deu errado';
}

/**
 * Opções para notificações
 */
interface NotificationOptions {
    title?: string;
    text?: string;
    icon?: 'success' | 'error' | 'warning' | 'info' | 'question';
    timer?: number;
    showConfirmButton?: boolean;
    confirmButtonText?: string;
    showCancelButton?: boolean;
    cancelButtonText?: string;
    confirmButtonColor?: string;
    cancelButtonColor?: string;
    showDenyButton?: boolean;
    denyButtonText?: string;
    denyButtonColor?: string;
}

/**
 * Exibe notificação de sucesso
 */
export function showSuccess(message: string, options: NotificationOptions = {}) {
    return MySwal.fire({
        icon: 'success',
        title: options.title || 'Sucesso!',
        text: message,
        timer: options.timer || 2000,
        showConfirmButton: options.showConfirmButton !== undefined ? options.showConfirmButton : false,
        confirmButtonText: options.confirmButtonText || 'OK',
        ...options,
    });
}

/**
 * Exibe notificação de erro com título humanizado
 */
export function showError(error: any, options: NotificationOptions = {}) {
    const message = options.text || extractErrorMessage(error);
    const title = options.title || extractErrorTitle(error);

    return MySwal.fire({
        icon: 'error',
        title,
        text: message,
        confirmButtonText: options.confirmButtonText || 'OK',
        confirmButtonColor: '#6366f1',
        ...options,
    });
}

/**
 * Exibe notificação de erro com botão de tentar novamente
 */
export async function showErrorWithRetry(
    error: any,
    onRetry: () => void | Promise<void>,
    options: NotificationOptions = {}
): Promise<boolean> {
    const message = options.text || extractErrorMessage(error);
    const title = options.title || extractErrorTitle(error);

    const result = await MySwal.fire({
        icon: 'error',
        title,
        text: message,
        showCancelButton: true,
        confirmButtonText: '🔄 Tentar Novamente',
        cancelButtonText: 'Fechar',
        confirmButtonColor: '#6366f1',
        cancelButtonColor: '#64748b',
        reverseButtons: true,
        ...options,
    });

    if (result.isConfirmed) {
        await onRetry();
        return true;
    }
    return false;
}

/**
 * Exibe notificação de aviso
 */
export function showWarning(message: string, options: NotificationOptions = {}) {
    return MySwal.fire({
        icon: 'warning',
        title: options.title || 'Atenção',
        text: message,
        confirmButtonText: options.confirmButtonText || 'OK',
        ...options,
    });
}

/**
 * Exibe notificação de informação
 */
export function showInfo(message: string, options: NotificationOptions = {}) {
    return MySwal.fire({
        icon: 'info',
        title: options.title || 'Informação',
        text: message,
        confirmButtonText: options.confirmButtonText || 'OK',
        ...options,
    });
}

/**
 * Exibe confirmação
 */
export function showConfirm(message: string, options: NotificationOptions = {}) {
    return MySwal.fire({
        icon: options.icon || 'question',
        title: options.title || 'Confirmar',
        text: message,
        showCancelButton: true,
        confirmButtonText: options.confirmButtonText || 'Sim',
        cancelButtonText: options.cancelButtonText || 'Cancelar',
        ...options,
    });
}

/**
 * Toast (notificação pequena no canto)
 */
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
});

export function showToast(message: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success') {
    return Toast.fire({
        icon,
        title: message
    });
}
