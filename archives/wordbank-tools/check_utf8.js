import { readFileSync } from 'fs';
import { join } from 'path';

const md_path = join(process.cwd(), 'AI_Data_Generation_Kit/intermediate_data/二年级上册.md');

// Read as binary to check encoding
const buffer = readFileSync(md_path);
console.log('First 500 chars as string:', buffer.toString('utf8', 0, 500));

// Check for BOM
const firstThreeBytes = buffer.slice(0, 3).toString('hex');
console.log('First 3 bytes:', firstThreeBytes);
