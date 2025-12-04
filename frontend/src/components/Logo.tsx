/**
 * Logo Component
 * 
 * Displays the FinChart logo in different variants:
 * - 'full': Complete logomarca (larger, detailed logo)
 * - 'icon': Compact logo icon (for small spaces, buttons, etc.)
 */

import React from 'react';
import { Box, BoxProps } from '@mui/material';
import type { ResponsiveStyleValue } from '@mui/system';

export type LogoVariant = 'full' | 'icon';

export interface LogoProps extends Omit<BoxProps, 'component'> {
    /** Variant of the logo to display */
    variant?: LogoVariant;
    /** Alt text for the logo */
    alt?: string;
    /** Width of the logo (height auto-scales to maintain aspect ratio) */
    width?: ResponsiveStyleValue<string | number>;
}

/**
 * FinChart Logo Component
 * 
 * @example
 * // Full logo (default)
 * <Logo width={200} />
 * 
 * @example
 * // Icon variant for compact spaces
 * <Logo variant="icon" width={40} />
 * 
 * @example
 * // Responsive width
 * <Logo variant="full" width={{ xs: 120, sm: 150 }} />
 */
export const Logo: React.FC<LogoProps> = ({
    variant = 'full',
    alt = 'FinChart Logo',
    width = variant === 'full' ? 180 : 40,
    sx,
    ...boxProps
}) => {
    const logoSrc = variant === 'full'
        ? '/logomarca-finchart.png'
        : '/finchart-logo.png';

    return (
        <Box
            component="img"
            src={logoSrc}
            alt={alt}
            sx={{
                width,
                height: 'auto',
                objectFit: 'contain',
                userSelect: 'none',
                ...sx,
            }}
            {...boxProps}
        />
    );
};

export default Logo;
