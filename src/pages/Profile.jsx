import React, { useEffect, useState, useRef } from 'react';
import axios from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Title, Text } from '../components/ui/Typography';
import Toast from '../components/ui/Toast';
import EmptyState from '../components/ui/EmptyState';
import { motion } from 'framer-motion';
import Modal from '../components/ui/Modal';
import { DownloadOutlined, DeleteOutlined, CloseCircleFilled } from '@ant-design/icons';


const Profile = () => {
  const [resumes, setResumes] = useState([]);
  const [file, setFile] = useState(null);
  const [username, setUsername] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const [previewResume, setPreviewResume] = useState(null); // {id, originalName}
  const fileInputRef = useRef();
  const [loading, setLoading] = useState(true);


  // 获取当前登录用户名
  const fetchUsername = async () => {
    try {
      const res = await axios.get('/auth/me');
      setUsername(res.data.username);
    } catch (e) {
      setUsername('');
    }
  };

  const fetchResumes = async () => {
    setLoading(true);
    const res = await axios.get('/resume/list');
    setResumes(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsername();
    fetchResumes();
  }, []);

  // 修改 handleFileChange，选择后立即校验格式
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.toLowerCase().endsWith('.pdf') || selected.type !== 'application/pdf') {
        setToast({ visible: true, message: '只能选择PDF格式的文件', type: 'error' });
        if (fileInputRef.current) fileInputRef.current.value = null;
        return;
      }
      setFile(selected);
    }
    // 如果没选文件（取消），不做任何操作，保留原有 file
  };

  const handleUpload = async () => {
    if (!file) {
      setToast({ visible: true, message: '请先选择要上传的PDF文件', type: 'error' });
      return;
    }
    if (!file.name.toLowerCase().endsWith('.pdf') || file.type !== 'application/pdf') {
      setToast({ visible: true, message: '只能上传PDF格式的文件', type: 'error' });
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await axios.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = null;
      setToast({ visible: true, message: '上传成功', type: 'success' });
      fetchResumes();
    } catch (e) {
      setToast({ visible: true, message: '上传失败', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/resume/${id}`);
      setToast({ visible: true, message: '删除成功', type: 'success' });
      fetchResumes();
    } catch (e) {
      setToast({ visible: true, message: '删除失败', type: 'error' });
    }
  };

  // 在Profile组件内添加handleDownload函数
  const handleDownload = async (resumeId, fileName) => {
    const token = localStorage.getItem('interview_token');
    const res = await fetch(`/api/resume/download/${resumeId}`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    if (!res.ok) {
      setToast({ visible: true, message: '下载失败', type: 'error' });
      return;
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'resume.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };


  return (
    <motion.div
      style={{ maxWidth: 600, margin: '0 auto', padding: '40px 0' }}
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <Card style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Title level={2}>个人中心</Title>
          <Button type="primary" onClick={() => navigate('/interview-types')}>返回主页</Button>
        </div>
        <div style={{ marginBottom: 18 }}>
          <Text strong>用户名：</Text>
          <Text>{username || '加载中...'}</Text>
        </div>
      </Card>
      <Card style={{ marginBottom: 32 }}>
        <Title level={4} style={{ marginBottom: 12 }}>上传简历</Title>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* 隐藏原生 input */}
            <input
              type="file"
              accept=".pdf"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <Button
              type="primary"
              style={{ borderRadius: 8, fontWeight: 500, minWidth: 120 }}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              选择文件
            </Button>
            {/* 显示已选文件名 */}
            <span style={{ color: file ? '#3b82f6' : '#64748b', minWidth: 120, fontSize: 15, display: 'flex', alignItems: 'center', gap: 4 }}>
              {file ? (
                <>
                  {file.name}
                  <span
                    style={{ display: 'flex', alignItems: 'center', marginLeft: 4 }}
                    title="移除已选文件"
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = null;
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.firstChild.style.transform = 'scale(1.25)';
                      e.currentTarget.firstChild.style.filter = 'drop-shadow(0 2px 6px #ef4444aa)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.firstChild.style.transform = '';
                      e.currentTarget.firstChild.style.filter = '';
                    }}
                  >
                    {/* 纯红色叉，无圆底，hover有动效 */}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transition: 'all 0.18s' }}>
                      <path d="M4 4l8 8M12 4l-8 8" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </span>
                </>
              ) : '未选择文件'}
            </span>
          </div>
          <Button
            type="primary"
            onClick={handleUpload}
            disabled={uploading}
            style={{ minWidth: 120, borderRadius: 8, fontWeight: 500 }}
          >
            {uploading ? '上传中...' : '上传简历'}
          </Button>
        </div>
      </Card>
      <Card>
        <Title level={4} style={{ marginBottom: 12 }}>我的简历</Title>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <span style={{ color: '#3b82f6', fontSize: 18 }}>简历加载中...</span>
          </div>
        ) : resumes.length === 0 ? (
          <EmptyState text="暂无简历" />
        ) : (
          <motion.ul
            style={{ padding: 0, margin: 0, listStyle: 'none' }}
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.07 } },
            }}
          >
            {resumes.map(r => (
              <motion.li
                key={r.id}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <div>
                  <Text strong>{r.originalName}</Text>
                  <Text type="secondary" style={{ marginLeft: 12 }}>{new Date(r.uploadTime).toLocaleString()}</Text>
                </div>
                <div style={{ display: 'flex', gap: 18 }}>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    style={{ borderRadius: 8, fontWeight: 500, transition: 'all 0.2s' }}
                    onClick={() => handleDownload(r.id, r.originalName)}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px #3b82f633'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
                  >
                    下载
                  </Button>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    style={{ borderRadius: 8, fontWeight: 500, transition: 'all 0.2s' }}
                    onClick={() => handleDelete(r.id)}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px #ef444433'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
                  >
                    删除
                  </Button>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </Card>
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={() => setToast(t => ({ ...t, visible: false }))}
      />
    </motion.div>
  );
};

export default Profile; 