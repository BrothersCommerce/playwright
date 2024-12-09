import { ExcelSLPNode, MagentoConnectedSkus, MagentoStatus, ProductPage } from "../utils/types";
import { service } from "../services";
import { excelRow } from "../utils/excelRow";

export const testMagentoConnectedSkus = async ({
    resultConnectedSkus,
    testTarget,
    skus,
    excelSLP
}: {
    resultConnectedSkus: MagentoConnectedSkus[],
    testTarget: string,
    skus: string[],
    excelSLP?: ExcelSLPNode[]
}) => {
    console.log(`Magento status to be tested for SKUs in "${testTarget}"`);
    const result: string[][] = [];

    for (let i = 0; i < resultConnectedSkus.length; i++) {
        const sku = resultConnectedSkus[i].sku;
        const connectedSku = resultConnectedSkus[i].connectedSku;
        const createMessage = () => {
            if (connectedSku.match(/\d{7}-\d+/g)) return `PRIMARY;${connectedSku}`;
            if (connectedSku === "CONNECTED") return "SECONDARY;should not be visible in PLP";
            return "NOT CONNECTED";
        }

        const message = createMessage();

        result.push(excelRow({message, refs: skus, i }));
    }

    return {
        result,
        label: "connected sku"
    }
};