import { useTheme, useMediaQuery, Breakpoint } from '@mui/material';
import { useMemo } from 'react';

/**
 * Hook para detectar o tamanho atual da tela
 * Retorna um objeto com flags para cada breakpoint
 */
export function useResponsive() {
    const theme = useTheme();

    const isXs = useMediaQuery(theme.breakpoints.only('xs'));
    const isSm = useMediaQuery(theme.breakpoints.only('sm'));
    const isMd = useMediaQuery(theme.breakpoints.only('md'));
    const isLg = useMediaQuery(theme.breakpoints.only('lg'));
    const isXl = useMediaQuery(theme.breakpoints.only('xl'));

    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

    const upSm = useMediaQuery(theme.breakpoints.up('sm'));
    const upMd = useMediaQuery(theme.breakpoints.up('md'));
    const upLg = useMediaQuery(theme.breakpoints.up('lg'));
    const upXl = useMediaQuery(theme.breakpoints.up('xl'));

    const downSm = useMediaQuery(theme.breakpoints.down('sm'));
    const downMd = useMediaQuery(theme.breakpoints.down('md'));
    const downLg = useMediaQuery(theme.breakpoints.down('lg'));
    const downXl = useMediaQuery(theme.breakpoints.down('xl'));

    return useMemo(
        () => ({
            // Exact breakpoints
            isXs,
            isSm,
            isMd,
            isLg,
            isXl,

            // Device categories
            isMobile,
            isTablet,
            isDesktop,

            // Up from
            upSm,
            upMd,
            upLg,
            upXl,

            // Down to
            downSm,
            downMd,
            downLg,
            downXl,

            // Current active breakpoint
            breakpoint: isXs ? 'xs' : isSm ? 'sm' : isMd ? 'md' : isLg ? 'lg' : 'xl',
        }),
        [
            isXs, isSm, isMd, isLg, isXl,
            isMobile, isTablet, isDesktop,
            upSm, upMd, upLg, upXl,
            downSm, downMd, downLg, downXl,
        ]
    );
}

/**
 * Hook para detectar orientação do dispositivo
 */
export function useOrientation() {
    const isPortrait = useMediaQuery('(orientation: portrait)');
    const isLandscape = useMediaQuery('(orientation: landscape)');

    return useMemo(
        () => ({
            isPortrait,
            isLandscape,
            orientation: isPortrait ? 'portrait' : 'landscape',
        }),
        [isPortrait, isLandscape]
    );
}

/**
 * Hook para detectar se é dispositivo touch
 */
export function useTouch() {
    const isTouchDevice = useMemo(() => {
        return (
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            (navigator as any).msMaxTouchPoints > 0
        );
    }, []);

    return isTouchDevice;
}

/**
 * Hook que retorna valor baseado no breakpoint atual
 * Exemplo: const padding = useResponsiveValue({ xs: 1, sm: 2, md: 3, lg: 4 });
 */
export function useResponsiveValue<T>(values: Partial<Record<Breakpoint, T>>): T | undefined {
    const { breakpoint } = useResponsive();

    // Procura o valor exato do breakpoint ou o mais próximo abaixo
    const breakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl'];
    const currentIndex = breakpoints.indexOf(breakpoint as Breakpoint);

    for (let i = currentIndex; i >= 0; i--) {
        const bp = breakpoints[i];
        if (values[bp] !== undefined) {
            return values[bp];
        }
    }

    return undefined;
}

/**
 * Helper para obter grid columns responsivo
 */
export function useResponsiveColumns(
    mobile: number = 1,
    tablet: number = 2,
    desktop: number = 3,
    wide: number = 4
) {
    const { isMobile, isTablet, isDesktop, upXl } = useResponsive();

    if (upXl) return wide;
    if (isDesktop) return desktop;
    if (isTablet) return tablet;
    return mobile;
}

/**
 * Hook para obter informações sobre a viewport
 */
export function useViewport() {
    const theme = useTheme();
    const { breakpoint } = useResponsive();

    return useMemo(() => {
        const width = typeof window !== 'undefined' ? window.innerWidth : 0;
        const height = typeof window !== 'undefined' ? window.innerHeight : 0;

        return {
            width,
            height,
            breakpoint,
            isMobile: width < theme.breakpoints.values.sm,
            isTablet: width >= theme.breakpoints.values.sm && width < theme.breakpoints.values.lg,
            isDesktop: width >= theme.breakpoints.values.lg,
        };
    }, [breakpoint, theme.breakpoints.values]);
}
