import { readFileSync } from 'fs';
import { join } from 'path';

const md_path = join(process.cwd(), 'AI_Data_Generation_Kit/intermediate_data/二年级上册.md');
const md_content = readFileSync(md_path, 'utf8');

const finalTableSection = md_content.split('## 三、最终总表')[1];
console.log('finalTableSection length:', finalTableSection?.length);

const lessonContent = finalTableSection.split('## ')[0];
console.log('lessonContent length:', lessonContent?.length);
console.log('lessonContent first 500 chars:', lessonContent?.substring(0, 500));

const [beforeLessons, ...lessonParts] = lessonContent.split('#### ');
console.log('beforeLessons first 500 chars:', beforeLessons?.substring(0, 500));
console.log('Number of lesson parts:', lessonParts.length);
