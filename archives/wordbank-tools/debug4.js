import { readFileSync } from 'fs';
import { join } from 'path';

const md_path = join(process.cwd(), 'AI_Data_Generation_Kit/intermediate_data/二年级上册.md');
const md_content = readFileSync(md_path, 'utf8');

const finalTableSection = md_content.split('## 三、最终总表')[1];
const parts = finalTableSection.split(/## /);

console.log('Number of parts:', parts.length);
console.log('Part 0 first 200 chars:', parts[0]?.substring(0, 200));
console.log('Part 1 first 50 chars:', parts[1]?.substring(0, 50));
console.log('Does part 0 contain "### 最终总表"?', parts[0]?.includes('### 最终总表'));
