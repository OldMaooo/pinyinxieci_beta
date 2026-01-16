import { useState, useEffect } from 'react';

// 颜色映射基于 kvg:position 属性
const POSITION_COLORS = {
  left: '#EF4444',    // 红色
  right: '#3B82F6',   // 蓝色
  top: '#10B981',     // 绿色
  bottom: '#F59E0B',  // 橙色
  middle: '#8B5CF6',  // 紫色
  inner: '#EC4899',   // 粉色
  outer: '#06B6D4',   // 青色
  default: '#333333'  // 默认灰色
};

// 测试汉字（使用 HanziVG 数据集中存在的字符）
const TEST_CHARACTERS = [
  // 基础笔画
  { char: '一', structure: '独体字', desc: '横' },
  { char: '三', structure: '独体字', desc: '三横' },
  { char: '上', structure: '独体字', desc: '指事字' },
  { char: '下', structure: '独体字', desc: '指事字' },
  { char: '中', structure: '独体字', desc: '对称字' },

  // 简单合体字
  { char: '万', structure: '独体字', desc: '万字' },
  { char: '不', structure: '独体字', desc: '否定词' },
  { char: '与', structure: '独体字', desc: '连词' },
  { char: '为', structure: '独体字', desc: '动词' },
  { char: '两', structure: '左右', desc: '数字' },

  // 较复杂字符
  { char: '雨', structure: '象形字', desc: '雨字头' },
  { char: '雪', structure: '上下', desc: '雨 + 彐' },
  { char: '门', structure: '部首', desc: '门部首' },
  { char: '问', structure: '半包围', desc: '门 + 口' },
  { char: '间', structure: '半包围', desc: '门 + 日' },

  // 复杂字符
  { char: '高', structure: '上下', desc: '京 + 冋' },
  { char: '黑', structure: '上下', desc: '复杂字形' },
  { char: '长', structure: '独体字', desc: '基本字' },
  { char: '铅', structure: '左右', desc: '金 + 公' },
  { char: '错', structure: '左右', desc: '金 + 昔' },

  // 非常复杂字符
  { char: '骑', structure: '左右', desc: '马 + 奇' },
  { char: '饭', structure: '左右', desc: '饣 + 反' },
  { char: '飞', structure: '独体字', desc: '动态字' },
  { char: '非', structure: '独体字', desc: '复杂独体字' },
  { char: '面', structure: '独体字', desc: '面部' }
];

/**
 * 解析 HanziVG SVG 字符串
 * 提取语义信息和构建可渲染的 React 组件
 */
function parseHanziVG(svgContent) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');
  const svgElement = doc.querySelector('svg');

  if (!svgElement) {
    return { error: '无法解析 SVG' };
  }

  // 提取基本信息
  const char = svgElement.getAttribute('kvg:element');
  const unicode = svgElement.getAttribute('kvg:original');
  const radical = svgElement.getAttribute('kvg:radical');

  // 递归解析组件树
  function parseNode(node, depth = 0) {
    const position = node.getAttribute('kvg:position');
    const element = node.getAttribute('kvg:element');
    const radical = node.getAttribute('kvg:radical');
    const type = node.getAttribute('kvg:type');

    const color = position ? POSITION_COLORS[position] || POSITION_COLORS.default : POSITION_COLORS.default;

    const result = {
      element: element || '未知',
      position: position || 'root',
      type: type || '',
      radical: radical || '',
      color: color,
      depth: depth,
      children: [],
      svgElement: null
    };

    // 处理子节点
    const children = Array.from(node.children);
    children.forEach(child => {
      if (child.tagName === 'g') {
        const childData = parseNode(child, depth + 1);
        result.children.push(childData);
      }
    });

    // 处理路径元素（实际的笔画）
    const paths = node.querySelectorAll('path');
    if (paths.length > 0) {
      const pathElements = Array.from(paths).map((path, index) => ({
        type: 'path',
        d: path.getAttribute('d'),
        color: color,
        id: `${element || 'root'}_${depth}_${index}`
      }));
      result.svgElement = pathElements;
    }

    return result;
  }

  // 从根节点开始解析
  const rootNode = parseNode(svgElement);

  return {
    char: char || unicode,
    unicode: unicode,
    radical: radical || '',
    structure: rootNode,
    svgWidth: svgElement.getAttribute('viewBox')?.split(' ')[2] || '109',
    svgHeight: svgElement.getAttribute('viewBox')?.split(' ')[3] || '109'
  };
}

/**
 * 递归渲染组件树（可视化）
 */
function renderComponentTree(node, activePath, onHover, onLeave) {
  const hasChildren = node.children.length > 0;
  const isActive = activePath.includes(node.element);

  return (
    <div
      key={node.element + '_' + node.depth}
      className="tree-node"
      style={{
        marginLeft: node.depth * 16,
        padding: '4px 8px',
        borderLeft: `3px solid ${node.color}`,
        backgroundColor: isActive ? `${node.color}20` : 'transparent',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onMouseEnter={() => onHover(node.element)}
      onMouseLeave={() => onLeave()}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {hasChildren && (
          <span style={{ fontSize: '12px', color: '#666' }}>
            {isActive ? '▼' : '▶'}
          </span>
        )}
        <span
          style={{
            fontWeight: node.depth === 0 ? 'bold' : 'normal',
            color: node.color
          }}
        >
          {node.element}
        </span>
        {node.position && node.position !== 'root' && (
          <span style={{ fontSize: '11px', color: '#666', padding: '2px 6px', background: '#f0f0f0', borderRadius: '3px' }}>
            {node.position}
          </span>
        )}
        {node.type && (
          <span style={{ fontSize: '11px', color: '#999' }}>
            ({node.type})
          </span>
        )}
        {node.radical && (
          <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 'bold' }}>
            [部首]
          </span>
        )}
      </div>
      {isActive && hasChildren && (
        <div style={{ marginTop: '4px' }}>
          {node.children.map(child => renderComponentTree(child, activePath, onHover, onLeave))}
        </div>
      )}
    </div>
  );
}

