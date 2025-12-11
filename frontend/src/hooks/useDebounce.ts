import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook de debounce para valores
 * Retorna o valor após o delay especificado de inatividade
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Hook de debounce para callbacks
 * Executa o callback após o delay especificado de inatividade
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
): [(...args: Parameters<T>) => void, () => void] {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const callbackRef = useRef(callback);

    // Update the callback ref on every render
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    const debouncedCallback = useCallback((...args: Parameters<T>) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            callbackRef.current(...args);
        }, delay);
    }, [delay]);

    const cancel = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return [debouncedCallback, cancel];
}

/**
 * Hook que executa debounce em um objeto de filtros
 * Útil para evitar muitas requisições durante digitação
 */
export function useDebouncedFilters<T extends Record<string, any>>(
    filters: T,
    delay: number = 300
): [T, boolean] {
    const [debouncedFilters, setDebouncedFilters] = useState<T>(filters);
    const [isPending, setIsPending] = useState(false);
    const prevFiltersRef = useRef<T>(filters);

    useEffect(() => {
        // Check if filters actually changed
        const filtersChanged = JSON.stringify(filters) !== JSON.stringify(prevFiltersRef.current);

        if (filtersChanged) {
            setIsPending(true);
            const timer = setTimeout(() => {
                setDebouncedFilters(filters);
                setIsPending(false);
                prevFiltersRef.current = filters;
            }, delay);

            return () => {
                clearTimeout(timer);
            };
        }
    }, [filters, delay]);

    return [debouncedFilters, isPending];
}

/**
 * Hook de throttle para limitar execuções
 */
export function useThrottle<T>(value: T, interval: number): T {
    const [throttledValue, setThrottledValue] = useState<T>(value);
    const lastExecuted = useRef<number>(Date.now());

    useEffect(() => {
        const now = Date.now();
        const timeSinceLastExecution = now - lastExecuted.current;

        if (timeSinceLastExecution >= interval) {
            setThrottledValue(value);
            lastExecuted.current = now;
        } else {
            const timer = setTimeout(() => {
                setThrottledValue(value);
                lastExecuted.current = Date.now();
            }, interval - timeSinceLastExecution);

            return () => clearTimeout(timer);
        }
    }, [value, interval]);

    return throttledValue;
}
