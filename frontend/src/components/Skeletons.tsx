import React from 'react';
import { Box, Card, CardContent, Grid, Skeleton, Stack } from '@mui/material';

export const DashboardSkeleton: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      {/* Header Skeleton */}
      <Stack spacing={1} sx={{ mb: 4 }}>
        <Skeleton variant="text" width="40%" height={40} />
        <Skeleton variant="text" width="60%" height={24} />
      </Stack>

      {/* Stats Cards Skeleton */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[1, 2, 3, 4].map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width="60%" height={20} />
                <Skeleton variant="text" width="80%" height={40} sx={{ mt: 1 }} />
                <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Skeleton */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width="30%" height={30} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width="40%" height={30} sx={{ mb: 2 }} />
              <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <Stack spacing={1}>
      {/* Table Header */}
      <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
      
      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} variant="rectangular" height={52} sx={{ borderRadius: 1 }} />
      ))}
    </Stack>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Skeleton variant="text" width="70%" height={28} />
          <Skeleton variant="text" width="90%" />
          <Skeleton variant="text" width="80%" />
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 3 }) => {
  return (
    <Stack spacing={2}>
      {Array.from({ length: items }).map((_, index) => (
        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Skeleton variant="circular" width={48} height={48} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="40%" height={20} />
          </Box>
          <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
        </Box>
      ))}
    </Stack>
  );
};

export default DashboardSkeleton;
