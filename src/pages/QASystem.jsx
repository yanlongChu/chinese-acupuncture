import { useState, useRef, useEffect } from 'react';
import {
  Input,
  Tag,
  Button,
  Avatar,
  Tooltip,
  message,
  Empty
} from 'antd';
import {
  SendOutlined,
  PlusOutlined,
  MessageOutlined,
  DeleteOutlined,
  RobotOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { qaData as initialQaData } from '../data/mockData';
import { allAcupoints } from '../data/acupoints361';

const { TextArea } = Input;

// 提取所有穴位名称用于匹配
const acupointNameMap = {};
allAcupoints.forEach(a => {
  acupointNameMap[a.name] = a;
});

// 将AI回复中的穴位名称渲染为可点击链接（支持markdown格式）
const renderContentWithAcupointLinks = (content, onAcupointClick) => {
  if (!content) return null;

  // 按穴位名称长度降序排列，优先匹配长名称（如"手三里"优先于"三里"）
  const sortedNames = Object.keys(acupointNameMap).sort((a, b) => b.length - a.length);

  // 构建正则，匹配穴位名称（可选带"穴"后缀）
  const escapedNames = sortedNames.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedNames.join('|')})穴?`, 'g');

  const parts = content.split(regex);

  // 处理markdown格式并渲染穴位链接
  const renderMarkdown = (text) => {
    // 粗体 **text**
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // 列表项
    text = text.replace(/•/g, '&bull;');
    // 换行
    text = text.replace(/\n/g, '<br/>');
    return text;
  };

  return parts.map((part, i) => {
    // 检查是否匹配穴位名称（去掉"穴"后缀）
    const cleanName = part.endsWith('穴') ? part.slice(0, -1) : part;
    if (acupointNameMap[cleanName]) {
      const acupoint = acupointNameMap[cleanName];
      return (
        <span
          key={i}
          onClick={() => onAcupointClick(acupoint)}
          style={{
            color: '#667eea',
            fontWeight: 600,
            cursor: 'pointer',
            borderBottom: '1px dashed #667eea',
            padding: '0 2px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#f0f0ff';
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
  '头痛': '根据您的症状描述，头痛伴有眩晕可能与肝阳上亢或气血不足有关。\n\n**推荐穴位：**\n• **百会穴** — 位于头顶正中，可升阳举陷、醒脑开窍\n• **太阳穴** — 额部两侧凹陷处，疏风止痛\n• **风池穴** — 颈后发际两侧，祛风解表\n\n**建议方法：** 艾灸百会穴15-20分钟，配合按揉太阳穴和风池穴各3分钟。每日1次，连续5-7天可见效。\n\n️ 如症状持续或加重，建议及时就医。',
  '失眠': '失眠多梦多与心脾两虚或心肾不交有关。\n\n**推荐穴位：**\n• **神门穴** — 心经原穴，宁心安神\n• **三阴交** — 肝脾肾三经交会，调理气血\n• **内关穴** — 理气安神\n• **涌泉穴** — 引火归元，配合艾灸效果更佳\n\n**建议方法：** 睡前2小时针刺或按揉上述穴位，每穴3-5分钟。可配合温水泡脚15分钟。\n\n💡 建议保持规律作息，避免睡前使用电子产品。',
  '腰痛': '腰痛可能由寒湿、湿热、肾虚或瘀血引起。\n\n**推荐穴位：**\n• **肾俞穴** — 腰部第二腰椎旁开1.5寸，主治腰痛\n• **腰阳关** — 腰部正中，温阳散寒\n• **委中穴** — 窝正中，"腰背委中求"\n• **承山穴** — 小腿后侧，舒筋活络\n\n**建议方法：** 可针刺配合艾灸，每次20-30分钟。寒湿型可加灸命门穴。\n\n⚠️ 避免久坐久站，注意腰部保暖。',
  '胃胀': '胃胀气、消化不良多与脾胃虚弱或肝气犯胃有关。\n\n**推荐穴位：**\n• **中脘穴** — 胃之募穴，上腹部正中，主治胃病\n• **足三里** — 强壮穴，健脾和胃\n• **天枢穴** — 调理肠胃气机\n• **内关穴** — 和胃降逆\n\n**建议方法：** 可采用温针灸或艾灸，中脘穴灸15分钟，足三里灸10分钟。饭后1小时进行效果最佳。\n\n 饮食宜清淡，避免生冷油腻食物。',
  'default': '感谢您的提问。根据中医针灸理论，我为您分析如下：\n\n**辨证分析：** 需要结合您的具体症状、舌象、脉象等进行综合判断。\n\n**建议方案：** 建议您前往正规中医医院进行面诊，由专业医师根据您的体质和病情制定个性化的针灸治疗方案。\n\n**常用保健穴位：**\n• 足三里 — 强身健体\n• 三阴交 — 调理气血\n• 合谷穴 — 止痛通络\n\n⚠️ 针灸治疗需在专业医师指导下进行，请勿自行操作。'
};

const QASystem = ({ onNavigateToVisualization }) => {
  const [conversations, setConversations] = useState(
    initialQaData.map(q => ({
      id: q.id,
      title: q.question.length > 20 ? q.question.substring(0, 20) + '...' : q.question,
      messages: [
        { role: 'user', content: q.question, time: q.createTime },
        ...(q.status === 'answered' ? [{ role: 'ai', content: q.answer, time: q.updateTime }] : [])
      ],
      createTime: q.createTime
    }))
  );
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [activeMode, setActiveMode] = useState('acupoint');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  // 开启新对话
  const handleNewConversation = () => {
    setActiveConversationId(null);
    setInputValue('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // 删除对话
  const handleDeleteConversation = (id, e) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
    message.success('对话已删除');
  };

  // 选择对话
  const handleSelectConversation = (id) => {
    setActiveConversationId(id);
  };

  // 点击穴位链接 - 跳转到3D穴位模块
  const handleAcupointClick = (acupoint) => {
    message.info(`正在跳转到3D穴位视图，定位：${acupoint.name}（${acupoint.code}）`);
    // 通过回调通知父组件跳转
    if (onNavigateToVisualization) {
      onNavigateToVisualization(acupoint);
    }
  };

  // 获取AI回答
  const getAIResponse = (userInput) => {
    for (const [keyword, answer] of Object.entries(aiAnswers)) {
      if (keyword !== 'default' && userInput.includes(keyword)) {
        return answer;
      }
    }
    return aiAnswers['default'];
  };

  // 发送消息
  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;

    const now = new Date().toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).replace(/\//g, '-');

    if (activeConversationId) {
      // 追加到当前对话
      setConversations(prev => prev.map(c =>
        c.id === activeConversationId
          ? { ...c, messages: [...c.messages, { role: 'user', content: text, time: now }] }
          : c
      ));
    } else {
      // 创建新对话
      const newId = Date.now();
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

    // 模拟AI回复延迟
    setTimeout(() => {
      const aiResponse = getAIResponse(text);
      const aiTime = new Date().toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).replace(/\//g, '-');

      setConversations(prev => prev.map(c =>
        c.id === (activeConversationId || Date.now())
          ? { ...c, messages: [...c.messages, { role: 'ai', content: aiResponse, time: aiTime }] }
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

  const modes = [
    { key: 'acupoint', label: '穴位经络', icon: <MedicineBoxOutlined />, desc: '查询穴位定位、归经、功效与经络循行' },
    { key: 'compat', label: '辨证配穴', icon: <ExperimentOutlined />, desc: '针对症状给出针灸方案与配穴建议' },
    { key: 'technique', label: '技法与安全', icon: <SearchOutlined />, desc: '针法灸法操作规范与安全禁忌说明' },
  ];

  const currentMode = modes.find(m => m.key === activeMode);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 140px)', gap: 0, margin: -24, background: '#f0f2f5' }}>
      {/* 左侧边栏 - 对话历史 */}
      <div style={{
        width: 260,
        background: 'white',
        borderRight: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}>
        {/* 新对话按钮 */}
        <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleNewConversation}
            block
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              height: 40,
              borderRadius: 8
            }}
          >
            开启新对话
          </Button>
        </div>

        {/* 对话列表 */}
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
          <div style={{ padding: '8px 16px', fontSize: 13, color: '#999', fontWeight: 500 }}>
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
                  padding: '10px 16px',
                  cursor: 'pointer',
                  background: activeConversationId === conv.id ? '#f0f5ff' : 'transparent',
                  borderLeft: activeConversationId === conv.id ? '3px solid #667eea' : '3px solid transparent',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
                onMouseEnter={e => {
                  if (activeConversationId !== conv.id) {
                    e.currentTarget.style.background = '#fafafa';
                  }
                }}
                onMouseLeave={e => {
                  if (activeConversationId !== conv.id) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <MessageOutlined style={{ color: '#667eea', fontSize: 14, flexShrink: 0 }} />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{
                    fontSize: 13,
                    color: '#333',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {conv.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>
                    {conv.createTime}
                  </div>
                </div>
                <Tooltip title="删除">
                  <DeleteOutlined
                    style={{ color: '#ccc', fontSize: 12, flexShrink: 0 }}
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    onMouseEnter={e => e.currentTarget.style.color = '#ff4d4f'}
                    onMouseLeave={e => e.currentTarget.style.color = '#ccc'}
                  />
                </Tooltip>
              </div>
            ))
          )}
        </div>

        {/* 底部统计 */}
        <div style={{
          padding: 12,
          borderTop: '1px solid #f0f0f0',
          fontSize: 12,
          color: '#999',
          textAlign: 'center'
        }}>
          共 {conversations.length} 条对话记录
        </div>
      </div>

      {/* 右侧主区域 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeConversation ? (
          <>
            {/* 对话消息区域 */}
            <div style={{ flex: 1, overflow: 'auto', padding: '24px 48px' }}>
              {activeConversation.messages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    gap: 12,
                    marginBottom: 24,
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-start'
                  }}
                >
                  <Avatar
                    size={40}
                    style={{
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      flexShrink: 0
                    }}
                    icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                  />
                  <div style={{
                    maxWidth: '70%',
                    background: msg.role === 'user' ? '#f0f5ff' : 'white',
                    borderRadius: 12,
                    padding: '14px 18px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    border: msg.role === 'user' ? '1px solid #d6e4ff' : '1px solid #f0f0f0'
                  }}>
                    <div style={{
                      fontSize: 14,
                      lineHeight: 1.8,
                      color: '#333',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {msg.role === 'ai'
                        ? renderContentWithAcupointLinks(msg.content, handleAcupointClick)
                        : msg.content
                      }
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: '#bbb',
                      marginTop: 8,
                      textAlign: msg.role === 'user' ? 'right' : 'left'
                    }}>
                      {msg.time}
                    </div>
                  </div>
                </div>
              ))}

              {/* AI正在输入 */}
              {isTyping && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'flex-start' }}>
                  <Avatar
                    size={40}
                    style={{
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      flexShrink: 0
                    }}
                    icon={<RobotOutlined />}
                  />
                  <div style={{
                    background: 'white',
                    borderRadius: 12,
                    padding: '14px 18px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    border: '1px solid #f0f0f0'
                  }}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', background: '#667eea',
                        animation: 'pulse 1.4s infinite ease-in-out'
                      }} />
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', background: '#667eea',
                        animation: 'pulse 1.4s infinite ease-in-out 0.2s'
                      }} />
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', background: '#667eea',
                        animation: 'pulse 1.4s infinite ease-in-out 0.4s'
                      }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* 底部输入区域 */}
            <div style={{
              padding: '16px 48px 24px',
              background: 'white',
              borderTop: '1px solid #f0f0f0'
            }}>
              <div style={{
                background: '#f8f9ff',
                borderRadius: 12,
                border: '1px solid #e8e8f0',
                overflow: 'hidden'
              }}>
                {/* 模式标签 */}
                <div style={{
                  display: 'flex',
                  gap: 0,
                  padding: '8px 16px 0',
                  borderBottom: '1px solid #eee'
                }}>
                  {modes.map(mode => (
                    <div
                      key={mode.key}
                      onClick={() => setActiveMode(mode.key)}
                      style={{
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: 13,
                        color: activeMode === mode.key ? '#667eea' : '#666',
                        fontWeight: activeMode === mode.key ? 600 : 400,
                        borderBottom: activeMode === mode.key ? '2px solid #667eea' : '2px solid transparent',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      {mode.icon}
                      {mode.label}
                    </div>
                  ))}
                </div>

                {/* 输入框 */}
                <div style={{ padding: 12, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <TextArea
                    ref={inputRef}
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`${currentMode?.label} - 请输入您的中医针灸问题...`}
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    style={{
                      border: 'none',
                      boxShadow: 'none',
                      resize: 'none',
                      fontSize: 14,
                      background: 'transparent',
                      flex: 1
                    }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isTyping}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      borderRadius: 8,
                      width: 40,
                      height: 40,
                      flexShrink: 0
                    }}
                  />
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#bbb', marginTop: 8, textAlign: 'center' }}>
                按 Enter 发送，Shift + Enter 换行 | 内容由AI生成，仅供参考
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
            padding: 48
          }}>
            {/* Logo区域 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              marginBottom: 16
            }}>
              <div style={{
                width: 120,
                height: 120,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
              }}>
                <RobotOutlined style={{ fontSize: 56, color: 'white' }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: 36,
                  fontWeight: 700,
                  color: '#1a1a2e',
                  margin: 0
                }}>
                  您的中医针灸AI顾问
                </h1>
                <p style={{
                  fontSize: 16,
                  color: '#999',
                  margin: '12px 0 0'
                }}>
                  穴位查询 · 病症分析 · 针灸方案 · 养生建议，都来问我吧~
                </p>
              </div>
            </div>

            {/* 模式选择卡片 */}
            <div style={{
              display: 'flex',
              gap: 16,
              marginTop: 40,
              flexWrap: 'wrap',
              justifyContent: 'center',
              maxWidth: 700
            }}>
              {modes.map(mode => (
                <div
                  key={mode.key}
                  onClick={() => {
                    setActiveMode(mode.key);
                    setTimeout(() => inputRef.current?.focus(), 100);
                  }}
                  style={{
                    width: 150,
                    padding: '20px 16px',
                    background: 'white',
                    borderRadius: 12,
                    border: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.15)';
                    e.currentTarget.style.borderColor = '#667eea';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                    e.currentTarget.style.borderColor = '#f0f0f0';
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 8, color: '#667eea' }}>
                    {mode.icon}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 4 }}>
                    {mode.label}
                  </div>
                  <div style={{ fontSize: 11, color: '#999' }}>
                    {mode.desc}
                  </div>
                </div>
              ))}
            </div>

            {/* 快捷提问 */}
            <div style={{ marginTop: 40, width: '100%', maxWidth: 600 }}>
              <div style={{ fontSize: 13, color: '#999', marginBottom: 12, textAlign: 'center' }}>
                试试这样问：
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                {['头痛伴有眩晕怎么针灸？', '失眠多梦用什么穴位？', '腰痛持续三天有效吗？', '胃胀气消化不良怎么调理？'].map(q => (
                  <Tag
                    key={q}
                    style={{
                      cursor: 'pointer',
                      padding: '6px 14px',
                      fontSize: 13,
                      borderRadius: 20,
                      border: '1px solid #d6e4ff',
                      background: '#f0f5ff',
                      color: '#667eea'
                    }}
                    onClick={() => {
                      setInputValue(q);
                      setTimeout(() => inputRef.current?.focus(), 100);
                    }}
                  >
                    {q}
                  </Tag>
                ))}
              </div>
            </div>

            {/* 底部输入框 */}
            <div style={{
              width: '100%',
              maxWidth: 600,
              marginTop: 32,
              background: 'white',
              borderRadius: 12,
              border: '1px solid #e8e8f0',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              overflow: 'hidden'
            }}>
              {/* 模式标签 */}
              <div style={{
                display: 'flex',
                gap: 0,
                padding: '8px 16px 0',
                borderBottom: '1px solid #f0f0f0'
              }}>
                {modes.map(mode => (
                  <div
                    key={mode.key}
                    onClick={() => setActiveMode(mode.key)}
                    style={{
                      padding: '8px 16px',
                      cursor: 'pointer',
                      fontSize: 13,
                      color: activeMode === mode.key ? '#667eea' : '#666',
                      fontWeight: activeMode === mode.key ? 600 : 400,
                      borderBottom: activeMode === mode.key ? '2px solid #667eea' : '2px solid transparent',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    {mode.icon}
                    {mode.label}
                  </div>
                ))}
              </div>

              <div style={{ padding: 12, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <TextArea
                  ref={inputRef}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`${currentMode?.label} - 请输入您的中医针灸问题...`}
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  style={{
                    border: 'none',
                    boxShadow: 'none',
                    resize: 'none',
                    fontSize: 14,
                    background: 'transparent',
                    flex: 1
                  }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: 8,
                    width: 40,
                    height: 40,
                    flexShrink: 0
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QASystem;
