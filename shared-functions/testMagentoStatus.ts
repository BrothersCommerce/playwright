import { ExcelSLPNode, MagentoConnectedSkus, MagentoStatus, ProductPage } from "../utils/types";
import { service } from "../services";
import { excelRow } from "../utils/excelRow";

export const testMagentoStatus = async ({
    testTarget,
    skus,
    excelSLP
}: {
    testTarget: string,
    skus: string[],
    excelSLP?: ExcelSLPNode[]
}) => {
    console.log(`Magento status to be tested for SKUs in "${testTarget}"`);
    const result: string[][] = [];
    const resultConnectedSkus: MagentoConnectedSkus[] = [];
    const resultRelevance: { relevance: string, sku: string }[] = [];
    const resultMagentoSlp: { magentoSlp: number, sku: string }[] = []

    for (let i = 0; i < skus.length; i++) {
        const sku = skus[i];
        const { status, connectedSku, magentoSlp, productRelevance } = await service.magento.getProductStatus(sku);
        resultConnectedSkus.push({ connectedSku, sku });
        resultMagentoSlp.push({ magentoSlp, sku })
        resultRelevance.push({ relevance: productRelevance ?? "UNKNOWN", sku });
        result.push(excelRow({message: status, refs: skus, i }));
    }

    return {
        result,
        resultConnectedSkus,
        resultRelevance,
        resultMagentoSlp,
        label: "status"
    }
};