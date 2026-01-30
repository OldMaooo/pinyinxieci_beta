import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ynasoxvdalcmrrsxxmjr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ap2IKSLCxabTzVTQNbw45Q_iFBUaNJW';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('═══════════════════════════════════════════════════════');
console.log('🧪 测试：连续5天答对的词，今天答错会怎样');
console.log('═══════════════════════════════════════════════════════');
console.log('');

async function test() {
  // 1. 找一个连续5天以上的词
  console.log('🔍 步骤1: 找一个连续5天的词...');
  const { data: masteredWords } = await supabase
    .from('mastery_records')
    .select('id, history, consecutive_green, last_practice_date')
    .gte('consecutive_green', 5)
    .limit(10);

  console.log(`   找到 ${masteredWords?.length || 0} 个连续5天+的词`);

  if (!masteredWords || masteredWords.length === 0) {
    console.log('❌ 没有连续5天的词，测试终止');
    return;
  }

  // 找一个历史记录最后是 green 的
  const testWord = masteredWords.find(w => w.history?.[w.history.length - 1] === 'green') || masteredWords[0];
  const wordName = testWord.id.split('-').slice(2, -1).join('-') || testWord.id.split('-').pop();

  console.log(`✅ 选择测试词: "${wordName}"`);
  console.log(`   连续绿: ${testWord.consecutive_green} 天`);
  console.log(`   最后练习: ${testWord.last_practice_date || '未知'}`);
  console.log(`   历史最后: ${testWord.history?.[testWord.history.length - 1]}`);
  console.log('');

  // 2. 模拟今天答错（添加 red 到历史，重置 consecutive_green）
  console.log('🔧 步骤2: 模拟今天答错...');
  const newHistory = [...(testWord.history || []), 'red'];
  const newConsecutive = 0;

  const { error: updateError } = await supabase
    .from('mastery_records')
    .update({
      history: newHistory,
      consecutive_green: newConsecutive,
      last_practice_date: new Date().toISOString().split('T')[0]
    })
    .eq('id', testWord.id);

  if (updateError) {
    console.log('❌ 更新失败:', updateError.message);
    return;
  }

  console.log(`✅ 已更新 "${wordName}":`);
  console.log(`   consecutive_green: ${testWord.consecutive_green} → 0`);
  console.log(`   history: [..., '${testWord.history?.[testWord.history.length - 1]}'] → [..., '${testWord.history?.[testWord.history.length - 1]}', 'red']`);
  console.log('');

  // 3. 验证
  console.log('🔍 步骤3: 验证更新...');
  const { data: updated } = await supabase
    .from('mastery_records')
    .select('id, history, consecutive_green')
    .eq('id', testWord.id)
    .single();

  console.log(`   验证结果:`);
  console.log(`   - consecutive_green = ${updated.consecutive_green} (应该是 0)`);
  console.log(`   - history 最后 = "${updated.history?.[updated.history.length - 1]}" (应该是 'red')`);
  console.log('');

  // 4. 验证状态计算
  const status = updated.consecutive_green >= 5 ? 'MASTERED' :
                 updated.history?.[updated.history.length - 1] === 'red' ? 'WEAK' : 'NEW';

  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ 测试完成！');
  console.log('');
  console.log('📝 预期变化:');
  console.log(`   之前: 掌握 (MASTERED) - 连续 ${testWord.consecutive_green} 天`);
  console.log(`   现在: 薄弱 (WEAK) - 连续 0 天，最后错`);
  console.log('');
  console.log('💡 在主应用中的表现:');
  console.log('   - Setup 页面: 绿色下划线 → 红色下划线');
  console.log('   - 练习页面: 正常显示 → 浅红色显示');
  console.log('═══════════════════════════════════════════════════════');

  // 恢复原状
  console.log('');
  console.log('🔄 自动恢复原状（5秒后）...');
  await new Promise(r => setTimeout(r, 5000));

  await supabase
    .from('mastery_records')
    .update({
      history: testWord.history,
      consecutive_green: testWord.consecutive_green,
      last_practice_date: testWord.last_practice_date
    })
    .eq('id', testWord.id);

  console.log('✅ 已恢复！');
}

test().catch(console.error);
