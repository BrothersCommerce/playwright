import { ExcelSLPNode } from "./types";

const debug = true;

export const excelRow = ({
    message,
    refs,
    i,
    excelSLP,
}:{
    message: string;
    refs: string[];
    i: number;
    excelSLP?: ExcelSLPNode[];
}) => {
    const statusAndComment = message.split(";");
    if (excelSLP) {
        debug && console.log([`${refs[i]}`, `${excelSLP[i].excelRow}`, `${statusAndComment[0]}`, `${statusAndComment?.[1]}`].map(item => item.replace("undefined", "")));
        return [`${refs[i]}`, `${excelSLP[i].excelRow}`, `${statusAndComment[0]}`, `${statusAndComment?.[1]}`].map(item => item.replace("undefined", ""));
    } else {
        debug && console.log((i + 1) + " : ", [`${refs[i]}`, `N/A`, `${statusAndComment[0]}`, `${statusAndComment?.[1]}`].map(item => item.replace("undefined", "")));
        return [`${refs[i]}`, `N/A`, `${statusAndComment[0]}`, `${statusAndComment?.[1]}`].map(item => item.replace("undefined", ""));
    }
}