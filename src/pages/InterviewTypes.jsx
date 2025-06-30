import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Card, 
  Button, 
  Typography, 
  Space, 
  Layout,
  Menu,
  message,
  Divider,
  Tag,
  Row,
  Col,
  Modal,
  Steps,
  Avatar,
  Badge
} from 'antd';
import { 
  VideoCameraOutlined, 
  HistoryOutlined,
  CloseOutlined,
  RobotOutlined,
  DatabaseOutlined,
  CloudOutlined,
  SettingOutlined,
  UserOutlined,
  BulbOutlined,
  CodeOutlined,
  ApiOutlined,
  AppstoreOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  StarOutlined
} from '@ant-design/icons';
import { removeToken } from '../utils/auth';

const { Title, Text, Paragraph } = Typography;
const { Header, Content } = Layout;

// 添加自定义样式
const customStyles = `
  .history-btn:hover {
    background: #f8fafc !important;
    border-color: #cbd5e1 !important;
    color: #475569 !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
  }
  
  .logout-btn:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 8px rgba(239, 68, 68, 0.4) !important;
  }
  
  .back-btn:hover {
    background: #f8fafc !important;
    border-color: #cbd5e1 !important;
    color: #475569 !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
  }
  
  .reselect-btn:hover {
    background: #f8fafc !important;
    border-color: #cbd5e1 !important;
    color: #475569 !important;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.12) !important;
  }
  
  .start-interview-btn:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 20px rgba(0,0,0,0.2) !important;
  }
`;

// 注入样式
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = customStyles;
  document.head.appendChild(styleElement);
}

// 面试类型数据
const interviewTypes = [
  {
    category: "人工智能",
    icon: <RobotOutlined />,
    color: "#3b82f6",
    description: "机器学习、深度学习、自然语言处理等前沿技术",
    positions: [
      {
        type: "AI_ENGINEER",
        title: "AI工程师",
        description: "专注于机器学习、深度学习、自然语言处理等技术",
        skills: ["机器学习", "深度学习", "Python", "TensorFlow", "自然语言处理"],
        aiModel: "GPT-4 + Claude",
        difficulty: "高级",
        salary: "25k-50k",
        demand: "高"
      },
      {
        type: "AI_RESEARCHER",
        title: "AI研究员",
        description: "专注于前沿AI算法研究和创新",
        skills: ["算法研究", "论文阅读", "数学基础", "创新思维", "实验设计"],
        aiModel: "Claude + GPT-4",
        difficulty: "专家级",
        salary: "35k-80k",
        demand: "极高"
      }
    ]
  },
  {
    category: "大数据",
    icon: <DatabaseOutlined />,
    color: "#10b981",
    description: "数据处理、分析、挖掘和商业智能",
    positions: [
      {
        type: "DATA_ENGINEER",
        title: "数据工程师",
        description: "专注于数据处理、ETL、数据仓库等技术",
        skills: ["SQL", "Python", "Spark", "Hadoop", "数据建模"],
        aiModel: "Claude + GPT-4",
        difficulty: "中级",
        salary: "20k-40k",
        demand: "高"
      },
      {
        type: "DATA_SCIENTIST",
        title: "数据科学家",
        description: "专注于数据分析、统计建模、商业智能等",
        skills: ["统计分析", "机器学习", "数据可视化", "商业分析", "R/Python"],
        aiModel: "GPT-4 + Claude",
        difficulty: "高级",
        salary: "25k-60k",
        demand: "极高"
      }
    ]
  },
  {
    category: "物联网",
    icon: <CloudOutlined />,
    color: "#f59e0b",
    description: "传感器、嵌入式系统、IoT平台开发",
    positions: [
      {
        type: "IOT_ENGINEER",
        title: "物联网工程师",
        description: "专注于传感器、嵌入式系统、IoT平台开发",
        skills: ["嵌入式开发", "传感器技术", "IoT协议", "硬件设计", "云平台"],
        aiModel: "Claude + GPT-4",
        difficulty: "中级",
        salary: "18k-35k",
        demand: "中"
      },
      {
        type: "IOT_ARCHITECT",
        title: "IoT架构师",
        description: "专注于IoT系统架构设计和优化",
        skills: ["系统架构", "物联网协议", "安全设计", "性能优化", "技术选型"],
        aiModel: "GPT-4 + Claude",
        difficulty: "高级",
        salary: "30k-60k",
        demand: "高"
      }
    ]
  },
  {
    category: "智能系统",
    icon: <SettingOutlined />,
    color: "#8b5cf6",
    description: "系统设计、性能优化、架构规划",
    positions: [
      {
        type: "SYSTEM_ENGINEER",
        title: "系统工程师",
        description: "专注于系统设计、性能优化、架构规划",
        skills: ["系统设计", "性能优化", "架构规划", "技术选型", "团队协作"],
        aiModel: "Claude + GPT-4",
        difficulty: "高级",
        salary: "25k-50k",
        demand: "高"
      },
      {
        type: "DEVOPS_ENGINEER",
        title: "DevOps工程师",
        description: "专注于自动化部署、监控、运维",
        skills: ["Docker", "Kubernetes", "CI/CD", "监控告警", "自动化运维"],
        aiModel: "GPT-4 + Claude",
        difficulty: "中级",
        salary: "20k-45k",
        demand: "高"
      }
    ]
  },
  {
    category: "产品管理",
    icon: <UserOutlined />,
    color: "#ef4444",
    description: "产品规划、需求分析、用户体验",
    positions: [
      {
        type: "PRODUCT_MANAGER",
        title: "产品经理",
        description: "专注于产品规划、需求分析、用户体验",
        skills: ["产品规划", "需求分析", "用户体验", "数据分析", "项目管理"],
        aiModel: "Claude + GPT-4",
        difficulty: "中级",
        salary: "20k-40k",
        demand: "高"
      },
      {
        type: "TECHNICAL_PRODUCT_MANAGER",
        title: "技术产品经理",
        description: "专注于技术产品规划和团队协作",
        skills: ["技术理解", "产品规划", "团队协作", "技术选型", "项目管理"],
        aiModel: "GPT-4 + Claude",
        difficulty: "高级",
        salary: "25k-55k",
        demand: "高"
      }
    ]
  }
];

