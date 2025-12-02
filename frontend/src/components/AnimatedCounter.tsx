import { useState, useEffect } from 'react';
import { Typography } from '@mui/material';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export default function AnimatedCounter({
  end,
  duration = 2000,
  prefix = '',
  suffix = '',
  decimals = 0,
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 }
    );

    const element = document.getElementById(`counter-${end}`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [end, hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number | null = null;
    const startValue = 0;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = startValue + (end - startValue) * easeOutQuart;

      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [hasStarted, end, duration]);

  return (
    <Typography
      id={`counter-${end}`}
      variant="h3"
      fontWeight={800}
      sx={{
        background: 'linear-gradient(120deg, #7c3aed 0%, #2563eb 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
      }}
    >
      {prefix}
      {count.toFixed(decimals)}
      {suffix}
    </Typography>
  );
}
