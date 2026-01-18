import { useState, useEffect } from 'react';

const POSITION_COLORS = {
  left: '#EF4444',
  right: '#3B82F6',
  top: '#10B981',
  bottom: '#F59E0B',
  middle: '#8B5CF6',
  inner: '#EC4899',
  outer: '#06B6D4',
  default: '#333333'
};

const TEST_CHARACTERS = [
  { char: '明', structure: '左右', desc: '日 + 月' },
  { char: '林', structure: '左右', desc: '木 + 木' },
  { char: '想', structure: '上下', desc: '相 + 心' },
  { char: '思', structure: '上下', desc: '田 + 心' },
  { char: '国', structure: '全包围', desc: '口 + 玉' },
  { char: '品', structure: '品字', desc: '口 + 口 + 口' }
];

function parseHanziVG(svgContent) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');
  const svgElement = doc.querySelector('svg');

  if (!svgElement) return { error: '无法解析 SVG' };

  const allGroups = Array.from(doc.getElementsByTagName('g'));
  const startNode = allGroups.find(g => {
    for (let i = 0; i < g.attributes.length; i++) {
      if (g.attributes[i].name.toLowerCase().includes('element')) return true;
    }
    return false;
  }) || allGroups[0];

  if (!startNode) return { error: 'SVG 中未找到组件数据' };

  function parseNode(node, depth = 0) {
    let element = '';
    let position = '';
    let radical = '';

    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      const name = attr.name.toLowerCase();
      if (name.includes('element')) element = attr.value;
      if (name.includes('position')) position = attr.value;
      if (name.includes('radical')) radical = attr.value;
    }

    const color = POSITION_COLORS[position] || POSITION_COLORS.default;

    const result = {
      element: element || (depth === 0 ? '根' : '部件'),
      position: position,
      radical: radical,
      color: color,
      depth: depth,
      children: [],
      svgElement: null
    };

    const children = Array.from(node.children);
    const paths = children.filter(n => n.tagName.toLowerCase() === 'path');
    if (paths.length > 0) {
      result.svgElement = paths.map((path, index) => ({
        d: path.getAttribute('d'),
        color: color,
        id: `p_${depth}_${index}_${Math.random().toString(36).substr(2, 5)}`
      }));
    }

    const subGroups = children.filter(n => n.tagName.toLowerCase() === 'g');
    subGroups.forEach(g => {
      result.children.push(parseNode(g, depth + 1));
    });

    return result;
  }

  const structure = parseNode(startNode);
  
  const hasPaths = (node) => {
    if (node.svgElement && node.svgElement.length > 0) return true;
    return node.children.some(hasPaths);
  };

  if (!hasPaths(structure)) {
      const allPaths = Array.from(doc.getElementsByTagName('path'));
      structure.svgElement = allPaths.map((p, i) => ({
          d: p.getAttribute('d'),
          color: POSITION_COLORS.default,
          id: `fallback_${i}`
      }));
  }

  return {
    char: elementAttr(startNode, 'element') || '?',
    structure: structure,
    svgWidth: svgElement.getAttribute('viewBox')?.split(' ')[2] || '109',
    svgHeight: svgElement.getAttribute('viewBox')?.split(' ')[3] || '109'
  };
}

function elementAttr(node, partialName) {
    for (let i = 0; i < node.attributes.length; i++) {
        if (node.attributes[i].name.toLowerCase().includes(partialName)) return node.attributes[i].value;
    }
    return '';
}

function renderPathsRecursive(node, paths = []) {
  if (node.svgElement) {
    paths.push(...node.svgElement.map(path => (
      <path 
        key={path.id} 
        d={path.d} 
        fill="none" 
        stroke={path.color} 
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: 'all 0.3s ease' }}
      />
    )));
  }
  if (node.children) {
    node.children.forEach(child => renderPathsRecursive(child, paths));
  }
  return paths;
}

function renderTree(node, hovered, onHover, onLeave) {
  const isHovered = hovered === node.element;
  return (
    <div 
      key={`${node.element}_${node.depth}_${node.position}_${node.radical}_${Math.random()}`}
      style={{ 
        marginLeft: 15, padding: '4px 8px', borderLeft: `2px solid ${node.color}`,
        background: isHovered ? `${node.color}15` : 'transparent', borderRadius: 4,
        marginBottom: 2, cursor: 'pointer'
      }}
      onMouseEnter={() => onHover(node.element)}
      onMouseLeave={onLeave}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontWeight: 'bold', color: node.color }}>{node.element}</span>
        {node.position && <span style={{ fontSize: 10, color: '#888', background: '#eee', padding: '1px 3px', borderRadius: 2 }}>{node.position}</span>}
        {node.radical && <span style={{ fontSize: 10, color: 'red', fontWeight: 'bold' }}>[部]</span>}
      </div>
      {node.children && node.children.map(c => renderTree(c, hovered, onHover, onLeave))}
    </div>
  );
}

