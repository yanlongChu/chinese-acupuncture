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
  AimOutlined,
  RotateLeftOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { acupointsWithPositions, meridianColors } from '../data/acupointPositions';
import { meridianList } from '../data/acupoints361';

// 注入一次性 CSS：隐藏滚动条但仍可滚动
if (typeof document !== 'undefined') {
  const styleId = '__acupoint_scrollbar_hide__';
  if (!document.getElementById(styleId)) {
    const s = document.createElement('style');
    s.id = styleId;
    s.textContent = `.scrollbar-hidden::-webkit-scrollbar { width: 0; height: 0; display: none; }
.scrollbar-hidden { -ms-overflow-style: none; scrollbar-width: none; }`;
    document.head.appendChild(s);
  }
}

// 身体部位区域定义（基于穴位 y/x 范围），用于双击缩放与部位聚焦
const BODY_REGIONS = [
  {
    key: 'head',
    label: '头部',
    icon: '👤',
    test: (p) => p.y > 0.85,
    center: { x: 0, y: 1.15, z: 0 },
    camPos: { x: 0, y: 1.15, z: 1.4 },
  },
  {
    key: 'chest',
    label: '胸背部',
    icon: '🫁',
    test: (p) => p.y > 0.25 && p.y <= 0.85 && Math.abs(p.x) <= 0.45,
    center: { x: 0, y: 0.55, z: 0 },
    camPos: { x: 0, y: 0.6, z: 1.8 },
  },
  {
    key: 'abdomen',
    label: '腰腹部',
    icon: '🧍',
    test: (p) => p.y > -0.15 && p.y <= 0.25 && Math.abs(p.x) <= 0.45,
    center: { x: 0, y: 0.05, z: 0 },
    camPos: { x: 0, y: 0.15, z: 1.8 },
  },
  {
    key: 'hand',
    label: '手部',
    icon: '✋',
    test: (p) => p.y < 0.15 && p.y > -0.25 && Math.abs(p.x) > 0.35,
    center: { x: 0.45, y: 0.05, z: 0.15 },
    camPos: { x: 0.45, y: 0.05, z: 0.8 },
  },
  {
    key: 'arm',
    label: '手臂',
    icon: '💪',
    test: (p) => p.y > 0.2 && p.y <= 0.9 && Math.abs(p.x) > 0.3,
    center: { x: 0.4, y: 0.55, z: 0.15 },
    camPos: { x: 0.4, y: 0.55, z: 1.0 },
  },
  {
    key: 'leg',
    label: '腿部',
    icon: '🦵',
    test: (p) => p.y <= -0.15 && p.y > -0.85 && Math.abs(p.x) <= 0.45,
    center: { x: 0, y: -0.5, z: 0 },
    camPos: { x: 0, y: -0.4, z: 1.6 },
  },
  {
    key: 'foot',
    label: '足部',
    icon: '🦶',
    test: (p) => p.y <= -0.85,
    center: { x: 0, y: -1.0, z: 0 },
    camPos: { x: 0, y: -0.95, z: 1.4 },
  },
  {
    key: 'neck',
    label: '颈部',
    icon: '🧣',
    test: (p) => p.y > 0.8 && p.y <= 0.95 && Math.abs(p.x) <= 0.2,
    center: { x: 0, y: 0.88, z: 0.2 },
    camPos: { x: 0, y: 0.9, z: 1.5 },
  },
];

// 根据穴位坐标计算所属区域
const detectRegion = (pos) => {
  for (const r of BODY_REGIONS) {
    if (r.test(pos)) return r;
  }
  return null;
};

// 简单模糊匹配：按字符包含 + 拼音首字母宽松匹配
const fuzzyMatch = (keyword, point) => {
  if (!keyword) return true;
  const k = keyword.toLowerCase().trim();
  if (!k) return true;
  const haystacks = [
    point.name,
    point.code,
    point.code.toLowerCase(),
    point.meridian,
    point.pinyin || '',
    (point.pinyin || '').toLowerCase(),
    point.location || '',
  ].filter(Boolean).map((s) => s.toLowerCase());
  // 子串匹配
  if (haystacks.some((h) => h.includes(k))) return true;
  // 逐字符松散匹配（用于模糊搜索）
  let idx = 0;
  for (const ch of haystacks.join('')) {
    if (ch === k[idx]) idx++;
    if (idx === k.length) return true;
  }
  return false;
};

