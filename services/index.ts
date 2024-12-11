import { magento } from "./magento";
import { sendGrid } from "./sendGrid";
import { saveReport } from "./fileSystem";

export const service = {
    magento,
    sendGrid,
    saveReport
}