import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ynasoxvdalcmrrsxxmjr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ap2IKSLCxabTzVTQNbw45Q_iFBUaNJW';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const todayStr = new Date().toISOString().split('T')[0];
const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

console.log('═══════════════════════════════════════════════════════');
console.log('🧪 跨天逻辑测试工具');
console.log('═══════════════════════════════════════════════════════');
console.log(`📅 今天: ${todayStr}`);
console.log(`📅 昨天: ${yesterdayStr}`);
console.log('');

async function test() {
  // 1. 找一个今天练过的词
  console.log('🔍 步骤1: 找一个今天练过的词...');
  const { data: todayWords } = await supabase
    .from('mastery_records')
    .select('id, history, consecutive_green, last_practice_date')
    .eq('last_practice_date', todayStr)
    .limit(5);

  if (!todayWords || todayWords.length === 0) {
    console.log('❌ 没有今天练过的词');
    return;
  }

  const testWord = todayWords[0];
  const wordName = testWord.id.split('-').pop();
  console.log(`✅ 找到测试词: "${wordName}"`);
  console.log(`   ID: ${testWord.id}`);
  console.log(`   连续绿: ${testWord.consecutive_green}`);
  console.log(`   最后练习: ${testWord.last_practice_date}`);
  console.log(`   历史: [${testWord.history?.join(', ')}]`);
  console.log('');

  // 2. 修改为昨天
  console.log('🔧 步骤2: 模拟跨天（修改为昨天）...');
  const { error: updateError } = await supabase
    .from('mastery_records')
    .update({ last_practice_date: yesterdayStr })
    .eq('id', testWord.id);

  if (updateError) {
    console.log('❌ 更新失败:', updateError.message);
    return;
  }

  console.log(`✅ 已将 "${wordName}" 的 last_practice_date 从 ${todayStr} 改为 ${yesterdayStr}`);
  console.log('');

  // 3. 验证结果
  console.log('🔍 步骤3: 验证修改...');
  const { data: updated } = await supabase
    .from('mastery_records')
    .select('id, last_practice_date')
    .eq('id', testWord.id)
    .single();

  console.log(`   现在 last_practice_date = ${updated.last_practice_date}`);
  console.log('');

  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ 测试完成！');
  console.log('');
  console.log('📝 下一步操作:');
  console.log('   1. 打开主应用 http://localhost:3009');
  console.log('   2. 刷新页面');
  console.log('   3. 进入练习，找到这个词');
  console.log('   4. 观察它的临时标记（practice/self/final）是否清空');
  console.log('');
  console.log('💡 预期结果:');
  console.log('   - 临时标记应该从上次的值变成白色 (white)');
  console.log('   - 因为 last_practice_date != todayStr，所以 start() 函数会清空标记');
  console.log('═══════════════════════════════════════════════════════');
}

test().catch(console.error);
