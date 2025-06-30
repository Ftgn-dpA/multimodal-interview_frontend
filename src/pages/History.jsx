import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Button, 
  Typography, 
  Space, 
  Layout,
  Menu,
  List,
  Tag,
  Row,
  Col,
  Modal,
  Descriptions,
  Progress,
  Divider,
  message,
  Empty,
  Spin,
  Dropdown
} from 'antd';
import { 
  VideoCameraOutlined, 
  HistoryOutlined,
  CloseOutlined,
  PlayCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileTextOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  LogoutOutlined,
  MoreOutlined,
  DeleteOutlined,
  DownOutlined
} from '@ant-design/icons';
import { removeToken } from '../utils/auth';
import { getInterviewHistory, getInterviewRecord, deleteInterviewRecord } from '../api';
import { Menu as AntdMenu } from 'antd';

const { Title, Text, Paragraph } = Typography;
const { Header, Content } = Layout;

// 添加自定义样式
const customStyles = `
  .history-back-btn:hover {
    background: #f8fafc !important;
    border-color: #cbd5e1 !important;
    color: #475569 !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
  }
  
  .history-logout-btn:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 8px rgba(239, 68, 68, 0.4) !important;
  }
  
  .history-action-btn:hover {
    background: #f8fafc !important;
    border-color: #cbd5e1 !important;
    color: #475569 !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
  }
`;

// 注入样式
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = customStyles;
  document.head.appendChild(styleElement);
}

// 在文件顶部添加全局动画样式
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = `@keyframes fadeInMenu { from { opacity: 0; transform: translateY(-8px);} to { opacity: 1; transform: none; } }`;
  document.head.appendChild(styleElement);
}

