## 实现计划：学期切换功能

## 目标
添加学期下拉选择器，支持动态加载不同学期的词库

## 实现步骤

### 步骤1：添加学期常量和默认学期
在App.jsx文件顶部（第10-25行左右）添加：

```javascript
// 学期列表常量
const SEMESTERS = ["一年级上册", "一年级下册", "二年级上册", "二年级下册", "三年级上册", "三年级下册"];

// 默认学期（从localStorage读取，如果没有则默认为三年级上册）
const DEFAULT_SEMESTER = localStorage.getItem('pinyin_selected_semester') || '三年级上册';
```

### 步骤2：添加selectedSemester状态和loadWordBank函数
在useState声明区域（第428行附近）添加：

```javascript
// 学期状态
const [selectedSemester, setSelectedSemester] = useState(DEFAULT_SEMESTER);

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

### 步骤3：修改DATA_BLUEPRINT处理逻辑
找到DATA_BLUEPRINT的处理逻辑（约第428行），修改为：

```javascript
const wordBank = useMemo(async () => {
  const grade = selectedSemester.includes('一') ? '一年级' :
                selectedSemester.includes('二') ? '二年级' :
                selectedSemester.includes('三') ? '三年级' : '一年级';
  const semester = selectedSemester.replace(grade, '');
  const words = await loadWordBank(grade, semester);
  return words;
}, [selectedSemester]);
```

### 步骤4：添加学期下拉选择器UI
在header区域（约第812行附近）添加下拉选择器：

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

### 步骤5：更新版本号显示
找到显示版本号的位置（第681行左右），修改版本号。

## 注意事项
- 保持三年级上册的ID格式不变（3up-前缀）
- 其他学期使用新的ID格式（年级-单元X-词名-序号）
- JSON文件路径：`/data/${grade}${semester}.json`
- 用户选择的学期会保存到localStorage

## 测试步骤
1. 启动开发服务器
2. 检查应用是否正常运行
3. 尝试切换到"二年级上册"
4. 检查词库是否正确加载
