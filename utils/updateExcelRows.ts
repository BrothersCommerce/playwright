import { ExcelRow } from "./types"

function updatePLPRow(PLP: ExcelRow, test: ExcelRow, matchStatus: string, changeSLPstatus?: string) {
    PLP.result = [...PLP.result].map((entry, i) => {
        if (test.result[i][2] === matchStatus) {
            const updatedEntry = [...entry];
            updatedEntry[2] = changeSLPstatus ? changeSLPstatus : "_error_";

            return updatedEntry;
        }
        return entry;
    });
}

export function updateExcelRows (excelRows: ExcelRow[]): Promise<ExcelRow[]> {
    return new Promise( async (resolve) => {
        let updatedExcelRows = [...excelRows];
        let PLP = await updatedExcelRows.find(test => test.label.toLowerCase() === "plp");

        if (PLP && updatedExcelRows) {
            updatedExcelRows = updatedExcelRows.map(test => {
                const label = test.label.toLowerCase();
        
                switch (label) {
                    case "status":
                        updatePLPRow(PLP, test, "DISABLED");
                    case "connected sku":
                        updatePLPRow(PLP, test, "SECONDARY");
                        break;
                    case "qty":
                        updatePLPRow(PLP, test, "0");
                    case "prices":
                        updatePLPRow(PLP, test, "SLP <= SALE", "_ok_");
                    default:
                        break;
                }

                return test;
            });
        }

        resolve(updatedExcelRows);
    });
}