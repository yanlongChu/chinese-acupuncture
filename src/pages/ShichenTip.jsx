import { useState, useEffect } from 'react';
import { Card, Tag, Divider, Tooltip } from 'antd';
import {
  ClockCircleOutlined,
  SkinOutlined,
  AimOutlined,
  BulbOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { getCurrentShichen } from '../data/shichenData';

const ShichenTip = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const { shichen, timeText } = getCurrentShichen(now);

  const dateText = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        padding: '12px 14px',
        background: 'linear-gradient(135deg, #fdf6ec 0%, #f5e6d3 100%)',
        borderTop: '1px solid #e8d9bf',
        maxHeight: '55%',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 20 }}>{shichen.icon}</span>
          <span style={{ fontWeight: 700, color: '#7a4a1e', fontSize: 14 }}>
            {shichen.name} · {shichen.meridian}当令
          </span>
        </div>
        <Tooltip title="子午流注实时时辰">
          <Tag color="gold" icon={<ClockCircleOutlined />}>
            {timeText}
          </Tag>
        </Tooltip>
      </div>

      <div style={{ fontSize: 11, color: '#9a7a4a', marginBottom: 6 }}>
        {dateText} · 气血充盈，调理效果最佳
      </div>

      <Card
        size="small"
        style={{
          background: '#fffaf0',
          borderColor: '#e8d9bf',
          marginBottom: 6,
        }}
        bodyStyle={{ padding: '8px 10px' }}
      >
        <div style={{ fontSize: 12, color: '#7a4a1e', fontWeight: 600, marginBottom: 4 }}>
          <AimOutlined style={{ color: '#d48806', marginRight: 4 }} />
          针灸优选
        </div>
        <div style={{ fontSize: 12, color: '#333', lineHeight: 1.6 }}>
          {shichen.acupuncture}
        </div>
        <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
          功效：{shichen.acupunctureEffect}
        </div>
      </Card>

      <Card
        size="small"
        style={{
          background: '#f0f9f0',
          borderColor: '#c6e6c6',
          marginBottom: 6,
        }}
        bodyStyle={{ padding: '8px 10px' }}
      >
        <div style={{ fontSize: 12, color: '#2b7a2b', fontWeight: 600, marginBottom: 4 }}>
          <SkinOutlined style={{ color: '#2b7a2b', marginRight: 4 }} />
          日常按摩
        </div>
        <div style={{ fontSize: 12, color: '#333' }}>{shichen.massage}</div>
      </Card>

      <Card
        size="small"
        style={{
          background: '#fff4e6',
          borderColor: '#ffd8a8',
        }}
        bodyStyle={{ padding: '8px 10px' }}
      >
        <div style={{ fontSize: 12, color: '#ad6800', fontWeight: 600, marginBottom: 4 }}>
          <BulbOutlined style={{ color: '#fa8c16', marginRight: 4 }} />
          作息提示
        </div>
        <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6 }}>{shichen.tip}</div>
      </Card>

      <Divider style={{ margin: '10px 0', borderColor: '#e8d9bf' }} />

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 6,
          fontSize: 11,
          color: '#999',
          lineHeight: 1.5,
        }}
      >
        <WarningOutlined style={{ color: '#faad14', marginTop: 2 }} />
        <div>
          针灸需专业中医师操作，禁止自行扎针；按摩仅作日常保健参考。
        </div>
      </div>
    </div>
  );
};

export default ShichenTip;
