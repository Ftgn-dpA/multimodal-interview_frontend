import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Button, 
  Typography, 
  Space, 
  Layout,
  Menu,
  message,
  Progress,
  Tag,
  Row,
  Col,
  Divider,
  List,
  Statistic,
  Spin
} from 'antd';
import { 
  HistoryOutlined,
  DownloadOutlined,
  ArrowLeftOutlined,
  TrophyOutlined,
  BulbOutlined,
  TargetOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { removeToken } from '../utils/auth';
import { getInterviewRecord } from '../api';

const { Title, Text, Paragraph } = Typography;
const { Header, Content } = Layout;

// 能力雷达图组件（简化版，实际项目中可以使用ECharts等库）
const SkillRadarChart = ({ skillData }) => {
  // 确保skillData是对象且可以转换为数组
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
      console.error('处理技能数据失败:', e);
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
            <Progress 
              percent={skill.value} 
              size="small" 
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              style={{ flex: 1 }}
            />
            <div style={{ width: '50px', textAlign: 'right' }}>
              <Text type="secondary">{skill.value}%</Text>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// 关键问题定位组件
const KeyIssues = ({ issues }) => {
  // 确保issueList始终是数组
  let issueList = [];
  
  if (issues && Array.isArray(issues)) {
    issueList = issues;
  } else if (issues && typeof issues === 'object') {
    // 如果是对象，尝试提取数组
    issueList = issues.issues || issues.problems || [];
  } else {
    // 默认数据
    issueList = [
      { type: '回答结构', issue: '回答缺乏STAR结构', severity: 'high' },
      { type: '非语言沟通', issue: '眼神交流不足', severity: 'medium' },
      { type: '技术深度', issue: '技术细节描述不够深入', severity: 'medium' }
    ];
  }

  // 确保每个项目都有正确的结构
  issueList = issueList.map(item => ({
    type: item.type || '未知',
    issue: item.issue || item.problem || '未知问题',
    severity: item.severity || 'medium'
  }));

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'blue';
      default: return 'default';
    }
  };

  return (
    <Card title="关键问题定位" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <List
        dataSource={issueList}
        renderItem={(item, index) => (
          <List.Item>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
              <div style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                background: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {index + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Text strong>{item.type}</Text>
                  <Tag color={getSeverityColor(item.severity)}>
                    {item.severity === 'high' ? '严重' : item.severity === 'medium' ? '中等' : '轻微'}
                  </Tag>
                </div>
                <Text type="secondary">{item.issue}</Text>
              </div>
            </div>
          </List.Item>
        )}
      />
    </Card>
  );
};

// 改进建议组件
const ImprovementSuggestions = ({ suggestions }) => {
  // 确保suggestionList始终是数组
  let suggestionList = [];
  
  if (suggestions && Array.isArray(suggestions)) {
    suggestionList = suggestions;
  } else if (suggestions && typeof suggestions === 'object') {
    // 如果是对象，尝试提取数组
    suggestionList = suggestions.suggestions || suggestions.建议 || suggestions.advice || [];
  } else {
    // 默认数据
    suggestionList = [
      '使用STAR方法回答问题：情境(Situation)、任务(Task)、行动(Action)、结果(Result)',
      '增加眼神交流，保持适度的目光接触',
      '在回答技术问题时，提供具体的代码示例或技术细节',
      '练习结构化思维，先总结要点再详细展开',
      '准备一些具体的项目案例，展示实际解决问题的能力'
    ];
  }

  // 确保每个项目都是字符串
  suggestionList = suggestionList.map(item => 
    typeof item === 'string' ? item : String(item)
  );

  return (
    <Card title="改进建议" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <List
        dataSource={suggestionList}
        renderItem={(item, index) => (
          <List.Item>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <CheckCircleOutlined style={{ color: '#52c41a', marginTop: '2px' }} />
              <Text>{item}</Text>
            </div>
          </List.Item>
        )}
      />
    </Card>
  );
};

const AIReview = () => {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [interviewData, setInterviewData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (recordId) {
      loadInterviewData();
    }
  }, [recordId]);

  const loadInterviewData = async () => {
    try {
      setLoading(true);
      const response = await getInterviewRecord(recordId);
      setInterviewData(response.data);
    } catch (error) {
      console.error('加载面试数据失败:', error);
      setError('加载面试数据失败');
      message.error('加载面试数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const handleDownloadReport = () => {
    message.info('报告下载功能开发中...');
  };

  const menuItems = [
    {
      key: 'interview',
      icon: <HistoryOutlined />,
      label: '面试类型',
      onClick: () => navigate('/interview-types'),
    },
    {
      key: 'history',
      icon: <HistoryOutlined />,
      label: '历史记录',
      onClick: () => navigate('/history'),
    },
  ];

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <TrophyOutlined style={{ color: '#f59e0b', fontSize: 28, marginRight: 12 }} />
            <Title level={3} style={{ margin: 0, color: '#1e293b', fontWeight: 700 }}>AI面试点评</Title>
          </div>
        </Header>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: 'calc(100vh - 64px)'
        }}>
          <Spin size="large" />
          <Text style={{ marginLeft: '16px' }}>正在生成AI点评...</Text>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <TrophyOutlined style={{ color: '#f59e0b', fontSize: 28, marginRight: 12 }} />
            <Title level={3} style={{ margin: 0, color: '#1e293b', fontWeight: 700 }}>AI面试点评</Title>
          </div>
        </Header>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: 'calc(100vh - 64px)',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <Text type="danger">{error}</Text>
          <Button type="primary" size="large" icon={<ArrowLeftOutlined />} onClick={() => navigate('/interview-types')} style={{ borderRadius: 12, height: 48, fontSize: 16 }}>返回面试类型</Button>
        </div>
      </Layout>
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
    <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: '#fff',
        padding: '0 32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        borderBottom: '1px solid #e2e8f0',
        height: 64
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <TrophyOutlined style={{ color: '#f59e0b', fontSize: 28 }} />
          <Title level={3} style={{ margin: 0, color: '#1e293b', fontWeight: 700 }}>AI面试点评</Title>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button
            type="text"
            icon={<HistoryOutlined />}
            onClick={() => navigate('/history')}
            style={{
              height: 40,
              padding: '0 20px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              color: '#64748b',
              border: '1px solid #e2e8f0',
              background: '#fff',
              transition: 'all 0.3s ease',
              minWidth: 100
            }}
          >
            历史记录
          </Button>
          <Button
            danger
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{
              height: 40,
              padding: '0 24px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              border: 'none',
              boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
              transition: 'all 0.3s ease',
              minWidth: 100
            }}
          >
            退出登录
          </Button>
        </div>
      </Header>

      <Content style={{ padding: '32px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* 页面标题 */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <Title level={2} style={{ color: '#1e293b', marginBottom: '16px' }}>
              <TrophyOutlined style={{ color: '#f59e0b', marginRight: '12px' }} />
              面试表现分析
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              基于AI深度分析的面试表现评估报告
            </Text>
          </div>

          {/* 面试基本信息 */}
          {interviewData && (
            <Card style={{ 
              borderRadius: '16px', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              marginBottom: '24px',
              border: '1px solid #e2e8f0',
              background: '#fff'
            }}>
              <Row gutter={24}>
                <Col span={6}>
                  <Statistic
                    title="总体评分"
                    value={interviewData.overallScore || 0}
                    suffix="/ 100"
                    valueStyle={{ color: '#3b82f6' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="面试岗位"
                    value={interviewData.position || '未知'}
                    valueStyle={{ color: '#10b981' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="面试时长"
                    value={interviewData.duration || 0}
                    suffix="分钟"
                    valueStyle={{ color: '#f59e0b' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="AI模型"
                    value={interviewData.aiModel || 'GPT-4'}
                    valueStyle={{ color: '#8b5cf6' }}
                  />
                </Col>
              </Row>
            </Card>
          )}

          {/* 总体反馈 */}
          {interviewData?.overallFeedback && (
            <Card 
              title={<span style={{ fontWeight: 600, color: '#1e293b' }}>总体反馈</span>} 
              style={{ 
                borderRadius: '16px', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                marginBottom: '24px',
                border: '1px solid #e2e8f0',
                background: '#fff'
              }}
            >
              <Paragraph style={{ fontSize: '16px', lineHeight: '1.6', color: '#334155' }}>
                {interviewData.overallFeedback}
              </Paragraph>
            </Card>
          )}

          {/* 主要内容区域 */}
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <SkillRadarChart skillData={skillData} />
            </Col>
            <Col xs={24} lg={12}>
              <KeyIssues issues={issues} />
            </Col>
          </Row>

          <div style={{ marginTop: '24px' }}>
            <ImprovementSuggestions suggestions={issues?.建议} />
          </div>

          {/* 操作按钮 */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: '40px',
            padding: '24px',
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'center',
            gap: '32px'
          }}>
            <Button
              size="large"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/interview-types')}
              style={{ 
                height: '48px', 
                padding: '0 32px',
                borderRadius: '12px',
                fontSize: 16,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                fontWeight: 500,
                transition: 'all 0.3s',
                minWidth: 160
              }}
            >
              返回面试类型
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<DownloadOutlined />}
              onClick={handleDownloadReport}
              style={{ 
                height: '48px', 
                padding: '0 32px',
                borderRadius: '12px',
                fontSize: 16,
                minWidth: 160
              }}
            >
              下载完整报告
            </Button>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default AIReview; 