/**
 * Script para analisar a estrutura do arquivo XLSX
 */
import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const filePath = path.join(__dirname, '../modelosDeArquivos/Financeiro.xlsx');
    
    console.log('='.repeat(60));
    console.log('ANÁLISE DA ESTRUTURA DO XLSX');
    console.log('='.repeat(60));
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    console.log(`Total de Abas: ${workbook.worksheets.length}`);
    console.log('');
    
    for (const worksheet of workbook.worksheets) {
        console.log('='.repeat(60));
        console.log(`ABA: ${worksheet.name}`);
        console.log('='.repeat(60));
        console.log(`Linhas: ${worksheet.rowCount}`);
        console.log(`Colunas: ${worksheet.columnCount}`);
        console.log('');
        
        // Mostrar as primeiras 5 linhas
        console.log('Primeiras 5 linhas:');
        for (let rowNum = 1; rowNum <= Math.min(5, worksheet.rowCount); rowNum++) {
            const row = worksheet.getRow(rowNum);
            const cells: string[] = [];
            
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                if (colNumber <= 15) { // Limitar a 15 colunas
                    let value = '';
                    if (cell.value !== null && cell.value !== undefined) {
                        if (typeof cell.value === 'object') {
                            if ('result' in cell.value) value = String(cell.value.result ?? '');
                            else if ('text' in cell.value) value = String(cell.value.text ?? '');
                            else if ('richText' in cell.value) {
                                value = (cell.value.richText as Array<{ text: string }>).map(rt => rt.text).join('');
                            } else {
                                value = JSON.stringify(cell.value);
                            }
                        } else {
                            value = String(cell.value);
                        }
                    }
                    cells.push(value.substring(0, 20).padEnd(20));
                }
            });
            
            console.log(`  L${rowNum}: | ${cells.join(' | ')}`);
        }
        console.log('');
    }
}

main().catch(console.error);
