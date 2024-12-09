import { service } from "../../../services";
import test from "@playwright/test";
import { MAGENTO_ATTR } from "../../../utils/constants";

test("filtered products", async () => {
    const data = await service.magento.getFilteredProducts([
        {
            field: "Kategori",
            value: MAGENTO_ATTR.kategori.Byxor.value,
        },
        {
            field: "status",
            value: MAGENTO_ATTR.status.enabled
        },
        {
            field: "visibility",
            value: MAGENTO_ATTR.visibility.catalogAndSearch
        },
    ]);

    console.log(JSON.stringify(data));
});