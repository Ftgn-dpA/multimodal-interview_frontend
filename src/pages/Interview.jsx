import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Input, 
  message, 
  Typography, 
  Space, 
  Divider,
  Progress,
  Alert,
  Layout,
  Menu
} from 'antd';
import { 
  PlayCircleOutlined, 
  StopOutlined, 
  SendOutlined,
  ReloadOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { interviewAPI } from '../api';
import { removeToken } from '../utils/auth';
import AudioRecorder from '../components/AudioRecorder';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;
const { Header, Content } = Layout;

const Interview = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getQuestion();
  }, []);

  const getQuestion = async () => {
    setLoading(true);
    try {
      const response = await interviewAPI.startInterview();
      setQuestion(response.data.question);
      setAnswer('');
      setAudioBlob(null);
      setFeedback(null);
      setScore(null);
    } catch (error) {
      let errorMessage = '获取题目失败';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      }
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAudioData = (blob) => {
    setAudioBlob(blob);
    // 这里可以将音频转换为文本，或者直接提交音频文件
    // 目前简化处理，用户需要手动输入文本
  };

  const handleSubmit = async () => {
    if (!answer.trim()) {
      message.error('请输入回答内容');
      return;
    }

    setSubmitting(true);
    try {
      const response = await interviewAPI.submitAnswer(question, answer);
      setScore(response.data.score);
      setFeedback(response.data.feedback);
      message.success('提交成功');
    } catch (error) {
      let errorMessage = '提交失败';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      }
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const menuItems = [
    {
      key: 'interview',
      icon: <PlayCircleOutlined />,
      label: '面试',
    },
    {
      key: 'history',
      icon: <HistoryOutlined />,
      label: '历史记录',
      onClick: () => navigate('/history'),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: '#fff',
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
          模拟面试系统
        </Title>
        <Space>
          <Menu
            mode="horizontal"
            items={menuItems}
            style={{ border: 'none' }}
          />
          <Button onClick={handleLogout}>退出登录</Button>
        </Space>
      </Header>

      <Content style={{ padding: '24px', background: '#f5f5f5' }}>
        <Card style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={2}>面试进行中</Title>
          </div>

          {/* 题目区域 */}
          <Card 
            title="面试题目" 
            extra={
              <Button 
                icon={<ReloadOutlined />} 
                onClick={getQuestion}
                loading={loading}
              >
                换题
              </Button>
            }
            style={{ marginBottom: 24 }}
          >
            <Paragraph style={{ fontSize: '16px', lineHeight: '1.6' }}>
              {question || '正在加载题目...'}
            </Paragraph>
          </Card>

          {/* 回答区域 */}
          <Card title="你的回答" style={{ marginBottom: 24 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Title level={5}>音频录制</Title>
                <AudioRecorder onAudioData={handleAudioData} />
              </div>
              
              <Divider />
              
              <div>
                <Title level={5}>文字回答</Title>
                <TextArea
                  rows={6}
                  placeholder="请输入你的回答..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  style={{ marginBottom: 16 }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSubmit}
                  loading={submitting}
                  disabled={!answer.trim()}
                  size="large"
                >
                  提交回答
                </Button>
              </div>
            </Space>
          </Card>

          {/* 反馈区域 */}
          {feedback && (
            <Card title="AI 反馈" style={{ marginBottom: 24 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Title level={5}>评分</Title>
                  <Progress
                    type="circle"
                    percent={score * 10}
                    format={(percent) => `${score}/10`}
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                </div>
                
                <div>
                  <Title level={5}>详细反馈</Title>
                  <Alert
                    message={feedback}
                    type="info"
                    showIcon
                    style={{ fontSize: '14px', lineHeight: '1.6' }}
                  />
                </div>
              </Space>
            </Card>
          )}
        </Card>
      </Content>
    </Layout>
  );
};

export default Interview; 