const History = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [menuVisibleId, setMenuVisibleId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef();

  useEffect(() => {
    fetchHistory();
  }, []);

  // 关闭菜单（点击外部）
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await getInterviewHistory();
      
      // 确保records始终是数组
      const recordsData = response.data;
      if (Array.isArray(recordsData)) {
        setRecords(recordsData);
      } else if (recordsData && Array.isArray(recordsData.records)) {
        setRecords(recordsData.records);
      } else {
        setRecords([]);
      }
    } catch (error) {
      message.error('获取历史记录失败');
      console.error('获取历史记录失败:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const handleBackToInterviewTypes = () => {
    navigate('/interview-types');
  };

  const handleViewDetail = async (record) => {
    try {
      const response = await getInterviewRecord(record.id);
      setSelectedRecord(response.data);
      setDetailModalVisible(true);
    } catch (error) {
      console.error('获取详情失败:', error);
      message.error('获取详情失败');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'IN_PROGRESS': return 'processing';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'COMPLETED': return '已完成';
      case 'IN_PROGRESS': return '进行中';
      case 'CANCELLED': return '已取消';
      default: return '未知';
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '未知';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}小时${mins}分钟`;
    }
    return `${mins}分钟`;
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '未知';
    return new Date(dateTime).toLocaleString('zh-CN');
  };

  const menuItems = [
    {
      key: 'interview',
      icon: <VideoCameraOutlined />,
      label: '面试类型',
      onClick: () => navigate('/interview-types'),
    },
    {
      key: 'history',
      icon: <HistoryOutlined />,
      label: '历史记录',
    },
  ];

  const renderSkillRadar = (skillAssessment) => {
    if (!skillAssessment) return null;
    
    try {
      const skills = JSON.parse(skillAssessment);
      // 确保skills是对象且可以转换为数组
      if (skills && typeof skills === 'object') {
        const skillEntries = Object.entries(skills);
        if (skillEntries.length === 0) return null;
        
        return (
          <div style={{ marginTop: '16px' }}>
            <Title level={5}>能力评估</Title>
            {skillEntries.map(([skill, score]) => (
              <div key={skill} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <Text>{skill}</Text>
                  <Text strong>{score}分</Text>
                </div>
                <Progress 
                  percent={score} 
                  size="small" 
                  strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f'}
                  showInfo={false}
                />
              </div>
            ))}
          </div>
        );
      }
      return null;
    } catch (e) {
      console.error('解析技能评估数据失败:', e);
      return null;
    }
  };

  const renderImprovementSuggestions = (suggestions) => {
    if (!suggestions) return null;
    
    try {
      const data = JSON.parse(suggestions);
      let suggestionsList = [];
      
      // 确保suggestionsList始终是数组
      if (data.建议 && Array.isArray(data.建议)) {
        suggestionsList = data.建议;
      } else if (data.suggestions && Array.isArray(data.suggestions)) {
        suggestionsList = data.suggestions;
      } else if (data.advice && Array.isArray(data.advice)) {
        suggestionsList = data.advice;
      } else if (Array.isArray(data)) {
        suggestionsList = data;
      } else {
        // 如果不是数组，尝试转换为数组
        suggestionsList = [];
      }
      
      // 确保每个项目都是字符串
      suggestionsList = suggestionsList.map(item => 
        typeof item === 'string' ? item : String(item)
      );
      
      if (suggestionsList.length === 0) return null;
      
      return (
        <div style={{ marginTop: '16px' }}>
          <Title level={5}>改进建议</Title>
          <List
            size="small"
            dataSource={suggestionsList}
            renderItem={(item, index) => (
              <List.Item>
                <Text>{index + 1}. {item}</Text>
              </List.Item>
            )}
          />
        </div>
      );
    } catch (e) {
      console.error('解析改进建议失败:', e);
      return null;
    }
  };

  // 删除面试记录
  const handleDeleteRecord = async (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除"${record.position}"的面试记录吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await deleteInterviewRecord(record.id);
          message.success('删除成功');
          fetchHistory();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  // 菜单项点击
  const handleMenuAction = (key, record) => {
    if (key === 'detail') {
      handleViewDetail(record);
    } else if (key === 'video') {
      window.open(record.videoFilePath, '_blank');
    } else if (key === 'delete') {
      handleDeleteRecord(record);
    }
    setOpenMenuId(null);
  };

  // 菜单渲染
  const renderCustomMenu = (record) => (
    <ul
      ref={menuRef}
      style={{
        position: 'absolute',
        top: 36,
        right: 0,
        minWidth: 90,
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
        padding: 0,
        margin: 0,
        zIndex: 1000,
        listStyle: 'none',
        animation: 'fadeInMenu 0.18s',
      }}
    >
      <li
        style={{
          display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', cursor: 'pointer', color: '#2563eb', fontWeight: 500, fontSize: 14, borderRadius: 6,
        }}
        onClick={() => handleMenuAction('detail', record)}
        onMouseEnter={e => e.currentTarget.style.background = '#f0f6ff'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <EyeOutlined style={{ color: '#2563eb' }} /> 详情
      </li>
      {record.videoFilePath && (
        <li
          style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', cursor: 'pointer', color: '#334155', fontSize: 14, borderRadius: 6 }}
          onClick={() => handleMenuAction('video', record)}
          onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <PlayCircleOutlined style={{ color: '#10b981' }} /> 视频
        </li>
      )}
      <li style={{ height: 1, background: '#f1f5f9', margin: '2px 0' }} />
      <li
        style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', cursor: 'pointer', color: '#ef4444', fontWeight: 500, fontSize: 14, borderRadius: 6 }}
        onClick={() => handleMenuAction('delete', record)}
        onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <DeleteOutlined style={{ color: '#ef4444' }} /> 删除
      </li>
    </ul>
  );

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: '#fff',
        padding: '0 32px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderBottom: '1px solid #e2e8f0',
        height: '64px',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            color: '#fff'
          }}>
            <HistoryOutlined />
          </div>
          <Title level={3} style={{ margin: 0, color: '#1e293b', fontWeight: 600 }}>
            面试历史记录
          </Title>
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          flexShrink: 0
        }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={handleBackToInterviewTypes}
            className="history-back-btn"
            style={{
              height: '40px',
              padding: '0 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#64748b',
              border: '1px solid #e2e8f0',
              background: '#fff',
              transition: 'all 0.3s ease',
              minWidth: '100px',
              flexShrink: 0
            }}
          >
            返回
          </Button>
          
          <Button
            danger
            onClick={handleLogout}
            className="history-logout-btn"
            style={{
              height: '40px',
              padding: '0 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              border: 'none',
              boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
              transition: 'all 0.3s ease',
              minWidth: '100px',
              flexShrink: 0
            }}
          >
            退出登录
          </Button>
        </div>
      </Header>

      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Title level={2} style={{ color: '#1e293b', marginBottom: '8px' }}>
              我的面试记录
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              查看您的面试历史和AI评测报告
            </Text>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px' }}>
                <Text type="secondary">加载中...</Text>
              </div>
            </div>
          ) : records.length === 0 ? (
            <Empty
              description="暂无面试记录"
              style={{ marginTop: '60px' }}
            >
              <Button type="primary" onClick={() => navigate('/interview-types')}>
                开始第一次面试
              </Button>
            </Empty>
          ) : (
            <List
              grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 }}
              dataSource={records}
              renderItem={(record) => (
                <List.Item>
                  <Card
                    hoverable
                    style={{ 
                      borderRadius: '16px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      border: '1px solid #e2e8f0',
                      marginBottom: '16px'
                    }}
                    bodyStyle={{ padding: '24px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <Title level={4} style={{ margin: 0, color: '#1e293b', fontWeight: 600 }}>
                            {record.position}
                          </Title>
                          <Tag color={getStatusColor(record.status)} style={{ fontSize: '12px', padding: '4px 8px' }}>
                            {getStatusText(record.status)}
                          </Tag>
                        </div>
                      </div>

                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <button
                          onClick={() => setOpenMenuId(openMenuId === record.id ? null : record.id)}
                          style={{
                            height: 32,
                            width: 32,
                            borderRadius: 8,
                            backgroundColor: '#f1f5f9',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                            outline: 'none',
                            padding: 0
                          }}
                        >
                          <MoreOutlined style={{ fontSize: 18, color: '#475569' }} />
                        </button>
                        {openMenuId === record.id && renderCustomMenu(record)}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ClockCircleOutlined style={{ color: '#64748b', fontSize: '16px' }} />
                        <div>
                          <Text style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>开始时间</Text>
                          <Text style={{ fontSize: '14px', color: '#475569', fontWeight: 500 }}>
                            {formatDateTime(record.startTime)}
                          </Text>
                        </div>
                      </div>
                      
                      {record.duration && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <ClockCircleOutlined style={{ color: '#64748b', fontSize: '16px' }} />
                          <div>
                            <Text style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>面试时长</Text>
                            <Text style={{ fontSize: '14px', color: '#475569', fontWeight: 500 }}>
                              {formatDuration(record.duration)}
                            </Text>
                          </div>
                        </div>
                      )}
                      
                      {record.overallScore && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <TrophyOutlined style={{ color: '#f59e0b', fontSize: '16px' }} />
                          <div>
                            <Text style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>总分</Text>
                            <Text strong style={{ fontSize: '16px', color: '#f59e0b', fontWeight: 600 }}>
                              {record.overallScore}分
                            </Text>
                          </div>
                        </div>
                      )}
                    </div>

                    {record.overallFeedback && (
                      <div style={{ 
                        background: '#f8fafc', 
                        padding: '16px', 
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <Text style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>
                          {record.overallFeedback}
                        </Text>
                      </div>
                    )}
                  </Card>
                </List.Item>
              )}
            />
          )}
        </div>
      </Content>

      {/* 详情模态框 */}
      <Modal
        title="面试详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedRecord && (
          <div>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="面试类型">{selectedRecord.interviewType}</Descriptions.Item>
              <Descriptions.Item label="岗位">{selectedRecord.position}</Descriptions.Item>
              <Descriptions.Item label="开始时间">
                {selectedRecord.startTime ? new Date(selectedRecord.startTime).toLocaleString() : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="结束时间">
                {selectedRecord.endTime ? new Date(selectedRecord.endTime).toLocaleString() : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="时长">
                {selectedRecord.duration ? `${selectedRecord.duration}分钟` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">{selectedRecord.status}</Descriptions.Item>
              <Descriptions.Item label="总体评分">
                {selectedRecord.overallScore ? `${selectedRecord.overallScore}分` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="AI模型">{selectedRecord.aiModel || '-'}</Descriptions.Item>
            </Descriptions>
            
            {selectedRecord.overallFeedback && (
              <div style={{ marginTop: '24px' }}>
                <Title level={5}>总体反馈</Title>
                <Paragraph>{selectedRecord.overallFeedback}</Paragraph>
              </div>
            )}
            
            {selectedRecord.videoFilePath && selectedRecord.videoFilePath.trim() !== '' && (
              <div style={{ marginTop: '24px' }}>
                <Title level={5}>面试视频</Title>
                <Button 
                  type="primary" 
                  icon={<PlayCircleOutlined />}
                  onClick={() => window.open(selectedRecord.videoFilePath, '_blank')}
                >
                  观看完整视频
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default History;