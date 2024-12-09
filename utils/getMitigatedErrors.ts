/**
 * @mitigatedErrors a string that contains excel rows from previous test run that contains manually added comments.
 */
export const getMitigatedErrors = (mitigatedErrors: string) => mitigatedErrors
    .split(/\n/)
    .filter(v => v.length)
    .map(row => row
        .split(/\t/))
        .map(item => {
            return {
                sku: item[0],
                message: item[6]
            };
        });