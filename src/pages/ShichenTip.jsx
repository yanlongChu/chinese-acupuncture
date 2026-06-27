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
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { shichen, timeText } = getCurrentShichen(now);

  const dateText = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
  const clockText = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  return (
    <div
      style={{
        position: 'fixed',
        left: 24,
        bottom: 24,
        width: 248,
        padding: '14px 14px 12px',
        background: 'linear-gradient(180deg, #F2F7F3 0%, #FFFFFF 45%)',
        border: '1px solid #D9E5DD',
        borderRadius: 22,
        boxShadow: '0 1px 2px rgba(0,0,0,0.02), 0 10px 28px rgba(31, 111, 82, 0.08)',
        zIndex: 1000,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          gap: 8,
          minWidth: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>{shichen.icon}</span>
          <span
            style={{
              fontWeight: 600,
              color: '#1F6F52',
              fontSize: 13,
              letterSpacing: '-0.01em',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              lineHeight: 1.4,
            }}
          >
            {shichen.name} · {shichen.meridian}当令
          </span>
        </div>
        <Tooltip title="子午流注实时时辰">
          <Tag
            color="default"
            icon={<ClockCircleOutlined />}
            style={{
              background: '#1F6F52',
              color: '#ffffff',
              border: 'none',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(31,111,82,0.22)',
            }}
          >
            {timeText}
          </Tag>
        </Tooltip>
      </div>

      <div
        style={{
          fontSize: 11,
          color: '#5BAF7D',
          marginBottom: 8,
          wordBreak: 'break-word',
          whiteSpace: 'normal',
          fontWeight: 500,
        }}
      >
        {dateText} · 气血充盈，调理效果最佳
      </div>

      <Card
        size="small"
        style={{
          background: '#E6F0EA',
          border: '1px solid #C8DED1',
          marginBottom: 6,
          borderRadius: 14,
          boxShadow: 'none',
        }}
        bodyStyle={{ padding: '10px 12px' }}
      >
        <div style={{ fontSize: 12, color: '#1F6F52', fontWeight: 600, marginBottom: 4 }}>
          <AimOutlined style={{ color: '#1F6F52', marginRight: 4 }} />
          针灸优选
        </div>
        <div
          style={{
            fontSize: 12,
            color: '#1f2937',
            lineHeight: 1.6,
            wordBreak: 'break-word',
            whiteSpace: 'normal',
          }}
        >
          {shichen.acupuncture}
        </div>
        <div
          style={{
            fontSize: 11,
            color: '#5BAF7D',
            marginTop: 4,
            wordBreak: 'break-word',
            whiteSpace: 'normal',
          }}
        >
          功效：{shichen.acupunctureEffect}
        </div>
      </Card>

      <Card
        size="small"
        style={{
          background: '#F7EBDC',
          border: '1px solid #E5D4BB',
          marginBottom: 6,
          borderRadius: 14,
          boxShadow: 'none',
        }}
        bodyStyle={{ padding: '10px 12px' }}
      >
        <div style={{ fontSize: 12, color: '#8C6A43', fontWeight: 600, marginBottom: 4 }}>
          <SkinOutlined style={{ color: '#C58B54', marginRight: 4 }} />
          日常按摩
        </div>
        <div
          style={{
            fontSize: 12,
            color: '#1f2937',
            lineHeight: 1.6,
            wordBreak: 'break-word',
            whiteSpace: 'normal',
          }}
        >
          {shichen.massage}
        </div>
      </Card>

      <Card
        size="small"
        style={{
          background: '#F2F7F3',
          border: '1px solid #D9E5DD',
          borderRadius: 14,
          boxShadow: 'none',
        }}
        bodyStyle={{ padding: '10px 12px' }}
      >
        <div style={{ fontSize: 12, color: '#1F6F52', fontWeight: 600, marginBottom: 4 }}>
          <BulbOutlined style={{ color: '#C58B54', marginRight: 4 }} />
          作息提示
        </div>
        <div
          style={{
            fontSize: 12,
            color: '#1f2937',
            lineHeight: 1.6,
            wordBreak: 'break-word',
            whiteSpace: 'normal',
          }}
        >
          {shichen.tip}
        </div>
      </Card>

      <Divider style={{ margin: '12px 0', borderColor: '#D9E5DD' }} />

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 6,
          fontSize: 11,
          color: '#8C6A43',
          lineHeight: 1.5,
          wordBreak: 'break-word',
          whiteSpace: 'normal',
        }}
      >
        <WarningOutlined style={{ color: '#C58B54', marginTop: 2, flexShrink: 0 }} />
        <div style={{ wordBreak: 'break-word', whiteSpace: 'normal', color: '#8C6A43' }}>
          针灸需专业中医师操作，禁止自行扎针；按摩仅作日常保健参考。
        </div>
      </div>
    </div>
  );
};

export default ShichenTip;
