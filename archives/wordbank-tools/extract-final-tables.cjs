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

const OUTPUT_DIR = 'scripts/extracted-final-tables';

function extractFinalTable(content) {
  const lines = content.split('\n');
  const extracted = [];
  let foundStart = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Start capturing when we find "### 最终总表"
    if (line === '### 最终总表') {
      foundStart = true;
      extracted.push(line);
      continue;
    }

    // Stop capturing when we hit next major section
    if (foundStart && line.startsWith('## ')) {
      break;
    }

    // Capture all lines after the header
    if (foundStart) {
      extracted.push(line);
    }
  }

  return extracted.join('\n');
}

function main() {
  console.log('Extracting 最终总表 from all semesters...\n');

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  SEMESTERS.forEach(semester => {
    const mdPath = path.join(__dirname, '..', MD_FILE_MAP[semester]);

    if (!fs.existsSync(mdPath)) {
      console.error(`MD file not found: ${mdPath}`);
      return;
    }

    const mdContent = fs.readFileSync(mdPath, 'utf-8');
    const finalTable = extractFinalTable(mdContent);

    if (finalTable.length === 0) {
      console.error(`No 最终总表 found in ${semester}`);
      return;
    }

    const outputPath = path.join(OUTPUT_DIR, `${semester}-纯净版.md`);
    fs.writeFileSync(outputPath, finalTable, 'utf-8');
    console.log(`✓ Extracted ${semester}-纯净版.md`);
  });

  console.log('\n✓ All final tables extracted successfully!');
}

main();
