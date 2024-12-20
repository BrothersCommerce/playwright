import { ExcelSLPNode, MagentoConnectedSkus, MagentoStatus, ProductPage } from "../utils/types";
import { service } from "../services";
import { excelRow } from "../utils/excelRow";

export const testRelevance = async ({
    testTarget,
    resultRelevance,
    skus,
    excelSLP
}: {
    testTarget: string,
    resultRelevance: { relevance: string, sku: string}[],
    skus: string[],
    excelSLP?: ExcelSLPNode[]
}) => {
    console.log(`Retire age to be tested for SKUs in "${testTarget}"`);
    const result: string[][] = [];

    for (let i = 0; i < resultRelevance.length; i++) {
        const message = resultRelevance[i].relevance === "0" ? "1" : resultRelevance[i].relevance;
        result.push(excelRow({message, refs: skus, i }));
    }

    return {
        result,
        label: "active years"
    }
};