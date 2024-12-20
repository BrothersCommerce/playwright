const createdAt = new Date("2024-06-05 07:35:36".split(" ")[0]);

const millisecondsMonth = 2628000000;

const productRetireAge = millisecondsMonth * 8;

const productAge = new Date().getTime() - createdAt;

console.log({ productAge, productRetireAge });

console.log(`Product is older than ${productRetireAge/millisecondsMonth} months old: `, productAge > productRetireAge);