// 视角图例按钮（带激活态高亮）
const ViewBtn = ({ label, active, onClick }) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') onClick();
    }}
    style={{
      width: 38,
      height: 30,
      background: active ? '#1F6F52' : '#F2F7F3',
      color: active ? '#fff' : '#1F6F52',
      border: active ? '1px solid #1F6F52' : '1px solid #D9E5DD',
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 12,
      fontWeight: active ? 600 : 500,
      cursor: 'pointer',
      userSelect: 'none',
      transition: 'all 0.15s ease',
      boxShadow: active ? '0 2px 6px rgba(31,111,82,0.22)' : 'none',
      justifySelf: 'center',
    }}
  >
    {label}
  </div>
);

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
function AcupointMarker({ acupoint, isSelected, onClick, onDoubleClick, cameraPosition }) {
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
  const labelOffset = acupoint._scaleFactor ? 0.22 * acupoint._scaleFactor : 0.14;

  // 根据相机位置动态计算标签偏移方向：始终把标签放在"相机与穴位连线方向"上，
  // 这样无论从正面、背面、左侧、右侧、顶、底哪个角度看，标签都不会被身体挡住
  // 同时根据相机是否在穴位"负 Z 侧"决定是否对 DOM 文本进行镜面翻转，
  // 确保背面查看时文字仍正向可读
  const labelPos = useMemo(() => {
    const cp = cameraPosition;
    if (!cp) return { pos: [0, labelOffset, 0], mirrored: false };
    const dx = cp.x - acupoint.position.x;
    const dy = cp.y - acupoint.position.y;
    const dz = cp.z - acupoint.position.z;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    // 归一化方向 + 稍微给一个向上的偏向，让标签更接近"上方"视觉
    const nx = dx / len;
    const ny = dy / len;
    const nz = dz / len;
    const blendY = ny >= 0 ? 0.55 : 0.15;
    const pos = [nx * labelOffset, ny * labelOffset + blendY * labelOffset, nz * labelOffset];
    // 相机在穴位的负 Z 侧时，为避免 Html 画布被反向渲染时文字反向，做 X 轴镜面翻转
    const mirrored = nz < -0.1;
    return { pos, mirrored };
  }, [cameraPosition, acupoint.position.x, acupoint.position.y, acupoint.position.z, labelOffset]);

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
        onDoubleClick={(e) => {
          e.stopPropagation();
          onDoubleClick && onDoubleClick(acupoint);
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
          position={labelPos.pos}
          center
          occlude={false}
          style={{ pointerEvents: 'none' }}
          zIndexRange={[20, 0]}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.98)',
              padding: '4px 10px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 600,
              color: '#333',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
              border: `1px solid ${color}`,
              transform: `translate(-50%, -50%) scaleX(${labelPos.mirrored ? -1 : 1})`,
              transformOrigin: 'center center',
              backfaceVisibility: 'hidden',
              direction: 'ltr',
              unicodeBidi: 'plaintext',
            }}
          >
            {acupoint.name} ({acupoint.code})
          </div>
        </Html>
      )}
    </group>
  );
}

