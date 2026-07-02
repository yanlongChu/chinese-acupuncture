import { useState, useRef, useEffect } from 'react';
import {
  Input,
  Tag,
  Button,
  Avatar,
  Tooltip,
  message,
  Empty,
  Divider,
  Space
} from 'antd';
import {
  SendOutlined,
  PlusOutlined,
  MessageOutlined,
  DeleteOutlined,
  RobotOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  ApartmentOutlined,
  BookOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { qaData as initialQaData } from '../data/mockData';
import { allAcupoints, acupointsByMeridian, meridianList } from '../data/acupoints361';
import { compatibilityData, techniqueData } from '../data/knowledgeData';

const { TextArea } = Input;

// 提取所有穴位名称用于匹配
const acupointNameMap = {};
allAcupoints.forEach(a => {
  acupointNameMap[a.name] = a;
});

// 将AI回复中的穴位名称渲染为可点击链接（支持markdown格式）
const renderContentWithAcupointLinks = (content, onAcupointClick) => {
  if (!content) return null;

  const sortedNames = Object.keys(acupointNameMap).sort((a, b) => b.length - a.length);
  const escapedNames = sortedNames.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedNames.join('|')})穴?`, 'g');

  const parts = content.split(regex);

  const renderMarkdown = (text) => {
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/•/g, '&bull;');
    text = text.replace(/\n/g, '<br/>');
    return text;
  };

  return parts.map((part, i) => {
    const cleanName = part.endsWith('穴') ? part.slice(0, -1) : part;
    if (acupointNameMap[cleanName]) {
      const acupoint = acupointNameMap[cleanName];
      return (
        <span
          key={i}
          onClick={() => onAcupointClick(acupoint)}
          style={{
            color: '#1F6F52',
            fontWeight: 600,
            cursor: 'pointer',
            borderBottom: '1px dashed #1F6F52',
            padding: '0 2px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#F2F7F3';
            e.currentTarget.style.borderRadius = '3px';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
          }}
          title={`点击查看3D位置 — ${acupoint.meridian} · ${acupoint.code}`}
        >
          {part}
        </span>
      );
    }
    return <span key={i} dangerouslySetInnerHTML={{ __html: renderMarkdown(part) }} />;
  });
};

// 模拟AI回答
const aiAnswers = {
  '头痛': {
    content: '根据您的症状描述，头痛伴有眩晕可能与肝阳上亢或气血不足有关。\n\n**推荐穴位：**\n• **百会穴** — 位于头顶正中，可升阳举陷、醒脑开窍\n• **太阳穴** — 额部两侧凹陷处，疏风止痛\n• **风池穴** — 颈后发际两侧，祛风解表\n\n**建议方法：** 艾灸百会穴15-20分钟，配合按揉太阳穴和风池穴各3分钟。每日1次，连续5-7天可见效。',
    graphType: 'meridian',
    graphNodes: ['百会', '太阳', '风池'],
    sources: [
      { type: 'meridian', name: '百会', code: 'GV20', label: '穴位详情' },
      { type: 'compat', name: '风寒外感头痛', id: 1, label: '配伍方案' }
    ]
  },
  '失眠': {
    content: '失眠多梦多与心脾两虚或心肾不交有关。\n\n**推荐穴位：**\n• **神门穴** — 心经原穴，宁心安神\n• **三阴交** — 肝脾肾三经交会，调理气血\n• **内关穴** — 理气安神\n• **涌泉穴** — 引火归元，配合艾灸效果更佳\n\n**建议方法：** 睡前2小时针刺或按揉上述穴位，每穴3-5分钟。可配合温水泡脚15分钟。',
    graphType: 'meridian',
    graphNodes: ['神门', '三阴交', '内关', '涌泉'],
    sources: [
      { type: 'meridian', name: '神门', code: 'HT7', label: '穴位详情' },
      { type: 'compat', name: '失眠（心脾两虚）', id: 8, label: '配伍方案' }
    ]
  },
  '腰痛': {
    content: '腰痛可能由寒湿、湿热、肾虚或瘀血引起。\n\n**推荐穴位：**\n• **肾俞穴** — 腰部第二腰椎旁开1.5寸，主治腰痛\n• **腰阳关** — 腰部正中，温阳散寒\n• **委中穴** — 窝正中，"腰背委中求"\n• **承山穴** — 小腿后侧，舒筋活络\n\n**建议方法：** 可针刺配合艾灸，每次20-30分钟。寒湿型可加灸命门穴。',
    graphType: 'meridian',
    graphNodes: ['肾俞', '腰阳关', '委中', '承山'],
    sources: [
      { type: 'meridian', name: '肾俞', code: 'BL23', label: '穴位详情' },
      { type: 'compat', name: '腰痛（寒湿型）', id: 17, label: '配伍方案' }
    ]
  },
  '胃胀': {
    content: '胃胀气、消化不良多与脾胃虚弱或肝气犯胃有关。\n\n**推荐穴位：**\n• **中脘穴** — 胃之募穴，上腹部正中，主治胃病\n• **足三里** — 强壮穴，健脾和胃\n• **天枢穴** — 调理肠胃气机\n• **内关穴** — 和胃降逆\n\n**建议方法：** 可采用温针灸或艾灸，中脘穴灸15分钟，足三里灸10分钟。饭后1小时进行效果最佳。',
    graphType: 'meridian',
    graphNodes: ['中脘', '足三里', '天枢', '内关'],
    sources: [
      { type: 'meridian', name: '足三里', code: 'ST36', label: '穴位详情' },
      { type: 'compat', name: '慢性胃炎', id: 13, label: '配伍方案' },
      { type: 'technique', name: '艾灸疗法', code: 'TC-004', label: '技法详情' }
    ]
  },
  'default': {
    content: '感谢您的提问。根据中医针灸理论，我为您分析如下：\n\n**辨证分析：** 需要结合您的具体症状、舌象、脉象等进行综合判断。\n\n**建议方案：** 建议您前往正规中医医院进行面诊，由专业医师根据您的体质和病情制定个性化的针灸治疗方案。\n\n**常用保健穴位：**\n• 足三里 — 强身健体\n• 三阴交 — 调理气血\n• 合谷穴 — 止痛通络',
    graphType: 'meridian',
    graphNodes: ['足三里', '三阴交', '合谷'],
    sources: [
      { type: 'meridian', name: '足三里', code: 'ST36', label: '穴位详情' }
    ]
  }
};

const QASystem = ({ onNavigateToVisualization, onNavigateToKnowledgeGraph }) => {
  const [conversations, setConversations] = useState(
    initialQaData.map(q => ({
      id: q.id,
      title: q.question.length > 20 ? q.question.substring(0, 20) + '...' : q.question,
      messages: [
        { role: 'user', content: q.question, time: q.createTime },
        ...(q.status === 'answered' ? [{ role: 'ai', content: q.answer, time: q.updateTime, graphType: 'meridian', sources: [] }] : [])
      ],
      createTime: q.createTime
    }))
  );
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const activeIdRef = useRef(null);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  useEffect(() => {
    activeIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  const handleNewConversation = () => {
    setActiveConversationId(null);
    activeIdRef.current = null;
    setInputValue('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleDeleteConversation = (id, e) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
      activeIdRef.current = null;
    }
    message.success('对话已删除');
  };

  const handleSelectConversation = (id) => {
    setActiveConversationId(id);
    activeIdRef.current = id;
  };

  const handleAcupointClick = (acupoint) => {
    message.info(`正在跳转到3D穴位视图，定位：${acupoint.name}（${acupoint.code}）`);
    if (onNavigateToVisualization) {
      onNavigateToVisualization(acupoint);
    }
  };

  const getAIResponse = (userInput) => {
    for (const [keyword, answer] of Object.entries(aiAnswers)) {
      if (keyword !== 'default' && userInput.includes(keyword)) {
        return answer;
      }
    }
    return aiAnswers['default'];
  };

  // 发送消息（可直接传入文本）
  const handleSend = (overrideText) => {
    const text = (overrideText || inputValue).trim();
    if (!text) return;

    const now = new Date().toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).replace(/\//g, '-');

    let targetId = activeIdRef.current;

    if (targetId) {
      setConversations(prev => prev.map(c =>
        c.id === targetId
          ? { ...c, messages: [...c.messages, { role: 'user', content: text, time: now }] }
          : c
      ));
    } else {
      const newId = Date.now();
      targetId = newId;
      activeIdRef.current = newId;
      const newConversation = {
        id: newId,
        title: text.length > 20 ? text.substring(0, 20) + '...' : text,
        messages: [{ role: 'user', content: text, time: now }],
        createTime: now
      };
      setConversations(prev => [newConversation, ...prev]);
      setActiveConversationId(newId);
    }

    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const aiResponse = getAIResponse(text);
      const aiTime = new Date().toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).replace(/\//g, '-');

      setConversations(prev => prev.map(c =>
        c.id === targetId
          ? { ...c, messages: [...c.messages, {
              role: 'ai',
              content: aiResponse.content,
              time: aiTime,
              graphType: aiResponse.graphType,
              graphNodes: aiResponse.graphNodes,
              sources: aiResponse.sources
            }] }
          : c
      ));
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 统一输入框组件 - 发送按钮在输入框内部右侧
  const renderInputBox = (style = {}) => (
    <Input
      ref={inputRef}
      value={inputValue}
      onChange={e => setInputValue(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="请输入您的中医针灸问题"
      suffix={
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={() => handleSend()}
          disabled={!inputValue.trim() || isTyping}
          style={{
            borderRadius: 10,
            minWidth: 32,
            height: 32,
            padding: '0 8px',
            marginRight: -8,
          }}
        />
      }
      style={{
        borderRadius: 22,
        border: '1px solid #E5E8E3',
        boxShadow: '0 2px 12px rgba(31,111,82,0.06)',
        fontSize: 14,
        padding: '10px 14px',
        paddingRight: 48,
        background: '#fff',
        ...style,
      }}
    />
  );

  // 渲染消息中的知识图谱和溯源区域
  const renderAISourceArea = (msg) => {
    if (msg.role !== 'ai') return null;
    return (
      <>
        {msg.graphNodes && msg.graphNodes.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <Divider style={{ margin: '8px 0', borderColor: '#D5D8D3' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <ApartmentOutlined style={{ color: '#1F6F52', fontSize: 14 }} />
              <span style={{ fontSize: 12, color: '#1F6F52', fontWeight: 600 }}>知识图谱绘制</span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {msg.graphNodes.map((node, i) => (
                <Tag
                  key={i}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 16,
                    background: '#F2F7F3',
                    color: '#1F6F52',
                    border: '1px solid #D5D8D3',
                    fontSize: 12,
                    padding: '4px 10px'
                  }}
                  onClick={() => {
                    const acupoint = acupointNameMap[node];
                    if (acupoint && onNavigateToKnowledgeGraph) {
                      onNavigateToKnowledgeGraph(acupoint.code, msg.graphType || 'meridian');
                    }
                  }}
                >
                  <ApartmentOutlined style={{ marginRight: 4, fontSize: 10 }} />
                  {node}
                </Tag>
              ))}
              <Tag
                style={{
                  cursor: 'pointer',
                  borderRadius: 16,
                  background: '#1F6F52',
                  color: '#fff',
                  border: 'none',
                  fontSize: 12,
                  padding: '4px 10px'
                }}
                onClick={() => {
                  if (onNavigateToKnowledgeGraph) {
                    onNavigateToKnowledgeGraph(null, msg.graphType || 'meridian');
                  }
                }}
              >
                <LinkOutlined style={{ marginRight: 4, fontSize: 10 }} />
                查看完整图谱
              </Tag>
            </div>
          </div>
        )}
        {msg.sources && msg.sources.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <Divider style={{ margin: '8px 0', borderColor: '#D5D8D3' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <BookOutlined style={{ color: '#C58B54', fontSize: 14 }} />
              <span style={{ fontSize: 12, color: '#C58B54', fontWeight: 600 }}>知识库溯源</span>
            </div>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {msg.sources.map((source, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: 8,
                    background: '#FAFAF8',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => {
                    if (source.type === 'meridian' && onNavigateToVisualization) {
                      const acupoint = acupointNameMap[source.name];
                      if (acupoint) onNavigateToVisualization(acupoint);
                    } else if (source.type === 'compat' && onNavigateToKnowledgeGraph) {
                      onNavigateToKnowledgeGraph(`compat-${source.id}`, 'compatibility');
                    } else if (source.type === 'technique' && onNavigateToKnowledgeGraph) {
                      onNavigateToKnowledgeGraph(source.code, 'technique');
                    }
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F2F7F3'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#FAFAF8'; }}
                >
                  <MedicineBoxOutlined style={{ fontSize: 12, color: '#1F6F52' }} />
                  <span style={{ fontSize: 12, color: '#1f2937' }}>{source.name}</span>
                  <Tag style={{
                    fontSize: 10,
                    background: source.type === 'meridian' ? '#F2F7F3' :
                               source.type === 'compat' ? '#FEF3E2' : '#E8F5E9',
                    color: source.type === 'meridian' ? '#1F6F52' :
                           source.type === 'compat' ? '#C58B54' : '#5BAF7D',
                    border: 'none',
                    borderRadius: 8,
                    padding: '0 6px'
                  }}>
                    {source.label}
                  </Tag>
                  <LinkOutlined style={{ fontSize: 10, color: '#8a8f89' }} />
                </div>
              ))}
            </Space>
          </div>
        )}
      </>
    );
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 140px)', gap: 20, background: 'transparent' }}>
      {/* 左侧边栏 */}
      <div style={{
        width: 260,
        background: '#ffffff',
        border: '1px solid #EEF0ED',
        borderRadius: 22,
        boxShadow: '0 1px 2px rgba(0,0,0,0.02), 0 8px 24px rgba(31, 111, 82, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden'
      }}>
        <div style={{ padding: 16, borderBottom: '1px solid #EEF0ED' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleNewConversation}
            block
            style={{ height: 42, borderRadius: 14, fontWeight: 500 }}
          >
            开启新对话
          </Button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
          <div style={{ padding: '12px 16px 8px', fontSize: 12, color: '#8a8f89', fontWeight: 600, letterSpacing: '0.02em' }}>
            对话记录
          </div>
          {conversations.length === 0 ? (
            <Empty description="暂无对话记录" style={{ marginTop: 40 }} />
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                style={{
                  margin: '4px 8px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  background: activeConversationId === conv.id ? '#F2F7F3' : 'transparent',
                  borderRadius: 12,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}
                onMouseEnter={e => {
                  if (activeConversationId !== conv.id) e.currentTarget.style.background = '#F2F4F2';
                }}
                onMouseLeave={e => {
                  if (activeConversationId !== conv.id) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F2F7F3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#1F6F52', fontSize: 13 }}>
                  <MessageOutlined />
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, color: '#1f2937', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {conv.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#8a8f89', marginTop: 2 }}>{conv.createTime}</div>
                </div>
                <Tooltip title="删除">
                  <DeleteOutlined
                    style={{ color: '#c7c7cc', fontSize: 12, flexShrink: 0 }}
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    onMouseEnter={e => e.currentTarget.style.color = '#C95A4A'}
                    onMouseLeave={e => e.currentTarget.style.color = '#c7c7cc'}
                  />
                </Tooltip>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: 12, borderTop: '1px solid #EEF0ED', fontSize: 12, color: '#8a8f89', textAlign: 'center', fontWeight: 500 }}>
          共 {conversations.length} 条对话
        </div>
      </div>

      {/* 右侧主区域 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#ffffff', border: '1px solid #EEF0ED', borderRadius: 22, boxShadow: '0 1px 2px rgba(0,0,0,0.02), 0 8px 24px rgba(31, 111, 82, 0.04)' }}>
        {activeConversation ? (
          <>
            {/* 消息区域 */}
            <div style={{ flex: 1, overflow: 'auto', padding: '32px 48px 32px 58px' }}>
              {activeConversation.messages.map((msg, index) => (
                <div key={index}>
                  <div style={{
                    display: 'flex',
                    gap: 12,
                    marginBottom: 4,
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-start'
                  }}>
                    <Avatar
                      size={36}
                      style={{ background: '#F2F7F3', color: '#1F6F52', flexShrink: 0, fontWeight: 500 }}
                      icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                    />
                    <div style={{
                      maxWidth: '75%',
                      background: msg.role === 'user' ? '#1F6F52' : '#F2F4F2',
                      color: msg.role === 'user' ? '#ffffff' : '#1f2937',
                      borderRadius: 18,
                      padding: '12px 16px',
                      fontSize: 14,
                      lineHeight: 1.7,
                      wordBreak: 'break-word',
                      boxShadow: msg.role === 'user' ? '0 2px 8px rgba(31,111,82,0.18)' : 'none'
                    }}>
                      <div style={{ whiteSpace: 'pre-wrap' }}>
                        {msg.role === 'ai'
                          ? renderContentWithAcupointLinks(msg.content, handleAcupointClick)
                          : msg.content
                        }
                      </div>
                      {renderAISourceArea(msg)}
                    </div>
                  </div>
                  {/* 时间放在气泡下方 */}
                  <div style={{
                    fontSize: 11,
                    color: '#8a8f89',
                    marginTop: 2,
                    marginBottom: 20,
                    textAlign: msg.role === 'user' ? 'right' : 'left',
                    paddingLeft: msg.role === 'user' ? 0 : 48,
                    paddingRight: msg.role === 'user' ? 48 : 0,
                  }}>
                    {msg.time}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'flex-start' }}>
                  <Avatar size={36} style={{ background: '#F2F7F3', color: '#1F6F52', flexShrink: 0 }} icon={<RobotOutlined />} />
                  <div style={{ background: '#F2F4F2', borderRadius: 18, padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#1F6F52', animation: 'pulse 1.4s infinite ease-in-out' }} />
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#1F6F52', animation: 'pulse 1.4s infinite ease-in-out 0.2s' }} />
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#1F6F52', animation: 'pulse 1.4s infinite ease-in-out 0.4s' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* 底部输入区域 */}
            <div style={{ padding: '12px 24px 20px' }}>
              {renderInputBox({ boxShadow: '0 -2px 12px rgba(31,111,82,0.04)' })}
              <div style={{ fontSize: 11, color: '#8a8f89', marginTop: 8, textAlign: 'center' }}>
                按 Enter 发送 · Shift + Enter 换行 · 内容由 AI 生成，仅供参考
              </div>
            </div>
          </>
        ) : (
          /* 欢迎页面 */
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 48,
            background: 'radial-gradient(ellipse at top, #F2F7F3 0%, #FAFAF8 70%)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
              <div style={{
                width: 88,
                height: 88,
                background: 'linear-gradient(135deg, #1F6F52 0%, #2D8A6A 100%)',
                borderRadius: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 40px rgba(31,111,82,0.25)'
              }}>
                <RobotOutlined style={{ fontSize: 42, color: 'white' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <h1 style={{ fontSize: 34, fontWeight: 700, color: '#1f2937', margin: 0, letterSpacing: '-0.02em' }}>
                  您的中医针灸 AI 顾问
                </h1>
                <p style={{ fontSize: 15, color: '#8a8f89', margin: '10px 0 0', letterSpacing: '-0.01em' }}>
                  穴位查询 · 病症分析 · 针灸方案 · 养生建议
                </p>
              </div>
            </div>

            {/* 快捷提问 - 直接发起问答 */}
            <div style={{ marginTop: 24, width: '100%', maxWidth: 620 }}>
              <div style={{ fontSize: 12, color: '#8a8f89', marginBottom: 12, textAlign: 'center', fontWeight: 500, letterSpacing: '0.05em' }}>
                试试这样问
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                {['头痛伴有眩晕怎么针灸？', '失眠多梦用什么穴位？', '腰痛持续三天有效吗？', '胃胀气消化不良怎么调理？'].map(q => (
                  <Tag
                    key={q}
                    style={{
                      cursor: 'pointer',
                      padding: '8px 16px',
                      fontSize: 13,
                      borderRadius: 980,
                      background: '#F2F7F3',
                      color: '#1F6F52',
                      border: 'none',
                      fontWeight: 500
                    }}
                    onClick={() => handleSend(q)}
                  >
                    {q}
                  </Tag>
                ))}
              </div>
            </div>

            {/* 底部输入框 */}
            <div style={{ width: '100%', maxWidth: 620, marginTop: 24 }}>
              {renderInputBox({ maxWidth: '100%' })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QASystem;