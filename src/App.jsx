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
  const {
    token: { borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    let cancelled = false;
    const loader = new GLTFLoader();

    loader.load(
      '/acupuncture.glb',
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
        setLoadProgress(100);
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          const percent = Math.round((xhr.loaded / xhr.total) * 100);
          setLoadProgress(percent);
        }
      },
      (err) => {
        if (cancelled) return;
        setLoadError(err.message || '模型加载失败');
      }
    );

    return () => { cancelled = true; };
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

  const renderContent = () => {
    return (
      <>
        <div style={{ display: selectedMenu === 'dashboard' ? 'block' : 'none' }}>
          <Dashboard onNavigate={setSelectedMenu} />
        </div>
        <div style={{ display: selectedMenu === 'qa' ? 'block' : 'none' }}>
          <QASystem />
        </div>
        <div style={{ display: selectedMenu === 'visualization' ? 'block' : 'none' }}>
          <AcupointVisualization preloadedScene={modelScene} modelTransform={modelTransform} />
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
      <Layout style={{ minHeight: '100vh', background: '#FAFAF8' }}>
        <Header
          className="app-header"
          style={{ borderBottom: '1px solid #EEF0ED', boxShadow: 'none' }}
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
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  marginBottom: 4,
                  color: '#1F6F52',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'visible',
                }}
              >
                正在准备 3D 模型 · {loadProgress}%
              </div>
              <Progress
                percent={loadProgress}
                size="small"
                strokeColor="#1F6F52"
                showInfo={false}
              />
            </div>
          )}
          {modelScene && (
            <div style={{ marginLeft: 'auto', color: '#5BAF7D', fontSize: 12, fontWeight: 500 }}>
              ● 3D 模型就绪
            </div>
          )}
        </Header>
        <Layout style={{ background: '#FAFAF8' }}>
          <Sider
            width={280}
            style={{
              background: 'transparent',
              padding: '20px 16px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Menu
              mode="inline"
              selectedKeys={[selectedMenu]}
              onClick={({ key }) => setSelectedMenu(key)}
              items={menuItems}
              style={{ flex: 1, borderRight: 0, paddingTop: 4, minHeight: 0 }}
            />
            <ShichenTip />
          </Sider>
          <Layout style={{ padding: '32px 32px 32px 24px', background: '#FAFAF8' }}>
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
