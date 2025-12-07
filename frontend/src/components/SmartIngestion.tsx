import { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Chip,
  Stack,
  Fade,
  LinearProgress,
} from '@mui/material';
import {
  CloudUpload,
  Description,
  Image,
  CheckCircle,
  AutoAwesome,
  Delete,
  Save,
  Refresh,
  CameraAlt,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { ingestionService, transactionService } from '../services/api';
import { showErrorWithRetry, showSuccess } from '../utils/notifications';
import TransactionItemsEditor from './TransactionItemsEditor';
import EditableField from './EditableField';

interface ExtractedItem {
  description: string;
  quantity: number;
  unitPrice?: number;
  totalPrice: number;
}

interface ExtractionResult {
  merchant: string | null;
  date: string | null;
  amount: number;
  category?: string | null;
  items?: ExtractedItem[] | null;
  confidence: number;
  extractionMethod: 'regex' | 'ai';
}

export default function SmartIngestion() {
  const { dashboardId } = useParams<{ dashboardId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [editableItems, setEditableItems] = useState<ExtractedItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setResult(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const data = await ingestionService.upload(file);
      setResult(data);
      // Initialize editable items from extraction result
      setEditableItems(data.items?.map((item: ExtractedItem) => ({
        description: item.description,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })) || []);
      showSuccess('Documento processado com sucesso!');
    } catch (error: any) {
      // Usa showErrorWithRetry que humaniza automaticamente e oferece retry
      showErrorWithRetry(error, handleUpload);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTransaction = async () => {
    if (!result || !dashboardId) return;

    setSaving(true);
    try {
      const transactionData = {
        description: result.merchant || 'Despesa não identificada',
        amount: result.amount,
        date: result.date || new Date().toISOString(),
        entryType: 'Despesa' as const,
        flowType: 'Variável' as const,
        category: result.category || 'Outros',
        installmentTotal: 1,
        installmentNumber: 1,
        installmentStatus: 'Paga' as const,
        isTemporary: false,
        dashboardId,
        items: editableItems.length > 0 ? editableItems.map(item => ({
          description: item.description,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })) : undefined,
      };
      await transactionService.create(transactionData);
      showSuccess(`Transação salva com sucesso!${editableItems.length ? ` (${editableItems.length} itens)` : ''}`);
      navigate(`/dashboard/${dashboardId}`);
    } catch (error: any) {
      // Usa showErrorWithRetry que humaniza automaticamente e oferece retry
      showErrorWithRetry(error, handleSaveTransaction);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setResult(null);
    setEditableItems([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Data não identificada';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleUpdateResult = (field: keyof ExtractionResult, value: any) => {
    if (!result) return;
    setResult({
      ...result,
      [field]: value,
    });
  };

  return (
    <Card elevation={3}>
      <CardHeader
        avatar={<AutoAwesome color="primary" sx={{ fontSize: 32 }} />}
        title="Ingestão Inteligente de Documentos"
        subheader="Envie PDFs ou imagens de notas fiscais e boletos para extração automática"
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
      />
      <CardContent>
        {!result && (
          <Fade in timeout={300}>
            <Box
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: '3px dashed',
                borderColor: dragActive ? 'primary.main' : 'divider',
                borderRadius: 3,
                p: 6,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: dragActive ? 'action.hover' : 'background.paper',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: 'action.hover',
                  borderColor: 'primary.light',
                },
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
              />
              {file ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    {file.type === 'application/pdf' ? (
                      <Description sx={{ fontSize: 48, color: 'error.main' }} />
                    ) : (
                      <Image sx={{ fontSize: 48, color: 'primary.main' }} />
                    )}
                    <Box textAlign="left">
                      <Typography variant="h6" fontWeight="600">{file.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                  </Box>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpload();
                      }}
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={18} /> : <CloudUpload />}
                      sx={{ px: 4, py: 1.5, fontWeight: 600 }}
                    >
                      {loading ? 'Analisando...' : 'Analisar Documento'}
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClear();
                      }}
                      disabled={loading}
                      startIcon={<Delete />}
                      sx={{ px: 3, py: 1.5 }}
                    >
                      Remover
                    </Button>
                  </Stack>
                  {loading && (
                    <Box sx={{ width: '100%', mt: 2 }}>
                      <LinearProgress />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                        Analisando documento com IA...
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <CloudUpload sx={{ fontSize: 72, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h5" color="text.primary" fontWeight="600">
                    {dragActive ? 'Solte o arquivo aqui' : 'Arraste um documento aqui'}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    ou clique para selecionar do seu computador
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                    <Chip icon={<Description />} label="PDF" variant="outlined" />
                    <Chip icon={<CameraAlt />} label="JPG/PNG" variant="outlined" />
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Tamanho máximo: 10 MB
                  </Typography>
                </Box>
              )}
            </Box>
          </Fade>
        )}

        {result && (
          <Fade in timeout={500}>
            <Box sx={{ mt: 2 }}>
              <Alert 
                severity="success" 
                icon={<CheckCircle fontSize="inherit" />}
                sx={{ mb: 3, fontWeight: 500 }}
              >
                ✨ Dados extraídos com sucesso! Revise as informações abaixo antes de salvar.
              </Alert>

              <Paper variant="outlined" sx={{ p: 4, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                  <Box>
                    <Typography variant="overline" color="text.secondary" fontWeight="600">
                      Estabelecimento
                    </Typography>
                    <EditableField
                      value={result.merchant || 'Estabelecimento não identificado'}
                      onSave={(val) => handleUpdateResult('merchant', val)}
                      typographyProps={{ variant: 'h4', fontWeight: 'bold' }}
                    />
                  </Box>
                  <Chip 
                    label={result.extractionMethod === 'ai' ? '🤖 IA Generativa' : '⚡ Regex Local'} 
                    color={result.extractionMethod === 'ai' ? 'secondary' : 'primary'}
                    size="medium"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} sx={{ mb: 4 }}>
                  <Box flex={1}>
                    <Typography variant="overline" color="text.secondary" fontWeight="600">
                      📅 Data
                    </Typography>
                    <EditableField
                      value={result.date ? result.date.split('T')[0] : ''}
                      onSave={(val) => handleUpdateResult('date', new Date(val).toISOString())}
                      type="date"
                      format={(val) => formatDate(val)}
                      typographyProps={{ variant: 'h6', fontWeight: 'medium' }}
                    />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="overline" color="text.secondary" fontWeight="600">
                      💰 Valor Total
                    </Typography>
                    <EditableField
                      value={result.amount}
                      onSave={(val) => handleUpdateResult('amount', parseFloat(val))}
                      type="number"
                      format={(val) => formatCurrency(val)}
                      typographyProps={{ variant: 'h5', color: 'primary.main', fontWeight: 'bold' }}
                    />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="overline" color="text.secondary" fontWeight="600">
                      🎯 Confiança
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress 
                        variant="determinate" 
                        value={result.confidence * 100} 
                        size={28} 
                        thickness={5}
                        color={result.confidence > 0.8 ? 'success' : 'warning'}
                      />
                      <Typography variant="h6" fontWeight="medium">
                        {Math.round(result.confidence * 100)}%
                      </Typography>
                    </Box>
                  </Box>
                </Stack>

                {result.category && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="overline" color="text.secondary" fontWeight="600">
                      🏷️ Categoria Sugerida
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip label={result.category} color="info" variant="filled" />
                    </Box>
                  </Box>
                )}

                {editableItems.length > 0 && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <TransactionItemsEditor
                      items={editableItems}
                      onChange={setEditableItems}
                      defaultExpanded
                    />
                  </>
                )}

                <Divider sx={{ my: 4 }} />

                <Stack direction="row" spacing={2} justifyContent="center">
                  <Button
                    variant="contained"
                    size="large"
                    color="primary"
                    startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                    onClick={handleSaveTransaction}
                    disabled={saving}
                    sx={{ 
                      px: 5, 
                      py: 1.5, 
                      fontWeight: 600,
                      fontSize: '1rem',
                      boxShadow: 4,
                      '&:hover': {
                        boxShadow: 6,
                      }
                    }}
                  >
                    {saving ? 'Salvando...' : 'Salvar como Transação'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<Refresh />}
                    onClick={handleClear}
                    disabled={saving}
                    sx={{ px: 4, py: 1.5, fontWeight: 600 }}
                  >
                    Novo Documento
                  </Button>
                </Stack>
              </Paper>
            </Box>
          </Fade>
        )}
      </CardContent>
    </Card>
  );
}
