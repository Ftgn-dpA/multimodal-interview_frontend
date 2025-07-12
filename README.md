# 前端详细说明文档

## 📁 文件结构说明

### 核心文件
- **App.jsx**: React主应用组件，路由配置
- **index.js**: 应用入口文件
- **index.css**: 全局样式文件

### 页面组件 (pages/)
- **Login.jsx**: 用户登录页面
- **Register.jsx**: 用户注册页面
- **InterviewTypes.jsx**: 面试类型选择页面
- **Interview.jsx**: 面试页面（集成虚拟人）
- **AIReview.jsx**: AI点评页面
- **History.jsx**: 历史记录页面
- **DeviceCheck.jsx**: 设备检查页面
- **Demo.jsx**: 演示页面

### 功能组件 (components/)
- **AudioRecorder.jsx**: 音频录制组件
- **MediaRecorder.jsx**: 媒体录制组件
- **ui/**: UI组件库
  - **Button.jsx**: 按钮组件
  - **Card.jsx**: 卡片组件
  - **Modal.jsx**: 模态框组件
  - **Toast.jsx**: 提示组件
  - **Loading.jsx**: 加载组件
  - **Typography.jsx**: 文字组件
  - **Tag.jsx**: 标签组件
  - **Progress.jsx**: 进度条组件
  - **Input.jsx**: 输入框组件
  - **EmptyState.jsx**: 空状态组件

### API接口 (api/)
- **index.js**: API配置和接口定义

### 工具函数 (utils/)
- **auth.js**: 认证工具函数
- **toast.js**: 提示工具函数

### 配置文件 (config/)
- **bgEffect.js**: 背景效果配置

### 第三方库 (libs/)
- **rtcplayer.esm.js**: RTC播放器

## 🚀 启动步骤

1. 安装依赖：`npm install`
2. 启动开发服务器：`npm start`
3. 访问 http://localhost:3000

## 🎨 核心功能特性

### 1. 虚拟人面试界面
- **自动启动**: 进入面试页面自动启动虚拟人
- **实时视频流**: WebRTC技术显示虚拟人视频
- **智能对话**: 聊天式界面，支持回车发送
- **自动关闭**: 面试结束时自动关闭虚拟人连接

### 2. 现代化UI设计
- **响应式布局**: 适配桌面端和移动端
- **聊天式输入**: 文本框4行高度，发送按钮1行高度
- **加载状态**: 虚拟人启动时的加载提示
- **状态管理**: 实时显示虚拟人连接状态

### 3. 用户体验优化
- **键盘操作**: 支持回车键发送消息
- **自动高度**: 文本框根据内容自动调整高度
- **视觉反馈**: 按钮状态、输入框聚焦效果
- **错误处理**: 完善的错误提示和重试机制

## 🔧 技术实现

### 虚拟人集成
```javascript
// 自动启动虚拟人
useEffect(() => {
  const initializeInterview = async () => {
    // 创建面试记录
    const res = await startInterview(type);
    
    // 自动启动虚拟人
    const avatarRes = await api.post('/avatar/start');
    setStreamInfo(avatarRes.data);
  };
  
  initializeInterview();
}, [type]);
```

### 消息发送
```javascript
// 发送消息（大模型交互）
const handleSendMessage = async () => {
  const res = await api.post(`/avatar/send?sessionId=${streamInfo.session}&text=${encodeURIComponent(avatarInput.trim())}`);
  setAvatarInput(''); // 清空输入框
};
```

### 键盘事件处理
```javascript
const handleKeyDown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (avatarInput.trim() && !avatarLoading && streamInfo?.session) {
      handleSendMessage();
    }
  }
};
```

## 📱 响应式设计

### 桌面端
- 文本框宽度：720px（与视频区域一致）
- 发送按钮：36x21px，位于右下角
- 布局：居中对齐，卡片式设计

### 移动端
- 文本框宽度：100% - 32px边距
- 发送按钮：32x24px，适配移动端
- 字体大小：16px防止iOS缩放

## 🎯 组件说明

### Interview.jsx（核心组件）
- **自动启动虚拟人**: 页面加载时自动调用后端接口
- **视频流显示**: 使用RTCPlayer显示虚拟人视频
- **聊天界面**: 现代化的消息输入和发送
- **状态管理**: 管理虚拟人连接状态和加载状态

### AIInterviewerVideo组件
- **视频播放**: 集成RTCPlayer播放虚拟人视频
- **占位显示**: 虚拟人未启动时显示占位内容
- **字幕显示**: 支持显示虚拟人说话的字幕

### 聊天输入组件
- **自动高度**: 根据内容自动调整文本框高度
- **键盘支持**: 回车发送，Shift+Enter换行
- **按钮状态**: 根据输入内容和连接状态控制按钮可用性

## 🔄 状态管理

### 虚拟人状态
```javascript
const [streamInfo, setStreamInfo] = useState(null);        // 虚拟人连接信息
const [avatarLoading, setAvatarLoading] = useState(false); // 加载状态
const [avatarInput, setAvatarInput] = useState("");        // 输入内容
```

### 面试状态
```javascript
const [loading, setLoading] = useState(true);              // 页面加载状态
const [recordId, setRecordId] = useState(null);            // 面试记录ID
const [interviewInfo, setInterviewInfo] = useState(null);  // 面试信息
```

## 🛠️ 开发指南

### 添加新的面试类型
1. 在`InterviewTypes.jsx`中添加新的岗位类型
2. 在`Interview.jsx`中处理新的面试逻辑
3. 更新相关的样式和配置

### 自定义虚拟人配置
1. 修改`api/index.js`中的接口配置
2. 调整`Interview.jsx`中的虚拟人启动逻辑
3. 更新UI组件以适应新的配置

### 样式定制
1. 修改`Interview.module.css`中的样式
2. 调整组件的内联样式
3. 更新响应式断点和布局

## 📦 依赖说明

### 核心依赖
- **React 18**: 用户界面框架
- **React Router**: 路由管理
- **Axios**: HTTP客户端
- **Ant Design**: UI组件库

### 虚拟人相关
- **RTCPlayer**: 视频流播放器
- **WebRTC**: 实时通信技术

### 开发工具
- **Create React App**: 项目脚手架
- **ESLint**: 代码检查
- **Prettier**: 代码格式化
