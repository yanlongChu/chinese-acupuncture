import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Card,
  Typography,
  Modal,
  Tag,
  Button,
  Tooltip,
  Space,
  Badge,
  Tabs,
  Select
} from 'antd';
import {
  MedicineBoxOutlined,
  ExperimentOutlined,
  ToolOutlined,
  InfoCircleOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  ReloadOutlined,
  DragOutlined,
  ApartmentOutlined
} from '@ant-design/icons';
import { allAcupoints, acupointsByMeridian, meridianList } from '../data/acupoints361';
import { compatibilityData, techniqueData } from '../data/knowledgeData';

const { Title, Text } = Typography;

const KnowledgeGraph = ({ highlightNode, defaultTab }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const zoomRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [legendPosition, setLegendPosition] = useState({ x: 20, y: 60 });
  const [showLegend, setShowLegend] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeTab, setActiveTab] = useState(defaultTab || 'meridian');
  // 默认选中第一个分类
  const getInitialCategory = useCallback(() => {
    if (activeTab === 'meridian') return meridianList[0];
    if (activeTab === 'compatibility') return [...new Set(compatibilityData.map(i => i.diseaseCategory))][0];
    return [...new Set(techniqueData.map(i => i.meridian))][0];
  }, [activeTab]);
  const [selectedCategory, setSelectedCategory] = useState(getInitialCategory());

  const tabItems = [
    { key: 'meridian', label: <span><MedicineBoxOutlined style={{ marginRight: 6 }} />经络穴位图谱</span> },
    { key: 'compatibility', label: <span><ExperimentOutlined style={{ marginRight: 6 }} />配伍关系图谱</span> },
    { key: 'technique', label: <span><ToolOutlined style={{ marginRight: 6 }} />技法分类图谱</span> },
  ];

  // 获取分类列表
  const getCategories = useCallback(() => {
    if (activeTab === 'meridian') return meridianList;
    if (activeTab === 'compatibility') return [...new Set(compatibilityData.map(i => i.diseaseCategory))];
    return [...new Set(techniqueData.map(i => i.meridian))];
  }, [activeTab]);

  const categories = getCategories();

  // 截取短名用于节点内显示
  const shortenName = (name, maxLen) => {
    if (!name) return '';
    if (name.length <= maxLen) return name;
    return name.slice(0, maxLen - 1) + '…';
  };

  // 根据图谱类型和筛选获取数据
  const getGraphConfig = useCallback(() => {
    // 只有单分类模式，没有总览
    if (activeTab === 'meridian') {
      const nodes = [];
      const links = [];

      // 中心是经脉名，外围是穴位
      nodes.push({
        id: selectedCategory,
        name: selectedCategory,
        shortName: shortenName(selectedCategory, 5),
        type: 'center',
        count: acupointsByMeridian[selectedCategory]?.length || 0,
      });
      const acupoints = acupointsByMeridian[selectedCategory] || [];
      acupoints.forEach(point => {
        nodes.push({
          id: point.code,
          name: point.name,
          shortName: shortenName(point.name, 5),
          type: 'leaf',
          category: selectedCategory,
          data: point,
          dangerLevel: point.dangerLevel,
        });
        links.push({ source: selectedCategory, target: point.code });
      });

      return {
        nodes, links,
        centerColor: '#1F6F52',
        nodeColor: '#5BAF7D',
        dangerColor: '#C95A4A',
        linkColor: '#C8CCC5',
        legendItems: [
          { label: '经脉', color: '#1F6F52', shape: 'circle-large' },
          { label: '穴位节点', color: '#5BAF7D', shape: 'circle-small' },
          ...(nodes.some(n => n.dangerLevel === '危险') ? [{ label: '危险穴位', color: '#C95A4A', shape: 'circle-small' }] : [])
        ]
      };
    }

    if (activeTab === 'compatibility') {
      const nodes = [];
      const links = [];

      nodes.push({
        id: selectedCategory,
        name: selectedCategory,
        shortName: shortenName(selectedCategory, 5),
        type: 'center',
        count: compatibilityData.filter(i => i.diseaseCategory === selectedCategory).length,
      });
      const items = compatibilityData.filter(i => i.diseaseCategory === selectedCategory);
      items.forEach(item => {
        nodes.push({
          id: `compat-${item.id}`,
          name: item.symptom,
          shortName: shortenName(item.symptom, 5),
          fullName: item.symptom,
          type: 'leaf',
          category: selectedCategory,
          data: item,
        });
        links.push({ source: selectedCategory, target: `compat-${item.id}` });
      });

      return {
        nodes, links,
        centerColor: '#C58B54',
        nodeColor: '#D4A574',
        dangerColor: '#C95A4A',
        linkColor: '#C8CCC5',
        legendItems: [
          { label: '病症分类', color: '#C58B54', shape: 'circle-large' },
          { label: '配伍方案', color: '#D4A574', shape: 'circle-small' }
        ]
      };
    }

    // technique
    const nodes = [];
    const links = [];

    nodes.push({
      id: selectedCategory,
      name: selectedCategory,
      shortName: shortenName(selectedCategory, 5),
      type: 'center',
      count: techniqueData.filter(i => i.meridian === selectedCategory).length,
    });
    const items = techniqueData.filter(i => i.meridian === selectedCategory);
    items.forEach(item => {
      nodes.push({
        id: `tech-${item.id}`,
        name: item.name,
        shortName: shortenName(item.name, 5),
        fullName: item.name,
        type: 'leaf',
        category: selectedCategory,
        data: item,
        dangerLevel: item.dangerLevel,
      });
      links.push({ source: selectedCategory, target: `tech-${item.id}` });
    });

    return {
      nodes, links,
      centerColor: '#5BAF7D',
      nodeColor: '#7BC99A',
      dangerColor: '#C95A4A',
      linkColor: '#C8CCC5',
      legendItems: [
        { label: '技法分类', color: '#5BAF7D', shape: 'circle-large' },
        { label: '技法节点', color: '#7BC99A', shape: 'circle-small' },
        ...(nodes.some(n => n.dangerLevel === '危险') ? [{ label: '危险技法', color: '#C95A4A', shape: 'circle-small' }] : [])
      ]
    };
  }, [activeTab, selectedCategory]);

  // 用 useMemo 缓存 config，避免每次渲染都创建新对象导致 useEffect 重复执行
  const config = useMemo(() => getGraphConfig(), [activeTab, selectedCategory]);

  // 绘制力导向图
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // 使用 requestAnimationFrame 确保在布局完成后获取正确的容器尺寸
    const drawGraph = () => {
      const container = containerRef.current;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight || 450;

      // 如果尺寸为0，等待下次重绘
      if (width === 0 || height === 0) {
        requestAnimationFrame(drawGraph);
        return;
      }

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#FAFAF8')
      .attr('rx', 8);

    const g = svg.append('g').attr('class', 'graph-group');

    const zoom = d3.zoom()
      .scaleExtent([0.2, 4])
      .wheelDelta((event) => -event.deltaY * 0.001) // 减小滚轮缩放步长，每次滚轮只缩放少量
      .filter((event) => {
        return event.type === 'wheel' || event.type === 'mousedown' || event.type === 'touchstart';
      })
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(Math.round(event.transform.k * 100) / 100);
      });

    zoomRef.current = zoom;
    svg.call(zoom);
    svg.on('wheel', (event) => { event.preventDefault(); });

    const centerX = width / 2;
    const centerY = height / 2;

    // ===== 星型辐射布局 =====
    const centerNode = config.nodes.find(n => n.type === 'center');
    const leafNodes = config.nodes.filter(n => n.type === 'leaf');
    const leafCount = leafNodes.length;
    const radius = Math.min(width, height) * 0.35;

    if (centerNode) {
      centerNode.x = centerX;
      centerNode.y = centerY;
      centerNode.fx = centerX;
      centerNode.fy = centerY;
    }

    leafNodes.forEach((node, i) => {
      const angle = (i / leafCount) * 2 * Math.PI - Math.PI / 2;
      node.x = centerX + Math.cos(angle) * radius;
      node.y = centerY + Math.sin(angle) * radius;
    });

    const centerR = 48;
    const leafR = 14;
    const linkDist = 110;

    const simulation = d3.forceSimulation(config.nodes)
      .force('link', d3.forceLink(config.links)
        .id(d => d.id)
        .distance(linkDist)
        .strength(0.6))
      .force('collision', d3.forceCollide().radius(d => {
        if (d.type === 'center') return centerR + 4;
        if (d.type === 'category') return centerR + 2;
        if (d.type === 'leaf') return leafR + 4;
        return leafR + 2;
      }))
      .force('center', d3.forceCenter(centerX, centerY))
      .alphaDecay(0.06);

    // 连接线
    const linkEls = g.append('g')
      .selectAll('line')
      .data(config.links)
      .join('line')
      .attr('stroke', config.linkColor)
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.4);

    // 节点组
    const nodeGroups = g.append('g')
      .selectAll('g')
      .data(config.nodes)
      .join('g')
      .attr('class', 'node-group')
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          if (d.type !== 'center') { d.fx = null; d.fy = null; }
        }));

    // 圆点
    nodeGroups.append('circle')
      .attr('r', d => {
        if (d.type === 'center') return centerR;
        if (d.type === 'leaf') return leafR;
        return leafR;
      })
      .attr('fill', d => {
        if (d.type === 'center') return config.centerColor;
        if (d.dangerLevel === '危险') return config.dangerColor;
        return config.nodeColor;
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', d => d.type === 'center' ? 4 : 2.5)
      .attr('opacity', 0.94)
      .style('cursor', 'pointer');

    // 中心节点文字（在圆内）
    nodeGroups.filter(d => d.type === 'center')
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-family', "'PingFang SC', 'Microsoft YaHei', sans-serif")
      .attr('font-size', '14px')
      .attr('font-weight', '600')
      .attr('fill', '#fff')
      .attr('pointer-events', 'none')
      .text(d => d.shortName);

    // 数量徽章
    nodeGroups.filter(d => d.type === 'center')
      .append('text')
      .attr('dy', -36)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .attr('fill', config.centerColor)
      .attr('pointer-events', 'none')
      .text(d => `${d.count}项`);

    // 叶子节点文字（全部在圆下方）
    nodeGroups.filter(d => d.type === 'leaf')
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', leafR + 14)
      .attr('font-family', "'PingFang SC', 'Microsoft YaHei', sans-serif")
      .attr('font-size', '10px')
      .attr('font-weight', '500')
      .attr('fill', '#555')
      .attr('pointer-events', 'none')
      .attr('stroke', '#FAFAF8')
      .attr('stroke-width', 3)
      .attr('paint-order', 'stroke')
      .text(d => d.shortName);

    // 悬停 tooltip
    nodeGroups.append('title')
      .text(d => {
        if (d.type === 'center') return `${d.name}（${d.count}项）`;
        return d.name;
      });

    // 双击详情
    nodeGroups.on('dblclick', (event, d) => {
      event.stopPropagation();
      setSelectedNode(d);
      setDetailModalVisible(true);
    });

    // 悬停高亮
    const getR = (d) => {
      if (d.type === 'center') return centerR;
      return leafR;
    };

    nodeGroups.on('mouseenter', function(event, d) {
      d3.select(this).select('circle')
        .transition().duration(150)
        .attr('stroke-width', 4)
        .attr('opacity', 1)
        .attr('r', getR(d) + 3);
      // 高亮相关连接线
      linkEls
        .attr('stroke', l => (l.source.id === d.id || l.target.id === d.id) ? config.centerColor : config.linkColor)
        .attr('stroke-opacity', l => (l.source.id === d.id || l.target.id === d.id) ? 0.7 : 0.2)
        .attr('stroke-width', l => (l.source.id === d.id || l.target.id === d.id) ? 2 : 1);
    })
    .on('mouseleave', function(event, d) {
      d3.select(this).select('circle')
        .transition().duration(150)
        .attr('stroke-width', d.type === 'center' ? 4 : 2.5)
        .attr('opacity', 0.94)
        .attr('r', getR(d));
      linkEls
        .attr('stroke', config.linkColor)
        .attr('stroke-opacity', 0.4)
        .attr('stroke-width', 1.5);
    });

    simulation.on('tick', () => {
      linkEls
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      nodeGroups.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // 初始化缩放到默认视图
    svg.call(zoom.transform, d3.zoomIdentity);
    setZoomLevel(1);

    // 处理高亮节点
    if (highlightNode) {
      const targetNode = config.nodes.find(n => n.id === highlightNode);
      if (targetNode) {
        const scale = 1.5;
        const translateX = width / 2 - targetNode.x * scale;
        const translateY = height / 2 - targetNode.y * scale;
        svg.transition().duration(500).call(
          zoom.transform,
          d3.zoomIdentity.translate(translateX, translateY).scale(scale)
        );
        nodeGroups.filter(d => d.id === highlightNode)
          .select('circle')
          .attr('stroke', '#ff9800')
          .attr('stroke-width', 4);
      }
    }

      // 返回清理函数
      return () => { simulation.stop(); };
    };

    // 立即调用或等待布局完成
    const rafId = requestAnimationFrame(drawGraph);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [activeTab, config, highlightNode]);

  // 切换 Tab 时重置为第一个分类
  useEffect(() => {
    const cats = getCategories();
    setSelectedCategory(cats[0]);
  }, [activeTab, getCategories]);

  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab]);

  const handleZoom = useCallback((delta) => {
    if (!svgRef.current || !zoomRef.current || !containerRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoom = zoomRef.current;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 以 SVG 中心为基准进行缩放
    const currentTransform = d3.zoomTransform(svg.node());
    const newScale = Math.max(0.2, Math.min(4, currentTransform.k + delta));

    // 计算新的 translate，使缩放以中心为基准
    const centerX = width / 2;
    const centerY = height / 2;
    const newTranslateX = centerX - (centerX - currentTransform.x) * (newScale / currentTransform.k);
    const newTranslateY = centerY - (centerY - currentTransform.y) * (newScale / currentTransform.k);

    svg.transition().duration(200).call(
      zoom.transform,
      d3.zoomIdentity.translate(newTranslateX, newTranslateY).scale(newScale)
    );
    setZoomLevel(newScale);
  }, []);

  const handleReset = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoom = zoomRef.current;
    svg.transition().duration(400).call(zoom.transform, d3.zoomIdentity);
    setZoomLevel(1);
  }, []);

  // 详情弹窗内容
  const renderDetailContent = () => {
    if (!selectedNode) return null;

    if (selectedNode.type === 'center') {
      return (
        <div>
          <Title level={4} style={{ marginBottom: 16 }}>{selectedNode.name}</Title>
          <Space direction="vertical" size="small">
            <Text><strong>包含项目数：</strong>{selectedNode.count}项</Text>
            {activeTab === 'meridian' && <Text><strong>类型：</strong>经络</Text>}
            {activeTab === 'compatibility' && <Text><strong>类型：</strong>病症分类</Text>}
            {activeTab === 'technique' && <Text><strong>类型：</strong>技法分类</Text>}
          </Space>
        </div>
      );
    }

    const data = selectedNode.data;
    if (activeTab === 'meridian') {
      return (
        <div>
          <Title level={4} style={{ marginBottom: 16 }}>
            <MedicineBoxOutlined style={{ marginRight: 8, color: '#1F6F52' }} />
            {data.name} ({data.code})
          </Title>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text><strong>拼音：</strong>{data.pinyin}</Text>
            <Text><strong>归经：</strong><Tag color="purple">{data.meridian}</Tag></Text>
            <Text><strong>定位：</strong>{data.location}</Text>
            <Text><strong>危险等级：</strong><Tag color={data.dangerLevel === '危险' ? 'red' : 'green'}>{data.dangerLevel}</Tag></Text>
            <Text><strong>状态：</strong><Tag color="success">{data.status}</Tag></Text>
            <Text><strong>更新时间：</strong>{data.updateTime}</Text>
          </Space>
        </div>
      );
    }

    if (activeTab === 'compatibility') {
      return (
        <div>
          <Title level={4} style={{ marginBottom: 16 }}>
            <ExperimentOutlined style={{ marginRight: 8, color: '#C58B54' }} />
            {selectedNode.fullName || selectedNode.name}
          </Title>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text><strong>穴位配伍：</strong>{data.acupoints}</Text>
            <Text><strong>针刺顺序：</strong>{data.needlingOrder}</Text>
            <Text><strong>疗程：</strong>{data.treatmentCourse}</Text>
            <Text><strong>出处：</strong><Tag color="green">{data.source}</Tag></Text>
            <Text><strong>病症分类：</strong><Tag color="orange">{data.diseaseCategory}</Tag></Text>
          </Space>
        </div>
      );
    }

    return (
      <div>
        <Title level={4} style={{ marginBottom: 16 }}>
          <ToolOutlined style={{ marginRight: 8, color: '#5BAF7D' }} />
          {selectedNode.fullName || selectedNode.name} ({data.code})
        </Title>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Text><strong>拼音：</strong>{data.pinyin}</Text>
          <Text><strong>分类：</strong><Tag color="cyan">{data.meridian}</Tag></Text>
          <Text><strong>内容：</strong>{data.location}</Text>
          <Text><strong>危险等级：</strong><Tag color={data.dangerLevel === '危险' ? 'red' : 'green'}>{data.dangerLevel}</Tag></Text>
        </Space>
      </div>
    );
  };

  return (
    <div className="fade-in" style={{ padding: '0 16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Tab + 筛选 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          items={tabItems}
          size="large"
          style={{ marginBottom: 0 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 13, color: '#8a8f89' }}>分类筛选：</Text>
          <Select
            value={selectedCategory}
            onChange={setSelectedCategory}
            style={{ width: 180 }}
            size="small"
            options={categories.map(c => ({ value: c, label: c }))}
          />
        </div>
      </div>

      {/* 交互提示 */}
      <Card size="small" style={{ marginBottom: 12, background: '#F5F5F3', border: 'none' }}>
        <Space split={<Text style={{ color: '#D5D8D3' }}>|</Text>}>
          <Text style={{ fontSize: 12, color: '#8a8f89' }}><DragOutlined style={{ marginRight: 4 }} />拖拽节点调整位置</Text>
          <Text style={{ fontSize: 12, color: '#8a8f89' }}><InfoCircleOutlined style={{ marginRight: 4 }} />双击查看详细信息</Text>
          <Text style={{ fontSize: 12, color: '#8a8f89' }}>滚轮缩放 | 拖拽空白平移</Text>
          <Text style={{ fontSize: 12, color: '#1F6F52', fontWeight: 500 }}>缩放: {Math.round(zoomLevel * 100)}%</Text>
          <Text style={{ fontSize: 12, color: config.centerColor, fontWeight: 500 }}>
            当前：{selectedCategory}
          </Text>
        </Space>
      </Card>

      {/* 图谱容器 */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          minHeight: 380,
          background: '#FAFAF8',
          borderRadius: 12,
          border: '1px solid #E8EAE6',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />

        {showLegend && (
          <Card
            size="small"
            style={{
              position: 'absolute',
              left: legendPosition.x,
              top: legendPosition.y,
              width: 150,
              background: 'rgba(255,255,255,0.96)',
              borderRadius: 8,
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              cursor: 'move',
              zIndex: 10
            }}
            draggable
            onDragEnd={(e) => {
              setLegendPosition({
                x: legendPosition.x + e.offsetX,
                y: legendPosition.y + e.offsetY
              });
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <ApartmentOutlined style={{ color: config.centerColor, marginRight: 6 }} />
              <Text strong style={{ fontSize: 12 }}>图例</Text>
              <Badge count={config.nodes.filter(n => n.type === 'center').length} style={{ marginLeft: 8, backgroundColor: config.centerColor }} overflowCount={99} />
            </div>
            {config.legendItems.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{
                  width: item.shape === 'circle-large' ? 18 : 10,
                  height: item.shape === 'circle-large' ? 18 : 10,
                  borderRadius: '50%',
                  background: item.color,
                  border: '2px solid #fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }} />
                <Text style={{ fontSize: 12, color: '#555' }}>{item.label}</Text>
              </div>
            ))}
          </Card>
        )}

        {/* 缩放控制 */}
        <div style={{ position: 'absolute', right: 16, top: 16, zIndex: 10 }}>
          <Space direction="vertical" size="small">
            <Tooltip title="放大"><Button size="small" icon={<ZoomInOutlined />} onClick={() => handleZoom(0.2)} style={{ background: 'rgba(255,255,255,0.9)' }} /></Tooltip>
            <Tooltip title="缩小"><Button size="small" icon={<ZoomOutOutlined />} onClick={() => handleZoom(-0.2)} style={{ background: 'rgba(255,255,255,0.9)' }} /></Tooltip>
            <Tooltip title="重置视图"><Button size="small" icon={<ReloadOutlined />} onClick={handleReset} style={{ background: 'rgba(255,255,255,0.9)' }} /></Tooltip>
          </Space>
        </div>
      </div>

      {/* 详情弹窗 */}
      <Modal
        title={selectedNode?.type === 'center' ? '分类详情' : '节点详情'}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[<Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>]}
        width={420}
      >
        {renderDetailContent()}
      </Modal>
    </div>
  );
};

export default KnowledgeGraph;
