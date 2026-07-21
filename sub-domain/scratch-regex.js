const str = "<div># Staret tenuantur odere quae</div><div><br></div><div>## Acheloides inter</div><div><br></div><div>Lorem markdownum feros voce maternis. **Tum** nando proculcat tendebat flumina</div>";

const cleanStr = str.replace(/<div>/g, '\n').replace(/<\/div>/g, '').replace(/<br\s*\/?>/gi, '\n');
console.log("CLEAN STRING:");
console.log(cleanStr);
