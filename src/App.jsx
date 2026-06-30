import { useState, useEffect } from 'react';
import { Layout, Menu, theme, Progress, ConfigProvider } from 'antd';
import {
  MessageOutlined,
  ScanOutlined,
  BookOutlined,
  HomeOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import QASystem from './pages/QASystem';
import AcupointVisualization from './pages/AcupointVisualization';
import KnowledgeBase from './pages/KnowledgeBase';
import Dashboard from './pages/Dashboard';
import ShichenTip from './pages/ShichenTip';
import './App.css';

const { Header, Content, Sider } = Layout;

function App() {
  const [selectedMenu, setSelectedMenu] = useState('qa');
  const [modelScene, setModelScene] = useState(null);
  const [modelTransform, setModelTransform] = useState(null);
  const [loadProgress, setLoadProgress] = useState(null);
  const [highlightAcupoint, setHighlightAcupoint] = useState(null);
  const {
    token: { borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    let cancelled = false;
    let lastPercent = -1;
    const loader = new GLTFLoader();
    // DRACO 解码器：用于加载 DRACO 压缩后的 glb（体积约原 1/5）
    // 解码器 wasm 放在 public/draco/，与 three 自带版本一致
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    dracoLoader.setDecoderConfig({ type: 'wasm' });
    dracoLoader.preload();
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      '/acupuncture.draco.glb',
      (gltf) => {
        if (cancelled) return;
        const loadedScene = gltf.scene;
        loadedScene.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
              color: '#E8DED1',
              roughness: 0.85,
              metalness: 0.05,
            });
          }
        });
        const box = new THREE.Box3().setFromObject(loadedScene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.5 / maxDim;
        const offset = new THREE.Vector3(
          -center.x * scale,
          -center.y * scale + 0.5,
          -center.z * scale
        );
        loadedScene.scale.set(scale, scale, scale);
        loadedScene.position.copy(offset);
        setModelScene(loadedScene);
        setModelTransform({
          scale,
          offset: { x: offset.x, y: offset.y, z: offset.z },
          modelCenter: { x: center.x, y: center.y, z: center.z },
          modelSize: { x: size.x, y: size.y, z: size.z },
        });
        if (lastPercent !== 100) {
          lastPercent = 100;
          setLoadProgress(100);
        }
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          const percent = Math.round((xhr.loaded / xhr.total) * 100);
          if (percent !== lastPercent) {
            lastPercent = percent;
            setLoadProgress(percent);
          }
        }
      },
      (err) => {
        if (cancelled) return;
      }
    );

    return () => {
      cancelled = true;
      dracoLoader.dispose();
    };
  }, []);

  const menuItems = [
    {
      key: 'dashboard',
      icon: <HomeOutlined />,
      label: '总览',
    },
    {
      key: 'qa',
      icon: <MessageOutlined />,
      label: '智能问答',
    },
    {
      key: 'visualization',
      icon: <ScanOutlined />,
      label: '3D 穴位',
    },
    {
      key: 'knowledge',
      icon: <BookOutlined />,
      label: '知识库',
    },
  ];

  const handleNavigateToVisualization = (acupoint) => {
    setHighlightAcupoint(acupoint);
    setSelectedMenu('visualization');
  };

  const handleMenuClick = ({ key }) => {
    // 从导航进入 3D 页面：清空穴位聚焦状态，使用默认人体比例视角
    if (key === 'visualization') {
      setHighlightAcupoint(null);
    }
    setSelectedMenu(key);
  };

  const renderContent = () => {
    return (
      <>
        <div style={{ display: selectedMenu === 'dashboard' ? 'block' : 'none' }}>
          <Dashboard onNavigate={setSelectedMenu} />
        </div>
        <div style={{ display: selectedMenu === 'qa' ? 'block' : 'none' }}>
          <QASystem onNavigateToVisualization={handleNavigateToVisualization} />
        </div>
        <div style={{ display: selectedMenu === 'visualization' ? 'block' : 'none' }}>
          <AcupointVisualization
            preloadedScene={modelScene}
            modelTransform={modelTransform}
            highlightAcupoint={highlightAcupoint}
          />
        </div>
        <div style={{ display: selectedMenu === 'knowledge' ? 'block' : 'none' }}>
          <KnowledgeBase />
        </div>
      </>
    );
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1F6F52',
          colorInfo: '#1F6F52',
          colorSuccess: '#5BAF7D',
          colorWarning: '#C58B54',
          colorError: '#C95A4A',
          colorBgContainer: '#ffffff',
          colorBgLayout: '#FAFAF8',
          colorText: '#1f2937',
          colorTextSecondary: '#8a8f89',
          colorBorder: '#D5D8D3',
          borderRadius: 12,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', 'Helvetica Neue', sans-serif",
        },
      }}
    >
      <Layout style={{ height: '100vh', background: '#FAFAF8', overflow: 'hidden' }}>
        <Header
          className="app-header"
          style={{
            borderBottom: '1px solid #EEF0ED',
            boxShadow: 'none',
            flexShrink: 0,
            height: 64,
            lineHeight: '64px',
          }}
        >
          <div className="app-title">
            <span className="app-title-icon">
              <MedicineBoxOutlined />
            </span>
            <span>中医针灸智能知识问答</span>
          </div>
          {loadProgress !== null && loadProgress < 100 && (
            <div
              style={{
                marginLeft: 'auto',
                width: 200,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                flexShrink: 0,
                lineHeight: 'normal',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  marginBottom: 4,
                  color: '#1F6F52',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                正在准备 3D 模型 · {loadProgress}%
              </div>
              <Progress
                percent={loadProgress}
                size="small"
                strokeColor="#1F6F52"
                showInfo={false}
                className="app-header-progress"
              />
            </div>
          )}
          {modelScene && (
            <div style={{ marginLeft: 'auto', color: '#5BAF7D', fontSize: 12, fontWeight: 500 }}>
              ● 3D 模型就绪
            </div>
          )}
        </Header>
        <Layout style={{ background: '#FAFAF8', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <Sider
            width={280}
            style={{
              background: 'transparent',
              padding: '20px 16px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              flexShrink: 0,
              height: '100%',
            }}
          >
            <Menu
              mode="inline"
              selectedKeys={[selectedMenu]}
              onClick={handleMenuClick}
              items={menuItems}
              style={{ flex: 1, borderRight: 0, paddingTop: 4, minHeight: 0 }}
            />
            <ShichenTip />
          </Sider>
          <Layout
            style={{
              padding: '32px 32px 32px 24px',
              background: '#FAFAF8',
              flex: 1,
              minHeight: 0,
              overflow: 'auto',
            }}
          >
            <Content
              style={{
                padding: 0,
                margin: 0,
                minHeight: 280,
                background: 'transparent',
                borderRadius: 0,
                boxShadow: 'none',
              }}
            >
              {renderContent()}
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
