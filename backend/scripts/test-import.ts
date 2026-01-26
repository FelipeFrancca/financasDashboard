/**
 * Script para testar importação de arquivo XLSX
 */
import * as fs from 'fs';
import * as path from 'path';
import ExcelJS from 'exceljs';
import { parseXLSXFile } from '../src/services/spreadsheetImportService';

// Debug function to show detected columns
async function debugColumns(filePath: string) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    console.log('='.repeat(60));
    console.log('DEBUG: DETECÇÃO DE COLUNAS POR ABA');
    console.log('='.repeat(60));
    
    const monthTabs = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    
    for (const ws of workbook.worksheets) {
        const tabName = ws.name.toUpperCase();
        if (!monthTabs.includes(tabName) && !tabName.includes('FEV') && !tabName.includes('MAR') && !tabName.includes('ABR')) {
            continue;
        }
        
        console.log(`\nAba: ${ws.name}`);
        console.log('Headers na Linha 2:');
        
        const row2 = ws.getRow(2);
        for (let col = 1; col <= 15; col++) {
            const cell = row2.getCell(col);
            let value = '';
            if (cell.value !== null && cell.value !== undefined) {
                if (typeof cell.value === 'object') {
                    if ('result' in cell.value) value = String(cell.value.result ?? '');
                    else if ('text' in cell.value) value = String(cell.value.text ?? '');
                    else value = String(cell.value);
                } else {
                    value = String(cell.value);
                }
            }
            if (value) {
                console.log(`  Col ${col}: "${value}"`);
            }
        }
        
        // Show sample data from row 3
        console.log('Dados na Linha 3:');
        const row3 = ws.getRow(3);
        for (let col = 1; col <= 15; col++) {
            const cell = row3.getCell(col);
            let value = '';
            if (cell.value !== null && cell.value !== undefined) {
                if (typeof cell.value === 'object') {
                    if ('result' in cell.value) value = String(cell.value.result ?? '');
                    else if ('text' in cell.value) value = String(cell.value.text ?? '');
                    else if (cell.value instanceof Date) value = cell.value.toISOString();
                    else value = JSON.stringify(cell.value);
                } else {
                    value = String(cell.value);
                }
            }
            if (value) {
                console.log(`  Col ${col}: "${value.substring(0, 50)}"`);
            }
        }
    }
}

async function main() {
    const filePath = path.join(__dirname, '../modelosDeArquivos/Financeiro.xlsx');
    
    console.log('='.repeat(60));
    console.log('TESTE DE IMPORTAÇÃO DE XLSX');
    console.log('='.repeat(60));
    console.log(`Arquivo: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
        console.error('ERRO: Arquivo não encontrado!');
        process.exit(1);
    }
    
    const fileBuffer = fs.readFileSync(filePath);
    console.log(`Tamanho: ${(fileBuffer.length / 1024).toFixed(2)} KB`);
    console.log('');
    
    // Debug columns first
    await debugColumns(filePath);
    
    try {
        console.log('');
        console.log('Parseando arquivo...');
        const preview = await parseXLSXFile(fileBuffer);
        
        console.log('');
        console.log('='.repeat(60));
        console.log('RESUMO DA IMPORTAÇÃO');
        console.log('='.repeat(60));
        console.log(`Total de Transações: ${preview.summary.totalTransactions}`);
        console.log(`Total Receitas: R$ ${preview.summary.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`Total Despesas: R$ ${preview.summary.totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`Parcelamentos: ${preview.summary.installmentsCount}`);
        console.log(`Devedores: ${preview.summary.debtorsCount}`);
        console.log(`Recorrentes: ${preview.summary.recurringCount}`);
        
        console.log('');
        console.log('='.repeat(60));
        console.log('TRANSAÇÕES POR MÊS');
        console.log('='.repeat(60));
        for (const [month, data] of Object.entries(preview.summary.byMonth)) {
            console.log(`${month}: ${data.count} transações | Receitas: R$ ${data.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Despesas: R$ ${data.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        }
        
        console.log('');
        console.log('='.repeat(60));
        console.log('ERROS DE PARSING');
        console.log('='.repeat(60));
        if (preview.errors.length === 0) {
            console.log('Nenhum erro encontrado!');
        } else {
            preview.errors.forEach((err, i) => {
                console.log(`${i + 1}. [${err.tab}:${err.row}] ${err.message}`);
            });
        }
        
        console.log('');
        console.log('='.repeat(60));
        console.log('PRIMEIRAS 10 TRANSAÇÕES');
        console.log('='.repeat(60));
        preview.transactions.slice(0, 10).forEach((t, i) => {
            const flowInfo = t.flowType ? ` (${t.flowType})` : '';
            console.log(`${i + 1}. [${t.sourceTab}] ${t.date.toLocaleDateString('pt-BR')} | ${t.entryType}${flowInfo} | ${t.category} | ${t.description} | R$ ${t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        });
        
        if (preview.transactions.length > 10) {
            console.log(`... e mais ${preview.transactions.length - 10} transações`);
        }
        
        console.log('');
        console.log('✅ Teste concluído com sucesso!');
        
    } catch (error: any) {
        console.error('');
        console.error('❌ ERRO:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

main();
