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
};

/**
 * Extrai mensagem de erro de um AxiosError
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
                return errorMessages.NETWORK_ERROR;
            }
            if (axiosError.code === 'ECONNABORTED') {
                return errorMessages.TIMEOUT_ERROR;
            }
            return 'Erro de conexão com o servidor';
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

            // Verifica se tem message direto
            if (errorObj.message) {
                return errorObj.message;
            }

            // Verifica se tem code
            if (errorObj.code && errorMessages[errorObj.code]) {
                return errorMessages[errorObj.code];
            }

            // Verifica se tem details com array de erros (validação Zod)
            if (errorObj.details && Array.isArray(errorObj.details)) {
                const errors = errorObj.details.map((d: any) => {
                    if (d.field && d.message) {
                        return `${d.field}: ${d.message}`;
                    }
                    return d.message || JSON.stringify(d);
                });
                return errors.join('\n');
            }
        }

        // Mensagens padrão por status code
        const status = axiosError.response.status;
        switch (status) {
            case 400:
                return 'Dados inválidos. Verifique as informações enviadas';
            case 401:
                return 'Não autorizado. Faça login novamente';
            case 403:
                return errorMessages.FORBIDDEN;
            case 404:
                return errorMessages.NOT_FOUND;
            case 409:
                return 'Conflito. Este recurso já existe';
            case 422:
                return 'Erro de validação. Verifique os dados';
            case 500:
                return errorMessages.INTERNAL_SERVER_ERROR;
            case 503:
                return errorMessages.SERVICE_UNAVAILABLE;
            default:
                return `Erro no servidor (${status})`;
        }
    }

    // Se tem uma mensagem de erro
    if (error.message) {
        return error.message;
    }

    // Fallback
    return 'Ocorreu um erro inesperado';
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
 * Exibe notificação de erro
 */
export function showError(error: any, options: NotificationOptions = {}) {
    const message = extractErrorMessage(error);

    return MySwal.fire({
        icon: 'error',
        title: options.title || 'Erro',
        text: message,
        confirmButtonText: options.confirmButtonText || 'OK',
        ...options,
    });
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
