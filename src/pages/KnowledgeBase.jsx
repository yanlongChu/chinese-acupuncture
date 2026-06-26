import { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Card,
  Row,
  Col,
  message,
  Badge,
  Tabs,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ScanOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { allAcupoints, meridianList } from '../data/acupoints361';
import { compatibilityData, techniqueData } from '../data/knowledgeData';

const { TextArea } = Input;

const KnowledgeBase = () => {
  const [activeTab, setActiveTab] = useState('basic');

  // 三套数据
  const [basicList, setBasicList] = useState(allAcupoints);
  const [compatList, setCompatList] = useState(compatibilityData);
  const [techList, setTechList] = useState(techniqueData);

  // 三套筛选
  const [basicFiltered, setBasicFiltered] = useState(allAcupoints);
  const [compatFiltered, setCompatFiltered] = useState(compatibilityData);
  const [techFiltered, setTechFiltered] = useState(techniqueData);

  // 弹窗状态
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [form] = Form.useForm();
  const [basicFilterForm] = Form.useForm();
  const [compatFilterForm] = Form.useForm();
  const [techFilterForm] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  // 获取当前列表
  const getCurrentList = () => {
    if (activeTab === 'basic') return basicList;
    if (activeTab === 'compat') return compatList;
    return techList;
  };

  const getCurrentFiltered = () => {
    if (activeTab === 'basic') return basicFiltered;
    if (activeTab === 'compat') return compatFiltered;
    return techFiltered;
  };

  const setCurrentList = (list) => {
    if (activeTab === 'basic') setBasicList(list);
    else if (activeTab === 'compat') setCompatList(list);
    else setTechList(list);
  };

  const setCurrentFiltered = (list) => {
    if (activeTab === 'basic') setBasicFiltered(list);
    else if (activeTab === 'compat') setCompatFiltered(list);
    else setTechFiltered(list);
  };

  const getCurrentFilterForm = () => {
    if (activeTab === 'basic') return basicFilterForm;
    if (activeTab === 'compat') return compatFilterForm;
    return techFilterForm;
  };

  // 危险等级颜色
  const getDangerColor = (level) => level === '危险' ? 'red' : 'green';
  const getStatusColor = (status) => status === '已发布' ? 'success' : 'default';

  // 筛选
  const handleFilter = (values) => {
    const list = getCurrentList();
    let filtered = [...list];

    if (values.keyword) {
      const kw = values.keyword.toLowerCase();
      filtered = filtered.filter(
        item => {
          if (activeTab === 'basic') {
            return item.name.includes(values.keyword) ||
              item.pinyin.toLowerCase().includes(kw) ||
              item.code.toLowerCase().includes(kw) ||
              item.location.includes(values.keyword);
          }
          if (activeTab === 'compat') {
            return item.symptom.includes(values.keyword) ||
              item.acupoints.includes(values.keyword) ||
              item.needlingOrder.includes(values.keyword) ||
              item.source.includes(values.keyword) ||
              item.diseaseCategory.includes(values.keyword);
          }
          return item.name.includes(values.keyword) ||
            item.pinyin.toLowerCase().includes(kw) ||
            item.code.toLowerCase().includes(kw) ||
            item.location.includes(values.keyword);
        }
      );
    }

    if (values.meridian) {
      filtered = filtered.filter(item => {
        if (activeTab === 'compat') return item.diseaseCategory === values.meridian;
        return item.meridian === values.meridian;
      });
    }

    if (values.dangerLevel) {
      filtered = filtered.filter(item => item.dangerLevel === values.dangerLevel);
    }

    if (values.status) {
      filtered = filtered.filter(item => item.status === values.status);
    }

    setCurrentFiltered(filtered);
    setPagination({ ...pagination, current: 1 });
  };

  const handleReset = () => {
    getCurrentFilterForm().resetFields();
    setCurrentFiltered(getCurrentList());
    setPagination({ ...pagination, current: 1 });
  };

  // 新增/编辑
  const handleSubmit = () => {
    form.validateFields().then(values => {
      const now = new Date().toISOString().split('T')[0];
      const list = getCurrentList();
      const isCompat = activeTab === 'compat';

      if (currentRecord) {
        const updated = list.map(item =>
          isCompat
            ? (item.id === currentRecord.id ? { ...item, ...values, updateTime: now } : item)
            : (item.code === currentRecord.code ? { ...item, ...values, updateTime: now } : item)
        );
        setCurrentList(updated);
        setCurrentFiltered(updated);
        message.success('信息更新成功');
      } else {
        const newRecord = {
          ...values,
          id: list.length + 1,
          status: '已发布',
          updateTime: now
        };
        const updated = [newRecord, ...list];
        setCurrentList(updated);
        setCurrentFiltered(updated);
        message.success('添加成功');
      }

      setIsModalVisible(false);
      form.resetFields();
      setCurrentRecord(null);
    });
  };

  const handleEdit = (record) => {
    setCurrentRecord(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = (code) => {
    const list = getCurrentList();
    const updated = list.filter(item => item.code !== code);
    setCurrentList(updated);
    setCurrentFiltered(updated);
    message.success('删除成功');
  };

  const handleDeleteCompat = (id) => {
    const updated = compatList.filter(item => item.id !== id);
    setCompatList(updated);
    setCompatFiltered(updated);
    message.success('删除成功');
  };

  const handleDeleteTech = (id) => {
    const updated = techList.filter(item => item.id !== id);
    setTechList(updated);
    setTechFiltered(updated);
    message.success('删除成功');
  };

  // 表格列 - 基础穴位
  const basicColumns = [
    {
      title: '穴位名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      fixed: 'left',
      render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>
    },
    {
      title: '拼音',
      dataIndex: 'pinyin',
      key: 'pinyin',
      width: 140,
      render: (text) => <span style={{ color: '#666', fontStyle: 'italic' }}>{text}</span>
    },
    {
      title: '编码',
      dataIndex: 'code',
      key: 'code',
      width: 90,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '归经',
      dataIndex: 'meridian',
      key: 'meridian',
      width: 140,
      render: (text) => <Tag color="purple">{text}</Tag>
    },
    {
      title: '定位',
      dataIndex: 'location',
      key: 'location',
      width: 350,
      ellipsis: true
    },
    {
      title: '危险等级',
      dataIndex: 'dangerLevel',
      key: 'dangerLevel',
      width: 90,
      align: 'center',
      render: (level) => <Tag color={getDangerColor(level)}>{level}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      align: 'center',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: 120,
      align: 'center'
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这条记录吗？"
            onConfirm={() => handleDelete(record.code)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 表格列 - 配伍与诊疗
  const compatColumns = [
    {
      title: '对症',
      dataIndex: 'symptom',
      key: 'symptom',
      width: 180,
      fixed: 'left',
      render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>
    },
    {
      title: '穴位配伍',
      dataIndex: 'acupoints',
      key: 'acupoints',
      width: 260,
      ellipsis: true
    },
    {
      title: '针刺顺序',
      dataIndex: 'needlingOrder',
      key: 'needlingOrder',
      width: 300,
      ellipsis: true
    },
    {
      title: '疗程',
      dataIndex: 'treatmentCourse',
      key: 'treatmentCourse',
      width: 260,
      ellipsis: true
    },
    {
      title: '信息出处',
      dataIndex: 'source',
      key: 'source',
      width: 220,
      ellipsis: true
    },
    {
      title: '病症分类',
      dataIndex: 'diseaseCategory',
      key: 'diseaseCategory',
      width: 130,
      render: (text) => <Tag color="purple">{text}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      align: 'center',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: 120,
      align: 'center'
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这条记录吗？"
            onConfirm={() => handleDeleteCompat(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 表格列 - 操作与技法
  const techColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 160,
      fixed: 'left',
      render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>
    },
    {
      title: '拼音',
      dataIndex: 'pinyin',
      key: 'pinyin',
      width: 160,
      render: (text) => <span style={{ color: '#666', fontStyle: 'italic' }}>{text}</span>
    },
    {
      title: '编码',
      dataIndex: 'code',
      key: 'code',
      width: 100,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '分类',
      dataIndex: 'meridian',
      key: 'meridian',
      width: 120,
      render: (text) => <Tag color="purple">{text}</Tag>
    },
    {
      title: '内容',
      dataIndex: 'location',
      key: 'location',
      width: 400,
      ellipsis: true
    },
    {
      title: '危险等级',
      dataIndex: 'dangerLevel',
      key: 'dangerLevel',
      width: 90,
      align: 'center',
      render: (level) => <Tag color={getDangerColor(level)}>{level}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      align: 'center',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: 120,
      align: 'center'
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这条记录吗？"
            onConfirm={() => handleDeleteTech(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const getColumns = () => {
    if (activeTab === 'basic') return basicColumns;
    if (activeTab === 'compat') return compatColumns;
    return techColumns;
  };

  // Tab 配置
  const tabItems = [
    {
      key: 'basic',
      label: (
        <span>
          <MedicineBoxOutlined style={{ marginRight: 6 }} />
          基础穴位
          <Badge count={basicList.length} style={{ backgroundColor: '#1F6F52', marginLeft: 8 }} overflowCount={999} />
        </span>
      ),
    },
    {
      key: 'compat',
      label: (
        <span>
          <ExperimentOutlined style={{ marginRight: 6 }} />
          配伍与诊疗
          <Badge count={compatList.length} style={{ backgroundColor: '#1F6F52', marginLeft: 8 }} overflowCount={999} />
        </span>
      ),
    },
    {
      key: 'tech',
      label: (
        <span>
          <ToolOutlined style={{ marginRight: 6 }} />
          操作与技法
          <Badge count={techList.length} style={{ backgroundColor: '#1F6F52', marginLeft: 8 }} overflowCount={999} />
        </span>
      ),
    },
  ];

  // 当前Tab的分类选项
  const getCategoryOptions = () => {
    if (activeTab === 'basic') {
      return meridianList.map(m => ({ value: m, label: m }));
    }
    if (activeTab === 'compat') {
      const list = [...new Set(compatList.map(i => i.diseaseCategory))];
      return list.map(m => ({ value: m, label: m }));
    }
    const list = [...new Set(techList.map(i => i.meridian))];
    return list.map(m => ({ value: m, label: m }));
  };

  const getFilterLabel = () => {
    if (activeTab === 'basic') return '按归经筛选';
    if (activeTab === 'compat') return '按病症分类筛选';
    return '按分类筛选';
  };

  const currentFiltered = getCurrentFiltered();

  return (
    <div className="fade-in" style={{ padding: '0 16px', maxWidth: '100%' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: 40, fontWeight: 700, color: '#1f2937', letterSpacing: '-0.025em', margin: 0 }}>
              知识库
            </h1>
            <p style={{ fontSize: 15, color: '#8a8f89', marginTop: 8, marginBottom: 0, letterSpacing: '-0.01em' }}>
              中医针灸基础穴位、辨证配穴与技法操作全收录
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setCurrentRecord(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
            style={{ borderRadius: 14, height: 40, fontWeight: 500 }}
          >
            新增记录
          </Button>
        </div>
      </div>

      {/* Tab 分类 */}
      <Card style={{ marginBottom: 16 }}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            setPagination({ ...pagination, current: 1 });
          }}
          items={tabItems}
          size="large"
        />
      </Card>

      {/* 筛选区域 */}
      <Card style={{ marginBottom: 16 }}>
        <Form form={getCurrentFilterForm()} layout="inline" onFinish={handleFilter}>
          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="keyword" style={{ width: '100%' }}>
                <Input
                  placeholder={
                    activeTab === 'basic' ? '搜索穴位名称、拼音、编码或定位' :
                    activeTab === 'compat' ? '搜索对症、穴位、出处或病症分类' :
                    '搜索名称、拼音、编码或内容'
                  }
                  prefix={<SearchOutlined />} allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Form.Item name="meridian" style={{ width: '100%' }}>
                <Select placeholder={getFilterLabel()} allowClear options={getCategoryOptions()} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Form.Item name="dangerLevel" style={{ width: '100%' }}>
                <Select placeholder="危险等级" allowClear>
                  <Select.Option value="危险">危险</Select.Option>
                  <Select.Option value="普通">普通</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Form.Item name="status" style={{ width: '100%' }}>
                <Select placeholder="状态" allowClear>
                  <Select.Option value="已发布">已发布</Select.Option>
                  <Select.Option value="未发布">未发布</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={5}>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  查询
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  重置
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* 数据统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 600, color: '#1f2937', letterSpacing: '-0.02em' }}>{getCurrentList().length}</div>
            <div style={{ fontSize: 12, color: '#8a8f89', fontWeight: 500 }}>
              {activeTab === 'basic' ? '穴位总数' : activeTab === 'compat' ? '方案总数' : '技法总数'}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 600, color: '#C95A4A', letterSpacing: '-0.02em' }}>
              {getCurrentList().filter(a => a.dangerLevel === '危险').length}
            </div>
            <div style={{ fontSize: 12, color: '#8a8f89', fontWeight: 500 }}>危险项目</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 600, color: '#5BAF7D', letterSpacing: '-0.02em' }}>
              {getCurrentList().filter(a => a.status === '已发布').length}
            </div>
            <div style={{ fontSize: 12, color: '#8a8f89', fontWeight: 500 }}>已发布</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 600, color: '#1F6F52', letterSpacing: '-0.02em' }}>
              {activeTab === 'compat'
                ? new Set(getCurrentList().map(a => a.diseaseCategory)).size
                : new Set(getCurrentList().map(a => a.meridian)).size}
            </div>
            <div style={{ fontSize: 12, color: '#8a8f89', fontWeight: 500 }}>分类数</div>
          </Card>
        </Col>
      </Row>

      {/* 数据表格 */}
      <Table
        columns={getColumns()}
        dataSource={currentFiltered}
        rowKey={activeTab === 'basic' ? 'code' : 'id'}
        pagination={{
          ...pagination,
          total: currentFiltered.length,
          showTotal: (total) => `共 ${total} 条记录`,
          showSizeChanger: false,
          onChange: (page, pageSize) => setPagination({ current: page, pageSize })
        }}
        scroll={{ x: 1300 }}
        size="middle"
      />

      {/* 新增/编辑弹窗 */}
      <Modal
        title={currentRecord ? '编辑记录' : '新增记录'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setCurrentRecord(null);
        }}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          {activeTab === 'basic' && (
            <>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
                    <Input placeholder="请输入名称" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="pinyin" label="拼音" rules={[{ required: true, message: '请输入拼音' }]}>
                    <Input placeholder="请输入拼音" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="code" label="编码" rules={[{ required: true, message: '请输入编码' }]}>
                    <Input placeholder="请输入编码" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="meridian" label="归经" rules={[{ required: true, message: '请选择归经' }]}>
                <Select placeholder="请选择归经" options={getCategoryOptions()} />
              </Form.Item>
              <Form.Item name="location" label="定位" rules={[{ required: true, message: '请输入定位' }]}>
                <TextArea rows={3} placeholder="请输入穴位解剖定位" />
              </Form.Item>
            </>
          )}

          {activeTab === 'compat' && (
            <>
              <Form.Item name="symptom" label="对症" rules={[{ required: true, message: '请输入适应症' }]}>
                <Input placeholder="请输入适应症，如：风寒外感头痛" />
              </Form.Item>
              <Form.Item name="acupoints" label="穴位配伍" rules={[{ required: true, message: '请输入穴位组合' }]}>
                <TextArea rows={2} placeholder="请输入推荐穴位组合" />
              </Form.Item>
              <Form.Item name="needlingOrder" label="针刺顺序" rules={[{ required: true, message: '请输入针刺顺序' }]}>
                <TextArea rows={2} placeholder="请输入针刺先后顺序" />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="treatmentCourse" label="疗程" rules={[{ required: true, message: '请输入疗程' }]}>
                    <Input placeholder="如：每日1次，5-7天为1疗程" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="source" label="信息出处" rules={[{ required: true, message: '请输入文献出处' }]}>
                    <Input placeholder="如：《针灸甲乙经》" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="diseaseCategory" label="病症分类" rules={[{ required: true, message: '请选择病症分类' }]}>
                <Select placeholder="请选择病症分类" options={getCategoryOptions()} />
              </Form.Item>
            </>
          )}

          {activeTab === 'tech' && (
            <>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
                    <Input placeholder="请输入技法名称" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="pinyin" label="拼音" rules={[{ required: true, message: '请输入拼音' }]}>
                    <Input placeholder="请输入拼音" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="code" label="编码" rules={[{ required: true, message: '请输入编码' }]}>
                    <Input placeholder="请输入编码" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="meridian" label="技法分类" rules={[{ required: true, message: '请选择技法分类' }]}>
                <Select placeholder="请选择技法分类" options={getCategoryOptions()} />
              </Form.Item>
              <Form.Item name="location" label="内容" rules={[{ required: true, message: '请输入内容描述' }]}>
                <TextArea rows={3} placeholder="请输入技法详细描述" />
              </Form.Item>
            </>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="dangerLevel" label="危险等级" rules={[{ required: true, message: '请选择危险等级' }]}>
                <Select placeholder="请选择危险等级">
                  <Select.Option value="普通">普通</Select.Option>
                  <Select.Option value="危险">危险</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
                <Select placeholder="请选择状态">
                  <Select.Option value="已发布">已发布</Select.Option>
                  <Select.Option value="未发布">未发布</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default KnowledgeBase;
