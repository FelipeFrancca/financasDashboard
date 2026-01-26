/**
 * Script simples para debugar detecção de colunas
 */
import ExcelJS from 'exceljs';
import * as path from 'path';

function getCellValue(cell: ExcelJS.Cell | undefined): string {
    if (!cell || cell.value === null || cell.value === undefined) return '';
    
    if (typeof cell.value === 'object') {
        if ('result' in cell.value) return String(cell.value.result ?? '');
        if ('text' in cell.value) return String(cell.value.text ?? '');
        if ('richText' in cell.value) {
            return (cell.value.richText as Array<{ text: string }>).map(rt => rt.text).join('');
        }
    }
    
    return String(cell.value);
}

interface MonthlyTabColumns {
    dateCol?: number;
    costCenterCol?: number;
    importantCol?: number;
    categoryCol?: number;
    descriptionCol?: number;
    paymentMethodCol?: number;
    valueCol?: number;
    receitaDateCol?: number;
    receitaDescCol?: number;
    receitaValueCol?: number;
}

function detectMonthlyColumns(worksheet: ExcelJS.Worksheet): MonthlyTabColumns {
    const columns: MonthlyTabColumns = {};
    
    console.log(`  Scanning worksheet: ${worksheet.name}`);
    
    // Scan first 5 rows for headers - check all columns up to 20
    for (let rowNum = 1; rowNum <= 5; rowNum++) {
        const row = worksheet.getRow(rowNum);
        
        for (let colNumber = 1; colNumber <= 20; colNumber++) {
            const cell = row.getCell(colNumber);
            const value = getCellValue(cell).toLowerCase().trim();
            
            // Skip empty cells
            if (!value) continue;
            
            // Log all non-empty cells in first 3 rows
            if (rowNum <= 3 && value) {
                console.log(`    Row ${rowNum}, Col ${colNumber}: "${value}"`);
            }
            
            // Despesas columns (usually on the left side, col 5-11)
            if (value === 'data' && !columns.dateCol) {
                columns.dateCol = colNumber;
                console.log(`    -> Found dateCol at col ${colNumber}`);
            }
            if ((value.includes('centro') && value.includes('custo')) || value === 'centro d custo') {
                if (!columns.costCenterCol) {
                    columns.costCenterCol = colNumber;
                    console.log(`    -> Found costCenterCol at col ${colNumber}`);
                }
            }
            if (value === 'importantes' || value === 'importancia') {
                columns.importantCol = colNumber;
                console.log(`    -> Found importantCol at col ${colNumber}`);
            }
            if (value === 'categoria' && !columns.categoryCol) {
                columns.categoryCol = colNumber;
                console.log(`    -> Found categoryCol at col ${colNumber}`);
            }
            if ((value === 'descrição' || value === 'descricao' || value === 'descriçao') && !columns.descriptionCol) {
                columns.descriptionCol = colNumber;
                console.log(`    -> Found descriptionCol at col ${colNumber}`);
            }
            if ((value === 'meio pg' || value === 'meio' || value === 'pagamento') && !columns.paymentMethodCol) {
                columns.paymentMethodCol = colNumber;
                console.log(`    -> Found paymentMethodCol at col ${colNumber}`);
            }
            if (value === 'valor' && !columns.valueCol) {
                columns.valueCol = colNumber;
                console.log(`    -> Found valueCol at col ${colNumber}`);
            }
            
            // Receitas section (usually starts around column 13)
            if (value === 'receitas') {
                console.log(`    -> Found 'receitas' header at row ${rowNum}, col ${colNumber}`);
                // Look for date, description and value columns in the next row
                const nextRow = worksheet.getRow(rowNum + 1);
                for (let c = colNumber; c <= colNumber + 5; c++) {
                    const headerVal = getCellValue(nextRow.getCell(c)).toLowerCase().trim();
                    console.log(`    -> Checking col ${c} for receita columns: "${headerVal}"`);
                    if (headerVal === 'data' && !columns.receitaDateCol) {
                        columns.receitaDateCol = c;
                        console.log(`    -> Found receitaDateCol at col ${c}`);
                    }
                    if ((headerVal === 'descrição' || headerVal === 'descricao' || headerVal === 'descriçao') && !columns.receitaDescCol) {
                        columns.receitaDescCol = c;
                        console.log(`    -> Found receitaDescCol at col ${c}`);
                    }
                    if (headerVal === 'valor' && !columns.receitaValueCol) {
                        columns.receitaValueCol = c;
                        console.log(`    -> Found receitaValueCol at col ${c}`);
                    }
                }
            }
        }
    }
    
    console.log(`  Final columns:`, JSON.stringify(columns, null, 2));
    return columns;
}

async function main() {
    const filePath = path.join(__dirname, '../modelosDeArquivos/Financeiro.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    console.log('Debug de detecção de colunas:');
    console.log('');
    
    const worksheet = workbook.getWorksheet('FEV');
    if (worksheet) {
        detectMonthlyColumns(worksheet);
    } else {
        console.log('Aba FEV não encontrada');
    }
}

main().catch(console.error);
