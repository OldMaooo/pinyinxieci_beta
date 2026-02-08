# 学期切换功能实现计划

## 目标
在应用顶部添加学期下拉选择器，支持动态加载不同学期的词库。

## 具体任务

### 任务1：添加学期常量和默认学期
在 `src/App.jsx` 第 9 行后面添加：
```javascript
// 学期列表常量
const SEMESTERS = ["一年级上册", "一年级下册", "二年级上册", "二年级下册", "三年级上册", "三年级下册"];

// 默认学期（从localStorage读取，如果没有则默认为三年级上册）
const DEFAULT_SEMESTER = localStorage.getItem('pinyin_selected_semester') || '三年级上册';

// 动态加载词库
async function loadWordBank(grade, semester) {
  try {
    const response = await fetch(`/data/${grade}${semester}.json`);
    const data = await response.json();
    return data.wordBank || [];
  } catch (error) {
    console.error('[App] Error loading word bank:', error);
    return [];
  }
}
```

### 任务2：添加 selectedSemester 状态
在 `src/App.jsx` 的 MainApp 函数中的 useState 声明区域（约第 428 行附近）添加：
```javascript
const [selectedSemester, setSelectedSemester] = useState(DEFAULT_SEMESTER);
const [wordBank, setWordBank] = useState([]);
```

### 任务3：添加 useEffect 监听学期变化
在 selectedSemester 状态声明后面添加：
```javascript
useEffect(() => {
  const loadWords = async () => {
    const grade = selectedSemester.includes('一') ? '一年级' :
                  selectedSemester.includes('二') ? '二年级' :
                  selectedSemester.includes('三') ? '三年级' : '一年级';
    const semester = selectedSemester.replace(grade, '');
    const words = await loadWordBank(grade, semester);
    setWordBank(words);
  };
  
  loadWords();
}, [selectedSemester]);
```

### 任务4：修改 processedUnits 定义
将现有的 DATA_BLUEPRINT 处理逻辑（约第 567 行）修改为使用 wordBank：
```javascript
const processedUnits = useMemo(() => {
  const unitsMap = {};
  wordBank.forEach(item => {
    if (!unitsMap[item.unit]) {
      unitsMap[item.unit] = [];
    }
    unitsMap[item.unit].push(item);
  });
  
  return Object.entries(unitsMap).map(([unitNum, items]) => {
    const name = items[0]?.lessonName || `单元${unitNum}`;
    const words = items.map((w, idx) => {
      const prefix = selectedSemester === '三年级上册' ? '3up' : selectedSemester;
      const baseId = `${prefix}-${name}-${w.word}-${idx}`;
      return { id: isDevMode ? `${baseId}-test` : baseId, word: w.word, pinyin: pinyin(String(w.word), { toneType: 'symbol' }) || '' };
    });
    return { name, words };
  });
}, [wordBank, selectedSemester, isDevMode]);
```

### 任务5：添加学期下拉选择器 UI
在 header 区域（约第 857 行附近）找到 `<h1 className="text-3xl font-black tracking-tighter text-black uppercase">听写练习</h1>`，在其后面添加：
```jsx
<select
  value={selectedSemester}
  onChange={(e) => {
    const newSemester = e.target.value;
    setSelectedSemester(newSemester);
    localStorage.setItem('pinyin_selected_semester', newSemester);
  }}
  className="px-3 py-1 border rounded bg-white text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
>
  {SEMESTERS.map(semester => (
    <option key={semester} value={semester}>
      {semester}
    </option>
  ))}
</select>
```

### 任务6：测试验证
1. 启动开发服务器
2. 检查应用是否正常运行
3. 在顶部找到学期下拉选择器
4. 选择"二年级上册"测试词库加载

## 文件路径
- `src/App.jsx` - 主应用文件
- `dist/data/` - JSON 词库文件目录

## 注意事项
- 三年级上册的 ID 格式保持不变（3up-前缀）
- 其他学期使用新的 ID 格式
- JSON 文件路径格式：`/data/${grade}${semester}.json`
