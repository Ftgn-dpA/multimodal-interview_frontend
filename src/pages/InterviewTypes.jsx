import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Tag from '../components/ui/Tag';
import { Title, Text } from '../components/ui/Typography';
import Toast from '../components/ui/Toast';
import { removeToken } from '../utils/auth';
import { showToast } from '../utils/toast';
import { BgEffectContext } from '../App';
import { resumeAPI } from '../api';

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
  const { setThemeColor, resetColors } = useContext(BgEffectContext);
  
  // 简历相关状态
  const [resumeList, setResumeList] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [resumeDropdownOpen, setResumeDropdownOpen] = useState(false);

  // 点击外部区域关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdownElement = document.getElementById('resume-dropdown');
      if (dropdownElement && !dropdownElement.contains(event.target)) {
        setResumeDropdownOpen(false);
      }
    };

    if (resumeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [resumeDropdownOpen]);

  // 获取用户简历列表
  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setLoadingResumes(true);
        const response = await resumeAPI.getResumeList();
        setResumeList(response.data || []);
      } catch (error) {
        console.error('获取简历列表失败:', error);
        showToast(setToast, '获取简历列表失败', 'error');
      } finally {
        setLoadingResumes(false);
      }
    };

    fetchResumes();
  }, []);

  // 处理简历选择
  const handleResumeSelect = (resume) => {
    setSelectedResume(resume);
    console.log('选中的简历路径:', resume.filename);
    showToast(setToast, `已选择简历: ${resume.originalName}`, 'success');
  };

  const handleCategorySelect = (category) => {
    if (category && category.positions) {
      setSelectedCategory(category);
      setSelectedPosition(null);
      setShowPositions(true);
      setThemeColor(category.color);
    }
  };

  // 移除 useEffect 里的 resetColors
  // useEffect(() => {
  //   return () => {
  //     resetColors();
  //   };
  // }, [resetColors]);

  const handlePositionSelect = (position) => {
    setSelectedPosition(position);
    setResumeDropdownOpen(false); // 关闭简历下拉菜单
  };

  const handleStartInterview = async () => {
    if (!selectedPosition) {
      showToast(setToast, '请选择一个面试岗位', 'warning');
      return;
    }
    setLoading(true);
    try {
      // 输出简历选择信息
      if (selectedResume) {
        console.log('开始面试，选中的简历信息:', {
          id: selectedResume.id,
          filename: selectedResume.filename,
          originalName: selectedResume.originalName,
          uploadTime: selectedResume.uploadTime
        });
      } else {
        console.log('开始面试，未选择简历');
      }
      
      showToast(setToast, `开始${selectedPosition.title}面试`, 'success');
      setTimeout(() => {
        // 传递选中的简历信息到设备检查页面
        const resumeInfo = selectedResume ? {
          id: selectedResume.id,
          filename: selectedResume.filename,
          originalName: selectedResume.originalName
        } : null;
        navigate(`/device-check/${selectedPosition.type}`, { 
          state: { selectedResume: resumeInfo } 
        });
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
    resetColors(); // 返回主页时还原泡泡为五色
  };

  const handleLogout = () => {
    removeToken();
    resetColors(); // 退出登录时还原泡泡为五色
    navigate('/login');
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
              type="text"
              onClick={() => navigate('/profile')}
              style={{ height: 40, padding: '0 20px', borderRadius: 8, fontSize: 14, fontWeight: 500, color: '#64748b', border: '1px solid #e2e8f0', background: '#fff', transition: 'all 0.3s', minWidth: 100 }}
            >
              个人中心
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
                
                {/* 简历选择区域 */}
                <div style={{ width: '100%', maxWidth: 400, marginBottom: 16 }}>
                  <div style={{ marginBottom: 8 }}>
                    <Text style={{ fontSize: 14, color: '#64748b' }}>
                      选择简历 (可选):
                    </Text>
                  </div>
                  
                  {loadingResumes ? (
                    <div style={{ 
                      padding: '12px 16px', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: 8, 
                      background: '#f8fafc',
                      textAlign: 'center',
                      color: '#64748b'
                    }}>
                      加载简历中...
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }} id="resume-dropdown">
                      {/* 下拉菜单触发器 */}
                      <div
                        onClick={() => setResumeDropdownOpen(!resumeDropdownOpen)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setResumeDropdownOpen(!resumeDropdownOpen);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-haspopup="listbox"
                        aria-expanded={resumeDropdownOpen}
                        style={{
                          padding: '12px 16px',
                          border: '1px solid #e2e8f0',
                          borderRadius: 8,
                          background: '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s ease',
                          minHeight: 44,
                          boxShadow: resumeDropdownOpen ? '0 4px 12px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
                          borderColor: resumeDropdownOpen ? selectedCategory.color : '#e2e8f0',
                          outline: 'none'
                        }}
                        onMouseEnter={(e) => {
                          if (!resumeDropdownOpen) {
                            e.target.style.borderColor = selectedCategory.color;
                            e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!resumeDropdownOpen) {
                            e.target.style.borderColor = '#e2e8f0';
                            e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                          }
                        }}
                      >
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          {selectedResume ? (
                            <div>
                              <Text strong style={{ fontSize: 14, color: '#1e293b' }}>
                                {selectedResume.originalName}
                              </Text>
                              <div style={{ marginTop: 2 }}>
                                <Text style={{ fontSize: 12, color: '#64748b' }}>
                                  上传时间: {new Date(selectedResume.uploadTime).toLocaleString('zh-CN')}
                                </Text>
                              </div>
                            </div>
                          ) : (
                            <Text style={{ fontSize: 14, color: '#64748b' }}>
                              请选择简历（可选）
                            </Text>
                          )}
                        </div>
                        <div style={{ 
                          marginLeft: 12,
                          transition: 'transform 0.2s ease',
                          transform: resumeDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          color: '#64748b'
                        }}>
                          ▼
                        </div>
                      </div>
                      
                      {/* 下拉菜单内容 */}
                      {resumeDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              setResumeDropdownOpen(false);
                            }
                          }}
                          tabIndex={-1}
                          role="listbox"
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: '#fff',
                            border: `1px solid ${selectedCategory.color}`,
                            borderTop: 'none',
                            borderRadius: '0 0 8px 8px',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                            zIndex: 1000,
                            maxHeight: 300,
                            overflowY: 'auto'
                          }}
                        >
                          {/* 不选择选项 */}
                          <div
                            onClick={() => {
                              setSelectedResume(null);
                              setResumeDropdownOpen(false);
                              console.log('不选择简历');
                              showToast(setToast, '已取消选择简历', 'info');
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setSelectedResume(null);
                                setResumeDropdownOpen(false);
                                console.log('不选择简历');
                                showToast(setToast, '已取消选择简历', 'info');
                              }
                            }}
                            tabIndex={0}
                            role="option"
                            aria-selected={selectedResume === null}
                            style={{
                              padding: '12px 16px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              borderBottom: '1px solid #f1f5f9',
                              background: selectedResume === null ? '#f0f9ff' : '#fff',
                              borderLeft: selectedResume === null ? `3px solid ${selectedCategory.color}` : '3px solid transparent',
                              outline: 'none'
                            }}
                            onMouseEnter={(e) => {
                              if (selectedResume !== null) {
                                e.target.style.background = '#f8fafc';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedResume !== null) {
                                e.target.style.background = '#fff';
                              }
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div>
                                <Text style={{ fontSize: 14, color: '#64748b', fontStyle: 'italic' }}>
                                  ✗ 不选择简历
                                </Text>
                                <div style={{ marginTop: 2 }}>
                                  <Text style={{ fontSize: 12, color: '#94a3b8' }}>
                                    直接开始面试，不关联简历
                                  </Text>
                                </div>
                              </div>
                              {selectedResume === null && (
                                <div style={{ color: selectedCategory.color, fontSize: 16, fontWeight: 'bold' }}>
                                  ✓
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* 简历列表 */}
                          {resumeList.length > 0 ? (
                            resumeList.map((resume) => (
                              <div
                                key={resume.id}
                                onClick={() => {
                                  handleResumeSelect(resume);
                                  setResumeDropdownOpen(false);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleResumeSelect(resume);
                                    setResumeDropdownOpen(false);
                                  }
                                }}
                                tabIndex={0}
                                role="option"
                                aria-selected={selectedResume?.id === resume.id}
                                style={{
                                  padding: '12px 16px',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  borderBottom: '1px solid #f1f5f9',
                                  background: selectedResume?.id === resume.id ? '#f0f9ff' : '#fff',
                                  borderLeft: selectedResume?.id === resume.id ? `3px solid ${selectedCategory.color}` : '3px solid transparent',
                                  outline: 'none'
                                }}
                                onMouseEnter={(e) => {
                                  if (selectedResume?.id !== resume.id) {
                                    e.target.style.background = '#f8fafc';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (selectedResume?.id !== resume.id) {
                                    e.target.style.background = '#fff';
                                  }
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <div style={{ flex: 1 }}>
                                    <Text strong style={{ fontSize: 14, color: '#1e293b' }}>
                                      📄 {resume.originalName}
                                    </Text>
                                    <div style={{ marginTop: 4 }}>
                                      <Text style={{ fontSize: 12, color: '#64748b' }}>
                                        上传时间: {new Date(resume.uploadTime).toLocaleString('zh-CN')}
                                      </Text>
                                    </div>
                                  </div>
                                  {selectedResume?.id === resume.id && (
                                    <div style={{ color: selectedCategory.color, fontSize: 16, fontWeight: 'bold' }}>
                                      ✓
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div style={{ 
                              padding: '16px', 
                              textAlign: 'center', 
                              color: '#64748b',
                              fontSize: 14,
                              fontStyle: 'italic'
                            }}>
                              暂无上传的简历
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  )}
                  
                  {/* 选中状态显示 */}
                  {selectedResume && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ marginTop: 8 }}
                    >
                      <Tag color={selectedCategory.color} style={{ fontSize: 12 }}>
                        ✓ 已选择: {selectedResume.originalName}
                      </Tag>
                    </motion.div>
                  )}
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