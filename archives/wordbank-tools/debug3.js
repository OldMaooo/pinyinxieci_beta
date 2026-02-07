import { readFileSync } from 'fs';
import { join } from 'path';

const md_path = join(process.cwd(), 'AI_Data_Generation_Kit/intermediate_data/二年级上册.md');
const md_content = readFileSync(md_path, 'utf8');

const finalTableSection = md_content.split('## 三、最终总表')[1];

// Check if split works
const parts = finalTableSection.split('### 最终总表');
console.log('Number of parts after splitting on "### 最终总表":', parts.length);
console.log('Part 0 length:', parts[0]?.length);
console.log('Part 1 length:', parts[1]?.length);
console.log('Part 0 first 100 chars:', parts[0]?.substring(0, 100));
console.log('Part 1 first 100 chars:', parts[1]?.substring(0, 100));
