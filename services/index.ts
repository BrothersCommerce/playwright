import { magento } from "./magento";
import { sendGrid } from "./sendGrid";
import { saveReport } from "./filesystem";

export const service = {
    magento,
    sendGrid,
    saveReport
}