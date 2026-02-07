#!/bin/bash
# Extract lines from "### 最终总表" to "## 四、字数统计"
sed -n '/^### 最终总表$/,/^## 四、字数统计$/p' AI_Data_Generation_Kit/intermediate_data/二年级上册.md > tmp/lessons.txt

# Parse and generate JSON
node -e "
const fs = require('fs');
const data = fs.readFileSync('tmp/lessons.txt', 'utf8');

const unit_mapping = {
  '阅读1': 1, '阅读2': 2, '阅读3': 3, '语文园地一': 3,
  '识字1': 4, '识字2': 5, '识字3': 6, '识字4': 7, '语文园地二': 7,
  '阅读4': 8, '阅读5': 9, '阅读6': 10, '语文园地三': 10,
  '阅读7': 11, '阅读8': 12, '阅读9': 13, '阅读10': 14, '语文园地四': 14,
  '阅读11': 15, '阅读12': 16, '阅读13': 17, '语文园地五': 17,
  '阅读14': 18, '阅读15': 19, '阅读16': 20, '阅读17': 21, '语文园地六': 21,
  '阅读18': 22, '阅读19': 23, '阅读20': 24, '语文园地七': 24,
  '阅读21': 25, '阅读22': 26, '阅读23': 27, '语文园地八': 27
};

const lines = data.trim().split('\n');
const wordBank = [];
let currentLesson = null;

for (const line of lines) {
  if (line.startsWith('#### ')) {
    currentLesson = line.slice(5).trim();
  } else if (line.trim() && !line.startsWith('|') && !line.startsWith('-') && currentLesson) {
    const unit = unit_mapping[currentLesson];
    if (unit) {
      const words = line.split(/、|，/).map(w => w.trim()).filter(w => w);
      for (const word of words) {
        wordBank.push({ word, pinyin: '', grade: '二年级', semester: '上册', unit, lessonName: currentLesson });
      }
    }
  }
}

const json = {
  version: '1.0',
  buildDate: new Date().toISOString(),
  gradeSemester: '二年级上册',
  count: wordBank.length,
  wordBank
};

fs.writeFileSync('dist/data/二年级上册.json', JSON.stringify(json, null, 2), 'utf8');
console.log(\`Generated \${wordBank.length} words\`);"
