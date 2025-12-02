import { useState, useEffect } from 'react';
import { Box, IconButton, Typography, Paper, useTheme } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CategoryIcon from '@mui/icons-material/Category';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ShareIcon from '@mui/icons-material/Share';

interface Feature {
  icon: string;
  title: string;
  description: string;
  color: string;
}

interface FeatureCarouselProps {
  features: Feature[];
  autoPlayInterval?: number;
}

const iconMap: Record<string, any> = {
  Dashboard: DashboardIcon,
  TrendingUp: TrendingUpIcon,
  Security: SecurityIcon,
  Speed: SpeedIcon,
  AccountBalance: AccountBalanceIcon,
  Category: CategoryIcon,
  Notifications: NotificationsActiveIcon,
  Share: ShareIcon,
};

export default function FeatureCarousel({ features, autoPlayInterval = 5000 }: FeatureCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % features.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [features.length, autoPlayInterval, isPaused]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + features.length) % features.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % features.length);
  };

  const currentFeature = features[currentIndex];
  const IconComponent = iconMap[currentFeature.icon] || DashboardIcon;

  return (
    <Box
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      sx={{ position: 'relative', width: '100%' }}
    >
      <Paper
        elevation={3}
        sx={{
          p: { xs: 4, md: 6 },
          borderRadius: 4,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)'
            : 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)',
          border: `1px solid ${theme.palette.divider}`,
          minHeight: { xs: 280, md: 320 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.5s ease',
        }}
      >
        {/* Icon */}
        <Box
          sx={{
            mb: 3,
            p: 3,
            borderRadius: '50%',
            background: `${currentFeature.color}15`,
            transition: 'all 0.5s ease',
            animation: 'iconPulse 2s ease-in-out infinite',
            '@keyframes iconPulse': {
              '0%, 100%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.05)' },
            },
          }}
        >
          <IconComponent sx={{ fontSize: { xs: 50, md: 60 }, color: currentFeature.color }} />
        </Box>

        {/* Title */}
        <Typography
          variant="h4"
          fontWeight={700}
          gutterBottom
          sx={{
            fontSize: { xs: '1.5rem', md: '2rem' },
            mb: 2,
          }}
        >
          {currentFeature.title}
        </Typography>

        {/* Description */}
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            maxWidth: 600,
            lineHeight: 1.8,
            fontSize: { xs: '0.95rem', md: '1.1rem' },
            px: { xs: 0, md: 2 },
          }}
        >
          {currentFeature.description}
        </Typography>
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
        {features.map((_, index) => (
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
