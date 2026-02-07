import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read backup data
const backup = JSON.parse(fs.readFileSync('./backups/mastery-backup-2026-01-29-09-02-12.json', 'utf-8'));

// Supabase 配置
const SUPABASE_URL = 'https://ynasoxvdalcmrrsxxmjr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ap2IKSLCxabTzVTQNbw45Q_iFBUaNJW';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function restoreBackup() {
  console.log('🚀 开始恢复备份数据...');
  console.log(`📊 总记录数: ${backup.totalRecords}`);
  console.log(`   - 已掌握: ${backup.stats.mastered}`);
  console.log(`   - 薄弱: ${backup.stats.weak}`);
  console.log(`   - 新词: ${backup.stats.new}`);
  
  let success = 0;
  let failed = 0;
  
  for (const record of backup.records) {
    try {
      const { error } = await supabase
        .from('mastery_records')
        .upsert({
          id: record.id,
          history: record.history,
          last_status: record.last_status,
          temp_state: record.temp_state,
          last_history_update_date: record.last_history_update_date,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error(`❌ 失败: ${record.id}`, error);
        failed++;
      } else {
        success++;
        if (success % 50 === 0) {
          console.log(`   已恢复 ${success} 条记录...`);
        }
      }
    } catch (e) {
      console.error(`❌ 异常: ${record.id}`, e);
      failed++;
    }
  }
  
  console.log(`\n✅ 恢复完成!`);
  console.log(`   成功: ${success}`);
  console.log(`   失败: ${failed}`);
}

restoreBackup();
