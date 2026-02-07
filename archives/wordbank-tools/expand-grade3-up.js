import { pinyin } from 'pinyin-pro';
import fs from 'fs';

// Read original data
const data = JSON.parse(fs.readFileSync('./public/data/三年级上册.json', 'utf-8'));

// Character to word mappings based on DATA_BLUEPRINT chars field
const charToWordMap = {
  "球": "打球", "呼": "招呼", "读": "读书",
  "笛": "笛子", "罚": "处罚", "互": "互相", "碰": "碰撞", "黄": "黄色",
  "急": "急忙", "庭": "庭院", "相": "相信", "未": "未来", "寒": "寒冷",
  "径": "小径", "斜": "倾斜", "枫": "枫叶", "霜": "严霜", "挑": "挑选",
  "深": "深沉", "落": "落下", "珠": "珍珠", "粘": "粘贴", "印": "印象",
  "案": "方案", "展": "展现", "凉": "凉快", "杏": "杏花", "枚": "一枚",
  "爽": "清爽", "挤": "拥挤", "争": "争取", "菊": "菊花", "频": "频度",
  "勾": "勾勒", "挖": "挖土", "油": "油画", "等": "等待", "钻": "钻孔",
  "爬": "爬行", "漂": "漂亮", "晒": "晾晒", "葫": "葫芦", "芦": "芦苇",
  "错": "错误", "普": "普通", "宫": "宫殿", "肯": "肯定", "冒": "冒险",
  "式": "形式", "极": "极致", "怜": "怜悯", "另": "另外", "晴": "晴天",
  "及": "及时", "卷": "试卷", "齿": "牙齿", "胃": "肠胃", "管": "管理",
  "刚": "刚才", "咬": "咬断", "申": "申请", "介": "介绍", "绍": "介绍",
  "宗": "祖宗", "旨": "宗旨", "占": "占据", "乏": "缺乏", "搭": "搭建",
  "亲": "亲人", "祖": "祖国", "披": "披上", "摇": "摇动", "停": "停止",
  "羽": "羽毛", "翠": "翠绿", "蓝": "蓝色", "吞": "吞咽", "蒲": "蒲公英",
  "英": "英雄", "耍": "玩耍", "使": "使用", "劲": "使劲", "脸": "脸庞",
  "欠": "欠钱", "朝": "朝向", "钓": "钓鱼", "察": "观察", "拢": "合拢",
  "喜": "喜欢", "景": "景象", "优": "优秀", "淡": "平淡", "浅": "深浅",
  "底": "底部", "岩": "岩松", "鹿": "梅花鹿", "划": "划分", "布": "棉布",
  "茂": "茂密", "密": "秘密", "厚": "宽厚", "料": "料理", "滨": "海滨",
  "棕": "棕色", "帆": "帆船", "灰": "灰色", "跟": "跟着", "渔": "渔民",
  "壳": "贝壳", "院": "院子", "亚": "亚热带", "透": "透明", "除": "除去",
  "踩": "踩踏", "抽": "抽象", "封": "封闭", "严": "严实", "挡": "遮挡",
  "坛": "花坛", "显": "显得", "苍": "苍翠", "药": "药材", "材": "材料",
  "软": "柔软", "刮": "刮风", "捉": "捕捉", "返": "返回", "望": "希望",
  "断": "中断", "楚": "清楚", "至": "至少", "岸": "岸边", "孤": "孤独",
  "饮": "饮料", "亦": "亦可", "欲": "欲望", "抹": "抹去", "宜": "宜人",
  "妙": "美妙", "奏": "演奏", "琴": "手风琴", "柔": "柔和", "感": "感谢",
  "充": "充足", "威": "威力", "器": "乐器", "汇": "汇集", "鸣": "鸣叫",
  "塘": "池塘", "虾": "小虾", "昆": "昆虫", "仅": "仅仅", "序": "有序",
  "荣": "荣誉", "枯": "枯萎", "姿": "姿势", "态": "态度", "刺": "刺激",
  "梨": "梨树", "部": "部分", "奥": "奥秘", "秘": "秘密", "螺": "田螺",
  "螃": "螃蟹", "蟹": "螃蟹", "鲤": "鲤鱼", "鲫": "鲫鱼", "鲨": "鲨鱼",
  "司": "司机", "联": "联合", "步": "步骤", "登": "登山", "跌": "跌倒",
  "皆": "皆知", "弃": "放弃", "持": "持久", "击": "打击", "念": "念书",
  "差": "差别", "考": "考试", "试": "试题", "均": "平均", "退": "后退",
  "努": "努力", "单": "单位", "留": "留心", "度": "态度", "奋": "奋斗",
  "棒": "木棒", "伤": "伤害", "陆": "陆地", "血": "血液", "取": "取消",
  "盘": "盘子", "匆": "匆忙", "医": "医生", "速": "速度", "夺": "夺取",
  "秒": "秒表", "睁": "睁眼", "眨": "眨眼", "瞪": "瞪眼", "瞅": "瞅见",
  "怒": "发怒", "眶": "眼眶", "呆": "发呆", "睹": "目睹"
};

