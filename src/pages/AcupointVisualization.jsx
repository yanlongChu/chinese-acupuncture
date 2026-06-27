import { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
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
  LoadingOutlined,
  AimOutlined
} from '@ant-design/icons';
import { acupointsWithPositions, meridianColors } from '../data/acupointPositions';
import { meridianList } from '../data/acupoints361';

const { Search } = Input;

// 把穴位坐标映射到模型的世界包围盒中
// 穴位原始坐标：原点为中心，y∈[-1.5, 1.5]（头正脚负），x,z∈[-0.4, 0.4]
// 模型世界包围盒：worldCenter 为中心，worldSize 为尺寸
const transformPosition = (pos, transform) => {
  if (!transform) return { x: pos.x, y: pos.y, z: pos.z };

  // 获取模型世界包围盒中心和尺寸
  const worldCenter = transform.worldCenter || { x: 0, y: 0.5, z: 0 };
  const worldSize = transform.worldSize || { x: 1.63, y: 2.5, z: 0.89 };

  // 穴位原始坐标的中心（原点）和尺寸
  // 穴位 Y 范围约 [-1.5, 1.5]，总高 3.0
  // 穴位 X 范围约 [-0.4, 0.4]，总宽 0.8
  // 穴位 Z 范围约 [-0.4, 0.4]，总深 0.8
  
  const acupointHeight = 3.0;   // 穴位总高度
  const acupointWidth = 0.8;    // 穴位总宽度
  const acupointDepth = 0.8;    // 穴位总深度

  // 计算缩放比例：穴位坐标范围 → 模型世界包围盒范围
  const scaleY = worldSize.y / acupointHeight;
  const scaleX = worldSize.x / acupointWidth;
  const scaleZ = worldSize.z / acupointDepth;

  // 计算穴位坐标的中心（原点）到模型世界中心的偏移
  // 穴位中心在 (0, 0, 0)，模型中心在 worldCenter
  const offsetX = worldCenter.x - 0;
  const offsetY = worldCenter.y - 0;  // 穴位 y=0 对应世界 y=worldCenter.y
  const offsetZ = worldCenter.z - 0;

  // 映射：worldPos = (acupointPos - acupointCenter) * scale + worldCenter
  return {
    x: pos.x * scaleX + offsetX,
    y: pos.y * scaleY + offsetY,
    z: pos.z * scaleZ + offsetZ,
  };
};

// 穴位标记组件（位置已提前转换到场景坐标系）
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

  // 根据穴位在模型中的缩放自适应标记大小
  const markerSize = acupoint._scaleFactor ? 0.018 * acupoint._scaleFactor : 0.018;
  const glowSize = acupoint._scaleFactor ? 0.03 * acupoint._scaleFactor : 0.03;
  const labelOffset = acupoint._scaleFactor ? 0.18 * acupoint._scaleFactor : 0.12;

  return (
    <group position={[acupoint.position.x, acupoint.position.y, acupoint.position.z]}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[glowSize, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} />
      </mesh>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[markerSize, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={0.7}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
      {(hovered || isSelected) && (
        <Html
          position={[0, labelOffset, 0]}
          center
          style={{ pointerEvents: 'none' }}
          zIndexRange={[10, 0]}
        >
          <div style={{
            background: 'rgba(255,255,255,0.97)',
            padding: '4px 10px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
            color: '#333',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            border: `1px solid ${color}`,
          }}>
            {acupoint.name} ({acupoint.code})
          </div>
        </Html>
      )}
    </group>
  );
}

