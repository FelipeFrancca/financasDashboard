/**
 * Configuração de temas do SweetAlert2 integrado com Material UI
 */

/**
 * Cores do tema escuro (padrão)
 */
const darkTheme = {
    background: '#1e1e1e',
    text: '#ffffff',
    confirmButton: '#7c3aed',
    confirmButtonHover: '#6d28d9',
    cancelButton: '#4b5563',
    cancelButtonHover: '#374151',
    popup: '#2d2d2d',
    border: '#404040',
    input: '#2d2d2d',
    inputBorder: '#404040',
    inputText: '#ffffff',
};

/**
 * Cores do tema claro
 */
const lightTheme = {
    background: '#ffffff',
    text: '#1e293b',
    confirmButton: '#7c3aed',
    confirmButtonHover: '#6d28d9',
    cancelButton: '#e5e7eb',
    cancelButtonHover: '#d1d5db',
    popup: '#ffffff',
    border: '#e5e7eb',
    input: '#ffffff',
    inputBorder: '#e5e7eb',
    inputText: '#1e293b',
};

/**
 * Aplica tema ao SweetAlert2
 */
export function applySwalTheme(mode: 'light' | 'dark' = 'dark') {
    const theme = mode === 'dark' ? darkTheme : lightTheme;

    // Cria estilos customizados
    const styleId = 'swal2-custom-theme';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
    }

    styleElement.textContent = `
    /* Popup Container */
    .swal2-popup {
      background-color: ${theme.popup} !important;
      color: ${theme.text} !important;
      border: 1px solid ${theme.border} !important;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2) !important;
    }
    
    /* Título */
    .swal2-title {
      color: ${theme.text} !important;
    }
    
    /* Texto */
    .swal2-html-container {
      color: ${theme.text} !important;
    }
    
    /* Botão Confirmar */
    .swal2-confirm {
      background-color: ${theme.confirmButton} !important;
      border: none !important;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06) !important;
      font-weight: 600 !important;
      padding: 0.75rem 1.5rem !important;
      border-radius: 0.5rem !important;
      transition: all 0.2s ease !important;
    }
    
    .swal2-confirm:hover {
      background-color: ${theme.confirmButtonHover} !important;
      transform: translateY(-1px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1) !important;
    }
    
    .swal2-confirm:focus {
      box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.4) !important;
    }
    
    /* Botão Cancelar */
    .swal2-cancel {
      background-color: ${theme.cancelButton} !important;
      color: ${mode === 'dark' ? '#ffffff' : '#374151'} !important;
      border: none !important;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06) !important;
      font-weight: 600 !important;
      padding: 0.75rem 1.5rem !important;
      border-radius: 0.5rem !important;
      transition: all 0.2s ease !important;
    }
    
    .swal2-cancel:hover {
      background-color: ${theme.cancelButtonHover} !important;
      transform: translateY(-1px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1) !important;
    }
    
    /* Input Fields */
    .swal2-input,
    .swal2-textarea {
      background-color: ${theme.input} !important;
      color: ${theme.inputText} !important;
      border: 1px solid ${theme.inputBorder} !important;
      border-radius: 0.5rem !important;
    }
    
    .swal2-input:focus,
    .swal2-textarea:focus {
      border-color: ${theme.confirmButton} !important;
      box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1) !important;
    }
    
    /* Ícones */
    .swal2-icon {
      border-color: ${theme.border} !important;
    }
    
    .swal2-icon.swal2-success .swal2-success-ring {
      border-color: rgba(34, 197, 94, 0.3) !important;
    }
    
    .swal2-icon.swal2-error [class^='swal2-x-mark-line'] {
      background-color: #ef4444 !important;
    }
    
    .swal2-icon.swal2-warning {
      border-color: #f59e0b !important;
      color: #f59e0b !important;
    }
    
    .swal2-icon.swal2-info {
      border-color: #3b82f6 !important;
      color: #3b82f6 !important;
    }
    
    /* Toast */
    .swal2-toast {
      background-color: ${theme.popup} !important;
      color: ${theme.text} !important;
      border: 1px solid ${theme.border} !important;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2) !important;
    }
    
    .swal2-toast .swal2-title {
      color: ${theme.text} !important;
    }
    
    .swal2-toast .swal2-icon {
      margin-top: 0 !important;
    }
    
    /* Timer Progress Bar */
    .swal2-timer-progress-bar {
      background-color: ${theme.confirmButton} !important;
    }
    
    /* Overlay */
    .swal2-container {
      background-color: rgba(0, 0, 0, ${mode === 'dark' ? '0.8' : '0.4'}) !important;
    }
    
    /* Close button */
    .swal2-close {
      color: ${theme.text} !important;
    }
    
    .swal2-close:hover {
      color: ${theme.confirmButton} !important;
    }
    
    /* Validação de input */
    .swal2-input.swal2-inputerror,
    .swal2-textarea.swal2-inputerror {
      border-color: #ef4444 !important;
    }
    
    .swal2-validation-message {
      background-color: ${mode === 'dark' ? '#3f1f1f' : '#fee2e2'} !important;
      color: ${mode === 'dark' ? '#fca5a5' : '#991b1b'} !important;
      border-color: #ef4444 !important;
    }
    
    /* Loading */
    .swal2-loader {
      border-color: ${theme.confirmButton} transparent ${theme.confirmButton} transparent !important;
    }
  `;
}

/**
 * Inicializa o tema do SweetAlert2
 * Deve ser chamado no início da aplicação
 */
export function initSwalTheme() {
    // Detecta preferência do usuário ou usa escuro como padrão
    const savedTheme = localStorage.getItem('finance-dashboard-theme');
    const preferredTheme = (savedTheme === 'light' ? 'light' : 'dark') as 'light' | 'dark';

    applySwalTheme(preferredTheme);

    return preferredTheme;
}

/**
 * Observa mudanças no tema e atualiza o SweetAlert2
 */
export function observeThemeChanges() {
    // Observa mudanças no localStorage
    window.addEventListener('storage', (e) => {
        if (e.key === 'finance-dashboard-theme') {
            const newTheme = (e.newValue === 'light' ? 'light' : 'dark') as 'light' | 'dark';
            applySwalTheme(newTheme);
        }
    });

    // Observa mudanças locais (mesma aba)
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function (key, value) {
        originalSetItem.apply(this, [key, value]);
        if (key === 'finance-dashboard-theme') {
            const newTheme = (value === 'light' ? 'light' : 'dark') as 'light' | 'dark';
            applySwalTheme(newTheme);
        }
    };
}
