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

function parseMD(content) {
  const lines = content.split('\n');
  const sections = [];
  let currentSection = null;
  let inFinalTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip all header lines
    if (line.startsWith('#') || line.startsWith('**') || line.startsWith('---') || line === '>') {
      if (line === '### 最终总表') {
        inFinalTable = true;
        sections.length = 0;
      }
      continue;
    }

    // Only parse if in "最终总表" section
    if (!inFinalTable) {
      continue;
    }

    // Check for lesson headers (#### followed by lesson name)
    const sectionMatch = line.match(/^####\s+(.+)$/);
    if (sectionMatch) {
      if (currentSection && currentSection.words.length > 0) {
        sections.push(currentSection);
      }
      const lessonName = sectionMatch[1];
      currentSection = {
        unit: lessonName,
        words: []
      };
      continue;
    }

    // Parse words (Chinese phrases separated by 顿号)
    if (currentSection && line.length > 0 && !line.startsWith('####')) {
      const words = line.split(/[、]/).filter(w => w.trim() && /^[\u4e00-\u9fa5]+$/.test(w));
      currentSection.words.push(...words);
    }
  }

  // Add last section
  if (currentSection && currentSection.words.length > 0) {
    sections.push(currentSection);
  }

  return sections;
}

    // Check for section headers (### followed by lesson name)
    const sectionMatch = line.match(/^###\s+(.+)$/);
    if (sectionMatch) {
      if (currentSection && currentSection.words.length > 0) {
        sections.push(currentSection);
      }
      const lessonName = sectionMatch[1];
      currentSection = {
        lessonName: lessonName,
        unit: lessonName,
        words: []
      };
      isWordList = true;
      continue;
    }

    // Parse words (Chinese characters or phrases)
    if (currentSection && isWordList && line.match(/^[\u4e00-\u9fa5\s、，。]+$/)) {
      const words = line.split(/[、，。]/).filter(w => w.trim() && /^[\u4e00-\u9fa5]+$/.test(w));
      currentSection.words.push(...words);
    }
  }

  // Add last section
  if (currentSection && currentSection.words.length > 0) {
    sections.push(currentSection);
  }

  return sections;
}

function convertMDToJSON(semester) {
  const mdPath = path.join(__dirname, '..', MD_FILE_MAP[semester]);
  const outputPath = path.join(__dirname, '..', OUTPUT_DIR, `${semester}.json`);

  if (!fs.existsSync(mdPath)) {
    console.error(`MD file not found: ${mdPath}`);
    return;
  }

  const mdContent = fs.readFileSync(mdPath, 'utf-8');
  const sections = parseMD(mdContent);

  const wordBank = [];
  sections.forEach(section => {
    section.words.forEach(word => {
      const item = {
        word: word,
        pinyin: '',
        grade: semester.substring(0, 3),
        semester: semester.substring(3),
        unit: section.lessonName
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

  // Create output directory if not exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(jsonOutput, null, 2), 'utf-8');
  console.log(`✓ Generated ${semester}.json with ${wordBank.length} words`);
}

function main() {
  console.log('Converting MD files to JSON...\n');

  SEMESTERS.forEach(semester => {
    convertMDToJSON(semester);
  });

  console.log('\n✓ All JSON files generated successfully!');
}

main();
