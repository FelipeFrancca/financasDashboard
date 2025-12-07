import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Stack,
  TypographyProps,
  InputAdornment,
  Button,
} from '@mui/material';
import { Edit, Check, Close } from '@mui/icons-material';

interface EditableFieldProps {
  value: string | number;
  onSave: (newValue: string) => void;
  label?: string;
  type?: 'text' | 'number' | 'date';
  format?: (value: any) => string;
  typographyProps?: TypographyProps;
  startAdornment?: React.ReactNode;
}

export default function EditableField({
  value,
  onSave,
  label,
  type = 'text',
  format,
  typographyProps,
  startAdornment,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(String(value));
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(String(value));
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          inputRef={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          type={type}
          size="small"
          label={label}
          fullWidth
          InputProps={{
            startAdornment: startAdornment ? (
              <InputAdornment position="start">{startAdornment}</InputAdornment>
            ) : undefined,
          }}
          sx={{ minWidth: 150 }}
        />
        <IconButton size="small" color="success" onClick={handleSave}>
          <Check fontSize="small" />
        </IconButton>
        <IconButton size="small" color="error" onClick={handleCancel}>
          <Close fontSize="small" />
        </IconButton>
      </Stack>
    );
  }

  const displayValue = format ? format(value) : value;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 0.5,
        borderRadius: 1,
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      <Typography {...typographyProps} sx={{ ...typographyProps?.sx, flexGrow: 1 }}>
        {displayValue}
      </Typography>
      <Button
        size="small"
        startIcon={<Edit />}
        onClick={() => setIsEditing(true)}
        variant="outlined"
        sx={{ ml: 2, minWidth: 'auto' }}
      >
        Editar
      </Button>
    </Box>
  );
}
