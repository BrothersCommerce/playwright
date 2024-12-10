import XLSX from 'xlsx-js-style';
import { ExcelRow } from './types';
import { updateExcelRows } from './updateExcelRows';
import { service } from '../services';

export const excelReportMulti = async ({ excelRows, testTarget, duplicatedRows, saleStatus }: { excelRows: ExcelRow[], testTarget: string, duplicatedRows: number, saleStatus?: "active" | "inactive" }) => {
    const updatedExcelRows = await updateExcelRows(excelRows);
    const worksheet = XLSX.utils.aoa_to_sheet([]);
    const multiHeaders: string[] = ["SKU", "SLP ROW" ];

    updatedExcelRows.map(r => {
        if (r.result.length) multiHeaders.push(`${r.label.toUpperCase()}`)
    });

    multiHeaders.push("MESSAGE");
    const combinedSheet: string[][] = [multiHeaders];

    updatedExcelRows.forEach((test, i) => {
        if (i === 0) {
            test.result.forEach(row => {
              const newExcelRow = Array.from(combinedSheet[0], (v, i) => {
                switch (v) {
                  case 'SKU':
                  case 'SLP ROW':
                    return row[i];
                  case 'PLP':
                      return row[2];
                  case 'MESSAGE':
                    return row[3] ? `${test.label}(${row[3]})` : "";
                  default:
                    return "";
                }
              });
              
                combinedSheet.push(newExcelRow);
            });
        } else {
            const columnIndex = combinedSheet[0].findIndex(item => item === `${test.label.toUpperCase()}`);
            const messageColumnIndex = combinedSheet[0].findIndex(item => item === "MESSAGE");
            test.result.forEach(row => {
                const rowIndex = combinedSheet.findIndex(excelRow => excelRow.includes(row[0]));
                combinedSheet[rowIndex][columnIndex] = row[2];
                if (row[3].length && combinedSheet[rowIndex][messageColumnIndex]?.length) {
                    combinedSheet[rowIndex][messageColumnIndex] += ` | ${test.label.toUpperCase()}(${row[3]})`;
                } else if (row[3].length) {
                    combinedSheet[rowIndex][messageColumnIndex] = `${test.label.toUpperCase()}(${row[3]})`
                }
            });
        }
    });

    if (duplicatedRows > 0) {
        const newExcelRow = Array.from(combinedSheet[0], (v, i) => {
            switch (v) {
              case 'MESSAGE':
                return `Duplicated rows removed before test run: ${duplicatedRows}`;
              default:
                return "";
            }
          });
        combinedSheet.push(newExcelRow);
    }

    const setCellWidth = () => {
        const cellWidthInformation: { wch: number }[] = [];

        const headers = combinedSheet[0];
        const genericResultRow = combinedSheet[1];

        headers.forEach((header, columnIndex) => {
            cellWidthInformation.push({ wch: header?.length > genericResultRow[columnIndex]?.length ? header?.length : genericResultRow[columnIndex]?.length });
        });

        return cellWidthInformation.map((w, i) => {
            if (i === cellWidthInformation.length - 1) return {...w, wch: 120 };
            else if (i !== 0) return { ...w, wch: w.wch * 2.5};
            return w;
        });
    };

    worksheet["!cols"] = setCellWidth();

    worksheet['!rows'] = [{ hpt: 25 }];

    XLSX.utils.sheet_add_aoa(worksheet, combinedSheet);

    const range = XLSX.utils.decode_range(worksheet["!ref"] ?? "");
    const rows = range.e.r;
    const columns = range.e.c;

    for (let row = 0; row <= rows; row++) {
        for (let col = 0; col <= columns; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: row, c: col });

            if (worksheet[cellRef]) {
                function setCellColor(defaultColor: string) {
                    let color = defaultColor;
                    const cellValue = worksheet[cellRef]?.v;

                    const isPrice = cellValue.includes("-") ? false : !isNaN(parseInt(cellValue, 10));
                    const inStock = cellValue.includes("site") && +cellValue.split(",")[0].split(":")[1] > 0;

                    const status = {
                        ok: "D8E4BC",
                        info: "FDE9D9",
                        error: "E6B8B7"
                    }
                    
                    if (cellValue === "OK"
                        || cellValue === "_ok_"
                        || cellValue === "ENABLED"
                        || typeof cellValue === 'number'
                        || cellValue === 'IN STOCK'
                        || isPrice
                        || (cellValue.includes("site") && inStock)
                        || cellValue === "NOT CONNECTED"
                        || cellValue === "RNB?"
                        || cellValue === "") {
                            color = status.ok;
                        };

                    if (cellValue === "ERROR"
                        || cellValue === "ERROR SALE ACTIVE"
                        || cellValue.includes("(identifiers found)")
                        || cellValue === "IDENTIFIERS"
                        || cellValue === "DIFF") {
                            color = status.error;
                        };

                    if (cellValue === "INFO"
                        || cellValue === "DISABLED"
                        || cellValue === "NO PDP"
                        || cellValue === "OUT OF STOCK"
                        || cellValue === "DUPLICATE"
                        || cellValue === '0'
                        || cellValue === "_error_"
                        || cellValue === "CONNECTED"
                        || (cellValue.includes("site") && !inStock)
                        || cellValue === "ONLY IN STORE"
                        || cellValue === "SECONDARY"
                        || cellValue === "PRIMARY"
                        || cellValue === "SLP <= SALE") {
                            color = status.info;
                        }
    
                    return color;
                }
    
                    if (row === 0) {
                        // vertical header - 1st column only
                        worksheet[cellRef].s = {
                            alignment: {
                                horizontal: "center",
                                vertical: "center",
                                wrapText: false,
                            },
                            font: { bold: true, color: { rgb: "FFFFFF" }},
                            fill: {
                                patternType: "solid",
                                fgColor: {
                                    rgb: "0a6291"
                                }
                            }
                        }
                    }
        
                    if (row % 2 === 0 && row !== 0) {
                        worksheet[cellRef].s = {
                            ...worksheet[cellRef].s,
                            fill: {
                                patternType: "solid",
                                fgColor: {
                                    rgb: setCellColor("d2eefc")
                                }
                            }
                            
                        }
                    }
        
                    if (row !== 0) {
                        worksheet[cellRef].s = {
                            ...worksheet[cellRef].s,
                            alignment: {
                                horizontal: "center",
                            },
                            fill: {
                                patternType: "solid",
                                fgColor: {
                                    rgb: setCellColor("FFFFFF")
                                }
                            }
                        }
                    }
        
                    if (row !== 0 && row % 2 > 0) {
                            worksheet[cellRef].s = {
                                ...worksheet[cellRef].s,
                                fill: {
                                    patternType: "solid",
                                    fgColor: {
                                        rgb: setCellColor("f5fbff")
                                    }
                                }
                            }
                    }

                    if (col === columns && row !== 0) {
                        worksheet[cellRef].s = {
                            ...worksheet[cellRef].s,
                            alignment: {
                                horizontal: "left",
                            },
                        }
                    }

                    if (row === rows && col === columns) {
                        worksheet['!autofilter'] = { ref:`A1:${cellRef}` };
                    }

                    if (row !== 0 && col === 0) {
                        // First column only (SKUs)
                        worksheet[cellRef].s = {
                            border: {
                                right: {
                                    style: "thin",
                                    color: {
                                        rgb: "FFFFFF"
                                    }
                                },
                                bottom: {
                                    style: "thin",
                                    color: {
                                        rgb: "FFFFFF"
                                    }
                                }
                            },
                            fill: {
                                patternType: "solid",
                                fgColor: {
                                    rgb: "FFFFFF"
                                }
                            }
                        }
                    }

                    if (row !== 0 && col === columns) {
                        // Last column only (message)
                        worksheet[cellRef].s = {
                            border: {
                                right: {
                                    style: "thin",
                                    color: {
                                        rgb: "FFFFFF"
                                    }
                                },
                                bottom: {
                                    style: "thin",
                                    color: {
                                        rgb: "FFFFFF"
                                    }
                                }
                            },
                            fill: {
                                patternType: "solid",
                                fgColor: {
                                    rgb: "FFFFFF"
                                }
                            }
                        }
                    }
        
                    worksheet[cellRef].s = {
                        ...worksheet[cellRef].s,
                        border: {
                            right: {
                                style: "thin",
                                color: {
                                    rgb: "FFFFFF"
                                }
                            },
                            bottom: {
                                style: "thin",
                                color: {
                                    rgb: "FFFFFF"
                                }
                            }
                        }
                    }
            }
        }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "report");
    const report = XLSX.write(workbook, { type: "buffer", bookType: "xlsx"});

    if (process.env.ENV_GITHUB_ACTION === "true" && process.env.SEND_GRID_API_KEY) {
        service.sendGrid.sendReport({ testTarget, saleStatus, report });
    } else {
        service.saveReport.locally({ testTarget, saleStatus, report });
        service.saveReport.oneDrive({ testTarget, saleStatus, report });
    }
}