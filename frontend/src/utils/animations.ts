/**
 * Animações e transições CSS reutilizáveis
 */

/**
 * Durações padronizadas (em ms)
 */
export const durations = {
    shortest: 150,
    shorter: 200,
    short: 250,
    standard: 300,
    complex: 375,
    enteringScreen: 225,
    leavingScreen: 195,
} as const;

/**
 * Funções de easing
 */
export const easings = {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
} as const;

/**
 * Cria uma string de transition CSS
 */
export const createTransition = (
    properties: string | string[],
    duration: keyof typeof durations = 'standard',
    easing: keyof typeof easings = 'easeInOut',
    delay = 0
): string => {
    const props = Array.isArray(properties) ? properties : [properties];
    const durationMs = durations[duration];
    const easingFn = easings[easing];

    return props
        .map((prop) => `${prop} ${durationMs}ms ${easingFn}${delay > 0 ? ` ${delay}ms` : ''}`)
        .join(', ');
};

/**
 * Animações de entrada
 */
export const fadeIn = {
    '@keyframes fadeIn': {
        from: { opacity: 0 },
        to: { opacity: 1 },
    },
    animation: `fadeIn ${durations.standard}ms ${easings.easeOut}`,
};

export const slideInUp = {
    '@keyframes slideInUp': {
        from: {
            opacity: 0,
            transform: 'translateY(20px)',
        },
        to: {
            opacity: 1,
            transform: 'translateY(0)',
        },
    },
    animation: `slideInUp ${durations.standard}ms ${easings.easeOut}`,
};

export const slideInDown = {
    '@keyframes slideInDown': {
        from: {
            opacity: 0,
            transform: 'translateY(-20px)',
        },
        to: {
            opacity: 1,
            transform: 'translateY(0)',
        },
    },
    animation: `slideInDown ${durations.standard}ms ${easings.easeOut}`,
};

export const slideInLeft = {
    '@keyframes slideInLeft': {
        from: {
            opacity: 0,
            transform: 'translateX(-20px)',
        },
        to: {
            opacity: 1,
            transform: 'translateX(0)',
        },
    },
    animation: `slideInLeft ${durations.standard}ms ${easings.easeOut}`,
};

export const slideInRight = {
    '@keyframes slideInRight': {
        from: {
            opacity: 0,
            transform: 'translateX(20px)',
        },
        to: {
            opacity: 1,
            transform: 'translateX(0)',
        },
    },
    animation: `slideInRight ${durations.standard}ms ${easings.easeOut}`,
};

export const scaleIn = {
    '@keyframes scaleIn': {
        from: {
            opacity: 0,
            transform: 'scale(0.9)',
        },
        to: {
            opacity: 1,
            transform: 'scale(1)',
        },
    },
    animation: `scaleIn ${durations.standard}ms ${easings.easeOut}`,
};

/**
 * Animação de pulso
 */
export const pulse = {
    '@keyframes pulse': {
        '0%': { transform: 'scale(1)' },
        '50%': { transform: 'scale(1.05)' },
        '100%': { transform: 'scale(1)' },
    },
    animation: `pulse ${durations.shorter}ms ${easings.easeInOut}`,
};

/**
 * Shimmer effect para skeletons
 */
export const shimmer = {
    '@keyframes shimmer': {
        '0%': {
            backgroundPosition: '-1000px 0',
        },
        '100%': {
            backgroundPosition: '1000px 0',
        },
    },
    animation: `shimmer 2s infinite linear`,
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
    backgroundSize: '1000px 100%',
};

/**
 * Animação de rotação
 */
export const rotate = {
    '@keyframes rotate': {
        from: { transform: 'rotate(0deg)' },
        to: { transform: 'rotate(360deg)' },
    },
    animation: `rotate 1s linear infinite`,
};

/**
 * Animação de bounce
 */
export const bounce = {
    '@keyframes bounce': {
        '0%, 100%': {
            transform: 'translateY(0)',
        },
        '50%': {
            transform: 'translateY(-10px)',
        },
    },
    animation: `bounce 1s ease-in-out infinite`,
};

/**
 * Stagger animation - cria delays para animações em sequência
 */
export const createStaggerDelay = (index: number, baseDelay = 50): number => {
    return index * baseDelay;
};

/**
 * Helper para criar animação com delay
 */
export const withDelay = (animationName: string, duration: number, delay: number): string => {
    return `${animationName} ${duration}ms ${easings.easeOut} ${delay}ms both`;
};

/**
 * Efeito de hover suave
 */
export const hoverLift = {
    transition: createTransition(['transform', 'box-shadow']),
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
};

/**
 * Efeito de hover em escala
 */
export const hoverScale = {
    transition: createTransition('transform', 'shorter'),
    '&:hover': {
        transform: 'scale(1.05)',
    },
};

/**
 * Efeito de hover para ícones
 */
export const hoverIcon = {
    transition: createTransition('transform', 'shortest'),
    '&:hover': {
        transform: 'scale(1.1)',
    },
};

/**
 * Efeito ripple (Material Design)
 */
export const rippleEffect = {
    position: 'relative' as const,
    overflow: 'hidden' as const,
    '&::before': {
        content: '""',
        position: 'absolute' as const,
        top: '50%',
        left: '50%',
        width: 0,
        height: 0,
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.5)',
        transform: 'translate(-50%, -50%)',
        transition: createTransition(['width', 'height'], 'complex'),
    },
    '&:active::before': {
        width: '100%',
        height: '100%',
    },
};

/**
 * Smooth scroll behavior
 */
export const smoothScroll = {
    scrollBehavior: 'smooth' as const,
    '&::-webkit-scrollbar': {
        width: 8,
        height: 8,
    },
    '&::-webkit-scrollbar-track': {
        background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 4,
        '&:hover': {
            background: 'rgba(0, 0, 0, 0.3)',
        },
    },
};
