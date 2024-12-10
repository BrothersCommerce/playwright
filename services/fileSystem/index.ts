import fs from 'fs-extra';
import path from 'path';
import { getFolderAndReportName } from '../../utils/getFolderAndReportName';

export const saveReport = {
    locally: ({ testTarget, saleStatus, report }) => {
        const { folderName, excelReportName } = getFolderAndReportName({ testTarget, saleStatus });
        const localDir = `${path.resolve()}/excel-reports/${folderName}`;
        fs.ensureDirSync(localDir);
        fs.writeFileSync(`${path.resolve()}/excel-reports/${folderName}/${excelReportName}test-report.xlsx`, report);
    },
    oneDrive: ({testTarget, saleStatus, report }) => {
        const { folderName, excelReportName } = getFolderAndReportName({ testTarget, saleStatus });
        const dir = `C:\\Users\\bdangus\\OneDrive - Brothers AB\\Produktlista IT/${folderName}`;
        fs.ensureDirSync(dir);
        fs.writeFileSync(`C:\\Users\\bdangus\\OneDrive - Brothers AB\\Produktlista IT/${folderName}/${excelReportName}test-report.xlsx`, report);
    }
}