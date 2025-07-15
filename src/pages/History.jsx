import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInterviewHistory, getInterviewRecord, deleteInterviewRecord } from '../api';
import { removeToken } from '../utils/auth';
import { showToast } from '../utils/toast';
import Toast from '../components/ui/Toast';
import Modal from '../components/ui/Modal';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Tag from '../components/ui/Tag';
import { Title, Text, Paragraph } from '../components/ui/Typography';
import Progress from '../components/ui/Progress';
import { motion } from 'framer-motion';

const CustomDeleteModal = ({ visible, onConfirm, onCancel, record }) => {
  if (!visible) return null;
  return (
    <Modal
      visible={visible}
      title={null}
      onOk={onConfirm}
      onCancel={onCancel}
      okText="删除"
      cancelText="取消"
    >
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 32, color: '#ef4444', marginBottom: 8 }}>🗑️</span>
        <Title level={4} style={{ color: '#ef4444', margin: 0 }}>确认删除</Title>
      </div>
      <Text style={{ fontSize: 16, color: '#475569' }}>
        确定要删除"${record?.position || '该岗位'}的面试记录吗？<br/>此操作不可恢复。
      </Text>
    </Modal>
  );
};

const History = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

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

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await getInterviewHistory();
      const recordsData = response.data;
      if (Array.isArray(recordsData)) {
        setRecords(recordsData);
      } else if (recordsData && Array.isArray(recordsData.records)) {
        setRecords(recordsData.records);
      } else {
        setRecords([]);
      }
    } catch (error) {
      showToast('获取历史记录失败', 'error');
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

  const handleViewDetail = (record) => {
    navigate(`/ai-review/${record.id}`);
  };

  const formatDurationFull = (startTime, endTime) => {
    if (!startTime || !endTime) return '';
    const seconds = Math.floor((new Date(endTime) - new Date(startTime)) / 1000);
    if (isNaN(seconds) || seconds < 0) return '';
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '未知';
    return new Date(dateTime).toLocaleString('zh-CN');
  };

  // 删除面试记录
  const handleDeleteRecord = (record) => {
    setDeleteRecord(record);
    setDeleteModalVisible(true);
  };

  const confirmDeleteRecord = async () => {
    if (!deleteRecord) return;
    try {
      await deleteInterviewRecord(deleteRecord.id);
      showToast('删除成功', 'success');
      fetchHistory();
    } catch (error) {
      showToast('删除失败', 'error');
    } finally {
      setDeleteModalVisible(false);
      setDeleteRecord(null);
    }
  };

  const cancelDeleteRecord = () => {
    setDeleteModalVisible(false);
    setDeleteRecord(null);
  };

  // 菜单项点击
  const handleMenuAction = (key, record) => {
    if (key === 'video') {
      setVideoPreviewUrl(record.videoFilePath);
    } else if (key === 'detail') {
      handleViewDetail(record);
    } else if (key === 'delete') {
      handleDeleteRecord(record);
    }
    setOpenMenuId(null);
  };

  // 自定义下拉菜单
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
        style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', cursor: 'pointer', color: '#2563eb', fontWeight: 500, fontSize: 14, borderRadius: 6 }}
        onClick={() => handleMenuAction('detail', record)}
        onMouseEnter={e => e.currentTarget.style.background = '#f0f6ff'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <span style={{ fontSize: 18 }}>👁️</span> 详情
      </li>
      {record.videoFilePath && (
        <li
          style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', cursor: 'pointer', color: '#334155', fontSize: 14, borderRadius: 6 }}
          onClick={() => handleMenuAction('video', record)}
          onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{ fontSize: 18 }}>▶️</span> 视频
        </li>
      )}
      <li style={{ height: 1, background: '#f1f5f9', margin: '2px 0' }} />
      <li
        style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', cursor: 'pointer', color: '#ef4444', fontWeight: 500, fontSize: 14, borderRadius: 6 }}
        onClick={() => handleMenuAction('delete', record)}
        onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <span style={{ fontSize: 18 }}>🗑️</span> 删除
      </li>
    </ul>
  );

  // 能力评估渲染
  const renderSkillRadar = (skillAssessment) => {
    if (!skillAssessment) return null;
    try {
      const skills = JSON.parse(skillAssessment);
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
                <Progress percent={score} color={score >= 80 ? '#22c55e' : score >= 60 ? '#faad14' : '#ef4444'} showInfo={false} />
              </div>
            ))}
          </div>
        );
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  // 改进建议渲染
  const renderImprovementSuggestions = (suggestions) => {
    if (!suggestions) return null;
    try {
      const data = JSON.parse(suggestions);
      let suggestionsList = [];
      if (data.建议 && Array.isArray(data.建议)) {
        suggestionsList = data.建议;
      } else if (data.suggestions && Array.isArray(data.suggestions)) {
        suggestionsList = data.suggestions;
      } else if (data.advice && Array.isArray(data.advice)) {
        suggestionsList = data.advice;
      } else if (Array.isArray(data)) {
        suggestionsList = data;
      } else {
        suggestionsList = [];
      }
      suggestionsList = suggestionsList.map(item => typeof item === 'string' ? item : String(item));
      if (suggestionsList.length === 0) return null;
      return (
        <div style={{ marginTop: '16px' }}>
          <Title level={5}>改进建议</Title>
          <ul style={{ paddingLeft: 18 }}>
            {suggestionsList.map((item, index) => (
              <li key={index} style={{ color: '#475569', fontSize: 15, marginBottom: 4 }}>{index + 1}. {item}</li>
            ))}
          </ul>
        </div>
      );
    } catch (e) {
      return null;
    }
  };

  return (
    <div className="history-root" style={{ minHeight: '100vh', background: 'transparent' }}>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
      {loading && <Loading />}
      <div className="history-header" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#fff', padding: '0 32px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderBottom: '1px solid #e2e8f0', height: '64px', overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', color: '#fff'
          }}>
            <span role="img" aria-label="history">🕑</span>
          </div>
          <Title level={3} style={{ margin: 0 }}>面试历史记录</Title>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button type="text" onClick={handleBackToInterviewTypes}>⬅️ 返回</Button>
          <Button danger onClick={handleLogout}>退出登录</Button>
        </div>
      </div>
      <div className="history-content" style={{ padding: '24px' }}>
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ maxWidth: 1200, margin: '0 auto' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Title level={2}>我的面试记录</Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              查看您的面试历史和AI评测报告
            </Text>
          </div>
          {records.length === 0 ? (
            <EmptyState text="暂无面试记录" buttonText="开始第一次面试" onButtonClick={() => navigate('/interview-types')} />
          ) : (
            <div>
              {records.map((record, idx) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.08 * idx }}
                  style={{ marginBottom: 24 }}
                >
                  <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <Title level={4} style={{ margin: 0 }}>{record.position}</Title>
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
                          <span style={{ fontSize: 18, color: '#475569' }}>⋯</span>
                        </button>
                        {openMenuId === record.id && renderCustomMenu(record)}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px', color: '#64748b' }}>⏰</span>
                        <div>
                          <Text style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>开始时间</Text>
                          <Text style={{ fontSize: '14px', color: '#475569', fontWeight: 500 }}>
                            {formatDateTime(record.startTime)}
                          </Text>
                        </div>
                      </div>
                      {record.duration && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px', color: '#64748b' }}>⏰</span>
                          <div>
                            <Text style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>面试时长</Text>
                            <Text style={{ fontSize: '14px', color: '#475569', fontWeight: 500 }}>
                              {formatDurationFull(record.startTime, record.endTime)}
                            </Text>
                          </div>
                        </div>
                      )}
                      {record.overallScore && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px', color: '#f59e0b' }}>🏆</span>
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
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
        <CustomDeleteModal
          visible={deleteModalVisible}
          onConfirm={confirmDeleteRecord}
          onCancel={cancelDeleteRecord}
          record={deleteRecord}
        />
        {/* 视频预览弹窗 */}
        {videoPreviewUrl && (
          <div
            style={{
              position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh',
              background: 'rgba(0,0,0,0.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            onClick={() => setVideoPreviewUrl(null)}
          >
            <div
              style={{ background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', minWidth: 360, maxWidth: '90vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12, color: '#334155' }}>面试视频回放</div>
              <video src={videoPreviewUrl} controls style={{ width: 480, maxWidth: '80vw', maxHeight: '60vh', borderRadius: 8, background: '#000' }} />
              <button
                onClick={() => setVideoPreviewUrl(null)}
                style={{ marginTop: 18, padding: '6px 28px', borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', fontWeight: 500, fontSize: 15, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.08)' }}
              >关闭</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;