# 备份和恢复 Supabase 数据

## 背景

在进行数据库迁移之前，**必须先备份现有数据**。本计划包含两个脚本：
1. `scripts/backup-mastery-data.js` - 备份数据
2. `scripts/restore-mastery-data.js` - 恢复数据（如迁移失败）

---

## 第一步：手动运行备份脚本

### 1.1 创建备份脚本

在项目根目录运行：

```bash
cat > scripts/backup-mastery-data.js << 'EOF'
/**
 * 备份 Supabase 中的错题数据
 * 
 * 运行方式: node scripts/backup-mastery-data.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Supabase 配置
const SUPABASE_URL = 'https://ynasoxvdalcmrrsxxmjr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ap2IKSLCxabTzVTQNbw45Q_iFBUaNJW';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function backupMasteryData() {
  console.log('开始备份错题数据...\n');

  try {
    // 获取所有记录
    console.log('正在从 Supabase 获取数据...');
    const { data, error } = await supabase
      .from('mastery_records')
      .select('*')
      .range(0, 9999);

    if (error) {
      throw error;
    }

    console.log(`✓ 成功获取 ${data.length} 条记录\n`);

    // 按状态统计
    const stats = {
      total: data.length,
      mastered: 0,
      weak: 0,
      new: 0
    };

    data.forEach(record => {
      if (!record.history || record.history.length === 0) {
        stats.new++;
      } else if (record.history.slice(-3).includes('red')) {
        stats.weak++;
      } else {
        stats.mastered++;
      }
    });

    console.log('数据统计:');
    console.log(`  - 已掌握 (MASTERED): ${stats.mastered}`);
    console.log(`  - 薄弱 (WEAK): ${stats.weak}`);
    console.log(`  - 新词 (NEW): ${stats.new}`);
    console.log(`  - 总计: ${stats.total}\n`);

    // 生成时间戳
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `mastery-backup-${timestamp}.json`;
    const backupPath = path.join(__dirname, '..', 'backups', backupFilename);

    // 保存备份文件
    const backupData = {
      exportDate: new Date().toISOString(),
      source: SUPABASE_URL,
      totalRecords: data.length,
      stats: stats,
      records: data
    };

    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf-8');
    console.log(`✓ 备份已保存到: ${backupPath}\n`);

    // 同时保存一份简化版本
    const simplifiedFilename = `mastery-backup-simplified-${timestamp}.json`;
    const simplifiedPath = path.join(__dirname, '..', 'backups', simplifiedFilename);

    const simplifiedData = {
      exportDate: new Date().toISOString(),
      totalRecords: data.length,
      records: data.map(r => ({
        id: r.id,
        history: r.history,
        last_history_update_date: r.last_history_update_date
      }))
    };

    fs.writeFileSync(simplifiedPath, JSON.stringify(simplifiedData, null, 2), 'utf-8');
    console.log(`✓ 简化备份已保存到: ${simplifiedPath}\n`);

    // 列出所有备份文件
    const backupsDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const files = fs.readdirSync(backupsDir)
      .filter(f => f.startsWith('mastery-backup'))
      .sort()
      .reverse();

    console.log('现有备份文件:');
    files.forEach(f => {
      const filePath = path.join(backupsDir, f);
      const size = (fs.statSync(filePath).size / 1024).toFixed(2);
      console.log(`  - ${f} (${size} KB)`);
    });

    console.log('\n备份完成！✓');

  } catch (error) {
    console.error('备份失败:', error.message);
    process.exit(1);
  }
}

backupMasteryData();
EOF
```

### 1.2 创建 backups 目录

```bash
mkdir -p backups
```

### 1.3 运行备份脚本

```bash
node scripts/backup-mastery-data.js
```

**预期输出**:
```
开始备份错题数据...

正在从 Supabase 获取数据...
✓ 成功获取 XXX 条记录

数据统计:
  - 已掌握 (MASTERED): XX
  - 薄弱 (WEAK): XX
  - 新词 (NEW): XX
  - 总计: XX

✓ 备份已保存到: backups/mastery-backup-XXXX-XX-XX.json
✓ 简化备份已保存到: backups/mastery-backup-simplified-XXXX-XX-XX.json

现有备份文件:
  - mastery-backup-XXXX-XX-XX.json
  - mastery-backup-simplified-XXXX-XX-XX.json

备份完成！✓
```

---

## 第二步：验证备份文件

