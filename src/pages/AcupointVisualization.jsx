import { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import {
  Card,
  Input,
  Select,
  Button,
  Tag,
  Space,
  Descriptions,
  message,
  List,
  Badge
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  ScanOutlined,
  MedicineBoxOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { acupointsWithPositions, meridianColors } from '../data/acupointPositions';
import { meridianList } from '../data/acupoints361';

const { Search } = Input;

// 穴位标记组件
function AcupointMarker({ acupoint, isSelected, onClick }) {
  const meshRef = useRef();
  const glowRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (glowRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
      glowRef.current.scale.set(scale, scale, scale);
    }
  });

  const meridianColor = meridianColors[acupoint.meridian] || '#1890ff';
  const color = isSelected ? '#ff4d4f' : hovered ? '#52c41a' : meridianColor;
  const emissiveColor = isSelected ? '#ff4d4f' : hovered ? '#52c41a' : meridianColor;

  return (
    <group position={[acupoint.position.x, acupoint.position.y, acupoint.position.z]}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.018, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={0.6}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
      {(hovered || isSelected) && (
        <Html
          position={[0, 0.12, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            padding: '4px 10px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
            color: '#333',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            border: `1px solid ${color}`,
          }}>
            {acupoint.name} ({acupoint.code})
          </div>
        </Html>
      )}
    </group>
  );
}

// 预加载模型渲染组件
function PreloadedModel({ scene }) {
  if (!scene) return null;
  return <primitive object={scene} />;
}

