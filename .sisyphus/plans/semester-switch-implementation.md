## 实现计划：学期切换功能

## 目标
1. 添加学期下拉选择器到应用顶部
2. 添加selectedSemester状态管理
3. 添加loadWordBank函数动态加载不同学期的词库
4. 修改DATA_BLUEPRINT处理逻辑，根据选择的学期加载对应数据
5. 测试二年级上册词库加载

## 实现步骤

### 步骤1：添加学期常量
在App.jsx文件顶部（第10-25行左右）添加：
```javascript
// 学期列表常量
const SEMESTERS = ["一年级上册", "一年级下册", "二年级上册", "二年级下册", "三年级上册", "三年级下册"];

// 默认学期（从localStorage读取，如果没有则默认为三年级上册）
const DEFAULT_SEMESTER = localStorage.getItem('pinyin_selected_semester') || "三年级上册";
```

### 步骤2：添加selectedSemester状态
在useState声明区域添加：
```javascript
const [selectedSemester, setSelectedSemester] = useState(DEFAULT_SEMESTER);
```

### 步骤3：添加loadWordBank函数
在函数声明区域添加：
```javascript
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

### 步骤4：修改DATA_BLUEPRINT处理逻辑
找到DATA_BLUEPRINT的处理逻辑（约第428行附近），修改为动态加载：
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

### 步骤5：添加学期下拉选择器UI
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

### 步骤6：更新版本号
修改第681行左右的版本号显示

### 步骤7：测试验证
1. 启动开发服务器
2. 选择"二年级上册"
3. 检查词库是否正确加载
4. 检查练习功能是否正常

## 注意事项
- 保持三年级上册的ID格式不变（3up-前缀）
- 其他学期使用新的ID格式（年级-单元X-词名-序号）
- 确保JSON文件路径正确：`/data/${grade}${semester}.json`