// DATA_BLUEPRINT units with chars field
const units = [
  { unit: 1, chars: "球招呼读" },
  { unit: 2, chars: "笛罚互碰黄" },
  { unit: 4, chars: "庭相未寒径斜枫霜挑深" },
  { unit: 5, chars: "珠粘印案展" },
  { unit: 6, chars: "凉杏枚爽挤争菊勾挖油" },
  { unit: 8, chars: "等哦钻爬漂晒" },
  { unit: 11, chars: "葫芦错普宫肯冒式" },
  { unit: 12, chars: "另晴及卷齿胃管刚咬" },
  { unit: 14, chars: "搭亲祖披摇停蓝吞" },
  { unit: 15, chars: "蒲英耍脸欠" },
  { unit: 16, chars: "淡浅底划布厚料" },
  { unit: 17, chars: "滨棕帆灰跟渔壳院亚透除踩" },
  { unit: 18, chars: "抽封严挡坛显苍软刮捉" },
  { unit: 20, chars: "返望断楚至岸孤饮亦欲抹宜" },
  { unit: 21, chars: "妙奏琴柔感充威器汇鸣塘" },
  { unit: 22, chars: "虾昆仅序荣枯姿态刺梨部" },
  { unit: 23, chars: "司登跌皆弃持击" },
  { unit: 24, chars: "念差均退努单留度奋" },
  { unit: 25, chars: "棒伤陆血取盘匆医迅速夺秒" },
  { unit: 26, chars: "睁眨瞪瞅怒眶呆睹" }
];

// Create a map of existing words per unit
const existingWordsByUnit = {};
data.wordBank.forEach(item => {
  if (!existingWordsByUnit[item.unit]) {
    existingWordsByUnit[item.unit] = new Set();
  }
  existingWordsByUnit[item.unit].add(item.word);
});

// Add expanded words
let addedCount = 0;
const newWordBank = [...data.wordBank];

units.forEach(({ unit, chars }) => {
  [...chars].forEach((char, idx) => {
    const phrase = charToWordMap[char] || char;
    
    // Check if this word already exists in the unit
    if (existingWordsByUnit[unit] && existingWordsByUnit[unit].has(phrase)) {
      return; // Skip if already exists
    }
    
    // Add the new word
    newWordBank.push({
      word: phrase,
      pinyin: pinyin(phrase, { toneType: 'symbol' }) || '',
      grade: "三年级",
      semester: "上册",
      unit: unit
    });
    
    addedCount++;
    if (!existingWordsByUnit[unit]) {
      existingWordsByUnit[unit] = new Set();
    }
    existingWordsByUnit[unit].add(phrase);
  });
});

// Update the data
data.wordBank = newWordBank;
data.count = newWordBank.length;
data.buildDate = new Date().toISOString();

// Write back
fs.writeFileSync('./public/data/三年级上册.json', JSON.stringify(data, null, 2, '\n'));

console.log(`✅ Expanded 三年级上册.json`);
console.log(`   Original words: ${data.count - addedCount}`);
console.log(`   Added words: ${addedCount}`);
console.log(`   Total words: ${data.count}`);
