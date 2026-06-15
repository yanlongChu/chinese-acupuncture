import { useState, useEffect } from 'react';
import { Layout, Menu, theme, Progress } from 'antd';
import {
  MessageOutlined,
  ScanOutlined,
  BookOutlined,
  HomeOutlined,
  MedicineBoxOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import QASystem from './pages/QASystem';
import AcupointVisualization from './pages/AcupointVisualization';
import KnowledgeBase from './pages/KnowledgeBase';
import Dashboard from './pages/Dashboard';
import './App.css';

const { Header, Content, Sider } = Layout;

function App() {
  const [selectedMenu, setSelectedMenu] = useState('qa');
  const [modelScene, setModelScene] = useState(null);
  const [loadProgress, setLoadProgress] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // 预加载3D模型
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
              color: '#d4a574',
              roughness: 0.7,
              metalness: 0.1,
            });
          }
        });
        const box = new THREE.Box3().setFromObject(loadedScene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.5 / maxDim;
        loadedScene.scale.set(scale, scale, scale);
        loadedScene.position.set(-center.x * scale, -center.y * scale + 0.5, -center.z * scale);
        setModelScene(loadedScene);
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
      label: '系统首页',
    },
    {
      key: 'qa',
      icon: <MessageOutlined />,
      label: '中医针灸问答',
    },
    {
      key: 'visualization',
      icon: <ScanOutlined />,
      label: '人体3D穴位',
    },
    {
      key: 'knowledge',
      icon: <BookOutlined />,
      label: '知识库管理',
    },
  ];

  const formatBytes = (bytes) => {
    if (bytes > 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    if (bytes > 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
  };

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
          <AcupointVisualization preloadedScene={modelScene} />
        </div>
        <div style={{ display: selectedMenu === 'knowledge' ? 'block' : 'none' }}>
          <KnowledgeBase />
        </div>
      </>
    );
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ 
          color: 'white', 
          fontSize: '20px', 
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <MedicineBoxOutlined style={{ fontSize: '24px' }} />
          中医针灸智能知识问答系统
        </div>
        {/* 模型预加载进度条 */}
        {loadProgress !== null && loadProgress < 100 && (
          <div style={{ marginLeft: 'auto', width: 200, color: 'white' }}>
            <div style={{ fontSize: 12, marginBottom: 4 }}>3D模型加载中 {loadProgress}%</div>
            <Progress percent={loadProgress} size="small" strokeColor="#fff" showInfo={false} />
          </div>
        )}
        {modelScene && (
          <div style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
            3D模型已就绪
          </div>
        )}
      </Header>
      <Layout>
        <Sider
          width={220}
          style={{
            background: colorBgContainer,
            boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedMenu]}
            onClick={({ key }) => setSelectedMenu(key)}
            items={menuItems}
            style={{ height: '100%', borderRight: 0, paddingTop: 16 }}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default App;
