import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LogOut, Check, X, Eye, EyeOff, Save, Volume2, Play, Pause, SkipBack, SkipForward, Plus, Minus, MousePointerClick, Loader2, Cloud, AlertCircle, RefreshCw, Monitor, VolumeX, Moon, Sun, Grid, Edit3 } from 'lucide-react';
import { pinyin } from 'pinyin-pro';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ynasoxvdalcmrrsxxmjr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ap2IKSLCxabTzVTQNbw45Q_iFBUaNJW';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DATA_BLUEPRINT = [
    { title: "单元1", vocab: ["山坡", "学校", "飘扬", "课文", "声音", "招引", "热闹", "古老", "粗壮", "枝干", "洁白"], chars: "球招呼读" },
    { title: "单元2", vocab: ["轰响", "阵雨", "湿润", "风笛", "狂欢", "觉得", "功课", "放学", "老师", "急急忙忙"], chars: "笛罚互碰黄" },
    { title: "单元4", vocab: [], chars: "庭相未寒径斜枫霜挑深" },
    { title: "单元5", vocab: ["秋风", "放晴", "明朗", "地面", "亮晶晶", "落叶", "图案", "闪闪发光", "尽头", "排列", "规则", "凌乱", "歌唱", "迟到"], chars: "珠粘印案展" },
    { title: "单元6", vocab: ["秋天", "清凉", "炎热", "枫树", "邮票", "凉爽", "果树", "菊花", "仙子", "频频", "气味", "香甜", "松果", "丰收"], chars: "凉杏枚爽挤争菊勾挖油" },
    { title: "单元8", vocab: ["门板", "准备", "旁边", "暴风雨", "安心", "低头", "吃力", "再见", "母鸡", "注意", "屋子", "漂亮", "意思", "因此"], chars: "等哦钻爬漂晒" },
    { title: "语文园地1", vocab: ["恒心", "神圣", "萌发", "妥当", "车轴", "阁楼", "培植", "厘米"], chars: "" },
    { title: "单元11", vocab: ["声明", "神仙", "普通", "让步", "条件", "指甲", "得到", "衣服", "所以", "要是", "同学", "可怜", "最好", "科学"], chars: "葫芦错普宫肯冒式" },
    { title: "单元12", vocab: ["旅行", "要好", "答应", "做梦", "来得及", "救命", "大吃一惊", "尾巴", "牙齿", "肚皮", "食物", "消化", "当然", "刚才", "知觉", "光亮"], chars: "另晴及卷齿胃管刚咬" },
    { title: "语文园地2", vocab: ["申请", "介绍", "主旨", "占领", "乏力"], chars: "" },
    { title: "单元14", vocab: ["母亲", "外祖父", "船夫", "羽毛", "翠绿", "静悄悄", "翠鸟", "捕鱼"], chars: "搭亲祖披摇停蓝吞" },
    { title: "单元15", vocab: ["草地", "蒲公英", "盛开", "玩耍", "一本正经", "使劲", "钓鱼", "观察", "合拢", "张开", "喜爱"], chars: "蒲英耍脸欠" },
    { title: "单元16", vocab: ["风景", "优美", "物产", "交错", "岩石", "鹿角", "成群结队", "布满", "条纹", "周身", "皮球", "茂密", "肥料", "祖国", "事业", "发展"], chars: "淡浅底划布厚料" },
    { title: "单元17", vocab: ["海滨", "街道", "交界", "水平线", "机帆船", "来来往往", "朝阳", "渔民", "贝壳", "汽笛", "出海", "银光闪闪", "庭院", "亚热带", "散发", "打扫", "干净"], chars: "滨棕帆灰跟渔壳院亚透除踩" },
    { title: "单元18", vocab: ["东北", "密密层层", "严严实实", "视线", "山谷", "起来", "照射", "各种各样", "花坛", "显得", "苍翠", "药材", "捕捉", "野兔", "景色", "宝库"], chars: "抽封严挡坛显苍软刮捉" },
    { title: "单元20", vocab: [], chars: "返望断楚至岸孤饮亦欲抹宜" },
    { title: "单元21", vocab: ["大自然", "美妙", "音乐家", "手风琴", "歌手", "感受", "温柔", "合奏", "充满", "威力", "乐器", "屋顶", "河流", "轻快", "合唱", "水塘"], chars: "妙奏琴柔感充威器汇鸣塘" },
    { title: "单元22", vocab: ["昆虫", "万物", "沉思", "搬家", "井然有序", "精神", "植物", "千姿百态", "鲜美", "池塘", "秋高气爽", "倒映", "游玩", "画册", "无穷", "奥秘", "无尽"], chars: "虾昆仅序荣枯姿态刺梨部" },
    { title: "语文园地3", vocab: ["田螺", "螃蟹", "鲤鱼", "鲫鱼", "鲨鱼"], chars: "螺螃蟹鲤鲫鲨" },
    { title: "单元23", vocab: [], chars: "司登跌皆弃持击" },
    { title: "单元24", vocab: ["生物", "从事", "成就", "学期", "考试", "再三", "同意", "难得", "值班", "努力", "留学", "国家", "落后", "地位", "环节", "难度", "刻苦", "兴奋"], chars: "念差均退努单留度奋" },
    { title: "单元25", vocab: ["手术台", "阵地", "战斗", "打响", "消灭", "伤员", "陆续", "血丝", "匆匆", "医生", "转告", "赶忙", "迅速", "迅速", "夺秒", "连续"], chars: "棒伤陆血取盘匆医迅速夺秒" },
    { title: "语文园地4", vocab: ["怒目圆睁", "眨眼", "眼眶", "目瞪口呆", "耳闻目睹"], chars: "睁眨瞪瞅怒眶呆睹" }
];

