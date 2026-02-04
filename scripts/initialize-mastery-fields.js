import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ynasoxvdalcmrrsxxmjr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ap2IKSLCxabTzVTQNbw45Q_iFBUaNJW';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function initializeMasteryFields() {
  console.log('开始初始化 mastery_records 字段...\n');

  try {
    const { data, error } = await supabase
      .from('mastery_records')
      .select('*')
      .range(0, 9999);

    if (error) throw error;

    console.log(`✓ 成功获取 ${data.length} 条记录\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const today = new Date().toISOString().split('T')[0];

    for (const record of data) {
      const { id, history, consecutive_green, last_practice_date } = record;

      let updates = {};

      // 初始化 consecutive_green（如果不存在或无效）
      if (consecutive_green === null || consecutive_green === undefined) {
        let consecutiveGreen = 0;
        if (history && history.length > 0) {
          for (let i = history.length - 1; i >= 0; i--) {
            if (history[i] === 'green') {
              consecutiveGreen++;
            } else {
              break;
            }
          }
        }
        updates.consecutive_green = consecutiveGreen;
      }

      // 初始化 last_practice_date（如果不存在）
      if (!last_practice_date) {
        updates.last_practice_date = today;
      }

      // 如果没有需要更新的字段，跳过
      if (Object.keys(updates).length === 0) {
        skippedCount++;
        continue;
      }

      const { error: updateError } = await supabase
        .from('mastery_records')
        .update(updates)
        .eq('id', id);

      if (updateError) {
        console.error(`✗ 更新失败 [${id}]:`, updateError.message);
        errorCount++;
      } else {
        updatedCount++;
        if (updatedCount % 50 === 0) {
          console.log(`  已更新 ${updatedCount} 条记录...`);
        }
      }
    }

    console.log(`\n✓ 初始化完成！`);
    console.log(`  - 成功更新: ${updatedCount}`);
    console.log(`  - 跳过（无需更新）: ${skippedCount}`);
    console.log(`  - 更新失败: ${errorCount}`);

  } catch (error) {
    console.error('初始化失败:', error.message);
    process.exit(1);
  }
}

initializeMasteryFields();