/**
 * 主 HanziVG 研究组件
 */
export default function HanziVGExplorer() {
  const [selectedChar, setSelectedChar] = useState(TEST_CHARACTERS[0].char);
  const [hanziData, setHanziData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredElement, setHoveredElement] = useState(null);

  // 加载 HanziVG 数据
  useEffect(() => {
    async function loadHanziVGData() {
      if (!selectedChar) return;

      setLoading(true);
      setError(null);
      setHanziData(null);

      try {
        // 将汉字转换为 Unicode 编码（16进制，5位，补零）
        const hexCode = selectedChar.charCodeAt(0).toString(16).padStart(5, '0');
        // 使用 GitHub Raw Content URL
        const url = `https://raw.githubusercontent.com/Connum/hanzivg/master/hanzi/${hexCode}.svg`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const svgText = await response.text();
        const parsed = parseHanziVG(svgText);

        if (parsed.error) {
          throw new Error(parsed.error);
        }

        setHanziData(parsed);
      } catch (err) {
        setError(`加载失败: ${err.message}`);
        console.error('HanziVG 加载错误:', err);
      } finally {
        setLoading(false);
      }
    }

    loadHanziVGData();
  }, [selectedChar]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden'
      }}>
        {/* 标题栏 */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
            HanziVG 语义结构研究
          </h1>
          <p style={{ marginTop: '0.5rem', opacity: 0.9 }}>
            基于 SVG 语义元数据的汉字组件自动识别与着色
          </p>
        </div>

        {/* 字符选择器 */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '2px solid #e0e0e0',
          background: '#f8f9fa'
        }}>
          <div style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold', color: '#333' }}>
            选择测试汉字：
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '12px'
          }}>
            {TEST_CHARACTERS.map(item => (
              <button
                key={item.char}
                onClick={() => setSelectedChar(item.char)}
                style={{
                  padding: '12px',
                  border: '2px solid ' + (selectedChar === item.char ? '#667eea' : '#e0e0e0'),
                  borderRadius: '8px',
                  background: selectedChar === item.char ? '#f0f3ff' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>{item.char}</div>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>{item.structure}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 主内容区 */}
        <div style={{ display: 'flex', minHeight: '600px' }}>
          {/* 左侧：SVG 显示区 */}
          <div style={{
            flex: 1,
            padding: '2rem',
            borderRight: '2px solid #e0e0e0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>
              SVG 语义着色显示
              {hanziData && (
                <span style={{ fontSize: '0.9rem', marginLeft: '1rem', color: '#666' }}>
                  Unicode: {hanziData.unicode}
                </span>
              )}
            </h2>

            {loading && (
              <div style={{
                padding: '3rem',
                fontSize: '1.2rem',
                color: '#666'
              }}>
                加载中...
              </div>
            )}

            {error && (
              <div style={{
                padding: '2rem',
                background: '#fee',
                border: '2px solid #f88',
                borderRadius: '8px',
                color: '#c33'
              }}>
                {error}
              </div>
            )}

            {hanziData && !loading && !error && (
              <>
                {/* 渲染 SVG */}
                <div style={{
                  width: '400px',
                  height: '400px',
                  border: '3px solid #333',
                  borderRadius: '12px',
                  background: 'white',
                  marginBottom: '1.5rem',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  <svg
                    viewBox={`0 0 ${hanziData.svgWidth} ${hanziData.svgHeight}`}
                    width="360"
                    height="360"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* 递归渲染所有路径 */}
                    {renderPathsRecursive(hanziData.structure)}
                  </svg>
                </div>

                {/* 颜色图例 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                  width: '100%',
                  maxWidth: '500px',
                  marginTop: '1rem',
                  padding: '1rem',
                  background: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  {Object.entries(POSITION_COLORS).map(([pos, color]) => (
                    <div key={pos} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          background: color,
                          borderRadius: '4px',
                          border: '2px solid rgba(0,0,0,0.2)'
                        }}
                      />
                      <span style={{ fontSize: '0.9rem', color: '#555' }}>
                        {pos === 'default' ? '默认' : pos}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 右侧：结构树 */}
          <div style={{
            flex: 1,
            padding: '2rem',
            background: '#fafafa',
            maxHeight: '800px',
            overflowY: 'auto'
          }}>
            <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>
              组件结构树
              {hanziData?.radical && (
                <span style={{ fontSize: '0.9rem', marginLeft: '1rem', color: '#DC2626' }}>
                  部首: {hanziData.radical}
                </span>
              )}
            </h2>

            {hanziData && (
              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e0e0e0'
              }}>
                {renderComponentTree(
                  hanziData.structure,
                  hoveredElement ? [hoveredElement] : [],
                  setHoveredElement,
                  () => setHoveredElement(null)
                )}
              </div>
            )}

            {!hanziData && !loading && !error && (
              <div style={{
                padding: '3rem',
                textAlign: 'center',
                color: '#999',
                fontSize: '1.1rem'
              }}>
                选择一个汉字以查看其结构
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 递归渲染 SVG 路径
 */
function renderPathsRecursive(node, paths = []) {
  // 添加当前节点的路径
  if (node.svgElement) {
    paths.push(...node.svgElement.map(path => (
      <path
        key={path.id}
        d={path.d}
        fill="none"
        stroke={path.color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: 'all 0.2s' }}
      />
    )));
  }

  // 递归处理子节点
  node.children.forEach(child => renderPathsRecursive(child, paths));

  return paths;
}