const InterviewTypes = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPositions, setShowPositions] = useState(false);

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const handleCategorySelect = (category) => {
    console.log('选中大类:', category);
    if (category && category.positions) {
      setSelectedCategory(category);
      setSelectedPosition(null);
      setShowPositions(true);
    }
  };

  const handlePositionSelect = (position) => {
    console.log('选中岗位:', position);
    setSelectedPosition(position);
  };

  const handleStartInterview = async () => {
    if (!selectedPosition) {
      message.warning('请选择一个面试岗位');
      return;
    }

    setLoading(true);
    try {
      message.success(`开始${selectedPosition.title}面试`);
      
      setTimeout(() => {
        navigate(`/interview/${selectedPosition.type}`);
      }, 1000);
    } catch (error) {
      message.error('启动面试失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCategories = () => {
    console.log('返回大类选择');
    setShowPositions(false);
    setSelectedCategory(null);
    setSelectedPosition(null);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case '初级': return 'green';
      case '中级': return 'blue';
      case '高级': return 'orange';
      case '专家级': return 'red';
      default: return 'default';
    }
  };

  const getDemandColor = (demand) => {
    switch (demand) {
      case '极高': return 'red';
      case '高': return 'orange';
      case '中': return 'blue';
      case '低': return 'green';
      default: return 'default';
    }
  };

  const menuItems = [
    {
      key: 'history',
      icon: <HistoryOutlined />,
      label: '历史记录',
      onClick: () => navigate('/history'),
    },
  ];

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
            <VideoCameraOutlined />
          </div>
          <Title level={3} style={{ margin: 0, color: '#1e293b', fontWeight: 600 }}>
            AI面试模拟器
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
            icon={<HistoryOutlined />}
            onClick={() => navigate('/history')}
            className="history-btn"
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
            历史记录
          </Button>
          
          <Button
            danger
            onClick={handleLogout}
            className="logout-btn"
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
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* 页面标题 */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: '40px' }}
          >
            <Title level={2} style={{ color: '#1e293b', marginBottom: '16px' }}>
              选择您的面试方向
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              我们提供多种技术方向的AI面试，帮助您提升面试技能
            </Text>
          </motion.div>

          {/* 面试大类选择 */}
          {!showPositions && (
            <Row gutter={[24, 24]}>
              {Array.isArray(interviewTypes) && interviewTypes.map((category, categoryIndex) => (
                <Col xs={24} sm={12} lg={8} xl={6} key={category.category}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                  >
                    <Card
                      hoverable
                      style={{ 
                        borderRadius: '16px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        border: '1px solid #e2e8f0',
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={() => handleCategorySelect(category)}
                      bodyStyle={{ padding: '24px', textAlign: 'center' }}
                    >
                      <div style={{ 
                        width: '80px', 
                        height: '80px', 
                        borderRadius: '50%',
                        background: `${category.color}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        fontSize: '32px',
                        color: category.color
                      }}>
                        {category.icon}
                      </div>
                      
                      <Title level={4} style={{ margin: '0 0 8px 0', color: '#1e293b' }}>
                        {category.category}
                      </Title>
                      
                      <Text type="secondary" style={{ fontSize: '14px', lineHeight: '1.5' }}>
                        {category.description}
                      </Text>
                      
                      <div style={{ marginTop: '16px' }}>
                        <Tag color={category.color} style={{ margin: '4px' }}>
                          {category.positions.length} 个岗位
                        </Tag>
                      </div>
                    </Card>
                  </motion.div>
                </Col>
              ))}
            </Row>
          )}

          {/* 岗位选择区域 */}
          {showPositions && selectedCategory && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* 返回按钮 */}
              <div style={{ marginBottom: '24px' }}>
                <Button 
                  icon={<ArrowLeftOutlined />} 
                  onClick={handleBackToCategories}
                  className="back-btn"
                  style={{ 
                    marginBottom: '16px',
                    height: '44px',
                    padding: '0 20px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#64748b',
                    border: '1px solid #e2e8f0',
                    background: '#fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  返回选择方向
                </Button>
                
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <Title level={2} style={{ color: '#1e293b', marginBottom: '8px' }}>
                    {selectedCategory.category}
                  </Title>
                  <Text type="secondary" style={{ fontSize: '16px' }}>
                    {selectedCategory.description}
                  </Text>
                </div>
              </div>

              {/* 岗位列表 */}
              <Row gutter={[16, 16]}>
                {selectedCategory.positions && selectedCategory.positions.map((position, index) => (
                  <Col xs={24} sm={12} lg={8} key={position.type}>
                    <Card
                      hoverable
                      style={{
                        border: selectedPosition?.type === position.type 
                          ? `2px solid ${selectedCategory.color}` 
                          : '1px solid #e2e8f0',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        background: selectedPosition?.type === position.type 
                          ? `${selectedCategory.color}10` 
                          : '#fff'
                      }}
                      onClick={() => handlePositionSelect(position)}
                      bodyStyle={{ padding: '20px' }}
                    >
                      <div style={{ marginBottom: '12px' }}>
                        <Title level={5} style={{ margin: '0 0 8px 0', color: '#1e293b' }}>
                          {position.title}
                        </Title>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <Tag color={getDifficultyColor(position.difficulty)}>
                            {position.difficulty}
                          </Tag>
                          <Tag color={getDemandColor(position.demand)}>
                            需求: {position.demand}
                          </Tag>
                        </div>
                      </div>

                      <Text type="secondary" style={{ fontSize: '14px', lineHeight: '1.5' }}>
                        {position.description}
                      </Text>

                      <div style={{ marginTop: '12px' }}>
                        <Text strong style={{ fontSize: '12px', color: '#64748b' }}>
                          核心技能:
                        </Text>
                        <div style={{ marginTop: '4px' }}>
                          {position.skills && position.skills.slice(0, 3).map((skill, index) => (
                            <Tag 
                              key={index} 
                              size="small" 
                              style={{ 
                                margin: '2px', 
                                background: '#f1f5f9',
                                border: 'none',
                                color: '#64748b'
                              }}
                            >
                              {skill}
                            </Tag>
                          ))}
                          {position.skills && position.skills.length > 3 && (
                            <Tag size="small" style={{ background: '#f1f5f9', border: 'none', color: '#64748b' }}>
                              +{position.skills.length - 3}
                            </Tag>
                          )}
                        </div>
                      </div>

                      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: '12px', color: '#64748b' }}>
                          {position.aiModel}
                        </Text>
                        <Text style={{ fontSize: '12px', color: '#f59e0b' }}>
                          {position.salary}
                        </Text>
                      </div>

                      {selectedPosition?.type === position.type && (
                        <div style={{ 
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          color: selectedCategory.color,
                          fontSize: '20px'
                        }}>
                          <CheckCircleOutlined />
                        </div>
                      )}
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* 开始面试按钮 */}
              {selectedPosition && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ 
                    textAlign: 'center', 
                    marginTop: '40px',
                    padding: '24px',
                    background: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ marginBottom: '16px' }}>
                    <Text style={{ fontSize: '16px', color: '#64748b' }}>
                      已选择: <Text strong style={{ color: '#1e293b' }}>{selectedPosition.title}</Text>
                    </Text>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    gap: '16px'
                  }}>
                    <Button
                      size="large"
                      icon={<ArrowLeftOutlined />}
                      onClick={() => setSelectedPosition(null)}
                      className="reselect-btn"
                      style={{ 
                        height: '52px', 
                        padding: '0 40px',
                        borderRadius: '12px',
                        fontSize: '15px',
                        fontWeight: 500,
                        color: '#64748b',
                        border: '1px solid #e2e8f0',
                        background: '#fff',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        transition: 'all 0.3s ease',
                        minWidth: '180px'
                      }}
                    >
                      重新选择
                    </Button>
                    <Button
                      type="primary"
                      size="large"
                      icon={<VideoCameraOutlined />}
                      loading={loading}
                      onClick={handleStartInterview}
                      className="start-interview-btn"
                      style={{ 
                        height: '52px', 
                        padding: '0 40px',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: 600,
                        background: `linear-gradient(135deg, ${selectedCategory.color} 0%, ${selectedCategory.color}dd 100%)`,
                        border: 'none',
                        boxShadow: `0 4px 12px ${selectedCategory.color}40`,
                        transition: 'all 0.3s ease',
                        minWidth: '180px'
                      }}
                    >
                      {loading ? '准备中...' : '开始面试'}
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </Content>
    </Layout>
  );
};

export default InterviewTypes; 