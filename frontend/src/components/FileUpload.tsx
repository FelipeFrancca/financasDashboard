import { Card, CardHeader, CardContent, Button, Typography, Box } from '@mui/material';
import CloudUpload from '@mui/icons-material/CloudUpload';
import FileDownload from '@mui/icons-material/FileDownload';
import { useRef } from 'react';
import Papa from 'papaparse';
import type { Transaction } from '../types';
import { showErrorWithRetry } from '../utils/notifications';

interface FileUploadProps {
  onImport: (transactions: Partial<Transaction>[]) => void;
}

export default function FileUpload({ onImport }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const processFile = () => {
      Papa.parse(file, {
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
            })).filter((t: any) => t.date && t.entryType && t.description);

            onImport(transactions);
          } catch (error) {
            showErrorWithRetry(error, processFile, { title: 'Erro', text: 'Não foi possível processar o arquivo CSV.' });
          }
        },
      });
    };

    processFile();

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const parseDate = (dateStr: string): string => {
    if (!dateStr) return new Date().toISOString();
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader
        avatar={<CloudUpload />}
        title="Importar Planilha"
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
      />
      <CardContent>
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={() => fileInputRef.current?.click()}
            fullWidth
          >
            Selecionar Arquivo CSV
          </Button>
          <Typography variant="caption" color="text.secondary" display="block" mt={2}>
            Use o modelo fornecido para melhor compatibilidade
          </Typography>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            href="/assets/template_financas.csv"
            download
            fullWidth
            sx={{ mt: 2 }}
          >
            Baixar Modelo
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
