import { useState, useEffect, useRef, useCallback } from 'react';
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
  Tabs
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

  // Tab 配置
  const tabItems = [
    {
      key: 'meridian',
      label: (
        <span>
          <MedicineBoxOutlined style={{ marginRight: 6 }} />
          经络穴位图谱
        </span>
      ),
    },
    {
      key: 'compatibility',
      label: (
        <span>
          <ExperimentOutlined style={{ marginRight: 6 }} />
          配伍关系图谱
        </span>
      ),
    },
    {
      key: 'technique',
      label: (
        <span>
          <ToolOutlined style={{ marginRight: 6 }} />
          技法分类图谱
        </span>
      ),
    },
  ];

  // 根据图谱类型获取数据和颜色配置
  const getGraphConfig = useCallback(() => {
    if (activeTab === 'meridian') {
      const nodes = [];
      const links = [];

      meridianList.forEach((meridian, idx) => {
        nodes.push({
          id: meridian,
          name: meridian,
          type: 'category',
          count: acupointsByMeridian[meridian]?.length || 0,
          angle: (idx / meridianList.length) * 2 * Math.PI
        });

        const acupoints = acupointsByMeridian[meridian] || [];
        const samplePoints = acupoints.slice(0, 6);
        samplePoints.forEach(point => {
          nodes.push({
            id: point.code,
            name: point.name,
            type: 'item',
            category: meridian,
            data: point,
            dangerLevel: point.dangerLevel,
            location: point.location
          });
          links.push({
            source: meridian,
            target: point.code,
            type: 'contains'
          });
        });
      });

      return {
        nodes,
        links,
        centerColor: '#1F6F52',
        nodeColor: '#5BAF7D',
        dangerColor: '#C95A4A',
        linkColor: '#D5D8D3',
        legendItems: [
          { label: '经络大类', color: '#1F6F52', shape: 'circle-large' },
          { label: '穴位节点', color: '#5BAF7D', shape: 'circle-small' },
          { label: '危险穴位', color: '#C95A4A', shape: 'circle-small' }
        ]
      };
    }

    if (activeTab === 'compatibility') {
      const nodes = [];
      const links = [];
      const categories = [...new Set(compatibilityData.map(i => i.diseaseCategory))];

      categories.forEach((category, idx) => {
        nodes.push({
          id: category,
          name: category,
          type: 'category',
          count: compatibilityData.filter(i => i.diseaseCategory === category).length,
          angle: (idx / categories.length) * 2 * Math.PI
        });

        const items = compatibilityData.filter(i => i.diseaseCategory === category).slice(0, 5);
        items.forEach(item => {
          nodes.push({
            id: `compat-${item.id}`,
            name: item.symptom.length > 8 ? item.symptom.slice(0, 7) + '..' : item.symptom,
            fullName: item.symptom,
            type: 'item',
            category: category,
            data: item,
            source: item.source
          });
          links.push({
            source: category,
            target: `compat-${item.id}`,
            type: 'contains'
          });
        });
      });

      return {
        nodes,
        links,
        centerColor: '#C58B54',
        nodeColor: '#D4A574',
        dangerColor: '#C95A4A',
        linkColor: '#D5D8D3',
        legendItems: [
          { label: '病症大类', color: '#C58B54', shape: 'circle-large' },
          { label: '配伍方案', color: '#D4A574', shape: 'circle-small' }
        ]
      };
    }

    const nodes = [];
    const links = [];
    const categories = [...new Set(techniqueData.map(i => i.meridian))];

    categories.forEach((category, idx) => {
      nodes.push({
        id: category,
        name: category,
        type: 'category',
        count: techniqueData.filter(i => i.meridian === category).length,
        angle: (idx / categories.length) * 2 * Math.PI
      });

      const items = techniqueData.filter(i => i.meridian === category);
      items.forEach(item => {
        nodes.push({
          id: `tech-${item.id}`,
          name: item.name.length > 8 ? item.name.slice(0, 7) + '..' : item.name,
          fullName: item.name,
          type: 'item',
          category: category,
          data: item,
          dangerLevel: item.dangerLevel
        });
        links.push({
          source: category,
          target: `tech-${item.id}`,
          type: 'contains'
        });
      });
    });

    return {
      nodes,
      links,
      centerColor: '#5BAF7D',
      nodeColor: '#7BC99A',
      dangerColor: '#C95A4A',
      linkColor: '#D5D8D3',
      legendItems: [
        { label: '技法大类', color: '#5BAF7D', shape: 'circle-large' },
        { label: '技法节点', color: '#7BC99A', shape: 'circle-small' },
        { label: '危险技法', color: '#C95A4A', shape: 'circle-small' }
      ]
    };
  }, [activeTab]);

  const config = getGraphConfig();

  // 绘制力导向图
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 450;

    // 清除旧内容
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // 添加背景
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#FAFAF8')
      .attr('rx', 8);

    // 创建组用于缩放平移
    const g = svg.append('g').attr('class', 'graph-group');

    // 缩放行为 - 修复滚轮缩放问题
    const zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .filter((event) => {
        // 允许鼠标滚轮和拖拽
        return event.type === 'wheel' || event.type === 'mousedown' || event.type === 'touchstart';
      })
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(Math.round(event.transform.k * 100) / 100);
      });

    // 保存 zoom 实例供外部使用
    zoomRef.current = zoom;
    svg.call(zoom);

    // 阻止默认滚轮行为
    svg.on('wheel', (event) => {
      event.preventDefault();
    });

    // 初始化节点位置（星型辐射布局）
    const centerX = width / 2;
    const centerY = height / 2;
    const categoryRadius = Math.min(width, height) * 0.3;

    config.nodes.forEach(node => {
      if (node.type === 'category') {
        node.x = centerX + Math.cos(node.angle) * categoryRadius;
        node.y = centerY + Math.sin(node.angle) * categoryRadius;
        node.fx = node.x;
        node.fy = node.y;
      } else {
        const parentAngle = config.nodes.find(n => n.id === node.category)?.angle || 0;
        const offsetAngle = parentAngle + (Math.random() - 0.5) * 0.4;
        const offsetRadius = 40 + Math.random() * 30;
        node.x = centerX + Math.cos(offsetAngle) * (categoryRadius + offsetRadius);
        node.y = centerY + Math.sin(offsetAngle) * (categoryRadius + offsetRadius);
      }
    });

    // 创建力模拟
    const simulation = d3.forceSimulation(config.nodes)
      .force('link', d3.forceLink(config.links)
        .id(d => d.id)
        .distance(60)
        .strength(0.4))
      .force('collision', d3.forceCollide().radius(d => d.type === 'category' ? 40 : 20))
      .force('center', d3.forceCenter(centerX, centerY))
      .alphaDecay(0.08);

    // 绘制连接线
    const links = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(config.links)
      .join('line')
      .attr('stroke', config.linkColor)
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.5);

    // 绘制节点
    const nodes = g.append('g')
      .attr('class', 'nodes')
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
          if (d.type === 'item') {
            d.fx = null;
            d.fy = null;
          }
        }));

    // 节点圆形
    nodes.append('circle')
      .attr('r', d => d.type === 'category' ? 32 : 16)
      .attr('fill', d => {
        if (d.type === 'category') return config.centerColor;
        if (d.dangerLevel === '危险') return config.dangerColor;
        return config.nodeColor;
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', d => d.type === 'category' ? 3 : 2)
      .attr('opacity', 0.9)
      .style('cursor', 'pointer');

    // 节点标签 - 优化字体显示
    nodes.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-family', "'PingFang SC', 'Microsoft YaHei', sans-serif")
      .attr('font-size', d => d.type === 'category' ? '13px' : '10px')
      .attr('font-weight', d => d.type === 'category' ? '600' : '500')
      .attr('fill', '#fff')
      .attr('pointer-events', 'none')
      .text(d => d.name);

    // 类别节点数量徽章
    nodes.filter(d => d.type === 'category')
      .append('text')
      .attr('dy', -26)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .attr('fill', config.centerColor)
      .attr('pointer-events', 'none')
      .text(d => `${d.count}项`);

    // 双击事件显示详情
    nodes.on('dblclick', (event, d) => {
      event.stopPropagation();
      setSelectedNode(d);
      setDetailModalVisible(true);
    });

    // 悬停效果
    nodes.on('mouseenter', function(event, d) {
      d3.select(this).select('circle')
        .transition()
        .duration(150)
        .attr('stroke-width', d.type === 'category' ? 4 : 3)
        .attr('opacity', 1)
        .attr('r', d.type === 'category' ? 34 : 18);
    })
    .on('mouseleave', function(event, d) {
      d3.select(this).select('circle')
        .transition()
        .duration(150)
        .attr('stroke-width', d.type === 'category' ? 3 : 2)
        .attr('opacity', 0.9)
        .attr('r', d.type === 'category' ? 32 : 16);
    });

    // 更新位置
    simulation.on('tick', () => {
      links
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      nodes.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // 初始缩放居中
    svg.call(zoom.transform, d3.zoomIdentity);

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
        // 高亮目标节点
        nodes.filter(d => d.id === highlightNode)
          .select('circle')
          .attr('stroke', '#ff9800')
          .attr('stroke-width', 4);
      }
    }

    return () => {
      simulation.stop();
    };
  }, [activeTab, config, highlightNode]);

  // 同步 defaultTab
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // 缩放控制
  const handleZoom = useCallback((delta) => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoom = zoomRef.current;
    const currentTransform = d3.zoomTransform(svg.node());
    const newScale = Math.max(0.3, Math.min(3, currentTransform.k + delta));
    svg.transition().duration(200).call(
      zoom.transform,
      d3.zoomIdentity.translate(currentTransform.x, currentTransform.y).scale(newScale)
    );
    setZoomLevel(newScale);
  }, []);

  // 重置视图
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

    if (selectedNode.type === 'category') {
      return (
        <div>
          <Title level={4} style={{ marginBottom: 16 }}>
            {selectedNode.name}
          </Title>
          <Space direction="vertical" size="small">
            <Text><strong>包含项目数：</strong>{selectedNode.count}项</Text>
            {activeTab === 'meridian' && (
              <Text><strong>类型：</strong>经络大类</Text>
            )}
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
            <Text>
              <strong>危险等级：</strong>
              <Tag color={data.dangerLevel === '危险' ? 'red' : 'green'}>{data.dangerLevel}</Tag>
            </Text>
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
          <Text>
            <strong>危险等级：</strong>
            <Tag color={data.dangerLevel === '危险' ? 'red' : 'green'}>{data.dangerLevel}</Tag>
          </Text>
        </Space>
      </div>
    );
  };

  return (
    <div className="fade-in" style={{ padding: '0 16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Tab 切换 */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        items={tabItems}
        size="large"
        style={{ marginBottom: 8 }}
      />

      {/* 交互提示 */}
      <Card size="small" style={{ marginBottom: 12, background: '#F5F5F3', border: 'none' }}>
        <Space split={<Text style={{ color: '#D5D8D3' }}>|</Text>}>
          <Text style={{ fontSize: 12, color: '#8a8f89' }}>
            <DragOutlined style={{ marginRight: 4 }} />拖拽节点调整位置
          </Text>
          <Text style={{ fontSize: 12, color: '#8a8f89' }}>
            <InfoCircleOutlined style={{ marginRight: 4 }} />双击查看详细信息
          </Text>
          <Text style={{ fontSize: 12, color: '#8a8f89' }}>
            鼠标滚轮缩放 | 拖拽空白平移
          </Text>
          <Text style={{ fontSize: 12, color: '#1F6F52', fontWeight: 500 }}>
            缩放: {Math.round(zoomLevel * 100)}%
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

        {/* 可拖拽图例 */}
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
              <Badge
                count={config.nodes.filter(n => n.type === 'category').length}
                style={{ marginLeft: 8, backgroundColor: config.centerColor }}
                overflowCount={99}
              />
            </div>
            {config.legendItems.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div
                  style={{
                    width: item.shape === 'circle-large' ? 18 : 12,
                    height: item.shape === 'circle-large' ? 18 : 12,
                    borderRadius: '50%',
                    background: item.color,
                    border: '2px solid #fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                />
                <Text style={{ fontSize: 12, color: '#555' }}>{item.label}</Text>
              </div>
            ))}
          </Card>
        )}

        {/* 缩放控制按钮 */}
        <div style={{ position: 'absolute', right: 16, top: 16, zIndex: 10 }}>
          <Space direction="vertical" size="small">
            <Tooltip title="放大">
              <Button
                size="small"
                icon={<ZoomInOutlined />}
                onClick={() => handleZoom(0.2)}
                style={{ background: 'rgba(255,255,255,0.9)' }}
              />
            </Tooltip>
            <Tooltip title="缩小">
              <Button
                size="small"
                icon={<ZoomOutOutlined />}
                onClick={() => handleZoom(-0.2)}
                style={{ background: 'rgba(255,255,255,0.9)' }}
              />
            </Tooltip>
            <Tooltip title="重置视图">
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={handleReset}
                style={{ background: 'rgba(255,255,255,0.9)' }}
              />
            </Tooltip>
          </Space>
        </div>
      </div>

      {/* 详细信息弹窗 */}
      <Modal
        title={selectedNode?.type === 'category' ? '大类详情' : '节点详情'}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={420}
      >
        {renderDetailContent()}
      </Modal>
    </div>
  );
};

export default KnowledgeGraph;