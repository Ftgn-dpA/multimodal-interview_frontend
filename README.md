# 前端详细说明文档

## 📁 文件结构说明

### 页面组件 (pages/)
- **Login.jsx**: 用户登录页面
  - 表单验证、错误处理
  - 现代化UI设计
  - 动画效果
- **Register.jsx**: 用户注册页面
  - 密码确认验证
  - 实时表单验证
- **InterviewTypes.jsx**: 面试类型选择页面
  - 卡片式布局
  - 动画交互效果
  - 确认弹窗
- **History.jsx**: 面试历史记录页面
  - 分页显示
  - 筛选功能
- **Demo.jsx**: 演示页面
- **TestVideo.jsx**: 视频测试页面

### 功能组件 (components/)
- **VideoInterviewNew.jsx**: 新版视频面试组件
  - 现代化UI设计
  - 语音波形可视化
  - 实时状态指示
  - AI面试官视频占位符
  - 用户视频显示
  - 字幕开关控制
- **AudioRecorder.jsx**: 音频录制组件
- **VideoInterview.jsx**: 旧版组件（已弃用）

### UI组件库 (components/ui/)
- **Button.jsx**: 自定义按钮组件
  - 多种样式：primary、secondary、danger、ghost
  - 多种尺寸：sm、md、lg、xl
  - 支持loading状态
- **Card.jsx**: 卡片容器组件
  - 统一卡片样式
  - hover效果
- **Input.jsx**: 自定义输入框组件
  - 错误状态显示
  - 图标支持
  - 密码切换

### API接口 (api/)
- **index.js**: API配置和接口定义
  - 用户认证API
  - 面试相关API
  - 错误处理

### 工具函数 (utils/)
- **auth.js**: 认证工具函数
  - token存储和获取
  - 认证状态检查
  - token清除

### 核心文件
- **App.jsx**: 主应用组件
  - 路由配置
  - 受保护路由
  - 全局布局
- **index.js**: 应用入口
- **index.css**: 全局样式
  - 现代化CSS类
  - 动画效果
  - 响应式设计
  - 清新配色方案

## 🎨 设计特色

### 配色方案
- 主色调：蓝色系 (#3b82f6)
- 背景色：slate色系 (#f8fafc)
- 文字色：slate色系 (#1e293b, #64748b)
- 去除了紫色渐变，使用清新纯色

### 动画效果
- 使用Framer Motion
- 页面进入动画
- 按钮hover效果
- 语音波形动画

### 响应式设计
- 移动端适配
- 平板端适配
- 桌面端优化

## 🚀 启动步骤

1. 安装依赖：`npm install`
2. 启动开发服务器：`npm start`
3. 访问 http://localhost:3000

## 📱 页面流程

1. **登录/注册** → 2. **面试类型选择** → 3. **视频面试** → 4. **历史记录**

## 🔧 技术栈

- React 18
- Ant Design
- Framer Motion
- Lucide React
- Axios
- React Router
