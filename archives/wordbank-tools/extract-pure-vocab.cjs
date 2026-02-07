const fs = require('fs');
const path = require('path');

const SEMESTERS = ['一年级上册', '一年级下册', '二年级上册', '二年级下册', '三年级上册', '三年级下册'];

const MD_FILE_MAP = {
  '一年级上册': 'AI_Data_Generation_Kit/intermediate_data/一年级上册.md',
  '一年级下册': 'AI_Data_Generation_Kit/intermediate_data/一年级下册.md',
  '二年级上册': 'AI_Data_Generation_Kit/intermediate_data/二年级上册.md',
  '二年级下册': 'AI_Data_Generation_Kit/intermediate_data/二年级下册.md',
  '三年级上册': 'AI_Data_Generation_Kit/intermediate_data/三年级上册.md',
  '三年级下册': 'AI_Data_Generation_Kit/intermediate_data/三年级下册.md',
};

const OUTPUT_DIR = 'dist/data';

function extractPureVocab(content) {
  const lines = content.split('\n');
  const sections = [];
  let currentSection = null;
  let inWordListSection = false;
  let debug = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for word list section markers
    if (line === '## 一、词语表（识字表）' || line === '## 二、词语表') {
      inWordListSection = true;
      debug.push('Line ' + i + ': START word list section');
      continue;
    }

    // Check for "## 三、最终总表" marker - STOP capturing
    if (line === '## 三、最终总表') {
      debug.push('Line ' + i + ': FOUND 最终总表 - stopping');
      if (currentSection && currentSection.words.length > 0) {
        sections.push(currentSection);
      }
      break;
    }

    // Skip other headers when not in word list section
    if (!inWordListSection) {
      continue;
    }

    // Check for section headers (### or #### followed by lesson name)
    const sectionMatch = line.match(/^#{3,4}\s+(.+)$/);
    if (sectionMatch) {
      if (currentSection && currentSection.words.length > 0) {
        sections.push(currentSection);
      }
      const lessonName = sectionMatch[1];
      currentSection = {
        unit: lessonName,
        words: []
      };
      debug.push('Line ' + i + ': NEW section: ' + lessonName);
      continue;
    }

    // Parse words (Chinese phrases separated by 顿号)
    if (currentSection && line.length > 0 && !line.match(/^#{1,4}/)) {
      const words = line.split(/[、]/).filter(w => w.trim() && /^[\u4e00-\u9fa5]+$/.test(w));
      if (words.length > 0) {
        currentSection.words.push(...words);
      }
    }
  }

  // Add last section
  if (currentSection && currentSection.words.length > 0) {
    sections.push(currentSection);
  }

  debug.push('Total sections: ' + sections.length);
  sections.forEach((s, idx) => {
    debug.push('Section ' + idx + ': ' + s.unit + ' (' + s.words.length + ' words)');
  });

  return { sections, debug };
}

function main() {
  console.log('Extracting pure vocabulary from all semesters...\n');

  // Test with 三年级下册 only
  const semester = '三年级下册';
  const mdPath = path.join(__dirname, '..', MD_FILE_MAP[semester]);
  
  const mdContent = fs.readFileSync(mdPath, 'utf-8');
  const { sections, debug } = extractPureVocab(mdContent);
  
  console.log(debug.join('\n'));

  const wordBank = [];
  sections.forEach(section => {
    section.words.forEach(word => {
      const item = {
        word: word,
        pinyin: '',
        grade: semester.substring(0, 3),
        semester: semester.substring(3),
        unit: section.unit
      };
      wordBank.push(item);
    });
  });

  const jsonOutput = {
    version: '1.0',
    buildDate: new Date().toISOString(),
    gradeSemester: semester,
    count: wordBank.length,
    wordBank: wordBank
  };

  const outputPath = path.join(__dirname, '..', OUTPUT_DIR, semester + '.json');
  fs.writeFileSync(outputPath, JSON.stringify(jsonOutput, null, 2), 'utf-8');
  console.log('\nGenerated', semester + '.json with', wordBank.length, 'words');
}

main();