const AcupointVisualization = ({ highlightAcupoint, onReady, preloadedScene }) => {
  const [selectedAcupoint, setSelectedAcupoint] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterMeridian, setFilterMeridian] = useState(null);
  const [filteredAcupoints, setFilteredAcupoints] = useState([]);
  const [activeView, setActiveView] = useState('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const controlsRef = useRef();

  const handleSearch = (value) => {
    setSearchKeyword(value);
    filterAcupoints(value, filterMeridian, activeView);
  };

  const handleMeridianFilter = (value) => {
    setFilterMeridian(value);
    filterAcupoints(searchKeyword, value, activeView);
  };

  const filterAcupoints = (keyword, meridian, view) => {
    let filtered = acupointsWithPositions;

    if (view === 'front') {
      filtered = filtered.filter(p => p.position.z > 0);
    } else if (view === 'back') {
      filtered = filtered.filter(p => p.position.z < 0);
    } else if (view === 'left') {
      filtered = filtered.filter(p => p.position.x < 0);
    } else if (view === 'right') {
      filtered = filtered.filter(p => p.position.x > 0);
    }

    if (keyword) {
      filtered = filtered.filter(
        point =>
          point.name.includes(keyword) ||
          point.code.toLowerCase().includes(keyword.toLowerCase()) ||
          point.meridian.includes(keyword)
      );
    }

    if (meridian) {
      filtered = filtered.filter(point => point.meridian === meridian);
    }

    setFilteredAcupoints(filtered);

    if (filtered.length === 0) {
      message.warning('未找到匹配的穴位');
    }
  };

  const handleReset = () => {
    setSearchKeyword('');
    setFilterMeridian(null);
    setActiveView('all');
    setSelectedAcupoint(null);
    setFilteredAcupoints([]);
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleShowAll = () => {
    setFilteredAcupoints(acupointsWithPositions);
  };

  const handleSelectAcupoint = (acupoint) => {
    setSelectedAcupoint(acupoint);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // 接收来自问答模块的穴位跳转
  useEffect(() => {
    if (highlightAcupoint) {
      const target = acupointsWithPositions.find(p => p.code === highlightAcupoint.code);
      if (target) {
        // 显示该穴位所属经络的所有穴位
        const meridianPoints = acupointsWithPositions.filter(p => p.meridian === target.meridian);
        setFilteredAcupoints(meridianPoints);
        setSelectedAcupoint(target);
        setSearchKeyword('');
        setFilterMeridian(null);
        setActiveView('all');
        message.success(`已定位到 ${target.name}（${target.code}），所属${target.meridian}`);
        // 通知父组件已处理
        if (onReady) onReady();
      }
    }
  }, [highlightAcupoint]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <ScanOutlined style={{ marginRight: 8, color: '#667eea' }} />
          人体3D穴位
        </h1>
        <Space>
          <Button type="primary" icon={<ScanOutlined />} onClick={handleShowAll}>
            显示全部穴位
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            隐藏穴位
          </Button>
          <Button icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />} onClick={handleToggleFullscreen}>
            {isFullscreen ? '退出全屏' : '全屏'}
          </Button>
        </Space>
      </div>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="middle" wrap style={{ width: '100%' }}>
          <Search
            placeholder="搜索穴位名称、编码或经络"
            allowClear
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onSearch={handleSearch}
            style={{ width: 280 }}
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="按经络筛选"
            allowClear
            value={filterMeridian}
            onChange={handleMeridianFilter}
            style={{ width: 180 }}
          >
            {meridianList.map(meridian => (
              <Select.Option key={meridian} value={meridian}>
                {meridian}
              </Select.Option>
            ))}
          </Select>
          <Tag color="blue" style={{ fontSize: 13, padding: '4px 12px' }}>
            显示 {filteredAcupoints.length} / {acupointsWithPositions.length} 个穴位
          </Tag>
        </Space>
      </Card>

      {/* 3D可视化区域 */}
      <div ref={containerRef} style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{
            width: '100%',
            height: 650,
            borderRadius: 8,
            overflow: 'hidden',
            background: 'linear-gradient(180deg, #e8f4f8 0%, #d1ecf1 50%, #bee5eb 100%)',
            position: 'relative',
          }}>
            {/* 模型等待加载遮罩 */}
            {!preloadedScene && (
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(232, 244, 248, 0.92)',
                zIndex: 20,
                borderRadius: 8,
              }}>
                <div style={{
                  textAlign: 'center',
                  padding: '40px 48px',
                  background: 'rgba(255,255,255,0.97)',
                  borderRadius: 16,
                  boxShadow: '0 8px 32px rgba(102,126,234,0.18)',
                  minWidth: 320,
                }}>
                  <LoadingOutlined style={{ fontSize: 56, color: '#667eea' }} spin />
                  <div style={{ marginTop: 20, color: '#333', fontSize: 16, fontWeight: 600 }}>
                    3D模型加载中
                  </div>
                  <div style={{ marginTop: 8, color: '#999', fontSize: 13 }}>
                    模型正在后台加载，请稍候...
                  </div>
                  <div style={{ marginTop: 16, color: '#667eea', fontSize: 12 }}>
                    <LoadingOutlined style={{ marginRight: 6 }} />
                    渲染引擎准备中
                  </div>
                </div>
              </div>
            )}

            <Canvas
              camera={{ position: [0, 0.5, 3.5], fov: 45 }}
              gl={{ antialias: true, alpha: true }}
              style={{ width: '100%', height: '100%' }}
            >
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 10, 5]} intensity={1} />
              <directionalLight position={[-5, 5, -5]} intensity={0.4} />
              <pointLight position={[0, 3, 0]} intensity={0.5} />

              {preloadedScene && (
                <PreloadedModel scene={preloadedScene} />
              )}

              {/* 渲染穴位标记点 */}
              {filteredAcupoints.map(acupoint => (
                <AcupointMarker
                  key={acupoint.code}
                  acupoint={acupoint}
                  isSelected={selectedAcupoint?.code === acupoint.code}
                  onClick={() => handleSelectAcupoint(acupoint)}
                />
              ))}

              <OrbitControls
                ref={controlsRef}
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                minDistance={1}
                maxDistance={10}
                target={[0, 0.5, 0]}
              />
            </Canvas>

            {/* 穴位信息面板 */}
            {selectedAcupoint && (
              <div style={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 280,
                zIndex: 10,
              }}>
                <Card
                  title={
                    <Space>
                      <span style={{ fontSize: 14, fontWeight: 'bold' }}>
                        {selectedAcupoint.name}
                      </span>
                      <Tag color="blue" style={{ borderRadius: 4, fontSize: 11 }}>{selectedAcupoint.code}</Tag>
                    </Space>
                  }
                  size="small"
                  extra={
                    <Button type="text" size="small" onClick={() => setSelectedAcupoint(null)}>
                      ✕
                    </Button>
                  }
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                >
                  <Descriptions column={1} size="small" layout="vertical">
                    <Descriptions.Item label="拼音">{selectedAcupoint.pinyin}</Descriptions.Item>
                    <Descriptions.Item label="所属经络">
                      <Tag color={meridianColors[selectedAcupoint.meridian] || 'purple'}>
                        {selectedAcupoint.meridian}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="定位">{selectedAcupoint.location}</Descriptions.Item>
                    <Descriptions.Item label="危险等级">
                      <Tag color={selectedAcupoint.dangerLevel === '危险' ? 'red' : 'green'}>
                        {selectedAcupoint.dangerLevel}
                      </Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </div>
            )}

            {/* 经络图例 */}
            <div style={{
              position: 'absolute',
              top: 16,
              left: 16,
              zIndex: 10,
            }}>
              <Card title="经络图例" size="small" style={{ width: 170, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: 10, lineHeight: 1.8, maxHeight: 240, overflow: 'auto' }}>
                  {Object.entries(meridianColors).map(([name, color]) => (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: color,
                        flexShrink: 0,
                      }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10 }}>{name}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* 操作提示 */}
            <div style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              zIndex: 10,
            }}>
              <Card size="small" style={{ width: 190, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: 11, lineHeight: 2.0, color: '#555' }}>
                  <div>🖱️ 左键拖动：旋转模型</div>
                  <div>🖱️ 右键拖动：平移视角</div>
                  <div>🖱️ 滚轮滑动：缩放视图</div>
                  <div>🔵 彩色光点：可点击穴位</div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* 右侧穴位列表 */}
        <Card
          title={
            <Space>
              <MedicineBoxOutlined />
              穴位列表
              <Badge count={filteredAcupoints.length} style={{ backgroundColor: '#667eea' }} />
            </Space>
          }
          style={{ width: 320, flexShrink: 0 }}
          bodyStyle={{ padding: '12px 16px', maxHeight: 650, overflow: 'auto' }}
        >
          <List
            size="small"
            dataSource={filteredAcupoints}
            renderItem={item => (
              <List.Item
                style={{
                  cursor: 'pointer',
                  padding: '10px 8px',
                  background: selectedAcupoint?.code === item.code ? '#f0f5ff' : 'transparent',
                  borderRadius: 8,
                  border: selectedAcupoint?.code === item.code ? '1px solid #d6e4ff' : '1px solid transparent',
                  transition: 'all 0.2s'
                }}
                onClick={() => handleSelectAcupoint(item)}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</span>
                      <Tag style={{ fontSize: 11, margin: 0 }}>{item.code}</Tag>
                    </Space>
                  }
                  description={
                    <div style={{ fontSize: 12, color: '#999' }}>
                      <span style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: meridianColors[item.meridian] || '#1890ff',
                        marginRight: 4,
                      }} />
                      {item.meridian}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      </div>
    </div>
  );
};

export default AcupointVisualization;