export default function HanziVGExplorer() {
  const [char, setChar] = useState(TEST_CHARACTERS[0].char);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [font, setFont] = useState('system');
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    async function load() {
      if (!char) return;
      setLoading(true);
      setError(null);
      setData(null);
      setDebugInfo(`开始加载: ${char}\n`);
      
      try {
        const hex = char.charCodeAt(0).toString(16).padStart(5, '0');
        const url = `https://raw.githubusercontent.com/Connum/hanzivg/master/hanzi/${hex}.svg`;
        setDebugInfo(prev => prev + `请求 URL: ${url}\n`);
        
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}: 无法获取 SVG 数据`);
        
        const text = await resp.text();
        const parsed = parseHanziVG(text);
        if (parsed.error) throw new Error(`解析错误: ${parsed.error}`);
        
        setDebugInfo(prev => prev + `解析成功! 包含 ${parsed.structure.children?.length || 0} 个子组件\n`);
        setData(parsed);
      } catch (e) {
        console.error('Demo Error:', e);
        setError(e.message);
        setDebugInfo(prev => prev + `错误: ${e.message}\n`);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [char]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: 20, fontFamily: font === 'stkaiti' ? 'STKaiti, "Kaiti SC", serif' : 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '30px 20px', background: '#2c3e50', color: 'white', textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 20px 0', fontSize: 28 }}>汉字部件拆解 & 着色研究</h1>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 15 }}>
            <button 
              onClick={() => setFont(f => f === 'system' ? 'stkaiti' : 'system')}
              style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#34495e', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
            >
              切换字体: {font === 'system' ? '系统' : '楷体'}
            </button>
            <input 
              type="text"
              placeholder="输入单字..." 
              maxLength={1} 
              style={{ width: 100, padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
              onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) setChar(e.target.value.trim()); }}
            />
          </div>
        </div>
        
        <div style={{ padding: 20, display: 'flex', flexWrap: 'wrap', gap: 10, background: '#fdfdfd', borderBottom: '1px solid #eee' }}>
          {TEST_CHARACTERS.map(t => (
            <button 
              key={t.char} 
              onClick={() => setChar(t.char)} 
              style={{ 
                width: 50, height: 50, fontSize: 24, border: '1px solid #ddd', 
                background: char === t.char ? '#3498db' : 'white',
                color: char === t.char ? 'white' : '#333',
                borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s',
                fontWeight: 'bold'
              }}
            >{t.char}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 30, padding: 30 }}>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: 20, color: '#2c3e50' }}>SVG 语义着色显示</h3>
            <div style={{ 
              width: 340, height: 340, margin: '0 auto', border: '2px solid #eee', 
              borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#fff', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)'
            }}>
              {loading ? <p style={{ color: '#999' }}>加载中...</p> : error ? <p style={{ color: '#e74c3c' }}>{error}</p> : data && (
                <svg viewBox={`0 0 ${data.svgWidth} ${data.svgHeight}`} width="300" height="300">
                  {renderPathsRecursive(data.structure)}
                </svg>
              )}
            </div>
            
            {/* 标准字体对比 */}
            <div style={{ marginTop: 20, padding: 15, border: '1px dashed #ccc', borderRadius: 8 }}>
                <p style={{ fontSize: 13, color: '#666', marginBottom: 10 }}>当前字体下的标准显示:</p>
                <div style={{ fontSize: 80, lineHeight: 1 }}>{char}</div>
            </div>

            <div style={{ marginTop: 15, textAlign: 'left', fontSize: 11, color: '#666', background: '#f0f0f0', padding: 10, borderRadius: 4 }}>
                <strong>调试信息:</strong>
                <pre style={{ margin: '5px 0 0 0', whiteSpace: 'pre-wrap' }}>{debugInfo}</pre>
            </div>
          </div>
          <div>
            <h3 style={{ marginBottom: 20, color: '#2c3e50' }}>组件结构树</h3>
            <div style={{ background: '#f9f9f9', padding: 20, borderRadius: 12, minHeight: 340, border: '1px solid #eee', overflowY: 'auto', maxHeight: 500 }}>
              {data ? renderTree(data.structure, hovered, setHovered, () => setHovered(null)) : <p style={{ color: '#999' }}>等待数据加载...</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