// 智能交互控制器：
// - 右键完全禁用
// - 左键拖动：
//     * 模型全可见（相机距离较远）→ 围绕 target 旋转
//     * 模型放大后（相机距离较近）→ 平移视角（朝拖动方向平移）
// - 滚轮：向上滚放大、向下滚缩小
function SmartSceneController({ controlsRef, onCameraAvailable }) {
  const { camera, gl, size } = useThree();

  // 把 camera 暴露出去
  useEffect(() => {
    if (onCameraAvailable) onCameraAvailable(camera);
  }, [camera, onCameraAvailable]);

  // 拖动状态
  const dragRef = useRef({
    active: false,
    mode: null,
    lastX: 0,
    lastY: 0,
  });

  // 阈值：相机距离 target > 该值 → 视为"全可见"→ 旋转模式
  const VISIBLE_DISTANCE_THRESHOLD = 2.3;

  useEffect(() => {
    const canvas = gl.domElement;
    if (!canvas) return;
    const controls = controlsRef.current;
    if (!controls) return;

    const onContextMenu = (e) => e.preventDefault();

    const onPointerDown = (e) => {
      if (e.button !== 0) return; // 仅左键

      const dist = camera.position.distanceTo(controls.target);
      const mode = dist > VISIBLE_DISTANCE_THRESHOLD ? 'rotate' : 'pan';

      dragRef.current = {
        active: true,
        mode,
        lastX: e.clientX,
        lastY: e.clientY,
      };
    };

    const onPointerMove = (e) => {
      const d = dragRef.current;
      if (!d.active) return;

      const dx = e.clientX - d.lastX;
      const dy = e.clientY - d.lastY;
      d.lastX = e.clientX;
      d.lastY = e.clientY;

      if (d.mode === 'rotate') {
        // 旋转模式：绕 target 旋转相机
        const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
        const spherical = new THREE.Spherical().setFromVector3(offset);

        const ROT_SPEED = 0.005;
        spherical.theta -= dx * ROT_SPEED;
        spherical.phi -= dy * ROT_SPEED;
        const EPS = 0.01;
        spherical.phi = Math.max(EPS, Math.min(Math.PI - EPS, spherical.phi));

        const newOffset = new THREE.Vector3().setFromSpherical(spherical);
        camera.position.copy(controls.target).add(newOffset);
        camera.lookAt(controls.target);
      } else {
        // 平移模式：把屏幕像素位移投影到相机前方平面
        const distance = camera.position.distanceTo(controls.target);
        const vFov = (camera.fov * Math.PI) / 180;
        const height = size.height;
        const worldPerPixel = (2 * Math.tan(vFov / 2) * distance) / height;

        // 相机 right 向量
        const right = new THREE.Vector3();
        camera.matrixWorld.extractBasis(right, new THREE.Vector3(), new THREE.Vector3());
        // 相机 up 向量（世界空间，由 camera.up 经过矩阵变换后得到）
        const worldUp = camera.up.clone().applyMatrix4(camera.matrixWorld).normalize();

        const deltaRight = right.multiplyScalar(-dx * worldPerPixel);
        const deltaUp = worldUp.multiplyScalar(dy * worldPerPixel);
        const delta = deltaRight.add(deltaUp);

        camera.position.add(delta);
        controls.target.add(delta);
      }
    };

    const onPointerUp = () => {
      dragRef.current.active = false;
      dragRef.current.mode = null;
    };

    const onWheel = (event) => {
      event.preventDefault();

      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);

      const currentDist = camera.position.distanceTo(controls.target);
      const moveDist = -event.deltaY * 0.0012 * currentDist;

      if (Math.abs(moveDist) < 1e-5) return;

      const moveVec = forward.multiplyScalar(moveDist);
      const newCam = camera.position.clone().add(moveVec);
      const newTarget = controls.target.clone().add(moveVec);
      const newDist = newCam.distanceTo(newTarget);

      if (newDist < 0.4 || newDist > 15) return;

      camera.position.copy(newCam);
      controls.target.copy(newTarget);
      camera.lookAt(controls.target);
    };

    canvas.addEventListener('contextmenu', onContextMenu);
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      canvas.removeEventListener('contextmenu', onContextMenu);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [camera, gl, size, controlsRef]);

  return null;
}

