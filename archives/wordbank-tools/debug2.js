import { readFileSync } from 'fs';
import { join } from 'path';

const md_path = join(process.cwd(), 'AI_Data_Generation_Kit/intermediate_data/二年级上册.md');
const md_content = readFileSync(md_path, 'utf8');

const finalTableSection = md_content.split('## 三、最终总表')[1];
console.log('=== Lines around "### 最终总表" ===');
const lines = finalTableSection.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('###') || (i >= 18 && i <= 22)) {
    console.log(`${i}: [${line}]`);
  }
}
