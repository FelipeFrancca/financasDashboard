import { useEffect, useState } from 'react';
import { Box, Container, Typography, Button, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, TextField, DialogActions, IconButton } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/api';
import ShareDialog from '../components/ShareDialog';

export default function DashboardListPage() {
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState<any>(null);
  const navigate = useNavigate();

  const load = async () => {
    const data = await dashboardService.list();
    setDashboards(data);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    await dashboardService.create(title, description);
    setOpen(false);
    load();
  };

  const handleShare = (dashboard: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDashboard(dashboard);
    setShareDialogOpen(true);
  };

  return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
        <Typography variant="h5">Meus Dashboards</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>Novo Dashboard</Button>
      </Box>

      <List>
        {dashboards.map((d) => (
          <ListItem
            key={d.id}
            button
            onClick={() => navigate(`/`)}
            secondaryAction={
              <IconButton edge="end" onClick={(e) => handleShare(d, e)}>
                <ShareIcon />
              </IconButton>
            }
          >
            <ListItemText primary={d.title} secondary={d.description} />
          </ListItem>
        ))}
      </List>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Novo Dashboard</DialogTitle>
        <DialogContent>
          <TextField label="Título" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} sx={{ mt: 1 }} />
          <TextField label="Descrição" fullWidth value={description} onChange={(e) => setDescription(e.target.value)} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreate}>Criar</Button>
        </DialogActions>
      </Dialog>

      {selectedDashboard && (
        <ShareDialog
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          dashboardId={selectedDashboard.id}
          dashboardTitle={selectedDashboard.title}
        />
      )}
    </Container>
  );
}
