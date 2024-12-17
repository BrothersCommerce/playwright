export const getFolderAndReportName = ({ testTarget, saleStatus }: { testTarget: string, saleStatus: string }) => {
    const timestamp = new Date();
    const year = timestamp.getUTCFullYear();
    const month = timestamp.getUTCMonth() + 1;
    const date = timestamp.getUTCDate();
    const folderName = `${year}-${month}-${date}`;

    let excelReportName = testTarget.replace("%", "procent").replace(".", "").replace(" ", "");

    if (saleStatus) {
        excelReportName = `${excelReportName}__${saleStatus}__`;
    }

    return { folderName, excelReportName };
}