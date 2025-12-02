import { useEffect, useRef, useState, ReactNode } from 'react';
import { Box } from '@mui/material';

interface ScrollAnimationProps {
  children: ReactNode;
  animation?: 'fadeIn' | 'slideInLeft' | 'slideInRight' | 'slideInUp' | 'scaleIn' | 'none';
  delay?: number;
  threshold?: number;
}

export default function ScrollAnimation({
  children,
  animation = 'fadeIn',
  delay = 0,
  threshold = 0.1,
}: ScrollAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Unobserve after triggering once
          if (ref.current) {
            observer.unobserve(ref.current);
          }
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold]);

  const animations = {
    fadeIn: {
      '@keyframes fadeIn': {
        from: { opacity: 0 },
        to: { opacity: 1 },
      },
      animation: 'fadeIn 0.6s ease-out forwards',
    },
    slideInLeft: {
      '@keyframes slideInLeft': {
        from: { opacity: 0, transform: 'translateX(-50px)' },
        to: { opacity: 1, transform: 'translateX(0)' },
      },
      animation: 'slideInLeft 0.6s ease-out forwards',
    },
    slideInRight: {
      '@keyframes slideInRight': {
        from: { opacity: 0, transform: 'translateX(50px)' },
        to: { opacity: 1, transform: 'translateX(0)' },
      },
      animation: 'slideInRight 0.6s ease-out forwards',
    },
    slideInUp: {
      '@keyframes slideInUp': {
        from: { opacity: 0, transform: 'translateY(30px)' },
        to: { opacity: 1, transform: 'translateY(0)' },
      },
      animation: 'slideInUp 0.6s ease-out forwards',
    },
    scaleIn: {
      '@keyframes scaleIn': {
        from: { opacity: 0, transform: 'scale(0.9)' },
        to: { opacity: 1, transform: 'scale(1)' },
      },
      animation: 'scaleIn 0.5s ease-out forwards',
    },
    none: {},
  };

  return (
    <Box
      ref={ref}
      sx={{
        opacity: 0,
        ...(isVisible && animations[animation]),
        animationDelay: `${delay}ms`,
      }}
    >
      {children}
    </Box>
  );
}
