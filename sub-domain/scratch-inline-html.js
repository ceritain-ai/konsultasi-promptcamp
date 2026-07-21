import { marked } from 'marked';

const input = `\nHello <span style="color:red">red</span> and <b>bold</b> text.\n`;

console.log(marked.parse(input));
