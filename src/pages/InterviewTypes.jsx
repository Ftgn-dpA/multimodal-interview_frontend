import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Tag from '../components/ui/Tag';
import { Title, Text } from '../components/ui/Typography';
import Toast from '../components/ui/Toast';
import { removeToken } from '../utils/auth';
import { showToast } from '../utils/toast';

// 面试类型数据（用emoji图标）
const interviewTypes = [
  {
    category: "人工智能",
    icon: <span style={{fontSize: 28}}>🤖</span>,
    color: "#3b82f6",
    description: "机器学习、深度学习、自然语言处理等前沿技术",
    positions: [
      {
        type: "AI_ENGINEER",
        title: "AI工程师",
        description: "专注于机器学习、深度学习、自然语言处理等技术",
        skills: ["机器学习", "深度学习", "Python", "TensorFlow", "自然语言处理"],
        difficulty: "高级",
        demand: "高"
      },
      {
        type: "AI_RESEARCHER",
        title: "AI研究员",
        description: "专注于前沿AI算法研究和创新",
        skills: ["算法研究", "论文阅读", "数学基础", "创新思维", "实验设计"],
        difficulty: "专家级",
        demand: "极高"
      }
    ]
  },
  {
    category: "大数据",
    icon: <span style={{fontSize: 28}}>💾</span>,
    color: "#10b981",
    description: "数据处理、分析、挖掘和商业智能",
    positions: [
      {
        type: "DATA_ENGINEER",
        title: "数据工程师",
        description: "专注于数据处理、ETL、数据仓库等技术",
        skills: ["SQL", "Python", "Spark", "Hadoop", "数据建模"],
        difficulty: "中级",
        demand: "高"
      },
      {
        type: "DATA_SCIENTIST",
        title: "数据科学家",
        description: "专注于数据分析、统计建模、商业智能等",
        skills: ["统计分析", "机器学习", "数据可视化", "商业分析", "R/Python"],
        difficulty: "高级",
        demand: "极高"
      }
    ]
  },
  {
    category: "物联网",
    icon: <span style={{fontSize: 28}}>☁️</span>,
    color: "#f59e0b",
    description: "传感器、嵌入式系统、IoT平台开发",
    positions: [
      {
        type: "IOT_ENGINEER",
        title: "物联网工程师",
        description: "专注于传感器、嵌入式系统、IoT平台开发",
        skills: ["嵌入式开发", "传感器技术", "IoT协议", "硬件设计", "云平台"],
        difficulty: "中级",
        demand: "中"
      },
      {
        type: "IOT_ARCHITECT",
        title: "IoT架构师",
        description: "专注于IoT系统架构设计和优化",
        skills: ["系统架构", "物联网协议", "安全设计", "性能优化", "技术选型"],
        difficulty: "高级",
        demand: "高"
      }
    ]
  },
  {
    category: "智能系统",
    icon: <span style={{fontSize: 28}}>⚙️</span>,
    color: "#8b5cf6",
    description: "系统设计、性能优化、架构规划",
    positions: [
      {
        type: "SYSTEM_ENGINEER",
        title: "系统工程师",
        description: "专注于系统设计、性能优化、架构规划",
        skills: ["系统设计", "性能优化", "架构规划", "技术选型", "团队协作"],
        difficulty: "高级",
        demand: "高"
      },
      {
        type: "DEVOPS_ENGINEER",
        title: "DevOps工程师",
        description: "专注于自动化部署、监控、运维",
        skills: ["Docker", "Kubernetes", "CI/CD", "监控告警", "自动化运维"],
        difficulty: "中级",
        demand: "高"
      }
    ]
  },
  {
    category: "产品管理",
    icon: <span style={{fontSize: 28}}>👤</span>,
    color: "#ef4444",
    description: "产品规划、需求分析、用户体验",
    positions: [
      {
        type: "PRODUCT_MANAGER",
        title: "产品经理",
        description: "专注于产品规划、需求分析、用户体验",
        skills: ["产品规划", "需求分析", "用户体验", "数据分析", "项目管理"],
        difficulty: "中级",
        demand: "高"
      },
      {
        type: "TECHNICAL_PRODUCT_MANAGER",
        title: "技术产品经理",
        description: "专注于技术产品规划和团队协作",
        skills: ["技术理解", "产品规划", "团队协作", "技术选型", "项目管理"],
        difficulty: "高级",
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
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const handleCategorySelect = (category) => {
    if (category && category.positions) {
      setSelectedCategory(category);
      setSelectedPosition(null);
      setShowPositions(true);
    }
  };

  const handlePositionSelect = (position) => {
    setSelectedPosition(position);
  };

  const handleStartInterview = async () => {
    if (!selectedPosition) {
      showToast(setToast, '请选择一个面试岗位', 'warning');
      return;
    }
    setLoading(true);
    try {
      showToast(setToast, `开始${selectedPosition.title}面试`, 'success');
      setTimeout(() => {
        navigate(`/device-check/${selectedPosition.type}`);
      }, 1000);
    } catch (error) {
      showToast(setToast, '启动面试失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCategories = () => {
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

  // 动态className: 选中岗位时毛玻璃，否则透明
  const mainClass = selectedPosition ? "glass-effect" : "main-glass-bg-none";

  return (
    <div className={mainClass} style={{ minHeight: '100vh' }}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, visible: false })} />
      {/* Header 区域 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#fff', padding: '0 32px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderBottom: '1px solid #e2e8f0', height: 64, position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, color: '#fff'
          }}>
            <span role="img" aria-label="video">🎥</span>
          </div>
          <Title level={3} style={{ margin: 0, color: '#1e293b', fontWeight: 600 }}>
            AI面试模拟器
          </Title>
        </div>
        {/* 右上角按钮：一级页面显示历史/退出，二级页面只显示返回 */}
        {!showPositions ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              onClick={() => navigate('/history')}
              style={{ height: 40, padding: '0 20px', borderRadius: 8, fontSize: 14, fontWeight: 500, color: '#64748b', border: '1px solid #e2e8f0', background: '#fff', transition: 'all 0.3s', minWidth: 100 }}
            >
              历史记录
            </Button>
            <Button
              danger
              onClick={handleLogout}
              style={{ height: 40, padding: '0 24px', borderRadius: 8, fontSize: 14, fontWeight: 500, background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', border: 'none', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)', transition: 'all 0.3s', minWidth: 100 }}
            >
              退出登录
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button 
              onClick={handleBackToCategories}
              style={{ height: 40, padding: '0 20px', borderRadius: 10, fontSize: 14, fontWeight: 500, color: '#64748b', border: '1px solid #e2e8f0', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', transition: 'all 0.3s' }}
            >
              ← 返回场景选择
            </Button>
          </div>
        )}
      </div>
      {/* 内容区域 */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: 24 }}>
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 40 }}
        >
          <Title level={2} style={{ color: '#1e293b', marginBottom: 16 }}>
            选择您的面试场景
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            我们提供多种技术场景的AI面试，帮助您提升面试技能
          </Text>
        </motion.div>
        {/* 面试大类选择 */}
        {!showPositions && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center', maxWidth: 480, margin: '0 auto' }}>
            {Array.isArray(interviewTypes) && interviewTypes.map((category, categoryIndex) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                style={{ width: '100%' }}
              >
                <Card
                  hoverable
                  style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', width: '100%', cursor: 'pointer', transition: 'all 0.3s' }}
                  onClick={() => handleCategorySelect(category)}
                  bodyStyle={{ padding: 24, textAlign: 'center' }}
                >
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: `${category.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 32, color: category.color }}>
                    {category.icon}
                  </div>
                  <Title level={4} style={{ margin: '0 0 8px 0', color: '#1e293b' }}>
                    {category.category}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 14, lineHeight: 1.5 }}>
                    {category.description}
                  </Text>
                  <div style={{ marginTop: 16 }}>
                    <Tag color={category.color} style={{ margin: 4 }}>
                      {category.positions.length} 个岗位
                    </Tag>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
        {/* 岗位选择区域 */}
        {showPositions && selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* 返回按钮已移至Header右上角，这里删除原有返回按钮 */}
            {/* 岗位列表 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', maxWidth: 480, margin: '0 auto' }}>
              {selectedCategory.positions && selectedCategory.positions.map((position, index) => (
                <div key={position.type} style={{ width: '100%' }}>
                  <Card
                    hoverable
                    style={{ border: selectedPosition?.type === position.type ? `2px solid ${selectedCategory.color}` : '1px solid #e2e8f0', borderRadius: 12, cursor: 'pointer', transition: 'all 0.3s', background: selectedPosition?.type === position.type ? 'rgba(255,255,255,0.85)' : '#fff', backdropFilter: selectedPosition?.type === position.type ? 'blur(8px)' : 'none', color: '#1e293b', position: 'relative', width: '100%' }}
                    onClick={() => handlePositionSelect(position)}
                    bodyStyle={{ padding: 20 }}
                  >
                    <div style={{ marginBottom: 12 }}>
                      <Title level={5} style={{ margin: '0 0 8px 0', color: '#1e293b' }}>
                        {position.title}
                      </Title>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <Tag color={getDifficultyColor(position.difficulty)}>
                          {position.difficulty}
                        </Tag>
                        <Tag color={getDemandColor(position.demand)}>
                          需求: {position.demand}
                        </Tag>
                      </div>
                    </div>
                    <Text type="secondary" style={{ fontSize: 14, lineHeight: 1.5 }}>
                      {position.description}
                    </Text>
                    <div style={{ marginTop: 12 }}>
                      <Text strong style={{ fontSize: 12, color: '#64748b' }}>
                        核心技能:
                      </Text>
                      <div style={{ marginTop: 4 }}>
                        {position.skills && position.skills.slice(0, 3).map((skill, index) => (
                          <Tag 
                            key={index} 
                            size="small" 
                            style={{ margin: 2, background: '#f1f5f9', border: 'none', color: '#64748b' }}
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
                    {selectedPosition?.type === position.type && (
                      <div style={{ position: 'absolute', top: 12, right: 12, color: selectedCategory.color, fontSize: 20, fontWeight: 700 }}>
                        ✓
                      </div>
                    )}
                  </Card>
                </div>
              ))}
            </div>
            {/* 开始面试按钮 */}
            {selectedPosition && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', marginTop: 40, padding: 24, background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
              >
                <div style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, color: '#64748b' }}>
                    已选择: <Text strong style={{ color: '#1e293b' }}>{selectedPosition.title}</Text>
                  </Text>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                  <Button
                    size="large"
                    onClick={() => setSelectedPosition(null)}
                    style={{ height: 52, padding: '0 40px', borderRadius: 12, fontSize: 15, fontWeight: 500, color: '#64748b', border: '1px solid #e2e8f0', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', transition: 'all 0.3s', minWidth: 180 }}
                  >
                    ← 重新选择
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    loading={loading}
                    onClick={handleStartInterview}
                    style={{ height: 52, padding: '0 40px', borderRadius: 12, fontSize: 16, fontWeight: 600, background: `linear-gradient(135deg, ${selectedCategory.color} 0%, ${selectedCategory.color}dd 100%)`, border: 'none', boxShadow: `0 4px 12px ${selectedCategory.color}40`, transition: 'all 0.3s', minWidth: 180 }}
                  >
                    {loading ? '准备中...' : '开始面试'}
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default InterviewTypes; 