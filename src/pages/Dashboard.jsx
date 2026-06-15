import { Row, Col, Card, Statistic, Timeline, Tag, Button } from 'antd';
import {
  MessageOutlined,
  BookOutlined,
  ScanOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { qaData, knowledgeData } from '../data/mockData';

const Dashboard = ({ onNavigate }) => {
  const answeredCount = qaData.filter(q => q.status === 'answered').length;
  const pendingCount = qaData.filter(q => q.status === 'pending').length;
  const knowledgeCount = knowledgeData.length;

  const recentQuestions = qaData.slice(0, 5);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">系统首页</h1>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={8}>
          <Card 
            hoverable
            onClick={() => onNavigate('qa')}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              color: 'white'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>总问答数</span>}
              value={qaData.length}
              prefix={<MessageOutlined />}
              valueStyle={{ color: 'white' }}
              suffix="条"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card 
            hoverable
            onClick={() => onNavigate('qa')}
            style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              border: 'none',
              color: 'white'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>已回答</span>}
              value={answeredCount}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: 'white' }}
              suffix="条"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card 
            hoverable
            onClick={() => onNavigate('knowledge')}
            style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              border: 'none',
              color: 'white'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>知识库文档</span>}
              value={knowledgeCount}
              prefix={<BookOutlined />}
              valueStyle={{ color: 'white' }}
              suffix="篇"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card 
            title={
              <span>
                <ClockCircleOutlined style={{ marginRight: 8 }} />
                最近问答记录
              </span>
            }
            extra={<Button type="link" onClick={() => onNavigate('qa')}>查看全部</Button>}
          >
            <Timeline
              items={recentQuestions.map(q => ({
                color: q.status === 'answered' ? 'green' : 'orange',
                children: (
                  <div>
                    <div style={{ marginBottom: 8 }}>
                      <Tag color={q.status === 'answered' ? 'success' : 'warning'}>
                        {q.status === 'answered' ? '已回答' : '待回答'}
                      </Tag>
                      <Tag color="blue">{q.category}</Tag>
                    </div>
                    <div style={{ fontSize: 14, marginBottom: 4 }}>{q.question}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>{q.createTime}</div>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title={
              <span>
                <RiseOutlined style={{ marginRight: 8 }} />
                热门知识文档
              </span>
            }
            extra={<Button type="link" onClick={() => onNavigate('knowledge')}>查看全部</Button>}
          >
            <Timeline
              items={knowledgeData.slice(0, 5).map(k => ({
                color: 'blue',
                children: (
                  <div>
                    <div style={{ marginBottom: 8 }}>
                      <Tag color="purple">{k.category}</Tag>
                      {k.tags.slice(0, 2).map(tag => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </div>
                    <div style={{ fontSize: 14, marginBottom: 4 }}>{k.title}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      浏览量: {k.views} | {k.updateTime}
                    </div>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card 
            title={
              <span>
                <ThunderboltOutlined style={{ marginRight: 8 }} />
                快速访问
              </span>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Button 
                  type="primary" 
                  size="large" 
                  block 
                  icon={<MessageOutlined />}
                  onClick={() => onNavigate('qa')}
                  style={{ height: 80 }}
                >
                  中医针灸问答
                </Button>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Button 
                  type="primary" 
                  size="large" 
                  block 
                  icon={<ScanOutlined />}
                  onClick={() => onNavigate('visualization')}
                  style={{ height: 80, background: '#f093fb' }}
                >
                  人体3D穴位
                </Button>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Button 
                  type="primary" 
                  size="large" 
                  block 
                  icon={<BookOutlined />}
                  onClick={() => onNavigate('knowledge')}
                  style={{ height: 80, background: '#4facfe' }}
                >
                  知识库管理
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