// 预加载模型渲染组件，在挂载后自动测量包围盒
function PreloadedModel({ scene, onMeasure, measuredRef }) {
  const groupRef = useRef();

  useEffect(() => {
    if (!scene || !groupRef.current) return;
    if (measuredRef?.current) return;
    if (measuredRef) measuredRef.current = true;

    // 使用包围盒工具测量模型
    const box = new THREE.Box3().setFromObject(groupRef.current);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const detectedTransform = {
      scale: 1,
      offset: { x: 0, y: 0, z: 0 },
      modelCenter: { x: 0, y: 0, z: 0 },
      modelSize: { x: size.x, y: size.y, z: size.z },
      worldCenter: { x: center.x, y: center.y, z: center.z },
      worldSize: { x: size.x, y: size.y, z: size.z },
      autoDetected: true,
    };

    console.log('=== 自动检测模型包围盒 ===');
    console.log('世界中心:', { x: center.x.toFixed(3), y: center.y.toFixed(3), z: center.z.toFixed(3) });
    console.log('世界大小:', { x: size.x.toFixed(3), y: size.y.toFixed(3), z: size.z.toFixed(3) });
    console.log('世界 Y 范围:', box.min.y.toFixed(3), '到', box.max.y.toFixed(3));
    console.log('世界 X 范围:', box.min.x.toFixed(3), '到', box.max.x.toFixed(3));
    console.log('世界 Z 范围:', box.min.z.toFixed(3), '到', box.max.z.toFixed(3));

    if (onMeasure) {
      onMeasure(detectedTransform);
    }
  }, [scene, onMeasure, measuredRef]);

  if (!scene) return null;
  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

const AcupointVisualization = ({ highlightAcupoint, onReady, preloadedScene, modelTransform }) => {
  const [selectedAcupoint, setSelectedAcupoint] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterMeridian, setFilterMeridian] = useState(null);
  const [filteredAcupoints, setFilteredAcupoints] = useState([]);
  const [activeView, setActiveView] = useState('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const cameraRef = useRef();
  const controlsRef = useRef({
    target: new THREE.Vector3(0, 0.5, 0),
    update: () => {},
    reset: () => {},
  });
  const didInitRef = useRef(false);  // 防止子组件 remount 时把相机重置

  // 自己检测到的模型包围盒（后备方案：当 modelTransform 为 null 时使用）
  const [detectedTransform, setDetectedTransform] = useState(null);
  const measuredRef = useRef(false);

  // 计算变换后的穴位坐标（与模型对齐）
  const effectiveTransform = modelTransform || detectedTransform;

  const transformedAcupoints = useMemo(() => {
    // 如果 transform 还没准备好，返回空数组
    if (!effectiveTransform) return [];

    const worldSize = effectiveTransform.worldSize || { x: 1.63, y: 2.5, z: 0.89 };
    // 标记基础大小：让它适应模型大小
    // 模型高度 2.5 单位，标记直径约 0.018 是合理的
    const baseMarkerSize = 0.018;
    const worldHeight = worldSize.y;
    const scaleFactor = worldHeight / 2.5;  // 相对于标准 2.5 单位高度的倍数

    const result = acupointsWithPositions.map((a) => {
      const newPos = transformPosition(a.position, effectiveTransform);
      return {
        ...a,
        position: newPos,
        _scaleFactor: scaleFactor > 0.3 ? scaleFactor : 1,
      };
    });

    // 调试：打印坐标（只打印一次）
    if (result.length > 0 && !window.__acupointLogged) {
      window.__acupointLogged = true;
      console.log('=== 穴位坐标调试 ===');
      console.log('effectiveTransform:', {
        ...effectiveTransform,
        worldCenter: effectiveTransform.worldCenter ? {
          x: effectiveTransform.worldCenter.x.toFixed(3),
          y: effectiveTransform.worldCenter.y.toFixed(3),
          z: effectiveTransform.worldCenter.z.toFixed(3),
        } : null,
        worldSize: effectiveTransform.worldSize ? {
          x: effectiveTransform.worldSize.x.toFixed(3),
          y: effectiveTransform.worldSize.y.toFixed(3),
          z: effectiveTransform.worldSize.z.toFixed(3),
        } : null,
      });
      const li2 = result.find(p => p.code === 'LI2');
      if (li2) console.log('LI2 二间(食指):', li2.position);
      const st1 = result.find(p => p.code === 'ST1');
      if (st1) console.log('ST1 承泣(头部):', st1.position);
      const ys = result.map(p => p.position.y);
      const xs = result.map(p => p.position.x);
      const zs = result.map(p => p.position.z);
      console.log('Y 范围:', Math.min(...ys).toFixed(2), '到', Math.max(...ys).toFixed(2));
      console.log('X 范围:', Math.min(...xs).toFixed(2), '到', Math.max(...xs).toFixed(2));
      console.log('Z 范围:', Math.min(...zs).toFixed(2), '到', Math.max(...zs).toFixed(2));
    }
    return result;
  }, [effectiveTransform]);

  const handleSearch = (value) => {
    setSearchKeyword(value);
    filterAcupoints(value, filterMeridian, activeView, transformedAcupoints);
  };

  const handleMeridianFilter = (value) => {
    setFilterMeridian(value);
    filterAcupoints(searchKeyword, value, activeView, transformedAcupoints);
    // 选择经络后自动聚焦：计算该经络穴位的中心，并把相机调整到合适距离
    if (value && controlsRef.current && cameraRef.current) {
      const meridianPts = transformedAcupoints.filter(p => p.meridian === value);
      if (meridianPts.length > 0) {
        const center = new THREE.Vector3();
        meridianPts.forEach(p => {
          center.add(new THREE.Vector3(p.position.x, p.position.y, p.position.z));
        });
        center.divideScalar(meridianPts.length);
        // 根据中心与原点距离决定相机距离
        const d = center.length();
        const camDist = Math.max(1.2, 0.6 + d * 0.7);
        controlsRef.current.target.copy(center);
        cameraRef.current.position.set(center.x, center.y + 0.3, center.z + camDist);
        cameraRef.current.lookAt(center);
        // 选中该经络的第一个穴位，便于信息面板展示
        setSelectedAcupoint(meridianPts[0]);
      }
    } else if (!value && controlsRef.current && cameraRef.current) {
      // 清除筛选时拉回默认视角
      controlsRef.current.target.set(0, 0.5, 0);
      cameraRef.current.position.set(0, 0.5, 3.2);
      cameraRef.current.lookAt(controlsRef.current.target);
      setSelectedAcupoint(null);
    }
  };

  const filterAcupoints = (keyword, meridian, view, list = transformedAcupoints) => {
    let filtered = list;

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
    // 重置到默认视角
    flyTo({ x: 0, y: 0.5, z: 0 }, 3.2, 0);
  };

  const handleShowAll = () => {
    setSearchKeyword('');
    setFilterMeridian(null);
    setActiveView('all');
    setSelectedAcupoint(null);
    setFilteredAcupoints(transformedAcupoints);
    // 把相机拉回默认视角，保证全身可见
    flyTo({ x: 0, y: 0.5, z: 0 }, 3.2, 0);
  };

  const handleSelectAcupoint = (acupoint) => {
    setSelectedAcupoint(acupoint);
  };

  const handleLocate = () => {
    if (!selectedAcupoint) return;
    flyTo(selectedAcupoint.position);
    message.success(`已聚焦：${selectedAcupoint.name}`);
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

  // 通用相机移动函数：距离越高（头部越近）、距离越低（足部越远）
  const flyTo = (worldPos, distance, heightAbove) => {
    if (!cameraRef.current || !controlsRef.current) {
      setTimeout(() => flyTo(worldPos, distance, heightAbove), 80);
      return false;
    }
    const pos = worldPos || { x: 0, y: 0.5, z: 0 };

    // 根据穴位高度 y 自适应相机距离：头部/上半身更近（更清晰），下半身稍远
    const y = pos.y;
    const dist = distance ?? (y > 0.7 ? 0.55 : y > 0.2 ? 0.9 : 1.25);
    const hAbove = heightAbove ?? (y > 0.7 ? 0.12 : 0.2);
    const sideOffset = y > 0.7 ? 0.15 : 0;

    const camPos = new THREE.Vector3(pos.x + sideOffset, pos.y + hAbove, pos.z + dist);
    cameraRef.current.position.copy(camPos);
    controlsRef.current.target.set(pos.x, pos.y, pos.z);
    cameraRef.current.lookAt(controlsRef.current.target);
    controlsRef.current.update();
    return true;
  };

  // 接收来自问答模块的穴位跳转
  useEffect(() => {
    if (!highlightAcupoint) return;

    const target = transformedAcupoints.find(p => p.code === highlightAcupoint.code);
    if (!target) return;

    const applyFocus = () => {
      const ok = flyTo(target.position);
      if (ok) {
        const meridianPoints = transformedAcupoints.filter(p => p.meridian === target.meridian);
        setFilteredAcupoints(meridianPoints);
        setSelectedAcupoint(target);
        setSearchKeyword('');
        setFilterMeridian(target.meridian);
        setActiveView('all');
        message.success(`已定位到 ${target.name}（${target.code}），所属${target.meridian}`);
        if (onReady) onReady();
      }
    };

    // 等 cameraRef / controlsRef 就绪后再聚焦，避免被 SmartSceneController 的初始化覆盖
    if (cameraRef.current && controlsRef.current) {
      // 直接从问答跳过来时，覆盖默认初始化相机位置
      didInitRef.current = true;
      applyFocus();
    } else {
      // 下一帧重试（SmartSceneController 会在首次挂载后设置 ref）
      const timer = setTimeout(() => {
        didInitRef.current = true;
        applyFocus();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [highlightAcupoint, transformedAcupoints]);

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
          <Button icon={<AimOutlined />} onClick={handleLocate} disabled={!selectedAcupoint}>
            聚焦穴位
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
            显示 {filteredAcupoints.length} / {transformedAcupoints.length} 个穴位
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
              camera={{ position: [0, 0.5, 3.2], fov: 45, near: 0.1, far: 100 }}
              gl={{ antialias: true, alpha: true }}
              style={{ width: '100%', height: '100%' }}
              onPointerMissed={() => setSelectedAcupoint(null)}
            >
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 10, 5]} intensity={1} />
              <directionalLight position={[-5, 5, -5]} intensity={0.4} />
              <pointLight position={[0, 3, 0]} intensity={0.5} />

              {preloadedScene && (
                <PreloadedModel scene={preloadedScene} onMeasure={setDetectedTransform} measuredRef={measuredRef} />
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

              <SmartSceneController
                controlsRef={controlsRef}
                onCameraAvailable={(cam) => {
                  cameraRef.current = cam;
                  // 只有首次挂载时才把相机重置到默认位置；
                  // 后续子组件 remount 不得覆盖已设置的聚焦位置
                  if (!didInitRef.current && cam && controlsRef.current) {
                    cam.position.set(0, 0.5, 3.2);
                    controlsRef.current.target.set(0, 0.5, 0);
                    cam.lookAt(controlsRef.current.target);
                    didInitRef.current = true;
                  }
                }}
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
              <Card size="small" style={{ width: 260, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: 11, lineHeight: 2.0, color: '#555' }}>
                  <div>🖱️ 左键拖动（全可见时）：旋转模型</div>
                  <div>🖱️ 左键拖动（放大后）：平移视角</div>
                  <div>🔍 滚轮向上：放大</div>
                  <div>🔍 滚轮向下：缩小</div>
                  <div>🖱️ 悬停穴位：查看名称信息</div>
                </div>
                {modelTransform && (
                  <div style={{
                    marginTop: 10,
                    padding: '6px 8px',
                    background: '#f5f5f5',
                    borderRadius: 4,
                    fontSize: 10,
                    color: '#888',
                    lineHeight: 1.6,
                  }}>
                    <div>scale: {modelTransform.scale.toFixed(3)}</div>
                    <div>offset: ({modelTransform.offset.x.toFixed(2)}, {modelTransform.offset.y.toFixed(2)}, {modelTransform.offset.z.toFixed(2)})</div>
                    <div>modelCenter: ({(modelTransform.modelCenter?.x || 0).toFixed(2)}, {(modelTransform.modelCenter?.y || 0).toFixed(2)}, {(modelTransform.modelCenter?.z || 0).toFixed(2)})</div>
                    <div>modelSize: ({(modelTransform.modelSize?.x || 0).toFixed(2)}, {(modelTransform.modelSize?.y || 0).toFixed(2)}, {(modelTransform.modelSize?.z || 0).toFixed(2)})</div>
                  </div>
                )}
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
