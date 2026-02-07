#!/usr/bin/env node
/**
 * 修复词组ID不匹配问题
 * 专门修复当前词库（单元1,2,4,5,6）中索引不正确的问题
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// 硬编码的Supabase配置（与App.jsx一致）
const SUPABASE_URL = 'https://ynasoxvdalcmrrsxxmjr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ap2IKSLCxabTzVTQNbw45Q_iFBUaNJW';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixMismatches() {
  console.log('🔧 开始修复 mastery ID 不匹配问题...\n');
  
  // 加载词库
  const wordBank = JSON.parse(fs.readFileSync('./public/data/三年级上册.json', 'utf-8'));
  
  // 只处理当前词库中存在的单元
  const currentUnits = ['1', '2', '4', '5', '6'];
  
  // 构建正确的ID映射
  const correctIds = new Map(); // oldId -> newId
  
  wordBank.wordBank.forEach((item, idx) => {
    if (item.grade === '三年级' && item.semester === '上册' && currentUnits.includes(String(item.unit))) {
      const correctId = `3up-单元${item.unit}-${item.word}-${idx}`;
      
      // 检查常见的旧索引（可能因为词库扩展导致索引偏移）
      // 常见偏移：-1, -2 (词库之前少了几个词)
      [-2, -1, 0, 1, 2].forEach(offset => {
        if (offset !== 0) {
          const oldIdx = idx + offset;
          if (oldIdx >= 0) {
            const oldId = `3up-单元${item.unit}-${item.word}-${oldIdx}`;
            if (!correctIds.has(oldId)) {
              correctIds.set(oldId, correctId);
            }
          }
        }
      });
    }
  });
  
  console.log(`📚 生成ID映射数: ${correctIds.size}\n`);
  
  // 获取所有 mastery 记录
  console.log('📥 获取 mastery 记录...');
  const { data: records, error } = await supabase
    .from('mastery_records')
    .select('id, history, consecutive_green, temp_state, last_practice_date, updated_at')
    .limit(10000);
  
  if (error) {
    console.error('❌ 获取记录失败:', error);
    return;
  }
  
  console.log(`✅ 获取到 ${records.length} 条记录\n`);
  
  // 找出需要修复的记录（只修复当前词库中存在的词组）
  const toFix = [];
  
  records.forEach(r => {
    if (r.id.endsWith('-test')) return; // 跳过dev模式记录
    
    // 检查是否是当前词库单元的记录
    const isCurrentUnit = currentUnits.some(u => r.id.includes(`-单元${u}-`));
    if (!isCurrentUnit) return;
    
    const newId = correctIds.get(r.id);
    if (newId && newId !== r.id) {
      toFix.push({
        oldId: r.id,
        newId: newId,
        history: r.history,
        consecutive_green: r.consecutive_green,
        temp_state: r.temp_state,
        last_practice_date: r.last_practice_date,
        updated_at: r.updated_at
      });
    }
  });
  
  console.log(`🔍 需要修复的记录数: ${toFix.length}\n`);
  
  if (toFix.length === 0) {
    console.log('✅ 没有需要修复的记录');
    return;
  }
  
  // 显示需要修复的记录
  console.log('=== 需要修复的记录 ===');
  toFix.forEach(f => {
    console.log(`${f.oldId} -> ${f.newId}`);
  });
  
  // 确认修复
  console.log('\n确认修复这些ID? (y/n)');
  process.stdin.once('data', async (input) => {
    if (input.toString().trim().toLowerCase() === 'y') {
      console.log('\n🔄 开始修复...\n');
      
      for (const record of toFix) {
        // 先检查新ID是否已存在
        const { data: existing } = await supabase
          .from('mastery_records')
          .select('id')
          .eq('id', record.newId)
          .single();
        
        if (existing) {
          // 新ID已存在，合并数据
          console.log(`⚠️  合并: ${record.oldId} -> ${record.newId} (新ID已存在)`);
          // 这里可以选择保留新的或保留旧的，或者合并历史
          // 简单处理：保留原有的记录，不做任何操作
        } else {
          // 新ID不存在，更新ID
          const { error: updateError } = await supabase
            .from('mastery_records')
            .update({ id: record.newId })
            .eq('id', record.oldId);
          
          if (updateError) {
            console.error(`❌ 更新失败 ${record.oldId}:`, updateError);
          } else {
            console.log(`✅ 更新成功: ${record.oldId} -> ${record.newId}`);
          }
        }
      }
      
      console.log('\n🎉 修复完成！请刷新页面查看效果');
    } else {
      console.log('❌ 已取消');
    }
    
    process.exit(0);
  });
}

fixMismatches().catch(console.error);
