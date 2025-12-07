import { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Stack,
  IconButton,
  Collapse,
  Fade,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  alpha,
  useMediaQuery,
} from '@mui/material';
import {
  CloudUpload,
  Image,
  CheckCircle,
  AutoAwesome,
  ExpandMore,
  ExpandLess,
  Delete,
  Save,
  Refresh,
  CameraAlt,
  TableChart,
  PictureAsPdf,
  FileDownload,
  Close,
  Add,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import Papa from 'papaparse';
import { ingestionService, transactionService } from '../services/api';
import { showError, showErrorWithRetry, showSuccess, showWarning, showConfirm } from '../utils/notifications';
import { useCategories, useCreateCategory } from '../hooks/api/useCategories';
import type { Transaction, Category } from '../types';
import { hoverLift } from '../utils/animations';

interface ExtractedItem {
  description: string;
  quantity?: number;
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

interface UnifiedImportProps {
  onImportCSV: (transactions: Partial<Transaction>[]) => void;
  onSaveAITransaction?: (data: Partial<Transaction>) => void;
  compact?: boolean;
}

type ImportMode = 'csv' | 'ai';

export default function UnifiedImport({ onImportCSV, onSaveAITransaction }: UnifiedImportProps) {
  const { dashboardId } = useParams<{ dashboardId: string }>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [mode, setMode] = useState<ImportMode>('csv');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [showItems, setShowItems] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [csvPreview, setCsvPreview] = useState<Partial<Transaction>[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect file type and set mode automatically
  const detectFileType = (file: File): ImportMode => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'csv') return 'csv';
    return 'ai';
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile: File) => {
    const detectedMode = detectFileType(selectedFile);
    setMode(detectedMode);
    setFile(selectedFile);
    setResult(null);
    setCsvPreview(null);

    // Auto-process CSV files
    if (detectedMode === 'csv') {
      processCSV(selectedFile);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const parseDate = (dateStr: string): string => {
    if (!dateStr) return new Date().toISOString();
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month?.padStart(2, '0')}-${day?.padStart(2, '0')}`;
  };

  const processCSV = (csvFile: File) => {
    setLoading(true);
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      delimiter: ';',
      complete: (results) => {
        try {
          const transactions = results.data.map((row: any) => ({
            date: parseDate(row.Data),
            entryType: row.Tipo,
            flowType: row.Fluxo || 'Variável',
            category: row.Categoria || 'Outros',
            subcategory: row.Subcategoria,
            description: row.Descricao || row.Descrição,
            amount: parseFloat(row.Valor?.replace(',', '.')) || 0,
            paymentMethod: row.MetodoPag || row.Pagamento,
            institution: row.Fonte || row.Banco,
            cardBrand: row.Bandeira || row.Cartao,
            installmentTotal: parseInt(row.ParcelasTotal, 10) || 0,
            installmentNumber: parseInt(row.ParcelaAtual, 10) || 0,
            installmentStatus: row.StatusParcela || 'N/A',
            notes: row.Observacao,
            isTemporary: false,
            dashboardId,
          })).filter((t: any) => t.date && t.entryType && t.description);

          setCsvPreview(transactions);
          setLoading(false);
        } catch (error) {
          showError(error, { title: 'Erro', text: 'Não foi possível processar o arquivo CSV.' });
          setLoading(false);
        }
      },
      error: () => {
        showError('Erro ao ler arquivo', { title: 'Erro' });
        setLoading(false);
      }
    });
  };

  const { data: categories } = useCategories(dashboardId!);
  const createCategory = useCreateCategory();

  const handleUploadAI = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const categoryNames = categories?.map((c: Category) => c.name) || [];
      const data = await ingestionService.upload(file, categoryNames);
      setResult(data);
      showSuccess('Documento processado com sucesso!');
    } catch (error: any) {
      showErrorWithRetry(error, handleUploadAI);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAITransaction = async () => {
    if (!result || !dashboardId) return;

    setSaving(true);
    try {
      let finalCategory = result.category || 'Outros';
      
      // Verifica se a categoria existe
      const categoryExists = categories?.some((c: Category) => c.name.toLowerCase() === finalCategory.toLowerCase());
      
      // Se não existe e não é "Outros", pergunta se quer criar
      if (finalCategory !== 'Outros' && !categoryExists) {
        const confirmed = await showConfirm(
          `A IA sugeriu a categoria "${finalCategory}", que ainda não existe. Deseja criá-la agora?`,
          {
            title: 'Nova Categoria',
            confirmButtonText: 'Sim, criar',
            cancelButtonText: 'Não, usar "Outros"',
            icon: 'question'
          }
        );

        if (confirmed.isConfirmed) {
          try {
            await createCategory.mutateAsync({
              data: { name: finalCategory, type: 'Despesa' },
              dashboardId
            });
            showSuccess(`Categoria "${finalCategory}" criada!`, { timer: 1500 });
          } catch (err) {
            console.error('Erro ao criar categoria:', err);
            showWarning('Não foi possível criar a categoria. Usando "Outros".');
            finalCategory = 'Outros';
          }
        } else {
          finalCategory = 'Outros';
        }
      }

      const transactionData = {
        description: result.merchant || 'Despesa não identificada',
        amount: result.amount,
        date: result.date || new Date().toISOString(),
        entryType: 'Despesa' as const,
        flowType: 'Variável' as const,
        category: finalCategory,
        installmentTotal: 1,
        installmentNumber: 1,
        installmentStatus: 'Paga' as const,
        isTemporary: false,
        dashboardId,
        items: result.items?.map(item => ({
          ...item,
          quantity: item.quantity || 1
        })) || undefined,
      };
      
      if (onSaveAITransaction) {
        onSaveAITransaction(transactionData);
      } else {
        await transactionService.create(transactionData);
      }
      
      showSuccess('Transação salva com sucesso!');
      handleClear();
    } catch (error) {
      showError(error, { title: 'Erro', text: 'Não foi possível salvar a transação.' });
    } finally {
      setSaving(false);
    }
  };

  const handleImportCSV = () => {
    if (!csvPreview || csvPreview.length === 0) {
      showWarning('Nenhuma transação válida encontrada.', { title: 'Atenção' });
      return;
    }
    onImportCSV(csvPreview);
    handleClear();
  };

  const handleClear = () => {
    setFile(null);
    setResult(null);
    setCsvPreview(null);
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



  return (
    <Card 
      elevation={4}
      sx={{ 
        borderRadius: 3,
        overflow: 'hidden',
        background: theme.palette.mode === 'dark' 
          ? `linear-gradient(145deg, ${alpha(theme.palette.primary.dark, 0.15)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`
          : theme.palette.background.paper,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        ...hoverLift,
      }}
    >
      {/* Header with Mode Toggle */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          p: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CloudUpload sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                Importar Dados
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {mode === 'csv' ? 'Planilha CSV com transações' : 'Notas fiscais e boletos via IA'}
              </Typography>
            </Box>
          </Box>

          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, newMode) => newMode && setMode(newMode)}
            size={isMobile ? 'small' : 'medium'}
            sx={{
              '& .MuiToggleButton-root': {
                px: { xs: 1.5, sm: 2.5 },
                py: 1,
                borderRadius: '12px !important',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                fontWeight: 600,
                textTransform: 'none',
                gap: 1,
                '&.Mui-selected': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  color: 'white',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                  }
                }
              }
            }}
          >
            <ToggleButton value="csv">
              <TableChart fontSize="small" />
              {!isMobile && 'Planilha'}
            </ToggleButton>
            <ToggleButton value="ai">
              <AutoAwesome fontSize="small" />
              {!isMobile && 'IA'}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Drop Zone - Show when no file selected or no result */}
        {!result && !csvPreview && (
          <Fade in timeout={300}>
            <Box
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: '3px dashed',
                borderColor: dragActive ? 'primary.main' : alpha(theme.palette.primary.main, 0.3),
                borderRadius: 3,
                p: { xs: 3, sm: 5 },
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: dragActive 
                  ? alpha(theme.palette.primary.main, 0.08)
                  : alpha(theme.palette.background.default, 0.5),
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  borderColor: 'primary.main',
                  transform: 'scale(1.01)',
                  '& .upload-icon': {
                    transform: 'translateY(-5px)',
                  }
                },
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={mode === 'csv' ? '.csv' : '.pdf,.jpg,.jpeg,.png'}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />

              {file && loading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <Box sx={{ position: 'relative' }}>
                    {file.type === 'application/pdf' ? (
                      <PictureAsPdf sx={{ fontSize: 64, color: 'error.main' }} />
                    ) : file.name.endsWith('.csv') ? (
                      <TableChart sx={{ fontSize: 64, color: 'success.main' }} />
                    ) : (
                      <Image sx={{ fontSize: 64, color: 'primary.main' }} />
                    )}
                  </Box>
                  <Typography variant="h6" fontWeight={600}>{file.name}</Typography>
                  <Box sx={{ width: '100%', maxWidth: 300 }}>
                    <LinearProgress 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                      }} 
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {mode === 'csv' ? 'Processando planilha...' : 'Analisando documento com IA...'}
                  </Typography>
                </Box>
              ) : file && mode === 'ai' && !result ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <Box sx={{ position: 'relative' }}>
                    {file.type === 'application/pdf' ? (
                      <PictureAsPdf sx={{ fontSize: 72, color: 'error.main' }} />
                    ) : (
                      <Image sx={{ fontSize: 72, color: 'primary.main' }} />
                    )}
                    <Chip 
                      size="small"
                      label={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                      sx={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)' }}
                    />
                  </Box>
                  <Typography variant="h6" fontWeight={600}>{file.name}</Typography>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUploadAI();
                      }}
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <AutoAwesome />}
                      sx={{ 
                        px: 4,
                        py: 1.5,
                        fontWeight: 600,
                        borderRadius: 3,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        '&:hover': {
                          background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`,
                        }
                      }}
                    >
                      Extrair com IA
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClear();
                      }}
                      startIcon={<Delete />}
                      sx={{ borderRadius: 3 }}
                    >
                      Remover
                    </Button>
                  </Stack>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <Box
                    className="upload-icon"
                    sx={{
                      p: 2.5,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                      transition: 'transform 0.3s ease',
                      mb: 1,
                    }}
                  >
                    <CloudUpload 
                      sx={{ 
                        fontSize: 56, 
                        color: 'primary.main',
                      }} 
                    />
                  </Box>
                  <Typography 
                    variant="h5" 
                    fontWeight={700}
                    sx={{
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {dragActive ? 'Solte o arquivo aqui' : 'Arraste um arquivo'}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    ou clique para selecionar do seu computador
                  </Typography>
                  <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
                    {mode === 'csv' ? (
                      <Chip 
                        icon={<TableChart />} 
                        label="CSV" 
                        variant="outlined"
                        color="success"
                        sx={{ fontWeight: 600 }}
                      />
                    ) : (
                      <>
                        <Chip 
                          icon={<PictureAsPdf />} 
                          label="PDF" 
                          variant="outlined"
                          color="error"
                          sx={{ fontWeight: 600 }}
                        />
                        <Chip 
                          icon={<CameraAlt />} 
                          label="JPG/PNG" 
                          variant="outlined"
                          color="primary"
                          sx={{ fontWeight: 600 }}
                        />
                      </>
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Tamanho máximo: 10 MB
                  </Typography>
                </Box>
              )}
            </Box>
          </Fade>
        )}

        {/* CSV Preview */}
        {csvPreview && csvPreview.length > 0 && (
          <Fade in timeout={500}>
            <Box>
              <Alert 
                severity="success" 
                icon={<CheckCircle fontSize="inherit" />}
                sx={{ mb: 3, fontWeight: 500, borderRadius: 2 }}
                action={
                  <IconButton size="small" onClick={handleClear}>
                    <Close fontSize="small" />
                  </IconButton>
                }
              >
                ✨ {csvPreview.length} transações encontradas! Revise e importe.
              </Alert>

              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  maxHeight: 300, 
                  overflow: 'auto',
                  mb: 3,
                }}
              >
                <List dense disablePadding>
                  {csvPreview.slice(0, 10).map((t, index) => (
                    <ListItem 
                      key={index}
                      divider={index < Math.min(csvPreview.length, 10) - 1}
                      sx={{ py: 1.5 }}
                    >
                      <ListItemText
                        primary={t.description}
                        secondary={`${t.entryType} • ${t.category}`}
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                      <Chip 
                        label={formatCurrency(t.amount || 0)}
                        size="small"
                        color={t.entryType === 'Receita' ? 'success' : 'error'}
                        sx={{ fontWeight: 600 }}
                      />
                    </ListItem>
                  ))}
                  {csvPreview.length > 10 && (
                    <ListItem>
                      <ListItemText
                        primary={`... e mais ${csvPreview.length - 10} transações`}
                        primaryTypographyProps={{ color: 'text.secondary', fontStyle: 'italic' }}
                      />
                    </ListItem>
                  )}
                </List>
              </Paper>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Add />}
                  onClick={handleImportCSV}
                  sx={{ 
                    px: 4,
                    py: 1.5,
                    fontWeight: 600,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                  }}
                >
                  Importar {csvPreview.length} Transações
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Refresh />}
                  onClick={handleClear}
                  sx={{ borderRadius: 3 }}
                >
                  Novo Arquivo
                </Button>
              </Stack>
            </Box>
          </Fade>
        )}

        {/* AI Extraction Result */}
        {result && (
          <Fade in timeout={500}>
            <Box>
              <Alert 
                severity="success" 
                icon={<CheckCircle fontSize="inherit" />}
                sx={{ mb: 3, fontWeight: 500, borderRadius: 2 }}
              >
                ✨ Dados extraídos! Revise as informações antes de salvar.
              </Alert>

              <Paper variant="outlined" sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="overline" color="text.secondary" fontWeight={600}>
                      Estabelecimento
                    </Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {result.merchant || 'Não identificado'}
                    </Typography>
                  </Box>
                  <Chip 
                    label={result.extractionMethod === 'ai' ? '🤖 IA Generativa' : '⚡ Regex'} 
                    color={result.extractionMethod === 'ai' ? 'secondary' : 'primary'}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 3 }}>
                  <Box flex={1}>
                    <Typography variant="overline" color="text.secondary" fontWeight={600}>
                      📅 Data
                    </Typography>
                    <Typography variant="h6" fontWeight={500}>
                      {formatDate(result.date)}
                    </Typography>
                  </Box>
                  <Box flex={1}>
                    <Typography variant="overline" color="text.secondary" fontWeight={600}>
                      💰 Valor
                    </Typography>
                    <Typography 
                      variant="h5" 
                      fontWeight={700}
                      sx={{
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {formatCurrency(result.amount)}
                    </Typography>
                  </Box>
                  <Box flex={1}>
                    <Typography variant="overline" color="text.secondary" fontWeight={600}>
                      🎯 Confiança
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress 
                        variant="determinate" 
                        value={result.confidence * 100} 
                        size={32} 
                        thickness={5}
                        color={result.confidence > 0.8 ? 'success' : 'warning'}
                      />
                      <Typography variant="h6" fontWeight={600}>
                        {Math.round(result.confidence * 100)}%
                      </Typography>
                    </Box>
                  </Box>
                </Stack>

                {result.category && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="overline" color="text.secondary" fontWeight={600}>
                      🏷️ Categoria
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip label={result.category} color="info" />
                    </Box>
                  </Box>
                )}

                {result.items && result.items.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box 
                      sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mb: 1 }}
                      onClick={() => setShowItems(!showItems)}
                    >
                      <Typography variant="subtitle1" fontWeight={600} sx={{ flexGrow: 1 }}>
                        📋 Itens ({result.items.length})
                      </Typography>
                      <IconButton size="small">
                        {showItems ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </Box>
                    <Collapse in={showItems}>
                      <List dense disablePadding>
                        {result.items.map((item, index) => (
                          <ListItem key={index} divider sx={{ py: 1 }}>
                            <ListItemText
                              primary={item.description}
                              secondary={item.quantity ? `${item.quantity}x` : null}
                            />
                            <Typography fontWeight={600}>
                              {formatCurrency(item.totalPrice)}
                            </Typography>
                          </ListItem>
                        ))}
                      </List>
                    </Collapse>
                  </>
                )}

                <Divider sx={{ my: 3 }} />

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                    onClick={handleSaveAITransaction}
                    disabled={saving}
                    sx={{ 
                      px: 4,
                      py: 1.5,
                      fontWeight: 600,
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    }}
                  >
                    {saving ? 'Salvando...' : 'Salvar Transação'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<Refresh />}
                    onClick={handleClear}
                    disabled={saving}
                    sx={{ borderRadius: 3 }}
                  >
                    Novo Documento
                  </Button>
                </Stack>
              </Paper>
            </Box>
          </Fade>
        )}

        {/* Download Template - Only for CSV mode */}
        {mode === 'csv' && !csvPreview && !file && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="text"
              startIcon={<FileDownload />}
              href="/assets/template_financas.csv"
              download
              sx={{ fontWeight: 500 }}
            >
              Baixar Modelo CSV
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
