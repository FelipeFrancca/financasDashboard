import { useState, useEffect } from 'react';
import { Box, IconButton, Typography, Paper, Avatar, Rating, useTheme } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface Testimonial {
  name: string;
  role: string;
  avatar: string;
  rating: number;
  text: string;
  color: string;
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
  autoPlayInterval?: number;
}

export default function TestimonialCarousel({ testimonials, autoPlayInterval = 6000 }: TestimonialCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [testimonials.length, autoPlayInterval, isPaused]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <Box
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      sx={{ position: 'relative', width: '100%' }}
    >
      <Paper
        elevation={4}
        sx={{
          p: { xs: 4, md: 6 },
          borderRadius: 4,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)'
            : 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(37, 99, 235, 0.08) 100%)',
          border: `2px solid ${theme.palette.divider}`,
          minHeight: { xs: 320, md: 280 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          transition: 'all 0.5s ease',
        }}
      >
        {/* Avatar */}
        <Avatar
          sx={{
            width: { xs: 70, md: 80 },
            height: { xs: 70, md: 80 },
            mb: 2,
            bgcolor: currentTestimonial.color,
            fontSize: '2rem',
            fontWeight: 700,
            animation: 'avatarPulse 3s ease-in-out infinite',
            '@keyframes avatarPulse': {
              '0%, 100%': { transform: 'scale(1)', boxShadow: `0 0 0 0 ${currentTestimonial.color}40` },
              '50%': { transform: 'scale(1.05)', boxShadow: `0 0 20px 10px ${currentTestimonial.color}20` },
            },
          }}
        >
          {currentTestimonial.avatar}
        </Avatar>

        {/* Rating */}
        <Rating value={currentTestimonial.rating} readOnly sx={{ mb: 2 }} />

        {/* Text */}
        <Typography
          variant="h6"
          sx={{
            fontStyle: 'italic',
            color: 'text.primary',
            lineHeight: 1.8,
            mb: 3,
            maxWidth: 700,
            fontSize: { xs: '1rem', md: '1.2rem' },
            px: { xs: 0, md: 3 },
          }}
        >
          "{currentTestimonial.text}"
        </Typography>

        {/* Author */}
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {currentTestimonial.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentTestimonial.role}
          </Typography>
        </Box>
      </Paper>

      {/* Navigation Arrows */}
      <IconButton
        onClick={handlePrevious}
        size="large"
        sx={{
          position: 'absolute',
          left: { xs: -20, md: -25 },
          top: '50%',
          transform: 'translateY(-50%)',
          bgcolor: 'background.paper',
          boxShadow: 2,
          width: { xs: 40, md: 48 },
          height: { xs: 40, md: 48 },
          '&:hover': {
            bgcolor: 'primary.main',
            color: 'white',
            boxShadow: 4,
            transform: 'translateY(-50%) scale(1.1)',
          },
          transition: 'all 0.2s ease-in-out',
        }}
      >
        <ChevronLeftIcon sx={{ fontSize: { xs: 24, md: 28 } }} />
      </IconButton>

      <IconButton
        onClick={handleNext}
        size="large"
        sx={{
          position: 'absolute',
          right: { xs: -20, md: -25 },
          top: '50%',
          transform: 'translateY(-50%)',
          bgcolor: 'background.paper',
          boxShadow: 2,
          width: { xs: 40, md: 48 },
          height: { xs: 40, md: 48 },
          '&:hover': {
            bgcolor: 'primary.main',
            color: 'white',
            boxShadow: 4,
            transform: 'translateY(-50%) scale(1.1)',
          },
          transition: 'all 0.2s ease-in-out',
        }}
      >
        <ChevronRightIcon sx={{ fontSize: { xs: 24, md: 28 } }} />
      </IconButton>

      {/* Dots Indicator */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 3 }}>
        {testimonials.map((_, index) => (
          <Box
            key={index}
            onClick={() => setCurrentIndex(index)}
            sx={{
              width: currentIndex === index ? 32 : 8,
              height: 8,
              borderRadius: 4,
              bgcolor: currentIndex === index ? 'primary.main' : 'action.disabled',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': { bgcolor: 'primary.light' },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
