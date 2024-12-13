import fs from 'fs-extra';
import path from 'path';
import sgMail, { MailDataRequired } from "@sendgrid/mail";
import { getFolderAndReportName } from '../../utils/getFolderAndReportName';

export const sendGrid = {
    sendReport: ({ testTarget, saleStatus, report }) => {
        const { folderName, excelReportName } = getFolderAndReportName({ testTarget, saleStatus });
        const localDir = `${path.resolve()}/excel-reports/${folderName}`;
        fs.ensureDirSync(localDir);
        fs.writeFileSync(`${path.resolve()}/excel-reports/${folderName}/${excelReportName}test-report.xlsx`, report);
    
        sgMail.setApiKey((process.env.SEND_GRID_API_KEY ?? ""));
    
        fs.readFile((`${path.resolve()}/excel-reports/${folderName}/${excelReportName}test-report.xlsx`), async (error, testReport) => {
            if (error) {
                throw new Error(error);
            } else if (testReport) {
                const mailAddresses = (process.env.MAIL_TO ?? "").split(",");
                const singleMailAddress = process.env.SINGLE_MAIL_TO ?? "";

                const to = singleMailAddress.length > 1 ? singleMailAddress : mailAddresses;
                const msg: MailDataRequired = {
                    to,
                    from: 'it@brothers.se',
                    subject: `Playwright test för kategori: ${testTarget}`,
                    text: 'rapporten finns bifogad som excel',
                    attachments: [
                        {
                            content: testReport.toString('base64'),
                            filename: `${excelReportName}test-report.xlsx`,
                            type: "application/xlsx",
                            disposition: "attachment"
                        }
                    ]
                  };

                console.log(`Report sent with senGrid to: ${mailAddresses}`);
                const sendGridResponse = await sgMail.send(msg);
            }
        });
    }
}