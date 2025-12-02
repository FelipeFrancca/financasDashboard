import React from 'react';
import { Avatar, AvatarProps } from '@mui/material';

interface UserAvatarProps extends Omit<AvatarProps, 'children'> {
  user?: {
    name?: string | null;
    avatar?: string | null;
    email?: string;
  };
  size?: 'small' | 'medium' | 'large';
}

const sizeMap = {
  small: { width: 32, height: 32, fontSize: 14 },
  medium: { width: 40, height: 40, fontSize: 18 },
  large: { width: 56, height: 56, fontSize: 24 },
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'medium',
  sx = {},
  ...props
}) => {
  const getInitials = () => {
    if (!user?.name && !user?.email) return '?';
    const name = user.name || user.email || '';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 65%, 50%)`;
  };

  const colorSeed = user?.email || user?.name || 'default';

  return (
    <Avatar
      src={user?.avatar || undefined}
      sx={{
        ...sizeMap[size],
        bgcolor: user?.avatar ? 'transparent' : getColor(colorSeed),
        fontWeight: 600,
        ...sx,
      }}
      {...props}
    >
      {!user?.avatar && getInitials()}
    </Avatar>
  );
};

export default UserAvatar;