const charToWordMap = {"球":"打球", "呼":"招呼", "读":"读书", "笛":"笛子", "罚":"处罚", "互":"互相", "碰":"碰撞", "黄":"黄色", "急":"急忙", "庭":"庭院", "相":"相信", "未":"未来", "寒":"寒冷", "径":"小径", "斜":"倾斜", "枫":"枫叶", "霜":"严霜", "挑":"挑选", "深":"深沉", "落":"落下", "珠":"珍珠", "粘":"粘贴", "印":"印象", "案":"方案", "展":"展现", "凉":"凉快", "杏":"杏花", "枚":"一枚", "爽":"清爽", "挤":"拥挤", "争":"争取", "菊":"菊花", "频":"频度", "勾":"勾勒", "挖":"挖土", "油":"油画", "等":"等待", "钻":"钻孔", "爬":"爬行", "漂":"漂亮", "晒":"晾晒", "葫":"葫芦", "芦":"芦苇", "错":"错误", "普":"普通", "宫":"宫殿", "肯":"肯定", "冒":"冒险", "式":"形式", "极":"极致", "怜":"怜悯", "另":"另外", "晴":"晴天", "及":"及时", "卷":"试卷", "齿":"牙齿", "胃":"肠胃", "管":"管理", "刚":"刚才", "咬":"咬断", "申":"申请", "介":"介绍", "绍":"介绍", "宗":"祖宗", "旨":"宗旨", "占":"占据", "乏":"缺乏", "搭":"搭建", "亲":"亲人", "祖":"祖国", "披":"披上", "摇":"摇动", "停":"停止", "羽":"羽毛", "翠":"翠绿", "蓝":"蓝色", "吞":"吞咽", "蒲":"蒲公英", "英":"英雄", "耍":"玩耍", "使":"使用", "劲":"使劲", "脸":"脸庞", "欠":"欠钱", "朝":"朝向", "钓":"钓鱼", "察":"观察", "拢":"合拢", "喜":"喜欢", "景":"景象", "优":"优秀", "淡":"平淡", "浅":"深浅", "底":"底部", "岩":"岩松", "鹿":"梅花鹿", "划":"划分", "布":"棉布", "茂":"茂密", "密":"秘密", "厚":"宽厚", "料":"料理", "滨":"海滨", "棕":"棕色", "帆":"帆船", "灰":"灰色", "跟":"跟着", "渔":"渔民", "壳":"贝壳", "院":"院子", "亚":"亚热带", "透":"透明", "除":"除去", "踩":"踩踏", "抽":"抽象", "封":"封闭", "严":"严实", "挡":"遮挡", "坛":"花坛", "显":"显得", "苍":"苍翠", "药":"药材", "材":"材料", "软":"柔软", "刮":"刮风", "捉":"捕捉", "返":"返回", "望":"希望", "断":"中断", "楚":"清楚", "至":"至少", "岸":"岸边", "孤":"孤独", "饮":"饮料", "亦":"亦可", "欲":"欲望", "抹":"抹去", "宜":"宜人", "妙":"美妙", "奏":"演奏", "琴":"手风琴", "柔":"柔和", "感":"感谢", "充":"充足", "威":"威力", "器":"乐器", "汇":"汇集", "鸣":"鸣叫", "塘":"池塘", "虾":"小虾", "昆":"昆虫", "仅":"仅仅", "序":"有序", "荣":"荣誉", "枯":"枯萎", "姿":"姿势", "态":"态度", "刺":"刺激", "梨":"梨树", "部":"部分", "奥":"奥秘", "秘":"秘密", "螺":"田螺", "螃":"螃蟹", "蟹":"螃蟹", "鲤":"鲤鱼", "鲫":"鲫鱼", "鲨":"鲨鱼", "司":"司机", "联":"联合", "步":"步骤", "登":"登山", "跌":"跌倒", "皆":"皆知", "弃":"放弃", "持":"持久", "击":"打击", "念":"念书", "差":"差别", "考":"考试", "试":"试题", "均":"平均", "退":"后退", "努":"努力", "单":"单位", "留":"留心", "度":"态度", "奋":"奋斗", "棒":"木棒", "伤":"伤害", "陆":"陆地", "血":"血液", "取":"取消", "盘":"盘子", "匆":"匆忙", "医":"医生", "迅速":"迅速", "速":"速度", "夺":"夺取", "秒":"秒表", "睁":"睁眼", "眨":"眨眼", "瞪":"瞪眼", "瞅":"瞅见", "怒":"发怒", "眶":"眼眶", "呆":"发呆", "睹":"目睹"};

// --- 错误边界 ---
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("Uncaught error:", error, errorInfo); }
  render() {
    if (this.state.hasError) return <div className="p-8 text-red-600 bg-red-50 h-screen overflow-auto font-mono text-sm"><h1 className="text-xl font-bold mb-4">应用崩溃检测器</h1><pre className="whitespace-pre-wrap">{this.state.error?.toString()}</pre></div>;
    return this.props.children;
  }
}

const AnalogClock = () => {
  const [t, setT] = useState(new Date());
  useEffect(() => { const timer = setInterval(() => setT(new Date()), 1000); return () => clearInterval(timer); }, []);
  const hDeg = (t.getHours() % 12 + t.getMinutes() / 60) * 30;
  const mDeg = (t.getMinutes() + t.getSeconds() / 60) * 6;
  return (
    <svg width="24" height="24" viewBox="0 0 100 100" className="text-black opacity-90">
      <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="4" />
      {[...Array(12)].map((_, i) => (<line key={i} x1="50" y1="0" x2="50" y2="10" stroke="currentColor" strokeWidth="5" transform={`rotate(${i * 30} 50 50)`} />))}
      <line x1="50" y1="50" x2="50" y2="25" stroke="currentColor" strokeWidth="7" strokeLinecap="round" transform={`rotate(${hDeg} 50 50)`} />
      <line x1="50" y1="50" x2="50" y2="15" stroke="currentColor" strokeWidth="7" strokeLinecap="round" transform={`rotate(${mDeg} 50 50)`} />
      <circle cx="50" cy="50" r="6" fill="currentColor" />
    </svg>
  );
};

const Modal = ({ isOpen, onClose, onConfirm, title, content }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-6"><h3 className="text-xl font-black text-black mb-2 text-center">{title}</h3><div className="text-slate-500 mb-6 font-medium leading-relaxed text-center">{content}</div><div className="flex gap-3"><button onClick={onClose} className="flex-1 py-3 rounded-lg font-bold text-slate-500 bg-slate-100">取消</button><button onClick={onConfirm} className="flex-1 py-3 rounded-lg font-bold text-white bg-black">确定</button></div></div>
    </div>
  );
};

