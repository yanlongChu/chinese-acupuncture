import { Row, Col, Card, Timeline, Tag, Button } from 'antd';
import {
  MessageOutlined,
  BookOutlined,
  ScanOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { qaData, knowledgeData } from '../data/mockData';

const Dashboard = ({ onNavigate }) => {
  const answeredCount = qaData.filter(q => q.status === 'answered').length;
  const pendingCount = qaData.filter(q => q.status === 'pending').length;
  const knowledgeCount = knowledgeData.length;

  const recentQuestions = qaData.slice(0, 5);

  return (
    <div className="fade-in">
      {/* Hero Section */}
      <div
        style={{
          marginBottom: 32,
          padding: '44px 40px',
          background: 'linear-gradient(135deg, #F2F7F3 0%, #FAF6F0 100%)',
          borderRadius: 28,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 560 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 980,
              background: 'rgba(31,111,82,0.08)',
              color: '#1F6F52',
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 20,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1F6F52' }} />
            智能中医针灸助手 · v1.0
          </div>
          <h1
            style={{
              fontSize: 44,
              fontWeight: 700,
              color: '#1f2937',
              letterSpacing: '-0.025em',
              margin: 0,
              lineHeight: 1.15,
            }}
          >
            探索千年针灸智慧
            <br />
            <span style={{ color: '#1F6F52' }}>一问一答，精准取穴</span>
          </h1>
          <p
            style={{
              fontSize: 16,
              color: '#6b7280',
              marginTop: 16,
              marginBottom: 0,
              letterSpacing: '-0.01em',
              lineHeight: 1.6,
            }}
          >
            基于经典经络理论与现代知识图谱，为你提供穴位定位、配伍方案、养生建议与 3D 可视化演示。
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
            <Button
              type="primary"
              size="large"
              icon={<MessageOutlined />}
              onClick={() => onNavigate('qa')}
              style={{ borderRadius: 980, height: 46, paddingInline: 24, fontSize: 15, fontWeight: 500 }}
            >
              开始对话
            </Button>
            <Button
              size="large"
              icon={<ScanOutlined />}
              onClick={() => onNavigate('visualization')}
              style={{
                borderRadius: 980,
                height: 46,
                paddingInline: 24,
                fontSize: 15,
                fontWeight: 500,
                background: '#ffffff',
                border: '1px solid #D5D8D3',
                color: '#1f2937',
              }}
            >
              查看 3D 模型
            </Button>
          </div>
        </div>
        {/* Decorative circle */}
        <div
          style={{
            position: 'absolute',
            right: '-80px',
            top: '-80px',
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(31,111,82,0.12) 0%, rgba(31,111,82,0) 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: '60px',
            bottom: '-60px',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(197,139,84,0.18) 0%, rgba(197,139,84,0) 70%)',
          }}
        />
      </div>

      {/* Stats */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => onNavigate('qa')} className="stat-card" style={{ borderRadius: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 13, color: '#8a8f89', fontWeight: 500 }}>总问答数</div>
                <div
                  style={{
                    fontSize: 44,
                    fontWeight: 600,
                    color: '#1f2937',
                    letterSpacing: '-0.03em',
                    marginTop: 8,
                    lineHeight: 1,
                  }}
                >
                  {qaData.length}
                  <span style={{ fontSize: 16, color: '#8a8f89', fontWeight: 400, marginLeft: 4 }}>条</span>
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: '#F2F7F3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1F6F52',
                  fontSize: 20,
                }}
              >
                <MessageOutlined />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => onNavigate('qa')} className="stat-card" style={{ borderRadius: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 13, color: '#8a8f89', fontWeight: 500 }}>已回答</div>
                <div
                  style={{
                    fontSize: 44,
                    fontWeight: 600,
                    color: '#1f2937',
                    letterSpacing: '-0.03em',
                    marginTop: 8,
                    lineHeight: 1,
                  }}
                >
                  {answeredCount}
                  <span style={{ fontSize: 16, color: '#8a8f89', fontWeight: 400, marginLeft: 4 }}>条</span>
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: '#F2F7F3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#5BAF7D',
                  fontSize: 20,
                }}
              >
                <CheckCircleOutlined />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => onNavigate('knowledge')} className="stat-card" style={{ borderRadius: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 13, color: '#8a8f89', fontWeight: 500 }}>知识库文档</div>
                <div
                  style={{
                    fontSize: 44,
                    fontWeight: 600,
                    color: '#1f2937',
                    letterSpacing: '-0.03em',
                    marginTop: 8,
                    lineHeight: 1,
                  }}
                >
                  {knowledgeCount}
                  <span style={{ fontSize: 16, color: '#8a8f89', fontWeight: 400, marginLeft: 4 }}>篇</span>
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: '#FAF3EA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#8C6A43',
                  fontSize: 20,
                }}
              >
                <BookOutlined />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Middle content columns */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ fontSize: 15, fontWeight: 600 }}>
                <ClockCircleOutlined style={{ marginRight: 8, color: '#1F6F52' }} />
                最近问答
              </span>
            }
            extra={<Button type="link" onClick={() => onNavigate('qa')}>查看全部</Button>}
          >
            <Timeline
              items={recentQuestions.map(q => ({
                color: q.status === 'answered' ? '#5BAF7D' : '#C58B54',
                children: (
                  <div>
                    <div style={{ marginBottom: 6 }}>
                      <Tag color={q.status === 'answered' ? 'success' : 'warning'}>
                        {q.status === 'answered' ? '已回答' : '待回答'}
                      </Tag>
                      <Tag
                        color="default"
                        style={{ background: '#F2F4F2', color: '#1f2937', border: 'none' }}
                      >
                        {q.category}
                      </Tag>
                    </div>
                    <div style={{ fontSize: 14, marginBottom: 4, color: '#1f2937', fontWeight: 500 }}>
                      {q.question}
                    </div>
                    <div style={{ fontSize: 12, color: '#8a8f89' }}>{q.createTime}</div>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ fontSize: 15, fontWeight: 600 }}>
                <BookOutlined style={{ marginRight: 8, color: '#1F6F52' }} />
                热门知识
              </span>
            }
            extra={<Button type="link" onClick={() => onNavigate('knowledge')}>查看全部</Button>}
          >
            <Timeline
              items={knowledgeData.slice(0, 5).map(k => ({
                color: '#1F6F52',
                children: (
                  <div>
                    <div style={{ marginBottom: 6 }}>
                      <Tag
                        color="default"
                        style={{ background: '#F2F4F2', color: '#1f2937', border: 'none' }}
                      >
                        {k.category}
                      </Tag>
                      {k.tags.slice(0, 2).map(tag => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </div>
                    <div style={{ fontSize: 14, marginBottom: 4, color: '#1f2937', fontWeight: 500 }}>
                      {k.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#8a8f89' }}>
                      {k.views} 次浏览 · {k.updateTime}
                    </div>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>

      {/* Feature navigation - replacing the oversized buttons */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card title={<span style={{ fontSize: 15, fontWeight: 600 }}>功能导览</span>}>
            <Row gutter={[16, 16]}>
              {[
                {
                  key: 'qa',
                  title: '智能问答',
                  desc: '自然语言提问，AI 解析病症与穴位',
                  icon: <MessageOutlined />,
                  color: '#1F6F52',
                  bg: '#F2F7F3',
                },
                {
                  key: 'visualization',
                  title: '3D 穴位模型',
                  desc: '交互式三维人体，精准定位穴位',
                  icon: <ScanOutlined />,
                  color: '#8C6A43',
                  bg: '#FAF3EA',
                },
                {
                  key: 'knowledge',
                  title: '知识库管理',
                  desc: '经典方剂、配伍方案、穴位详解',
                  icon: <BookOutlined />,
                  color: '#5B6B8C',
                  bg: '#F1F4F9',
                },
              ].map(item => (
                <Col xs={24} md={8} key={item.key}>
                  <div
                    onClick={() => onNavigate(item.key)}
                    style={{
                      padding: '20px 22px',
                      background: '#ffffff',
                      border: '1px solid #EEF0ED',
                      borderRadius: 18,
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = item.color;
                      e.currentTarget.style.boxShadow = `0 8px 24px ${item.bg}`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '#EEF0ED';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        background: item.bg,
                        color: item.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#1f2937', marginBottom: 2 }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 12, color: '#8a8f89', lineHeight: 1.5 }}>{item.desc}</div>
                    </div>
                    <ArrowRightOutlined style={{ color: '#c7c7cc', fontSize: 14 }} />
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