检查备份文件是否正确保存：

```bash
# 查看备份目录
ls -la backups/

# 查看备份内容（可选）
cat backups/mastery-backup-*.json | head -50
```

---

## 第三步：创建恢复脚本（以防万一）

```bash
cat > scripts/restore-mastery-data.js << 'EOF'
/**
 * 恢复 Supabase 中的错题数据
 * 
 * 运行方式: node scripts/restore-mastery-data.js <备份文件名>
 * 示例: node scripts/restore-mastery-data.js mastery-backup-2026-01-29.json
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Supabase 配置
const SUPABASE_URL = 'https://ynasoxvdalcmrrsxxmjr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ap2IKSLCxabTzVTQNbw45Q_iFBUaNJW';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 获取备份文件名
const backupFilename = process.argv[2];
if (!backupFilename) {
  console.error('用法: node scripts/restore-mastery-data.js <备份文件名>');
  console.error('示例: node scripts/restore-mastery-data.js mastery-backup-2026-01-29.json');
  process.exit(1);
}

const backupPath = path.join(__dirname, '..', 'backups', backupFilename);

if (!fs.existsSync(backupPath)) {
  console.error(`备份文件不存在: ${backupPath}`);
  process.exit(1);
}

async function restoreMasteryData() {
  console.log(`准备恢复数据从: ${backupFilename}\n`);

  try {
    // 读取备份文件
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
    console.log(`✓ 读取备份文件成功，共 ${backupData.records.length} 条记录\n`);

    // 确认恢复
    console.log('⚠️  警告：此操作将覆盖 Supabase 中的所有数据！');
    console.log('恢复的数据量: ' + backupData.records.length + ' 条\n');

    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question('确认恢复? (输入 "YES" 继续): ', resolve);
    });
    rl.close();

    if (answer !== 'YES') {
      console.log('已取消恢复操作');
      process.exit(0);
    }

    console.log('\n正在恢复数据...');

    // 准备 upsert 数据
    const upserts = backupData.records.map(r => ({
      id: r.id,
      history: r.history,
      last_history_update_date: r.last_history_update_date || r.last_history_update_date,
      temp_state: r.temp_state || { practice: 'white', self: 'white', final: 'white' },
      updated_at: new Date().toISOString()
    }));

    // 分批写入（每批 100 条）
    const batchSize = 100;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < upserts.length; i += batchSize) {
      const batch = upserts.slice(i, i + batchSize);
      const { error } = await supabase.from('mastery_records').upsert(batch);

      if (error) {
        console.error(`批量 ${i/batchSize + 1} 写入失败:`, error.message);
        failCount += batch.length;
      } else {
        successCount += batch.length;
        console.log(`  已恢复 ${successCount}/${upserts.length} 条...`);
      }
    }

    console.log(`\n✓ 恢复完成！`);
    console.log(`  - 成功: ${successCount}`);
    console.log(`  - 失败: ${failCount}`);

  } catch (error) {
    console.error('恢复失败:', error.message);
    process.exit(1);
  }
}

restoreMasteryData();
EOF
```

---

## 使用说明

### 备份数据
```bash
# 创建目录和脚本
mkdir -p backups
cat > scripts/backup-mastery-data.js <上面的脚本内容>

# 运行备份
node scripts/backup-mastery-data.js
```

### 恢复数据（如迁移失败）
```bash
# 查看可用备份
ls backups/mastery-backup-*.json

# 恢复数据
node scripts/restore-mastery-data.js mastery-backup-2026-01-29.json
```

---

## 备份文件说明

| 文件 | 用途 |
|------|------|
| `mastery-backup-YYYY-MM-DD.json` | 完整备份（包含所有字段） |
| `mastery-backup-simplified-YYYY-MM-DD.json` | 简化备份（仅 id + history） |

建议保留至少一份简化备份，体积更小，便于查看。

---

## 迁移失败时的恢复步骤

如果数据库迁移失败，按以下步骤恢复：

1. **停止应用**: 关闭正在运行的开发服务器
2. **确认备份**: 检查 `backups/` 目录中有备份文件
3. **运行恢复**:
   ```bash
   node scripts/restore-mastery-data.js <备份文件名>
   ```
4. **验证数据**: 打开应用，确认错题状态是否正确恢复
5. **联系支持**: 如果恢复后仍有问题，记录错误信息并寻求帮助

---

**生成时间**: 2026-01-29