const StrokeOrderPlayer = ({ word, onClose }) => {
  const containerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const chars = word.split('');
  const [writerInstance, setWriterInstance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!window.HanziWriter) {
        const t = setTimeout(() => { if (!window.HanziWriter) setIsLoading(false); }, 3000);
        return () => clearTimeout(t);
    }
    if (!containerRef.current) return;
    setIsLoading(false);
    containerRef.current.innerHTML = ''; 
    try {
        const writer = window.HanziWriter.create(containerRef.current, chars[currentIndex], {
          width: 200, height: 200, padding: 5, strokeAnimationSpeed: 1, delayBetweenStrokes: 200, showOutline: true, strokeColor: '#000000', outlineColor: '#e2e8f0'
        });
        writer.animateCharacter();
        setWriterInstance(writer);
    } catch (e) { console.error(e); }
  }, [currentIndex, word]);

  return (
    <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-8 shadow-2xl flex flex-col items-center gap-6 relative max-w-sm w-full animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-300 hover:text-black transition-colors"><X size={24}/></button>
        <div className="text-slate-400 font-bold text-lg mb-2">笔顺演示</div>
        <div ref={containerRef} className="bg-slate-50 rounded-xl border border-slate-100 shadow-inner w-[200px] h-[200px] flex items-center justify-center">{isLoading && <Loader2 className="animate-spin text-slate-300" />}</div>
        <div className="flex gap-2 w-full">{chars.map((c, i) => (<button key={i} onClick={() => setCurrentIndex(i)} className={`flex-1 py-3 rounded-xl font-bold transition-all ${currentIndex === i ? 'bg-black text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{c}</button>))}</div>
        <button onClick={() => writerInstance?.animateCharacter()} className="w-full py-4 bg-emerald-500 text-white rounded-xl font-black shadow-lg">重新演示</button>
      </div>
    </div>
  );
};

const AnswerCard = ({ word, onClose, onAutoNext }) => {
  if (!word) return null;
  const handleClose = () => {
    onClose();
    onAutoNext && onAutoNext();
  };
  return (
    <div
      className="fixed inset-0 z-[5000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={handleClose}
    >
      <div
        className="bg-white p-12 px-20 rounded-lg shadow-2xl flex items-center justify-center animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[10rem] font-black font-kaiti text-black leading-none">
          {word.word}
        </span>
      </div>
    </div>
  );
};

const FlashCardView = ({ words, onClose }) => {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(5000);
  const [soundOn, setSoundOn] = useState(true);
  const [volume, setVolume] = useState(1.0);
  const [showControls, setShowControls] = useState(true);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('pinyin_flash_dark') === 'true');
  const timerRef = useRef(null);
  const fadeRef = useRef(null);
  const wordElementRef = useRef(null);
  const wordStartTimeRef = useRef(null);
  const [wordProgress, setWordProgress] = useState(0);

  const currentWord = words[index];
  useEffect(() => { localStorage.setItem('pinyin_flash_dark', isDarkMode); }, [isDarkMode]);

  const speak = (text) => {
    if (!soundOn || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setTimeout(() => {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'zh-CN'; u.rate = 0.8; u.volume = volume;
        const premiumVoice = window.speechSynthesis.getVoices().find(v => v.name.includes('Yue') || v.name.includes('月'));
        if (premiumVoice) u.voice = premiumVoice;
        window.speechSynthesis.speak(u);
    }, 10);
  };

  const calculateFontSize = (containerWidth, textLength) => {
    const baseSize = containerWidth * 0.8;
    const adjustedSize = baseSize / Math.max(1, textLength * 0.3);
    return Math.min(Math.max(adjustedSize, 24), 300);
  };

  useEffect(() => {
    const loadVoices = () => { window.speechSynthesis.getVoices(); };
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  useEffect(() => { speak(currentWord.word); }, [index]);
  useEffect(() => { if (isPlaying) { timerRef.current = setInterval(() => { setIndex(prev => (prev + 1) % words.length); }, speed); } return () => clearInterval(timerRef.current); }, [isPlaying, speed, words.length]);

  useEffect(() => {
    setWordProgress(0);
    wordStartTimeRef.current = Date.now();
    const progressInterval = setInterval(() => {
      if (wordStartTimeRef.current && isPlaying) {
        const elapsed = Date.now() - wordStartTimeRef.current;
        const progress = Math.min((elapsed / speed) * 100, 100);
        setWordProgress(progress);
      }
    }, 50);
    return () => clearInterval(progressInterval);
  }, [index, speed, isPlaying]);

  const handleInteraction = () => { setShowControls(true); if (fadeRef.current) clearTimeout(fadeRef.current); fadeRef.current = setTimeout(() => setShowControls(false), 6000); };
  useEffect(() => { handleInteraction(); }, []);

  useEffect(() => {
    if (!wordElementRef.current) return;

    const updateFontSize = () => {
      const parent = wordElementRef.current.parentElement;
      if (!parent) return;
      const containerWidth = parent.offsetWidth;
      const textLength = currentWord.word.length;
      const newSize = calculateFontSize(containerWidth, textLength);
      wordElementRef.current.style.fontSize = `${newSize}px`;
    };

    updateFontSize();

    const resizeObserver = new ResizeObserver(() => {
      updateFontSize();
    });
    resizeObserver.observe(wordElementRef.current.parentElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [currentWord.word, isDarkMode]);

  const next = (e) => { e.stopPropagation(); setIndex((index + 1) % words.length); handleInteraction(); };
  const prev = (e) => { e.stopPropagation(); setIndex((index - 1 + words.length) % words.length); handleInteraction(); };

  return (
    <div
      className={`fixed inset-0 z-[2000] flex flex-col items-center justify-center overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-black' : 'bg-slate-100'}`}
      onClick={handleInteraction}
      onDoubleClick={() => setIsPlaying(!isPlaying)}
    >
      <div className="absolute top-0 left-0 w-full p-4 flex flex-col items-center gap-1 z-[3000]">
        <div className={`font-mono font-black text-xl ${isDarkMode ? 'text-white/80' : 'text-slate-600'}`}>{index + 1} / {words.length}</div>
        <div className={`h-[4px] w-[200px] rounded-full overflow-hidden ${isDarkMode ? 'bg-white/30' : 'bg-slate-300'}`}>
          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${wordProgress}%` }} />
        </div>
      </div>
      <div className="flex flex-col items-center justify-center flex-1 w-full pointer-events-none px-4">
        <div ref={wordElementRef} className={`font-kaiti font-black leading-none transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>{currentWord.word}</div>
      </div>
      <div className="absolute inset-y-0 left-0 w-1/4 z-10 cursor-pointer hover:bg-white/5" onClick={prev} style={{cursor: 'pointer'}} />
      <div className="absolute inset-y-0 right-0 w-1/4 z-10 cursor-pointer hover:bg-white/5" onClick={next} style={{cursor: 'pointer'}} />
      
      <div className={`absolute top-0 left-0 w-full p-8 flex justify-between items-start pointer-events-auto z-[2050] transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <button onClick={onClose} className={`p-4 rounded-full backdrop-blur shadow-xl ${isDarkMode ? 'bg-white/10 text-white' : 'bg-black/5 text-black'}`}><LogOut size={32}/></button>
        <button onClick={(e) => { e.stopPropagation(); setIsDarkMode(!isDarkMode); }} className={`p-4 rounded-full backdrop-blur shadow-xl ${isDarkMode ? 'bg-white/10 text-white' : 'bg-black/5 text-black'}`}>{isDarkMode ? <Sun size={32}/> : <Moon size={32}/>}</button>
      </div>

      <div className={`absolute inset-0 flex flex-col justify-end pointer-events-none transition-opacity duration-500 z-[2040] ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="p-8 flex flex-col gap-6 items-center pointer-events-auto">
          {showThumbnails && (
            <div className="w-full flex gap-2 overflow-x-auto pb-4 px-4 mask-fade-edges scrollbar-hide">
              {words.map((w, i) => (
                <button key={i} onClick={() => setIndex(i)} className={`shrink-0 w-16 h-[100px] rounded-xl font-kaiti flex items-center justify-center transition-all ${index === i ? 'bg-white text-black font-black text-2xl shadow-lg' : (isDarkMode ? 'bg-white/10 text-white/40 text-xl' : 'bg-black/5 text-black/40 text-xl')}`}>{w.word[0]}</button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-8 px-10 py-6">
            <div className="flex items-center gap-4 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full">
              <input type="range" min="3000" max="20000" step="500" value={speed} onChange={e => setSpeed(Number(e.target.value))} className="w-24 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white" />
              <span className="text-white font-mono font-black text-sm w-8 text-right">{speed/1000}s</span>
            </div>
            <button onClick={() => setIsPlaying(!isPlaying)} className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-2xl active:scale-95 transition-transform">{isPlaying ? <Pause size={40} fill="black"/> : <Play size={40} fill="black" className="ml-1"/>}</button>
            <button onClick={() => setSoundOn(!soundOn)} className={`p-4 rounded-full transition-colors bg-black/20 backdrop-blur-md ${soundOn ? 'text-white' : 'text-white/30'}`}>{soundOn ? <Volume2 size={24}/> : <VolumeX size={24}/>}</button>
            <button onClick={() => setShowThumbnails(!showThumbnails)} className={`p-4 rounded-full transition-colors bg-black/20 backdrop-blur-md ${showThumbnails ? 'text-white' : 'text-white/50'}`}><Grid size={24}/></button>
          </div>
        </div>
      </div>
    </div>
  );
};

const WordRow = ({ item, index, step, onUpdate, setHintWord, showAnswer, isVoiceActive, activeIndex, onStartVoice, progress, isShuffling, onShowStroke, onShowAnswer }) => {
  const handleBoxClick = (e, type) => {
    e.stopPropagation();
    if ((step === 0 && type !== 'markPractice') || (step === 1 && type !== 'markSelf') || (step === 2 && type !== 'markFinal')) return;
    let next = item[type] === 'white' ? 'red' : (type === 'markFinal' && item[type] === 'red' ? 'green' : 'white');
    onUpdate(item.id, type, next);
  };
  const focusOnAnswer = (step === 0 && showAnswer) || (step === 2);
  if (!item || !item.pinyin) return <div className="h-24" />;
  const isActive = isVoiceActive && activeIndex === index;
  const isWaiting = isVoiceActive && activeIndex === -1;

  return (
    <div onClick={() => isWaiting && onStartVoice(index)} className={`flex flex-col items-center border-b border-slate-200 pb-6 mb-0 w-full overflow-hidden relative transition-all duration-300 ${isActive ? 'bg-blue-50' : ''} ${isWaiting ? 'hover:bg-blue-50/30 cursor-pointer ring-2 ring-blue-400 ring-dashed ring-opacity-50 rounded-lg' : ''} ${isShuffling ? 'opacity-50 scale-95 blur-[1px]' : 'opacity-100 scale-100 blur-0'}`}>
      <div className="no-wrap-box relative select-none touch-none flex flex-col justify-end items-center transition-all duration-300 w-full overflow-hidden" style={{ minHeight: focusOnAnswer ? '94px' : '49px' }}>
        <div className={`font-bold font-kaiti tracking-tight leading-none transition-all ${focusOnAnswer ? 'opacity-30 mb-1 text-[14px]' : 'text-black text-[32px]'} ${isActive ? 'text-blue-600' : ''}`}>{item.pinyin}</div>
        <div onClick={(e) => { e.stopPropagation(); onShowStroke && onShowStroke(item.word); }} className={`font-kaiti text-black font-bold leading-none transition-all cursor-pointer hover:text-blue-600 ${focusOnAnswer ? 'opacity-100 text-[64px] mt-1' : 'opacity-0 h-0 overflow-hidden'}`}>{item.word}</div>
      </div>
      <div className="flex justify-center items-center gap-2 mt-2 w-full">
        <span className="text-[10px] font-mono text-slate-300 italic">{index + 1}</span>
        <div onClick={(e) => handleBoxClick(e, 'markPractice')} className={`w-8 h-8 border border-black rounded-sm transition-colors ${item.markPractice === 'red' ? 'bg-red-500 border-red-600 shadow-inner' : 'bg-white'}`} />
        {step >= 1 && <div onClick={(e) => handleBoxClick(e, 'markSelf')} className={`w-8 h-8 border border-black rounded-sm transition-colors ${item.markSelf === 'red' ? 'bg-red-500 border-red-600 shadow-inner' : 'bg-white'}`} />}
        {step >= 2 && <div onClick={(e) => handleBoxClick(e, 'markFinal')} className={`w-8 h-8 border-2 border-black rounded-sm cursor-pointer flex items-center justify-center transition-colors ml-1 ${item.markFinal === 'green' ? 'bg-emerald-500 border-emerald-600' : item.markFinal === 'red' ? 'bg-red-500 border-red-600 shadow-inner' : 'bg-white'}`}>{item.markFinal === 'green' && <Check className="text-white w-5 h-5" strokeWidth={4} />}{item.markFinal === 'red' && <X className="text-white w-5 h-5" strokeWidth={4} />}</div>}
      </div>
      {isActive && <div className="absolute bottom-0 left-0 w-full h-[4px] bg-slate-100"><div className="h-full bg-blue-600 transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} /></div>}
    </div>
  );
};

export default function App() {
  return <ErrorBoundary><MainApp /></ErrorBoundary>;
}

function MainApp() {
  const [view, setView] = useState('SETUP'); 
  const [step, setStep] = useState(0); 
  const [selectedUnits, setSelectedUnits] = useState(() => { const saved = localStorage.getItem('pinyin_selected_units'); return saved ? new Set(JSON.parse(saved)) : new Set(['单元1']); });
  const [onlyWrong, setOnlyWrong] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false); 
  const [showStrokeOrder, setShowStrokeOrder] = useState(false);
  const [strokeTarget, setStrokeTarget] = useState(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false });
  const [hintWord, setHintWord] = useState(null);
  const [time, setTime] = useState(0);
  const [words, setWords] = useState([]);
  const [mastery, setMastery] = useState({});
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voiceInterval, setVoiceInterval] = useState(20);
  const [activeVoiceIndex, setActiveVoiceIndex] = useState(-1);
  const [volume, setVolume] = useState(1.0);
  const [progress, setProgress] = useState(0);
  const [filterWrong, setFilterWrong] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [isShuffling, setIsShuffling] = useState(false);
  const [isFlashCardMode, setIsFlashCardMode] = useState(false);

  const [answerCardVisible, setAnswerCardVisible] = useState(false);
  const [answerCardWord, setAnswerCardWord] = useState(null);
  const [answerCardWordIndex, setAnswerCardWordIndex] = useState(null);

  const handleShowAnswer = (word) => {
    setAnswerCardWord(word);
    setAnswerCardVisible(true);
    const wordIndex = words.findIndex(w => w.id === word.id);
    setAnswerCardWordIndex(wordIndex);
  };

  const handleAnswerCardClose = () => {
    setAnswerCardVisible(false);
    setAnswerCardWord(null);
  };

  const handleAnswerCardAutoNext = () => {
    if (answerCardWordIndex !== null) {
      const nextIndex = answerCardWordIndex + 1;
      setAnswerCardWordIndex(null);
      if (nextIndex < words.length) {
        speak(nextIndex);
      }
    }
  };

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminClickCount, setAdminClickCount] = useState(0);
  const adminTimerRef = useRef(null);
  const [tempMastery, setTempMastery] = useState({});

  const timerRef = useRef(null);
  const progressRef = useRef(0);

  useEffect(() => { localStorage.setItem('pinyin_selected_units', JSON.stringify(Array.from(selectedUnits))); }, [selectedUnits]);
  useEffect(() => { async function loadCloud() { setIsLoading(true); try { const { data, error } = await supabase.from('mastery_records').select('*').range(0, 9999); if (data) { const m = {}; data.forEach(r => { m[r.id] = { history: r.history, temp: r.temp_state, lastUpdate: r.last_history_update_date }; }); setMastery(m); } } catch (e) {} finally { setIsLoading(false); } } loadCloud(); }, []);

  const isDevMode = useMemo(() => new URLSearchParams(window.location.search).get('dev') === '1', []);
  const toggleMode = () => { window.location.href = isDevMode ? window.location.origin : window.location.origin + '?dev=1'; };

  const handleAdminTrigger = () => {
    setAdminClickCount(prev => prev + 1);
    if (adminTimerRef.current) clearTimeout(adminTimerRef.current);
    adminTimerRef.current = setTimeout(() => setAdminClickCount(0), 3000);
    if (adminClickCount >= 2) { setIsAdminMode(true); setTempMastery(JSON.parse(JSON.stringify(mastery))); setAdminClickCount(0); }
  };

  const cycleStatus = (id) => {
    const current = getStatus(id, true);
    let next;
    if (current === 'NEW') next = ['red'];
    else if (current === 'WEAK') next = ['green', 'green', 'green'];
    else next = [];
    setTempMastery(prev => ({ ...prev, [id]: { history: next } }));
  };

  const saveAdminChanges = async () => {
    const upserts = [];
    Object.keys(tempMastery).forEach(id => {
      if (JSON.stringify(mastery[id]) !== JSON.stringify(tempMastery[id])) {
        upserts.push({ id, history: tempMastery[id].history, last_status: tempMastery[id].history[0] || 'white', updated_at: new Date().toISOString() });
      }
    });
    if (upserts.length > 0) await supabase.from('mastery_records').upsert(upserts);
    setMastery(tempMastery); setIsAdminMode(false);
  };

  const processedUnits = useMemo(() => {
    return DATA_BLUEPRINT.map(unit => {
      const finalWords = [...unit.vocab];
      const existStr = finalWords.join("");
      [...unit.chars].forEach(c => { if (!existStr.includes(c)) { const phrase = charToWordMap[c] || c; if (!finalWords.includes(phrase)) finalWords.push(phrase); }});
      return {
        name: unit.title,
        words: finalWords.map((w, idx) => {
          const baseId = `3up-${unit.title}-${w}-${idx}`;
          return { id: isDevMode ? `${baseId}-test` : baseId, word: String(w), pinyin: pinyin(String(w), { toneType: 'symbol' }) || '' };
        })
      };
    });
  }, [isDevMode]);

  const getStatus = (id, useTemp = false) => { 
    const m = useTemp && isAdminMode ? tempMastery[id] : mastery[id];
    if (!m || !m.history || m.history.length === 0) return 'NEW'; 
    return m.history.slice(-3).includes('red') ? 'WEAK' : 'MASTERED'; 
  };

  const currentTotalCount = useMemo(() => {
    let pool = []; processedUnits.forEach(u => { if (selectedUnits.has(u.name)) pool = [...pool, ...u.words]; });
    if (onlyWrong) pool = pool.filter(w => getStatus(w.id) !== 'MASTERED');
    return pool.length;
  }, [selectedUnits, processedUnits, onlyWrong, mastery]);

  const start = () => {
    if (isLoading) return; 
    let pool = []; processedUnits.forEach(u => { if (selectedUnits.has(u.name)) pool = [...pool, ...u.words]; });
    let targetWords = [];
    pool.forEach(w => {
        const savedTemp = mastery[w.id]?.temp || {};
        const wordData = { ...w, markPractice: savedTemp.practice || 'white', markSelf: savedTemp.self || 'white', markFinal: savedTemp.final || 'white' };
        if (!onlyWrong || mastery[w.id]?.history?.includes('red')) targetWords.push(wordData);
    });
    if (targetWords.length === 0) return alert('没有符合条件的词语');
    setWords(targetWords); setStep(0); setTime(0); setShowAnswers(false); setView('RUNNING');
  };

  const save = async (isTemporary = false) => {
    setSyncStatus('saving');
    const upserts = []; const nextMastery = { ...mastery }; const todayStr = new Date().toISOString().split('T')[0];
    words.forEach(w => {
      let currentFinal = w.markFinal; if (!isTemporary && step === 2 && currentFinal === 'white') currentFinal = 'green';
      const currentTemp = { practice: w.markPractice, self: w.markSelf, final: currentFinal };
      const m = nextMastery[w.id] || { history: [], lastUpdate: null };
      let newHistory = [...(m.history || [])]; let newLastUpdate = m.lastUpdate;
      if (!isTemporary && step === 2) {
          if (newLastUpdate !== todayStr) { newHistory.push(currentFinal); if (newHistory.length > 10) newHistory.shift(); newLastUpdate = todayStr; } 
          else { const lastIdx = newHistory.length - 1; if (lastIdx >= 0 && currentFinal === 'red') newHistory[lastIdx] = 'red'; }
      }
      nextMastery[w.id] = { history: newHistory, temp: currentTemp, lastUpdate: newLastUpdate };
      upserts.push({ id: w.id, history: newHistory, temp_state: currentTemp, last_history_update_date: newLastUpdate, updated_at: new Date().toISOString() });
    });
    setMastery(nextMastery);
    if (upserts.length > 0) { const { error } = await supabase.from('mastery_records').upsert(upserts); if (error) setSyncStatus('error'); else setSyncStatus('idle'); }
    if (!isTemporary) { setView('SETUP'); window.scrollTo(0,0); }
  };

  const markAs = (status) => {
    if (activeVoiceIndex !== -1 && activeVoiceIndex < words.length) {
      setWords(prev => {
        const nextWords = prev.map((w, idx) => (idx === activeVoiceIndex) ? { ...w, markPractice: step===0?status:w.markPractice, markSelf: step===1?status:w.markSelf, markFinal: step===2?status:w.markFinal } : w);
        const cur = nextWords[activeVoiceIndex];
        supabase.from('mastery_records').upsert({ id: cur.id, history: mastery[cur.id]?.history || [], temp_state: { practice: cur.markPractice, self: cur.markSelf, final: cur.markFinal }, updated_at: new Date().toISOString() });
        return nextWords;
      });
      if (status === 'red') {
        handleShowAnswer(words[activeVoiceIndex]);
      } else {
        speak(activeVoiceIndex + 1);
      }
    }
  };

  const speak = (index) => {
    if (index >= words.length || index < 0) { if (step === 2) stopVoice(); else { setIsVoiceActive(true); setActiveVoiceIndex(index); } return; }
    setActiveVoiceIndex(index); setIsPaused(false); setProgress(0); progressRef.current = 0;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(words[index].word);
    u.lang = 'zh-CN'; u.rate = 0.6;
    const premiumVoice = window.speechSynthesis.getVoices().find(v => v.name.includes('Yue') || v.name.includes('月'));
    if (premiumVoice) u.voice = premiumVoice;
    window.speechSynthesis.speak(u);
  };

  const stopVoice = () => { window.speechSynthesis.cancel(); setIsVoiceActive(false); setIsPaused(false); setActiveVoiceIndex(-1); setProgress(0); if (timerRef.current) clearInterval(timerRef.current); };

  const handleTabChange = (idx) => {
    if (idx === 2 && step < 2) setModalConfig({ isOpen: true, type: 'TO_FINAL', title: "确认进入终测？", content: "确认进入终测吗？" });
    else { setStep(idx); setShowAnswers(false); stopVoice(); if (idx === 2) setWords(prev => prev.map(w => (!mastery[w.id]?.history?.length && (w.markPractice==='red' || w.markSelf==='red')) ? {...w, markFinal:'red'} : w)); }
  };

  const updateWordsWithFilter = (enableFilter) => {
    stopVoice(); setFilterWrong(enableFilter);
    let pool = []; processedUnits.forEach(u => { if (selectedUnits.has(u.name)) pool = [...pool, ...u.words]; });
    let targetWords = [];
    pool.forEach(w => {
        const curW = words.find(cw => cw.id === w.id);
        const savedTemp = curW ? { practice: curW.markPractice, self: curW.markSelf, final: curW.markFinal } : (mastery[w.id]?.temp || {});
        const wordData = { ...w, markPractice: savedTemp.practice || 'white', markSelf: savedTemp.self || 'white', markFinal: savedTemp.final || 'white' };
        const hasHist = mastery[w.id]?.history?.includes('red');
        let shouldShow = true;
        if (enableFilter) {
            if (step === 0) shouldShow = wordData.markPractice === 'red' || hasHist;
            else if (step === 1) shouldShow = wordData.markPractice === 'red' || wordData.markSelf === 'red' || hasHist;
            else shouldShow = wordData.markPractice === 'red' || wordData.markSelf === 'red' || wordData.markFinal === 'red' || hasHist;
        } else if (onlyWrong) shouldShow = hasHist;
        if (shouldShow) targetWords.push(wordData);
    });
    if (targetWords.length === 0) { alert("无错题"); setFilterWrong(false); } else { setWords(targetWords); setActiveVoiceIndex(-1); }
  };

  const restartWrong = () => {
    updateWordsWithFilter(true);
    setIsVoiceActive(true);
    setActiveVoiceIndex(-1);
    setTimeout(() => speak(0), 100);
  };

  const calculateStats = () => {
    const total = words.length;
    let wrong = 0, mastered = 0;
    words.forEach(w => {
      const status = w.markFinal === 'white' ? 'green' : w.markFinal;
      if (status === 'red') wrong++;
      if (status === 'green') mastered++;
    });
    return { total, wrong, mastered, unassigned: 0 };
  };

  const shuffleWords = () => {
    stopVoice(); 
    setIsShuffling(true);
    setTimeout(() => {
        setWords(prev => {
            const shuffled = [...prev];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        });
        setIsShuffling(false);
    }, 300);
  };

  useEffect(() => { const t = setInterval(() => view === 'RUNNING' && setTime(s => s + 1), 1000); return () => clearInterval(t); }, [view]);

  useEffect(() => {
    if (!isVoiceActive || activeVoiceIndex < 0 || isPaused) {
      return;
    }
    setProgress(0);
    progressRef.current = 0;
    const intervalTime = 50;
    const increment = 100 / (voiceInterval * 1000 / intervalTime);
    const progressInterval = setInterval(() => {
      progressRef.current += increment;
      if (progressRef.current >= 100) {
        setProgress(100);
      } else {
        setProgress(progressRef.current);
      }
    }, intervalTime);
    return () => clearInterval(progressInterval);
  }, [activeVoiceIndex, voiceInterval, isVoiceActive, isPaused]);

  const isDictationFinished = isVoiceActive && activeVoiceIndex >= words.length;

  if (view === 'SETUP') {
    return (
      <div className="h-screen flex flex-col bg-white font-sans text-black overflow-hidden relative">
        {isDevMode && <div className="fixed top-0 left-0 w-full h-1 bg-red-600 animate-pulse z-[1000]" />}
        {isAdminMode && <div className="fixed top-0 left-0 w-full h-8 bg-purple-600 z-[1000] flex items-center justify-center text-white text-xs font-bold shadow-lg animate-in slide-in-from-top">🔧 数据修正模式：点击词组调整状态</div>}
        <header className="max-w-5xl w-full mx-auto px-8 py-2 flex justify-between items-baseline shrink-0 border-b border-slate-100 relative">
          <div onClick={handleAdminTrigger} className="absolute top-0 left-1/2 -translate-x-1/2 w-[150px] h-full z-50 cursor-default" />
          <div className="flex items-center gap-3"><h1 className="text-3xl font-black tracking-tighter text-black uppercase">听写练习</h1><span onClick={toggleMode} className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border rounded-lg italic cursor-pointer active:scale-95 transition-all ${isDevMode ? 'text-red-600 border-red-100 bg-red-50' : 'text-emerald-600 border-emerald-100 bg-emerald-50'}`}>{isDevMode ? 'TEST DATA MODE V3.9.1' : 'Cloud V3.9.1'}</span></div>
          <span className="text-lg font-bold text-slate-400">三年级上册</span>
        </header>
        <main className={`flex-1 overflow-y-auto px-8 pb-24 ${isAdminMode ? 'pt-8' : ''}`}><div className="max-w-5xl mx-auto">{processedUnits.map((unit) => { const isSelected = selectedUnits.has(unit.name); return (<div key={unit.name} onClick={() => { if(!isAdminMode) { const n = new Set(selectedUnits); if(n.has(unit.name)) n.delete(unit.name); else n.add(unit.name); setSelectedUnits(n); } }} className="flex items-baseline gap-6 py-3 border-b border-slate-100 group transition-colors hover:bg-slate-50/50 cursor-pointer"><div className={`w-5 h-5 rounded-sm shrink-0 border-2 flex items-center justify-center transition-all mt-1 ${isSelected ? 'bg-black border-black shadow-md' : 'border-slate-200'}`}>{isSelected && <Check size={14} className="text-white" strokeWidth={4} />}</div><div className="font-black text-lg text-black shrink-0 min-w-[6.5rem] tracking-tighter">{unit.name}</div><div className="flex flex-wrap gap-x-1 gap-y-0">{unit.words.map(w => { const st = getStatus(w.id, true); return (<div key={w.id} className="relative group/word"><span style={{ fontSize: '22px' }} className={`font-kaiti px-1.5 transition-colors ${st === 'WEAK' ? 'text-black font-bold' : st === 'MASTERED' ? 'text-emerald-600 font-bold' : 'text-black'}`}>{w.word}</span>{st === 'WEAK' && <div className="absolute bottom-0 left-1 right-1 h-0.5 bg-red-500 rounded-full" />}{st === 'MASTERED' && <div className="absolute bottom-0 left-1 right-1 h-0.5 bg-emerald-600 rounded-full" />}</div>);})}</div></div>);})}</div></main>
        <div className="fixed bottom-0 left-0 w-full p-2 bg-white/95 backdrop-blur-xl border-t z-30 flex justify-center items-center gap-4 shadow-2xl">
          {isAdminMode ? (
            <>
              <button onClick={() => { setIsAdminMode(false); setTempMastery({}); }} className="flex-1 max-w-[12rem] h-10 rounded-lg font-bold text-slate-500 bg-slate-100">取消修改</button>
              <button onClick={saveAdminChanges} className="flex-1 max-w-[12rem] h-10 rounded-lg font-bold text-white bg-purple-600 shadow-lg">确认保存修正</button>
            </>
          ) : (
            <>
              <label className="flex items-center gap-2 cursor-pointer select-none group" onClick={(e) => e.stopPropagation()}><div className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center transition-all ${onlyWrong ? 'bg-black border-black shadow-md' : 'border-slate-300'}`}>{onlyWrong && <Check size={14} className="text-white" strokeWidth={4} />}</div><span className="text-sm font-black text-black">仅练错题</span><input type="checkbox" className="hidden" checked={onlyWrong} onChange={() => setOnlyWrong(!onlyWrong)} /></label>
              <div className="flex flex-col items-end w-full max-w-sm">
                {!isLoading && Object.keys(mastery).length > 0 && <span className="text-[10px] text-emerald-600 font-bold mb-1 flex items-center gap-1"><Cloud size={10}/> 云端就绪</span>}
                <button onClick={start} disabled={selectedUnits.size === 0 || isLoading} className={`w-full text-white h-12 rounded-lg font-black text-xl shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2 ${isDevMode ? 'bg-red-600' : 'bg-black'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {isLoading ? <><Loader2 className="animate-spin" size={20}/> 正在同步数据...</> : `开始练习 (${currentTotalCount})`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white font-sans text-black overflow-hidden relative">
      {isFlashCardMode && <FlashCardView words={words} onClose={() => setIsFlashCardMode(false)} />}
      {strokeTarget && <StrokeOrderPlayer word={strokeTarget} onClose={() => setStrokeTarget(null)} />}
      {isDevMode && <div className="fixed top-0 left-0 w-full h-1 bg-red-600 z-[2000]" />}
      <header className="fixed top-0 left-0 w-full bg-white border-b z-[100]">
        <div className="flex justify-between items-center px-8 h-[54px]">
          <button onClick={() => setView('SETUP')} className="text-slate-400 font-bold text-xs flex items-center gap-1 hover:text-black transition-colors uppercase">
            <LogOut size={14}/> 退出
          </button>
          <div className="flex items-center gap-2">
            {step === 0 && <button onClick={() => setIsFlashCardMode(true)} className="p-2 text-slate-400 hover:text-black hover:bg-slate-50 rounded-lg transition-all"><Monitor size={18}/></button>}
            <button onClick={() => { stopVoice(); setIsShuffling(true); setTimeout(() => { setWords(prev => [...prev].sort(() => Math.random() - 0.5)); setIsShuffling(false); }, 300); }} className="p-2 text-slate-400 hover:text-black hover:bg-slate-50 rounded-lg transition-all"><RefreshCw size={18}/></button>
            <button onClick={() => setShowAnswers(!showAnswers)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${showAnswers ? 'bg-slate-50 text-black' : 'text-slate-400 hover:text-black'}`}>
              {showAnswers ? <EyeOff size={18}/> : <Eye size={18}/>} 看答案
            </button>
            <button onClick={() => setShowStrokeOrder(!showStrokeOrder)} className={`p-2 rounded-lg transition-all ${showStrokeOrder ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:text-black'}`}><Edit3 size={18}/></button>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={() => updateWordsWithFilter(!filterWrong)} className={`flex items-center gap-2 px-4 h-[36px] rounded-lg text-xs font-black border transition-all ${filterWrong ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${filterWrong ? 'bg-red-500 border-red-500' : 'bg-white border-slate-300'}`}>
                {filterWrong && <Check size={12} className="text-white" strokeWidth={4} />}
              </div>
              仅错题
            </button>
            <div className="flex items-center gap-3 px-4 h-[36px] bg-slate-50 rounded-lg border border-slate-100 font-mono text-base font-black text-black">
              {Math.floor(time/60).toString().padStart(2,'0')}:{(time%60).toString().padStart(2,'0')} <AnalogClock />
            </div>
          </div>
        </div>
        <div className="px-6 pb-2">
          <div className="flex gap-2">
            {[
              { label: '自由练习', bg: 'bg-blue-600' },
              { label: '模拟自测', bg: 'bg-orange-500' },
              { label: '家长终测', bg: 'bg-emerald-600' }
            ].map((s, idx) => (
              <button key={idx} onClick={() => handleTabChange(idx)} className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${step === idx ? (isDevMode ? 'bg-red-600 text-white shadow-md' : `${s.bg} text-white shadow-md`) : (isDevMode ? 'bg-red-600/10 text-black' : 'bg-slate-50 text-black opacity-80')}`}>
                {idx + 1}. {s.label}
              </button>
            ))}
          </div>
        </div>
      </header>
      {!isVoiceActive && <button onClick={() => { setIsVoiceActive(true); setActiveVoiceIndex(-1); }} className={`fixed bottom-8 left-8 z-[200] w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all ${isDevMode ? 'bg-red-600' : 'bg-blue-600'} text-white`}><Volume2 size={24} /></button>}
      {isVoiceActive && (
        <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t px-6 py-4 flex items-center justify-between z-[200] shadow-2xl animate-in slide-in-from-bottom-full">
          {isDictationFinished ? (<div className="w-full flex items-center justify-center gap-4 relative"><button onClick={() => { setIsVoiceActive(true); setActiveVoiceIndex(-1); }} className="w-10 h-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center"><MousePointerClick size={20}/></button>{step !== 2 && <><button onClick={restartWrong} className="px-6 h-10 rounded-lg bg-red-50 text-red-600 font-bold text-xs border border-red-100">重听错题</button><button onClick={() => handleTabChange(step + 1)} className="px-6 h-10 rounded-lg bg-black text-white font-bold text-xs shadow-lg">进入{step === 0 ? '自测' : '家长终测'}</button></>}<button onClick={stopVoice} className="absolute right-0 px-6 h-10 rounded-lg border border-slate-200 text-slate-400 font-bold text-xs">退出听写</button></div>) : (<><div className="flex items-center gap-3 w-[20%]"><span className="text-[10px] font-bold text-black">间隔</span><div className="flex items-center gap-1 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100"><button onClick={() => setVoiceInterval(Math.max(5, voiceInterval-5))}><Minus size={14}/></button><span className="text-sm font-mono font-bold w-10 text-center">{voiceInterval}s</span><button onClick={() => setVoiceInterval(Math.min(60, voiceInterval+5))}><Plus size={14}/></button></div></div><div className="flex items-center gap-2 flex-1 justify-center"><button onClick={() => { stopVoice(); setIsVoiceActive(true); setActiveVoiceIndex(-1); }} className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 mr-2"><MousePointerClick size={20}/></button><button onClick={() => setIsPaused(!isPaused)} className="w-[80px] h-10 rounded-lg bg-slate-100 text-black flex items-center justify-center border border-slate-200">{isPaused ? <Play size={20} fill="black"/> : <Pause size={20} fill="black"/>}</button><button onClick={() => speak(activeVoiceIndex - 1)} className="w-[80px] h-10 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs uppercase">上一题</button><button onClick={() => speak(activeVoiceIndex + 1)} className="w-[150px] h-10 rounded-lg bg-black text-white flex items-center justify-center font-bold active:scale-95 transition-all text-xs uppercase">下一题</button><div className="w-4" /><button onClick={() => markAs('red')} className="w-[80px] h-10 rounded-lg border-2 border-red-500 text-red-500 flex items-center justify-center font-bold text-xs">不会</button>{step === 2 && <button onClick={() => markAs('green')} className="w-[80px] h-10 rounded-lg border-2 border-emerald-500 text-emerald-500 flex items-center justify-center font-bold text-xs ml-2">掌握</button>}</div><div className="w-[20%] flex justify-end"><button onClick={stopVoice} className="px-6 py-2 bg-slate-100 text-slate-400 rounded-lg font-bold text-[10px] uppercase">退出听写</button></div></>)}
        </div>
      )}
      <main className="flex-1 overflow-y-auto p-[36px] bg-slate-50 pt-[110px] pb-32"><div className="max-w-full grid grid-cols-4 gap-x-8 gap-y-0">{words.map((item, index) => <WordRow key={`${step}-${item.id}`} item={item} index={index} step={step} onUpdate={(id, type, val) => setWords(prev => prev.map(w => w.id === id ? { ...w, [type]: val } : w))} setHintWord={setHintWord} showAnswer={showAnswers} activeIndex={activeVoiceIndex} progress={progress} isVoiceActive={isVoiceActive} onStartVoice={speak} isShuffling={isShuffling} onShowStroke={(w) => showStrokeOrder && setStrokeTarget(w)} onShowAnswer={handleShowAnswer} />)}</div>{hintWord && (<div className="fixed inset-0 z-[500] bg-black/40 flex items-center justify-center p-10 pointer-events-none animate-in fade-in"><div className="bg-white p-12 px-20 w-fit rounded-lg shadow-2xl flex items-center justify-center animate-in zoom-in-90 border-8 border-slate-100"><span className="text-[12rem] font-black font-kaiti text-black leading-none">{hintWord}</span></div></div>)}</main>
      {step === 2 && (<div className={`fixed left-0 w-full flex justify-center z-[300] transition-all duration-500 pointer-events-none ${isVoiceActive && !isDictationFinished ? 'bottom-24' : 'bottom-4'}`}><button onClick={() => setModalConfig({ isOpen: true, type: 'FINISH_STATS', title: "本次练习统计", content: "" })} className="px-12 py-4 rounded-lg font-black text-white shadow-2xl pointer-events-auto bg-emerald-600">存档并结束 <Save size={20} className="inline ml-2"/></button></div>)}
      {answerCardVisible && <AnswerCard word={answerCardWord} onClose={handleAnswerCardClose} onAutoNext={handleAnswerCardAutoNext} />}
      <Modal isOpen={modalConfig.isOpen} onClose={() => setModalConfig({ isOpen: false })} onConfirm={() => { if (modalConfig.type === 'TO_FINAL') { stopVoice(); setStep(2); setModalConfig({ isOpen: false }); } else if (modalConfig.type === 'FINISH_STATS') { save(); } }} title={modalConfig.title} content={modalConfig.type === 'FINISH_STATS' ? (<div className="flex flex-col gap-4 py-4 text-left"><div className="flex justify-between border-b pb-2"><span className="text-slate-400 font-bold">词组总数</span><span className="font-mono font-black text-lg text-black">{words.length}</span></div><div className="flex justify-between border-b pb-2"><span className="text-red-500 font-bold">错题 (需复习)</span><span className="font-mono font-black text-lg text-red-500">{calculateStats().wrong}</span></div><div className="flex justify-between border-b pb-2"><span className="text-emerald-600 font-bold">已掌握</span><span className="font-mono font-black text-lg text-emerald-600">{calculateStats().mastered}</span></div><div className="flex justify-between"><span className="text-slate-400 font-bold">未标记</span><span className="font-mono font-black text-lg text-slate-300">0</span></div></div>) : modalConfig.content} />
    </div>
  );
}