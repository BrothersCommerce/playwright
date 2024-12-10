const skus = `
3031795-3367
3031795-3432
3031795-3463
3031795-5066
3033310-5003
3033310-4153
3033310-6042
3033652-3916
3031459-3010
3033351-3010
3033351-3551
3033541-3010
3033268-3777
3033268-3367
`

let pipedSkus = (skus, numberOfSkusPerChunk = 100) => {
    const chunk = (arr, size) =>
        Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
          arr.slice(i * size, i * size + size)
    );

    const skuArray = skus.split(/\n/).map(v => v.trim()).filter(v => v.length);
    const skuChunks = chunk(skuArray, numberOfSkusPerChunk);
    let i = 1;
    for (const chunk of skuChunks) {
        const pipedSkus = chunk.reduce((prev, curr, i, array) => {if (i + 1 < array.length) { return prev += curr + "|"} else { return prev += curr }}, "" );
        console.log("");
        console.log("------------");
        console.log(`Group: ${i}`);
        console.log("------------");
        console.log(pipedSkus);
        i += 1;
    }
    console.log("");
    console.log(`Generated ${skuChunks.length} lists with a total of ${skuArray.length} SKUs`);
}

pipedSkus(skus, 200);