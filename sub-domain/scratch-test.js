import { marked } from 'marked';

const input = `<div># Staret tenuantur odere quae</div><div><br></div><div>## Acheloides inter</div><div><br></div><div>Lorem markdownum feros voce maternis. **Tum** nando proculcat tendebat flumina</div>`;

const cleaned = input
  .replace(/<div[^>]*>/gi, '\n')
  .replace(/<\/div>/gi, '')
  .replace(/<p[^>]*>/gi, '\n')
  .replace(/<\/p>/gi, '')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/&nbsp;/gi, ' ');

console.log('--- CLEANED ---');
console.log(cleaned);
console.log('--- MARKED ---');
console.log(marked.parse(cleaned, { async: false, breaks: true }));
