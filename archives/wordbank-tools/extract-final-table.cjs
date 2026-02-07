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

function extractFinalTable(content) {
  const lines = content.split('\n');
  const sections = [];
  let currentSection = null;
  let inFinalTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Start capturing at "## 三、最终总表"
    if (line === '## 三、最终总表') {
      inFinalTable = true;
      continue;
    }

    // Stop at "## 四、字数统计"
    if (line === '## 四、字数统计') {
      if (currentSection && currentSection.words.length > 0) {
        sections.push(currentSection);
      }
      break;
    }

    // Skip if not in final table section
    if (!inFinalTable) {
      continue;
    }

    // Skip table rows in "处理规则" section
    if (line.includes('|')) {
      continue;
    }

    // Check for section headers (#### followed by lesson name)
    const sectionMatch = line.match(/^####\s+(.+)$/);
    if (sectionMatch) {
      const lessonName = sectionMatch[1];
      
      // Skip non-lesson headers
      if (lessonName === '最终总表' || lessonName === '处理规则') {
        continue;
      }
      
      // Save previous section
      if (currentSection && currentSection.words.length > 0) {
        sections.push(currentSection);
      }
      
      // Start new section
      currentSection = {
        unit: lessonName,
        words: []
      };
      continue;
    }

    // Parse words
    if (currentSection && line.length > 0 && !line.startsWith('>')) {
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

  return sections;
}

function main() {
  console.log('Extracting final tables from all semesters...\n');

  SEMESTERS.forEach(semester => {
    const mdPath = path.join(__dirname, '..', MD_FILE_MAP[semester]);

    if (!fs.existsSync(mdPath)) {
      console.error('MD file not found:', mdPath);
      return;
    }

    const mdContent = fs.readFileSync(mdPath, 'utf-8');
    const sections = extractFinalTable(mdContent);

    // Deduplicate words within each section
    sections.forEach(section => {
      const seen = new Set();
      section.words = section.words.filter(word => {
        if (seen.has(word)) return false;
        seen.add(word);
        return true;
      });
    });

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
    console.log('Generated', semester + '.json with', wordBank.length, 'words');
  });

  console.log('\nAll final tables extracted successfully!');
}

main();
