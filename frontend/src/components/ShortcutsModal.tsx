import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, Box, Typography, Chip } from '@mui/material';

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const shortcuts = [
  { key: 'G', label: 'Filtros', description: 'Abrir painel de filtros' },
  { key: 'N', label: 'Novo', description: 'Nova transação' },
  { key: 'E', label: 'Exportar', description: 'Exportar dados em CSV' },
  { key: 'T', label: 'Tema', description: 'Alternar tema claro/escuro' },
  { key: '?', label: 'Ajuda', description: 'Abrir esta janela' },
];

export default function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Atalhos do Dashboard</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          {shortcuts.map((shortcut) => (
            <Grid item xs={12} key={shortcut.key}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                <Chip label={shortcut.key} sx={{ fontWeight: 700, fontFamily: 'monospace', minWidth: 40 }} />
                <Box>
                  <Typography variant="body1" fontWeight={600}>{shortcut.label}</Typography>
                  <Typography variant="caption" color="text.secondary">{shortcut.description}</Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}
