import React from 'react';
import { Card, Button, Typography, Layout } from 'antd';
import { VideoCameraOutlined, AudioOutlined, SettingOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Header, Content } = Layout;

const Demo = () => {
  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header style={{ 
        background: '#fff',
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
          界面演示
        </Title>
      </Header>

      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <Title level={2} style={{ 
            color: '#1890ff', 
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            面试类型选择
          </Title>
          
          <Card
            hoverable
            style={{ 
              borderRadius: '12px',
              border: '1px solid #e8e8e8',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              background: '#fff',
              transition: 'all 0.3s ease'
            }}
            bodyStyle={{ padding: '32px', textAlign: 'center' }}
          >
            <VideoCameraOutlined style={{ fontSize: '64px', color: '#1890ff', marginBottom: '32px' }} />
            
            <Title level={2} style={{ 
              marginBottom: '24px',
              color: '#1890ff'
            }}>
              视频面试
            </Title>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '16px',
              marginBottom: '32px'
            }}>
              <div style={{ 
                padding: '16px',
                borderRadius: '8px',
                background: '#f8f9fa',
                border: '1px solid #e9ecef'
              }}>
                <AudioOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '8px' }} />
                <div style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>
                  AI语音提问
                </div>
              </div>
              <div style={{ 
                padding: '16px',
                borderRadius: '8px',
                background: '#f8f9fa',
                border: '1px solid #e9ecef'
              }}>
                <VideoCameraOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '8px' }} />
                <div style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>
                  实时视频对话
                </div>
              </div>
              <div style={{ 
                padding: '16px',
                borderRadius: '8px',
                background: '#f8f9fa',
                border: '1px solid #e9ecef'
              }}>
                <SettingOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '8px' }} />
                <div style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>
                  字幕开关
                </div>
              </div>
            </div>

            <Button
              type="primary"
              size="large"
              block
              style={{ 
                backgroundColor: '#1890ff',
                borderColor: '#1890ff',
                borderRadius: '8px',
                height: '48px',
                fontSize: '16px'
              }}
            >
              开始面试
            </Button>
          </Card>
        </div>
      </Content>
    </Layout>
  );
};

export default Demo; 