// 跟踪相机位置并回传到 React 状态，供 AcupointMarker 动态计算标签偏移
function CameraTracker({ onUpdate }) {
  const { camera } = useThree();
  const lastRef = useRef({ x: 0, y: 0, z: 0 });
  useFrame(() => {
    const p = camera.position;
    const dx = p.x - lastRef.current.x;
    const dy = p.y - lastRef.current.y;
    const dz = p.z - lastRef.current.z;
    const dist2 = dx * dx + dy * dy + dz * dz;
    // 只在相机发生明显位移时才通知 React（避免每帧 setState 性能损耗）
    if (dist2 > 0.0004) {
      lastRef.current = { x: p.x, y: p.y, z: p.z };
      onUpdate({ x: p.x, y: p.y, z: p.z });
    }
  });
  return null;
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterMeridian, setFilterMeridian] = useState(null);
  const [filteredAcupoints, setFilteredAcupoints] = useState([]);
  const [activeView, setActiveView] = useState('all');
  const [presetView, setPresetView] = useState('front');
  const [cameraPositionState, setCameraPositionState] = useState(null);
  const [activeRegion, setActiveRegion] = useState(null);  // 当前聚焦的身体部位
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const cameraRef = useRef();
  const controlsRef = useRef({
    target: new THREE.Vector3(0, 0.5, 0),
    update: () => {},
    reset: () => {},
  });
  const didInitRef = useRef(false);  // 防止子组件 remount 时把相机重置
  const searchDebounceRef = useRef(null);  // 搜索防抖定时器
  const canvasWrapperRef = useRef(null);   // 3D画布容器引用，用于恢复原始尺寸
  const prevCanvasSizeRef = useRef(null);  // 保存全屏前的尺寸

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

  const searchInputRef = useRef(null);

  // 页面加载后默认聚焦搜索框
  useEffect(() => {
    if (searchInputRef.current && searchInputRef.current.focus) {
      searchInputRef.current.focus({ preventScroll: true });
    }
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = e.target.value;
      handleSearch(value);
      if (value) {
        setSearchOpen(true);
      } else {
        setSearchOpen(false);
      }
    }
  };

  const handleSearch = (value) => {
    setSearchKeyword(value);
    filterAcupoints(value, filterMeridian, activeView, transformedAcupoints);
  };

  const handleResultClick = (p) => {
    // 激活穴位及其所在经脉
    handleSelectAcupoint(p);
    flyTo(p.position);
    handleMeridianFilter(p.meridian);
    setSearchKeyword(p.name);
    setSearchOpen(false);
  };

  const handleSearchIconClick = () => {
    handleSearch(searchKeyword);
    if (searchKeyword) {
      setSearchOpen(true);
    } else {
      setSearchOpen(false);
    }
  };

  const handleLiveSearch = (value) => {
    setSearchKeyword(value);
    // 防抖 250ms：用户停止输入后才执行模糊过滤
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      filterAcupoints(value, filterMeridian, activeView, transformedAcupoints);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    }, 250);
  };

  // 双击穴位：聚焦穴位所在部位并放大
  const handleAcupointDoubleClick = (acupoint) => {
    const region = detectRegion(acupoint.position);
    if (region) {
      focusRegion(region);
    } else {
      flyTo(acupoint.position);
    }
  };

  // 聚焦到某身体部位（用于双击穴位 / 点击部位按钮）
  const focusRegion = (region) => {
    if (!region) return;
    setActiveRegion(region.key);
    // 筛选该区域 + 所属经络的穴位
    const regionPoints = transformedAcupoints.filter((p) => region.test(p.position));
    if (regionPoints.length === 0) {
      message.info(`${region.label}暂无穴位数据`);
      return;
    }
    // 计算中心
    const center = new THREE.Vector3();
    regionPoints.forEach((p) => {
      center.add(new THREE.Vector3(p.position.x, p.position.y, p.position.z));
    });
    center.divideScalar(regionPoints.length);

    // 相机飞至区域
    if (!cameraRef.current || !controlsRef.current) {
      setTimeout(() => focusRegion(region), 80);
      return;
    }
    didInitRef.current = true;
    controlsRef.current.target.set(region.center.x, region.center.y, region.center.z);
    cameraRef.current.position.set(region.camPos.x, region.camPos.y, region.camPos.z);
    cameraRef.current.lookAt(controlsRef.current.target);
    controlsRef.current.update();
    setCameraPositionState({ x: region.camPos.x, y: region.camPos.y, z: region.camPos.z });

    // 更新筛选状态
    setFilteredAcupoints(regionPoints);
    setSelectedAcupoint(regionPoints[0]);
    setSearchKeyword('');
    setSearchOpen(false);
    setActiveView('all');
    // 尝试保持当前经络筛选（如果该区域所有穴位都属于同一条经络）
    const meridianSet = new Set(regionPoints.map((p) => p.meridian));
    if (meridianSet.size === 1) {
      setFilterMeridian([...meridianSet][0]);
    } else {
      setFilterMeridian(null);
    }

    message.success(`已聚焦 ${region.label}（共 ${regionPoints.length} 个穴位）`);
  };

  // 画布空白处双击：把双击位置作为新的焦点并按合理比例放大
  const handleCanvasDoubleClick = (e) => {
    if (!cameraRef.current || !controlsRef.current) return;
    // 使用鼠标位置反投影到世界坐标
    const rect = e.currentTarget.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    // 优先与穴位标记点求交（最近的）
    let focusPoint = null;
    if (filteredAcupoints.length > 0) {
      // 基于穴位坐标做最近距离估算
      let nearest = null;
      let minDist = Infinity;
      const rayDir = raycaster.ray.direction.clone().normalize();
      const origin = raycaster.ray.origin.clone();
      for (const p of filteredAcupoints) {
        const pt = new THREE.Vector3(p.position.x, p.position.y, p.position.z);
        // 点到射线的距离
        const toPt = pt.clone().sub(origin);
        const t = toPt.dot(rayDir);
        if (t < 0) continue;
        const proj = origin.clone().add(rayDir.clone().multiplyScalar(t));
        const dist = proj.distanceTo(pt);
        if (dist < minDist) {
          minDist = dist;
          nearest = { point: p, t };
        }
      }
      // 如果射线离某个穴位足够近（阈值 0.15），就聚焦到该穴位
      if (nearest && minDist < 0.15) {
        focusPoint = {
          pos: new THREE.Vector3(nearest.point.position.x, nearest.point.position.y, nearest.point.position.z),
          acupoint: nearest.point,
        };
      } else if (nearest) {
        // 否则用射线最近点作为焦点
        const proj = origin.clone().add(rayDir.clone().multiplyScalar(nearest.t));
        focusPoint = { pos: proj };
      }
    }

    if (!focusPoint) {
      // 退而求其次：用射线在 z=0 平面的交点作为焦点
      const ray = raycaster.ray;
      if (Math.abs(ray.direction.z) > 0.0001) {
        const t = -ray.origin.z / ray.direction.z;
        if (t > 0) {
          const pt = ray.origin.clone().add(ray.direction.clone().multiplyScalar(t));
          focusPoint = { pos: pt };
        }
      }
    }

    if (!focusPoint) return;

    const target = focusPoint.pos;
    controlsRef.current.target.copy(target);

    // 根据焦点的 y 位置自适应缩放比例
    const y = target.y;
    const dist = y > 0.7 ? 0.55 : y > 0.2 ? 0.9 : 1.25;
    const hAbove = y > 0.7 ? 0.12 : 0.2;
    const newCamPos = new THREE.Vector3(target.x, target.y + hAbove, target.z + dist);
    cameraRef.current.position.copy(newCamPos);
    cameraRef.current.lookAt(target);
    controlsRef.current.update();
    setCameraPositionState({ x: newCamPos.x, y: newCamPos.y, z: newCamPos.z });
    didInitRef.current = true;

    if (focusPoint.acupoint) {
      const acu = focusPoint.acupoint;
      setSelectedAcupoint(acu);
      setSearchKeyword('');
      setSearchOpen(false);
      const region = detectRegion(acu.position);
      if (region) setActiveRegion(region.key);
      message.success(`已聚焦 ${acu.name}（${acu.code}）`);
    } else {
      setSelectedAcupoint(null);
      setActiveRegion(null);
      message.success('已放大到点击位置');
    }
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
        const camPos = new THREE.Vector3(center.x, center.y + 0.3, center.z + camDist);
        controlsRef.current.target.copy(center);
        cameraRef.current.position.copy(camPos);
        cameraRef.current.lookAt(center);
        // 同步相机位置给标签跟随
        setCameraPositionState({
          x: camPos.x,
          y: camPos.y,
          z: camPos.z,
        });
        // 选中该经络的第一个穴位，便于信息面板展示
        setSelectedAcupoint(meridianPts[0]);
      }
    } else if (!value && controlsRef.current && cameraRef.current) {
      // 清除筛选时拉回默认视角
      controlsRef.current.target.set(0, 0.5, 0);
      cameraRef.current.position.set(0, 0.5, 3.2);
      cameraRef.current.lookAt(controlsRef.current.target);
      setCameraPositionState({ x: 0, y: 0.5, z: 3.2 });
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
      filtered = filtered.filter((point) => fuzzyMatch(keyword, point));
    }

    if (meridian) {
      filtered = filtered.filter(point => point.meridian === meridian);
    }

    setFilteredAcupoints(filtered);

    if (filtered.length === 0) {
      message.warning('未找到匹配的穴位');
    }
  };

  // 预设视角：正面、背面、左侧、右侧、顶部、底部
  // 身体中心约为 (0, 0.5, 0)，相机距离约 3.2 以容纳整个身体
  const VIEW_PRESETS = {
    front:  { label: '正面', cam: [0,    0.5, 3.2],  target: [0, 0.5, 0] },
    back:   { label: '背面', cam: [0,    0.5, -3.2], target: [0, 0.5, 0] },
    left:   { label: '左侧', cam: [-3.2, 0.5, 0],   target: [0, 0.5, 0] },
    right:  { label: '右侧', cam: [3.2,  0.5, 0],    target: [0, 0.5, 0] },
    top:    { label: '顶部', cam: [0,    3.8, 0.6],  target: [0, 0.5, 0] },
    bottom: { label: '底部', cam: [0,    -2.2, 0.6], target: [0, 0.5, 0] },
  };

  const applyPresetView = (key) => {
    const preset = VIEW_PRESETS[key];
    if (!preset) return;
    setPresetView(key);
    if (!cameraRef.current || !controlsRef.current) {
      setTimeout(() => applyPresetView(key), 80);
      return;
    }
    didInitRef.current = true;
    cameraRef.current.position.set(preset.cam[0], preset.cam[1], preset.cam[2]);
    controlsRef.current.target.set(preset.target[0], preset.target[1], preset.target[2]);
    cameraRef.current.lookAt(controlsRef.current.target);
    controlsRef.current.update();
    // 立即把相机位置同步到 React 状态，让标签跟着切换方向
    setCameraPositionState({
      x: preset.cam[0],
      y: preset.cam[1],
      z: preset.cam[2],
    });
  };

  const handleReset = () => {
    setSearchKeyword('');
    setFilterMeridian(null);
    setActiveView('all');
    setSelectedAcupoint(null);
    setFilteredAcupoints([]);
    // 重置：清空筛选后回到默认正面视角
    applyPresetView('front');
  };

  // 一键还原模型：清空所有筛选 + 回到默认正面视角
  const handleResetAll = () => {
    handleReset();
    message.success('已还原模型到默认位置');
  };

  const handleShowAll = () => {
    setSearchKeyword('');
    setFilterMeridian(null);
    setActiveView('all');
    setSelectedAcupoint(null);
    setFilteredAcupoints(transformedAcupoints);
    // 把相机拉回正面视角，保证全身可见
    applyPresetView('front');
  };

  const handleSelectAcupoint = (acupoint) => {
    setSelectedAcupoint(acupoint);
    // 更新激活区域（用于右侧部位聚焦高亮）
    const region = detectRegion(acupoint.position);
    if (region) setActiveRegion(region.key);
  };

  const handleLocate = () => {
    if (!selectedAcupoint) return;
    flyTo(selectedAcupoint.position);
    message.success(`已聚焦：${selectedAcupoint.name}`);
  };

  const restoreCanvasSize = () => {
    if (prevCanvasSizeRef.current && canvasWrapperRef.current) {
      const { width, height } = prevCanvasSizeRef.current;
      // 先立刻把 canvas wrapper 设为像素尺寸，避免布局重排导致水平滚动
      canvasWrapperRef.current.style.width = width + 'px';
      canvasWrapperRef.current.style.height = height + 'px';
      // 两帧后再清除内联样式，让 flex 布局自然接管
      setTimeout(() => {
        if (canvasWrapperRef.current) {
          canvasWrapperRef.current.style.width = '';
          canvasWrapperRef.current.style.height = '';
        }
        prevCanvasSizeRef.current = null;
      }, 50);
    }
  };

  const handleToggleFullscreen = () => {
    const next = !isFullscreen;
    if (next) {
      // 进入全屏：保存原始尺寸
      if (canvasWrapperRef.current) {
        const rect = canvasWrapperRef.current.getBoundingClientRect();
        prevCanvasSizeRef.current = {
          width: rect.width,
          height: rect.height,
        };
      }
    } else {
      restoreCanvasSize();
    }
    setIsFullscreen(next);
  };

  // 全屏状态变化：保存原始样式，退出时完全还原
  const prevStylesRef = useRef(null);
  useEffect(() => {
    if (isFullscreen) {
      // 保存当前 html/body 的 overflow 与 height 状态
      prevStylesRef.current = {
        htmlOverflow: document.documentElement.style.overflow,
        htmlHeight: document.documentElement.style.height,
        bodyOverflow: document.body.style.overflow,
        bodyHeight: document.body.style.height,
      };
      // 全屏时锁定滚动，避免 body 撑大
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.height = '100%';
      document.body.style.height = '100%';
      const onKey = (e) => {
        if (e.key === 'Escape') {
          restoreCanvasSize();
          setIsFullscreen(false);
        }
      };
      window.addEventListener('keydown', onKey);
      return () => {
        window.removeEventListener('keydown', onKey);
      };
    } else if (prevStylesRef.current) {
      // 还原到全屏前的状态
      const s = prevStylesRef.current;
      document.documentElement.style.overflow = s.htmlOverflow || '';
      document.documentElement.style.height = s.htmlHeight || '';
      document.body.style.overflow = s.bodyOverflow || '';
      document.body.style.height = s.bodyHeight || '';
      prevStylesRef.current = null;
    }
  }, [isFullscreen]);

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
    // 同步相机位置给标签跟随
    setCameraPositionState({
      x: camPos.x,
      y: camPos.y,
      z: camPos.z,
    });
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
    <div style={{ maxWidth: '100%' }}>
      <div className="page-header">
        <h1 className="page-title">
          <ScanOutlined style={{ marginRight: 8, color: '#667eea' }} />
          人体3D穴位
        </h1>
        <Space>
          <Button type="primary" icon={<ScanOutlined />} onClick={handleShowAll}>
            显示全部穴位
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleResetAll}>
            还原模型
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
      <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: 14 }}>
        <Space size="middle" wrap style={{ width: '100%' }} align="center">
          <div style={{ position: 'relative' }}>
            <Input
              ref={searchInputRef}
              placeholder="搜索穴位名称/编码/经络，回车搜索"
              allowClear
              value={searchKeyword}
              onChange={(e) => handleLiveSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
              style={{ width: 320, height: 36 }}
              suffix={<SearchOutlined onClick={handleSearchIconClick} style={{ cursor: 'pointer', color: '#5BAF7D' }} />}
            />
            {searchOpen && searchKeyword && filteredAcupoints.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  right: 0,
                  background: '#fff',
                  border: '1px solid #EEF0ED',
                  borderRadius: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  maxHeight: 260,
                  overflow: 'auto',
                  zIndex: 200,
                }}
              >
                {filteredAcupoints.slice(0, 12).map((p) => (
                  <div
                    key={p.code}
                    onMouseDown={(e) => { e.preventDefault(); handleResultClick(p); }}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #F3F5F3',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F2F7F3')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: meridianColors[p.meridian] || '#1890ff',
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#1f2937' }}>{p.name}</span>
                      <Tag color="default" style={{ margin: 0, fontSize: 10 }}>{p.code}</Tag>
                    </div>
                    <span style={{ fontSize: 11, color: '#8a8f89' }}>{p.meridian}</span>
                  </div>
                ))}
                {filteredAcupoints.length > 12 && (
                  <div style={{ padding: '6px 12px', fontSize: 11, color: '#8a8f89', textAlign: 'center' }}>
                    还有 {filteredAcupoints.length - 12} 个匹配项，回车搜索全部
                  </div>
                )}
              </div>
            )}
          </div>
          <Select
            placeholder="按经络筛选"
            allowClear
            value={filterMeridian}
            onChange={handleMeridianFilter}
            style={{ width: 200, height: 36 }}
          >
            {meridianList.map(meridian => (
              <Select.Option key={meridian} value={meridian}>
                {meridian}
              </Select.Option>
            ))}
          </Select>
          <div style={{
            height: 36,
            padding: '0 14px',
            display: 'inline-flex',
            alignItems: 'center',
            borderRadius: 8,
            background: '#F2F7F3',
            border: '1px solid #D9E5DD',
            color: '#1F6F52',
            fontSize: 13,
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}>
            显示 <strong style={{ color: '#163D2B', margin: '0 4px' }}>{filteredAcupoints.length}</strong> / {transformedAcupoints.length} 个穴位
          </div>
        </Space>
      </Card>

      {/* 3D可视化区域 */}
      <div ref={containerRef} style={{ display: 'flex', gap: 16 }}>
        <div ref={canvasWrapperRef} style={{ flex: 1, position: isFullscreen ? 'fixed' : 'relative', top: isFullscreen ? 0 : undefined, left: isFullscreen ? 0 : undefined, width: isFullscreen ? '100%' : '100%', height: isFullscreen ? '100%' : undefined, zIndex: isFullscreen ? 9999 : undefined, background: isFullscreen ? 'linear-gradient(180deg, #e8f4f8 0%, #d1ecf1 50%, #bee5eb 100%)' : undefined, inset: isFullscreen ? 0 : undefined, overflow: 'hidden' }}>
          <div style={{
            width: '100%',
            height: isFullscreen ? '100%' : 650,
            borderRadius: isFullscreen ? 0 : 8,
            overflow: 'hidden',
            background: 'linear-gradient(180deg, #e8f4f8 0%, #d1ecf1 50%, #bee5eb 100%)',
            position: 'relative',
          }}>
            {/* 全屏时显示退出按钮：右侧垂直居中 */}
            {isFullscreen && (
              <button
                onClick={() => setIsFullscreen(false)}
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: 16,
                  transform: 'translateY(-50%)',
                  zIndex: 30,
                  padding: '10px 14px',
                  borderRadius: 24,
                  border: 'none',
                  background: 'rgba(255,255,255,0.92)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  color: '#1F6F52',
                  fontWeight: 500,
                  transition: 'transform 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-50%) scale(1.04)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(-50%) scale(1)')}
                title="退出全屏 (ESC)"
              >
                <FullscreenExitOutlined />
                <span>退出全屏</span>
              </button>
            )}
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
              onDoubleClick={(e) => handleCanvasDoubleClick(e.nativeEvent)}
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
                  cameraPosition={cameraPositionState}
                  onClick={() => handleSelectAcupoint(acupoint)}
                  onDoubleClick={() => handleAcupointDoubleClick(acupoint)}
                />
              ))}

              <CameraTracker onUpdate={setCameraPositionState} />

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

            {/* 经络图例（可点击激活对应经络） */}
            <div style={{
              position: 'absolute',
              top: 16,
              left: 16,
              zIndex: 10,
            }}>
              <Card
                title={<span style={{ fontSize: 12, fontWeight: 600 }}>经络图例</span>}
                extra={
                  filterMeridian ? (
                    <Button type="link" size="small" onClick={() => handleMeridianFilter(null)} style={{ padding: 0, height: 'auto', fontSize: 11 }}>
                      清除
                    </Button>
                  ) : null
                }
                size="small"
                style={{ width: 190, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                bodyStyle={{ padding: 8 }}
              >
                <div className="scrollbar-hidden" style={{ fontSize: 11, lineHeight: 1.9, maxHeight: 220, overflow: 'auto', scrollbarWidth: 'none' }}>
                  {Object.entries(meridianColors).map(([name, color]) => {
                    const active = filterMeridian === name;
                    return (
                      <div
                        key={name}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleMeridianFilter(active ? null : name)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') handleMeridianFilter(active ? null : name);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '3px 6px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          background: active ? '#F2F7F3' : 'transparent',
                          border: active ? '1px solid #D9E5DD' : '1px solid transparent',
                          transition: 'background 0.15s ease',
                          userSelect: 'none',
                          marginBottom: 2,
                        }}
                        onMouseEnter={(e) => {
                          if (!active) e.currentTarget.style.background = '#F7F9F7';
                        }}
                        onMouseLeave={(e) => {
                          if (!active) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div
                          style={{
                            width: 9,
                            height: 9,
                            borderRadius: '50%',
                            background: color,
                            flexShrink: 0,
                            boxShadow: active ? `0 0 0 2px ${color}55` : 'none',
                          }}
                        />
                        <span style={{
                          fontSize: 11,
                          color: active ? '#1F6F52' : '#1f2937',
                          fontWeight: active ? 600 : 400,
                        }}>{name}</span>
                        {active && <span style={{ marginLeft: 'auto', fontSize: 9, color: '#5BAF7D' }}>✓</span>}
                      </div>
                    );
                  })}
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
                  <div>🖱️ 左键拖动：旋转模型</div>
                  <div>🖱️ 右键拖动：平移视角</div>
                  <div>🔍 滚轮向上：放大</div>
                  <div>🔍 滚轮向下：缩小</div>
                  <div>👆 点击穴位：查看详情</div>
                  <div>🖱️ 悬停穴位：查看名称</div>
                </div>
              </Card>
            </div>

            {/* 视角图例：六面方向切换 */}
            <div style={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              zIndex: 10,
            }}>
              <Card
                size="small"
                title={<span style={{ fontSize: 12, fontWeight: 600 }}>视角切换</span>}
                extra={
                  <Button
                    type="text"
                    size="small"
                    icon={<RotateLeftOutlined />}
                    onClick={() => handleResetAll()}
                    style={{ color: '#1F6F52' }}
                  >
                    还原
                  </Button>
                }
                style={{
                  width: 156,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderRadius: 12,
                }}
                bodyStyle={{ padding: 8 }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gridTemplateRows: 'repeat(4, 30px)',
                    gap: 4,
                    alignItems: 'center',
                    justifyItems: 'center',
                  }}
                >
                  <div />
                  <ViewBtn label="顶" active={presetView === 'top'} onClick={() => applyPresetView('top')} />
                  <div />

                  <ViewBtn label="左" active={presetView === 'left'} onClick={() => applyPresetView('left')} />
                  <ViewBtn label="前" active={presetView === 'front'} onClick={() => applyPresetView('front')} />
                  <ViewBtn label="右" active={presetView === 'right'} onClick={() => applyPresetView('right')} />

                  <div />
                  <ViewBtn label="底" active={presetView === 'bottom'} onClick={() => applyPresetView('bottom')} />
                  <div />

                  <div style={{ gridColumn: '1 / span 3' }}>
                    <ViewBtn label="后" active={presetView === 'back'} onClick={() => applyPresetView('back')} />
                  </div>
                </div>
                <div style={{ marginTop: 6, fontSize: 10, color: '#8a8f89', textAlign: 'center', lineHeight: 1.4 }}>
                  点击方向即可切换视角<br/>穴位始终正常展示
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
