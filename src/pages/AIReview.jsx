import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { removeToken } from '../utils/auth';
import { getInterviewRecord } from '../api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Tag from '../components/ui/Tag';
import { Title, Text, Paragraph } from '../components/ui/Typography';
import Toast from '../components/ui/Toast';
import Loading from '../components/ui/Loading';
import { BgEffectContext } from '../App';

// 能力雷达图组件（自定义进度条）
const SkillRadarChart = ({ skillData }) => {
  let skills = [];
  if (skillData && typeof skillData === 'object') {
    try {
      skills = [
        { name: '技术能力', value: skillData?.技术能力 || skillData?.technical || 0 },
        { name: '沟通能力', value: skillData?.沟通能力 || skillData?.communication || 0 },
        { name: '问题解决', value: skillData?.问题解决 || skillData?.problemSolving || 0 },
        { name: '学习能力', value: skillData?.学习能力 || skillData?.learning || 0 },
        { name: '团队协作', value: skillData?.团队协作 || skillData?.teamwork || 0 },
        { name: '创新思维', value: skillData?.创新思维 || skillData?.innovation || 0 }
      ];
    } catch (e) {
      skills = [];
    }
  }
  if (skills.length === 0) {
    return (
      <Card title="能力雷达图" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          暂无技能评估数据
        </div>
      </Card>
    );
  }
  return (
    <Card title="能力雷达图" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {skills.map((skill, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '100px', textAlign: 'right' }}>
              <Text strong>{skill.name}</Text>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ height: 10, background: '#e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${skill.value}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6 0%, #22d3ee 100%)', transition: 'width 0.4s' }} />
              </div>
            </div>
            <div style={{ width: '50px', textAlign: 'right' }}>
              <Text type="secondary">{skill.value}%</Text>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// 关键问题定位组件（自定义列表）
const KeyIssues = ({ issues }) => {
  let issueList = [];
  if (issues && Array.isArray(issues)) {
    issueList = issues;
  } else if (issues && typeof issues === 'object') {
    issueList = issues.issues || issues.problems || [];
  } else {
    issueList = [
      { type: '回答结构', issue: '回答缺乏STAR结构', severity: 'high' },
      { type: '非语言沟通', issue: '眼神交流不足', severity: 'medium' },
      { type: '技术深度', issue: '技术细节描述不够深入', severity: 'medium' }
    ];
  }
  issueList = issueList.map(item => ({
    type: item.type || '未知',
    issue: item.issue || item.problem || '未知问题',
    severity: item.severity || 'medium'
  }));
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#3b82f6';
      default: return '#64748b';
    }
  };
  return (
    <Card title="关键问题定位" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {issueList.map((item, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold' }}>{index + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Text strong>{item.type}</Text>
                <Tag color={getSeverityColor(item.severity)}>
                  {item.severity === 'high' ? '严重' : item.severity === 'medium' ? '中等' : '轻微'}
                </Tag>
              </div>
              <Text type="secondary">{item.issue}</Text>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// 改进建议组件（自定义列表）
const ImprovementSuggestions = ({ suggestions }) => {
  let suggestionList = [];
  if (suggestions && Array.isArray(suggestions)) {
    suggestionList = suggestions;
  } else if (suggestions && typeof suggestions === 'object') {
    suggestionList = suggestions.suggestions || suggestions.建议 || suggestions.advice || [];
  } else {
    suggestionList = [
      '使用STAR方法回答问题：情境(Situation)、任务(Task)、行动(Action)、结果(Result)',
      '增加眼神交流，保持适度的目光接触',
      '在回答技术问题时，提供具体的代码示例或技术细节',
      '练习结构化思维，先总结要点再详细展开',
      '准备一些具体的项目案例，展示实际解决问题的能力'
    ];
  }
  suggestionList = suggestionList.map(item => typeof item === 'string' ? item : String(item));
  return (
    <Card title="改进建议" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {suggestionList.map((item, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <Tag color="#22c55e">✔</Tag>
            <Text>{item}</Text>
          </div>
        ))}
      </div>
    </Card>
  );
};

// 工具函数：格式化时长
const formatDuration = (startTime, endTime, currentTime = new Date(), actualDuration = null) => {
  // 优先使用传递的实际面试时长
  if (actualDuration !== null && actualDuration > 0) {
    const h = Math.floor(actualDuration / 3600);
    const m = Math.floor((actualDuration % 3600) / 60);
    const s = actualDuration % 60;
    
    let result = '';
    if (h > 0) {
      result = `${h}小时${m}分${s}秒`;
    } else if (m > 0) {
      result = `${m}分${s}秒`;
    } else {
      result = `${s}秒`;
    }
    
    return result;
  }
  
  // 如果没有传递时长，则使用后端时间计算
  if (!startTime) {
    return '未知';
  }
  
  try {
    // 确保开始时间格式正确
    const start = new Date(startTime);
    
    if (isNaN(start.getTime())) {
      return '未知';
    }
    
    // 如果没有结束时间，使用传入的当前时间或当前时间
    const end = endTime ? new Date(endTime) : currentTime;
    
    if (isNaN(end.getTime())) {
      return '未知';
    }
    
    const seconds = Math.floor((end - start) / 1000);
    
    if (seconds < 0) {
      return '未知';
    }
    
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    let result = '';
    if (h > 0) {
      result = `${h}小时${m}分${s}秒`;
    } else if (m > 0) {
      result = `${m}分${s}秒`;
    } else {
      result = `${s}秒`;
    }
    
    // 如果没有结束时间，添加标识
    if (!endTime) {
      result += ' (进行中)';
    }
    
    return result;
  } catch (error) {
    console.error('格式化时长时出错:', error);
    return '未知';
  }
};

const AIReview = () => {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [interviewData, setInterviewData] = useState(null);
  const [error, setError] = useState(null);
  // Toast本地state
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  // 本地showToast函数
  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
  };
  const { resetColors } = useContext(BgEffectContext);
  
  // 新增：从URL参数获取面试时长
  const urlDuration = searchParams.get('duration');
  const [actualDuration, setActualDuration] = useState(urlDuration ? parseInt(urlDuration) : null);
  
  // 新增：实时更新面试时长的状态
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (recordId) {
      loadInterviewData();
    }
  }, [recordId]);

  // 新增：实时更新当前时间，用于计算进行中的面试时长
  useEffect(() => {
    // 如果面试没有结束时间，说明还在进行中，需要实时更新
    // 但如果有传递的时长，则不需要实时更新
    if (interviewData && !interviewData.endTime && !actualDuration) {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [interviewData?.endTime, actualDuration]);

  const loadInterviewData = async () => {
    try {
      setLoading(true);
      const response = await getInterviewRecord(recordId);
      console.log('后端返回的面试数据:', response.data);
      console.log('后端返回的actualDuration:', response.data?.actualDuration);
      setInterviewData(response.data);
      
      // 使用后端返回的时长数据
      if (response.data?.actualDuration) {
        setActualDuration(response.data.actualDuration);
        console.log('使用后端返回的actualDuration:', response.data.actualDuration);
      } else if (urlDuration) {
        setActualDuration(parseInt(urlDuration));
        console.log('使用URL参数中的duration:', urlDuration);
      }
    } catch (error) {
      console.error('加载面试数据失败:', error);
      setError('加载面试数据失败');
      showToast('加载面试数据失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const menuItems = [
    {
      key: 'interview',
      icon: '⬅️',
      label: '面试类型',
      onClick: () => navigate('/interview-types'),
    },
    {
      key: 'history',
      icon: '⬅️',
      label: '历史记录',
      onClick: () => navigate('/history'),
    },
  ];

  if (loading) {
    return <Loading text="正在生成AI点评..." />;
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Text type="danger" style={{ fontSize: 18, marginBottom: 24 }}>{error}</Text>
        <Button type="primary" size="large" onClick={() => {
          resetColors();
          navigate('/interview-types');
        }} style={{ borderRadius: 12, height: 48, fontSize: 16, minWidth: 160 }}>返回面试类型</Button>
      </div>
    );
  }

  // 解析JSON数据
  let skillData = {};
  let issues = {};
  
  try {
    if (interviewData?.skillAssessment) {
      skillData = JSON.parse(interviewData.skillAssessment);
    }
  } catch (e) {
    console.error('解析技能评估数据失败:', e);
    skillData = {};
  }
  
  try {
    if (interviewData?.improvementSuggestions) {
      issues = JSON.parse(interviewData.improvementSuggestions);
    }
  } catch (e) {
    console.error('解析改进建议数据失败:', e);
    issues = {};
  }

  return (
    <div className="glass-effect" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
          }
        `}
      </style>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
      <Card id="ai-review-main-card" style={{ maxWidth: 1200, padding: '32px', margin: '40px auto' }}>
        {/* 页面标题 */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
          <Title level={2} style={{ color: '#1e293b', marginBottom: '16px' }}>
            面试表现分析
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            基于AI深度分析的面试表现评估报告
          </Text>
        </div>

        {/* 面试基本信息 */}
        {interviewData && (
          <Card style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', marginBottom: '24px', border: '1px solid #e2e8f0', background: '#fff' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32 }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ color: '#64748b', fontSize: 15, marginBottom: 6 }}>总体评分</div>
                <div style={{ color: '#3b82f6', fontWeight: 700, fontSize: 28 }}>{interviewData.overallScore || 0} <span style={{ fontSize: 16, color: '#64748b', fontWeight: 400 }}>/ 100</span></div>
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ color: '#64748b', fontSize: 15, marginBottom: 6 }}>面试岗位</div>
                <div style={{ color: '#10b981', fontWeight: 700, fontSize: 22 }}>{interviewData.position || '未知'}</div>
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ color: '#64748b', fontSize: 15, marginBottom: 6 }}>面试时长</div>
                <div style={{ 
                  color: '#f59e0b', 
                  fontWeight: 700, 
                  fontSize: 22,
                  animation: (!interviewData?.endTime && !actualDuration) ? 'pulse 2s infinite' : 'none'
                }}>
                  {formatDuration(interviewData?.startTime, interviewData?.endTime, currentTime, actualDuration)}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ color: '#64748b', fontSize: 15, marginBottom: 6 }}>面试状态</div>
                <div style={{ 
                  color: (interviewData?.endTime || actualDuration) ? '#10b981' : '#f59e0b', 
                  fontWeight: 700, 
                  fontSize: 20 
                }}>
                  {(interviewData?.endTime || actualDuration) ? '已完成' : '进行中'}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ color: '#64748b', fontSize: 15, marginBottom: 6 }}>AI模型</div>
                <div style={{ color: '#8b5cf6', fontWeight: 700, fontSize: 20 }}>{interviewData.aiModel || 'GPT-4'}</div>
              </div>
            </div>
          </Card>
        )}

        {/* 总体反馈 */}
        {interviewData?.overallFeedback && (
          <Card title={<span style={{ fontWeight: 600, color: '#1e293b' }}>总体反馈</span>} style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', marginBottom: '24px', border: '1px solid #e2e8f0', background: '#fff' }}>
            <Paragraph style={{ fontSize: '16px', lineHeight: '1.6', color: '#334155' }}>
              {interviewData.overallFeedback}
            </Paragraph>
          </Card>
        )}

        {/* 主要内容区域 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
          <div style={{ flex: 1, minWidth: 320 }}>
            <SkillRadarChart skillData={skillData} />
          </div>
          <div style={{ flex: 1, minWidth: 320 }}>
            <KeyIssues issues={issues} />
          </div>
        </div>

        <div style={{ marginTop: '24px' }}>
          <ImprovementSuggestions suggestions={issues?.建议} />
        </div>

        {/* 操作按钮 */}
        <div style={{ textAlign: 'center', marginTop: '40px', padding: '24px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'center', gap: '32px' }}>
          <Button size="large" onClick={() => {
            resetColors();
            navigate('/interview-types');
          }} style={{ height: '48px', padding: '0 32px', borderRadius: '12px', fontSize: 16, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 500, transition: 'all 0.3s', minWidth: 160 }}>
            返回主页
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AIReview; 