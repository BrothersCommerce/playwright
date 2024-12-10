import { ExcelRow } from "./types"

function updatePLPRow(PLP: ExcelRow, test: ExcelRow, matchStatus: string, changeSLPstatus?: string) {
    const rnbGuard: { skus: string[], labels: string[]} = { skus: [], labels: [ "qty" ]};

    PLP.result = [...PLP.result].map((entry, i) => {
        if (test.result[i][2] === matchStatus && !rnbGuard.labels.includes(test.label.toLowerCase())) {
            const updatedEntry = [...entry];
            updatedEntry[2] = changeSLPstatus?.length ? changeSLPstatus : "_error_";
            return updatedEntry;
        }

        if (matchStatus === "RNB?") {
            rnbGuard.skus.push(test.result[i][0]);
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
                        updatePLPRow(PLP, test, "RNB?", "OK");
                        break;
                    case "connected sku":
                        updatePLPRow(PLP, test, "SECONDARY");
                        break;
                    case "qty":
                        updatePLPRow(PLP, test, "0");
                        break;
                    case "prices":
                        updatePLPRow(PLP, test, "SLP <= SALE", "_ok_");
                        break;
                    case "pdp price":
                        break;
                    default:
                        break;
                }

                return test;
            });
        }

        resolve(updatedExcelRows);
    });
}