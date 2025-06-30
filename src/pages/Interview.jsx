import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getInterviewRecord, startInterview, endInterview } from '../api';
import Toast from '../components/ui/Toast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Tag from '../components/ui/Tag';
import { Title, Text, Paragraph } from '../components/ui/Typography';
import Loading from '../components/ui/Loading';
import { removeToken } from '../utils/auth';

const Interview = () => {
  const navigate = useNavigate();
  const { type } = useParams();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const [question, setQuestion] = useState('');
  const [recordId, setRecordId] = useState(null);
  const [interviewInfo, setInterviewInfo] = useState(null);
  const [answer, setAnswer] = useState('');
  const [step, setStep] = useState(1); // 1:答题 3:报告
  const [report, setReport] = useState(null);

  useEffect(() => {
    handleStartInterview();
    // eslint-disable-next-line
  }, [type]);

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
  };

  const handleStartInterview = async () => {
    setLoading(true);
    try {
      const res = await startInterview(type);
      setQuestion(res.data.question);
      setRecordId(res.data.recordId);
      setInterviewInfo({ position: res.data.position, aiModel: res.data.aiModel });
      setStep(1);
    } catch (e) {
      showToast('启动面试失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEndInterview = async () => {
    setLoading(true);
    try {
      const res = await endInterview(recordId);
      setReport(res.data);
      setStep(3);
      showToast('面试已结束', 'success');
    } catch (e) {
      showToast('结束面试失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, visible: false })} />
      {loading && <Loading />}
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
            <span role="img" aria-label="robot">🤖</span>
          </div>
          <Title level={3} style={{ margin: 0 }}>AI面试模拟器</Title>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button type="text" onClick={() => navigate('/interview-types')}>⬅️ 返回岗位选择</Button>
          <Button danger onClick={handleLogout}>退出登录</Button>
        </div>
      </div>
      {/* 内容区域 */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: 'calc(100vh - 64px)', padding: '40px 0' }}>
        <div style={{ width: '100%', maxWidth: 540 }}>
          <Card style={{ borderRadius: 18, boxShadow: '0 4px 20px rgba(0,0,0,0.10)', border: '1.5px solid #e2e8f0', padding: 0 }}>
            <div style={{ padding: '32px 32px 24px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <span style={{ fontSize: 28, color: '#3b82f6' }}>🤖</span>
                <Title level={4} style={{ margin: 0 }}>{interviewInfo?.position || 'AI面试'}</Title>
                <Tag color="#3b82f6">AI</Tag>
              </div>
              {step === 1 && (
                <>
                  <Text strong style={{ fontSize: 16 }}>面试问题：</Text>
                  <Paragraph style={{ fontSize: 16, margin: '12px 0 24px 0' }}>{question}</Paragraph>
                  <textarea
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    placeholder="请在此输入你的答案..."
                    style={{ width: '100%', minHeight: 100, borderRadius: 8, border: '1px solid #e2e8f0', padding: 12, fontSize: 15, marginBottom: 18, resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                    <Button type="primary" onClick={handleEndInterview}>提交并结束面试</Button>
                    <Button type="text" onClick={() => navigate('/interview-types')}>返回岗位选择</Button>
                  </div>
                </>
              )}
              {step === 3 && report && (
                <>
                  <Title level={4} style={{ margin: '18px 0 8px 0' }}>面试报告</Title>
                  <Text strong>总体评分：</Text>
                  <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: 18, marginLeft: 8 }}>{report.overallScore}分</span>
                  <Paragraph style={{ marginTop: 12 }}>{report.overallFeedback}</Paragraph>
                  <Button type="primary" onClick={() => navigate('/history')} style={{ marginTop: 24 }}>查看历史记录</Button>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Interview; 