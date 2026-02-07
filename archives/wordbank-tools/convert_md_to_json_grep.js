import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Unit mapping from work plan
const unit_mapping = {
  "阅读1": 1, "阅读2": 2, "阅读3": 3, "语文园地一": 3,
  "识字1": 4, "识字2": 5, "识字3": 6, "识字4": 7, "语文园地二": 7,
  "阅读4": 8, "阅读5": 9, "阅读6": 10, "语文园地三": 10,
  "阅读7": 11, "阅读8": 12, "阅读9": 13, "阅读10": 14, "语文园地四": 14,
  "阅读11": 15, "阅读12": 16, "阅读13": 17, "语文园地五": 17,
  "阅读14": 18, "阅读15": 19, "阅读16": 20, "阅读17": 21, "语文园地六": 21,
  "阅读18": 22, "阅读19": 23, "阅读20": 24, "语文园地七": 24,
  "阅读21": 25, "阅读22": 26, "阅读23": 27, "语文园地八": 27
};

// Use grep to extract from "### 最终总表" to "## 四、字数统计"
const md_path = join(process.cwd(), 'AI_Data_Generation_Kit/intermediate_data/二年级上册.md');
try {
  const grepResult = execSync(
    `grep -A 1000 "^### 最终总表" "${md_path}" | grep -B 1000 "^## 四、字数统计"`,
    { encoding: 'utf8' }
  );
  
  const content = grepResult.stdout.toString('utf8');
  
  if (!content) {
    console.error('Failed to extract content');
    process.exit(1);
  }
  
  // Split by "#### " to get individual lessons
  const lessonParts = content.split(/^#### /m);
  
  const wordBank = [];
  for (let i = 0; i < lessonParts.length; i++) {
    const part = lessonParts[i];
    
    if (!part || !part.startsWith('#### ')) {
      continue;
    }
    
    const [headerLine, ...rest] = part.split('\n');
    const lessonName = headerLine.slice(5).trim();
    
    // Get unit from mapping
    const unit = unit_mapping[lessonName];
    if (!unit) {
      console.warn(`No unit mapping for lesson: ${lessonName}`);
      continue;
    }
    
    // Extract words from this lesson
    const wordLines = rest.join('\n');
    // Skip empty lines and markdown table lines (containing |)
    const wordsText = wordLines
      .split('\n')
      .filter(line => line.trim() && !line.includes('|') && !line.startsWith('-'))
      .join('');
    
    // Parse words (comma-separated with 、 or ，)
    const words = wordsText.split(/、|，/).map(w => w.trim()).filter(w => w);
    
    if (words.length > 0) {
      console.log(`Lesson: ${lessonName}, Unit: ${unit}, Words: ${words.length}`);
    }
    
    for (const word of words) {
      wordBank.push({
        word,
        pinyin: "",
        grade: "二年级",
        semester: "上册",
        unit,
        lessonName
      });
    }
  }
  
  // Create JSON structure
  const json = {
    version: "1.0",
    buildDate: new Date().toISOString(),
    gradeSemester: "二年级上册",
    count: wordBank.length,
    wordBank
  };
  
  // Write output
  const output_path = join(process.cwd(), 'dist/data/二年级上册.json');
  writeFileSync(output_path, JSON.stringify(json, null, 2), 'utf8');
  console.log(`\nGenerated JSON with ${wordBank.length} words at ${output_path}`);
  
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
