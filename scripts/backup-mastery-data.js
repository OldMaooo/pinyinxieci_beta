import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://ynasoxvdalcmrrsxxmjr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ap2IKSLCxabTzVTQNbw45Q_iFBUaNJW';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function backupMasteryData() {
  console.log('开始备份错题数据...\n');

  try {
    const { data, error } = await supabase
      .from('mastery_records')
      .select('*')
      .range(0, 9999);

    if (error) throw error;

    console.log(`成功获取 ${data.length} 条记录\n`);

    let mastered = 0, weak = 0, newWords = 0;
    data.forEach(r => {
      if (!r.history || r.history.length === 0) newWords++;
      else if (r.history.slice(-3).includes('red')) weak++;
      else mastered++;
    });

    console.log('统计:');
    console.log(`  - 已掌握 (MASTERED): ${mastered}`);
    console.log(`  - 薄弱 (WEAK): ${weak}`);
    console.log(`  - 新词 (NEW): ${newWords}`);
    console.log(`  - 总计: ${data.length}\n`);

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const backupPath = path.join(__dirname, '..', 'backups', `mastery-backup-${timestamp}.json`);
    
    const backupData = {
      exportDate: new Date().toISOString(),
      totalRecords: data.length,
      stats: { mastered, weak, new: newWords },
      records: data
    };

    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    console.log(`备份已保存到: ${backupPath}`);
    console.log(`文件大小: ${(fs.statSync(backupPath).size / 1024).toFixed(2)} KB`);
    console.log('\n备份完成！');
  } catch (error) {
    console.error('备份失败:', error.message);
    process.exit(1);
  }
}

backupMasteryData();
