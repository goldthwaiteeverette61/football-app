# 开发列表 (Development Checklist)

## 项目概述
ScoreRED 足球投注应用 - 基于 React Native + Expo 开发的移动端应用

## 技术栈
- **框架**: React Native + Expo SDK 54
- **导航**: Expo Router
- **UI组件**: React Native Paper (Material Design)
- **状态管理**: React Context + Hooks
- **数据存储**: AsyncStorage + SecureStore
- **网络请求**: 自定义 API Client
- **图片处理**: expo-image-picker + expo-media-library
- **加密**: expo-crypto + jsencrypt
- **缓存**: expo-file-system + expo-crypto

---

## 功能开发状态

### ✅ 已完成功能

#### 🔐 用户认证系统
- [x] 用户登录界面 (`app/auth/login.tsx`)
- [x] 用户注册界面 (`app/auth/register.tsx`)
- [x] 忘记密码界面 (`app/auth/forgot-password.tsx`)
- [x] JWT Token 管理
- [x] 用户信息缓存 (`services/userInfoCache.ts`)
- [x] 认证状态管理 (`contexts/AuthContext.tsx`)
- [x] 认证守卫组件 (`components/AuthGuard.tsx`)

#### 💰 钱包系统
- [x] 钱包主界面 (`app/(tabs)/wallet.tsx`)
- [x] 充值界面 (`app/wallet/recharge.tsx`)
- [x] 提现界面 (`app/wallet/withdraw.tsx`)
- [x] 交易记录 (`app/wallet/transactions.tsx`)
- [x] 交易详情 (`app/wallet/transaction-detail.tsx`)
- [x] 二维码生成和保存功能
- [x] USDT 地址管理

#### 🎯 倍投系统
- [x] 倍投主界面 (`app/(tabs)/betting.tsx`)
- [x] 方案跟投 (`app/betting/scheme-betting.tsx`)
- [x] 我的订单 (`app/betting/orders.tsx`)
- [x] 红单趋势 (`app/betting/red-trend.tsx`)
- [x] 理赔管理 (`app/betting/claim-management.tsx`)
- [x] 倍投策略 (`app/profile/betting-strategy.tsx`)
- [x] 连黑理赔服务
- [x] 重置倍投功能
- [x] 申请理赔功能

#### ⚽ 足球赛事
- [x] 足球赛事列表 (`app/discover/football-matches.tsx`)
- [x] 足球计算器 (`app/discover/football-calculator.tsx`)
- [x] 比赛状态判断逻辑
- [x] AI预测按钮（占位功能）
- [x] 球队logo显示

#### 👤 用户中心
- [x] 个人资料界面 (`app/(tabs)/profile.tsx`)
- [x] 编辑资料 (`app/profile/edit-profile.tsx`)
- [x] 地址管理 (`app/profile/address-management.tsx`)
- [x] 添加/编辑地址 (`app/profile/add-edit-address.tsx`)
- [x] 邀请好友 (`app/profile/invite-friends.tsx`)
- [x] 邀请统计API (`services/inviteApi.ts`)
- [x] 邀请数据统计功能
- [x] 安全设置 (`app/profile/security-settings.tsx`)
- [x] 头像上传功能

#### 🖼️ 图片缓存系统
- [x] 图片缓存服务 (`services/imageCache.ts`)
- [x] 缓存头像组件 (`components/CachedAvatar.tsx`)
- [x] 缓存图片组件 (`components/CachedImage.tsx`)
- [x] 缓存管理界面 (`app/profile/cache-management.tsx`)
- [x] 自动缓存管理
- [x] 缓存统计功能

#### 🔧 API 服务
- [x] API 客户端 (`services/apiClient.ts`)
- [x] 认证 API (`services/authApi.ts`)
- [x] 用户 API (`services/userApi.ts`)
- [x] 钱包 API (`services/walletApi.ts`)
- [x] 交易 API (`services/transactionApi.ts`)
- [x] 倍投 API (`services/bettingApi.ts`)
- [x] 方案 API (`services/schemeApi.ts`)
- [x] 理赔 API (`services/claimApi.ts`)
- [x] 足球 API (`services/matchesApi.ts`)
- [x] 赔率 API (`services/oddsApi.ts`)
- [x] 订单 API (`services/ordersApi.ts`)
- [x] 发现 API (`services/discoverApi.ts`)
- [x] 配置 API (`services/configApi.ts`)
- [x] 权限 API (`services/permissionsApi.ts`)
- [x] 奖励 API (`services/rewardApi.ts`)
- [x] 提现 API (`services/withdrawalApi.ts`)
- [x] 版本 API (`services/versionsApi.ts`)

#### 🛠️ 工具和配置
- [x] 加密工具 (`utils/crypto.ts`, `utils/rsaCrypto.ts`, `utils/secureCrypto.ts`)
- [x] 安全存储 (`utils/secureStorage.ts`)
- [x] JWT 处理 (`utils/jwt.ts`)
- [x] 验证码处理 (`utils/captcha.ts`)
- [x] 比赛状态工具 (`utils/matchStatus.ts`)
- [x] 加密配置 (`utils/encryptionConfig.ts`)
- [x] 主题颜色 (`constants/Colors.ts`)
- [x] 认证常量 (`constants/auth.ts`)
- [x] 交易类型 (`constants/transactionTypes.ts`)

---

### 🚧 高优先级任务 (当前版本 v1.0.0)

#### 👥 邀请好友功能完善
- [x] **已邀请好友数量** - 后端API需要返回 `totalInvites` 字段
- [x] **本月邀请数量** - 后端API需要返回 `monthlyInvites` 字段
- [ ] **优化邀请文案** - 提升邀请内容的吸引力和专业性
- [x] 邀请奖励发放机制

#### 🖼️ 图片缓存系统优化
- [x] **优化缓存管理UI** - 统一导航风格，提升用户体验

#### ⚽ 足球赛事系统优化
- [x] **足球赛事状态管理验证** - 确保比赛状态判断的准确性

#### 💰 钱包系统优化
- [ ] **充值二维码保存到相册功能验证** - 解决Android权限问题

#### 🎯 倍投系统优化
- [x] **方案跟投验证最小投注金额** - 完善投注金额验证逻辑
- [x] **方案跟投的确认投注接入真实API** - 替换测试接口
- [ ] **当前方案状态不是可出票状态不能进入方案跟投界面** - 添加状态检查
- [x] **验证用户修改投注金额比最小投注金额小的时候提示用户重置倍投** - 完善用户引导

#### 📊 数据展示优化
- [x] **红单趋势图修改成最近30天** - 调整数据展示时间范围

#### 🛡️ 理赔管理系统优化
- [x] **理赔管理实现切换参与状态** - 完善参与状态切换功能
- [ ] **验证申请理赔功能** - 确保理赔申请流程正常

#### 🎨 应用界面优化
- [ ] **确认开屏封面** - 设计应用启动画面
- [ ] **设计LOGO** - 创建应用品牌标识
- [ ] **设置logo的相关icon** - 配置应用图标

#### 🚀 发布管理
- [ ] **发布预览版本** - 准备应用发布

#### 🔐 用户认证系统优化
- [x] **去掉登陆界面的测试功能按钮** - 清理测试代码
- [x] **接入注册用户API** - 完善注册功能
- [ ] **接入忘记密码API** - 完善密码重置功能
- [ ] **更换企业邮箱** - 更新联系信息
- [x] **新用户注册S3头像图片不存在** - 修复新用户注册时头像图片缺失问题

#### 🌐 区块链网络优化
- [ ] **波场转到正式网络** - 将波场网络从测试网切换到主网


---

### 📋 计划功能

#### 👥 邀请好友功能扩展 (v1.1.0)
- [ ] 邀请记录列表功能
- [ ] 邀请排行榜功能
- [ ] 邀请好友详情页面
- [ ] 邀请奖励历史记录
- [ ] 分享邀请功能

#### 📱 推送通知和数据统计 (v1.2.0)
- [ ] Expo Push Notifications 集成
- [ ] 国内推送服务集成（Getui/JPush/MiPush）
- [ ] 推送权限管理
- [ ] 推送消息处理
- [ ] 投注数据统计
- [ ] 收益分析图表
- [ ] 用户行为分析
- [ ] 数据导出功能

#### 🎮 游戏功能
- [ ] 更多体育赛事支持
- [ ] 实时比分更新
- [ ] 赛事预测算法
- [ ] 社交功能（评论、分享）

#### 🔒 安全增强
- [ ] 生物识别登录
- [ ] 设备绑定
- [ ] 异常登录检测
- [ ] 数据加密传输

#### 🎨 用户体验
- [ ] 深色模式支持
- [ ] 多语言支持
- [ ] 无障碍功能
- [ ] 性能优化

#### 📱 平台特性
- [ ] iOS 特定功能
- [ ] Android 特定功能
- [ ] 平板适配
- [ ] Web 版本

---

## 技术债务

### 🔧 需要重构的代码
- [ ] 统一错误处理机制
- [ ] 优化 API 响应处理
- [ ] 改进状态管理结构
- [ ] 代码分割和懒加载

### 🐛 已知问题
- [ ] Expo Go 中媒体库权限限制
- [ ] 某些 Android 设备的兼容性问题
- [ ] 网络请求超时处理
- [ ] 图片加载失败回退机制

### 📈 性能优化
- [ ] 图片压缩和优化
- [ ] 列表虚拟化
- [ ] 内存泄漏检查
- [ ] 启动时间优化

---

## 开发规范

### 📝 代码规范
- [x] TypeScript 严格模式
- [x] ESLint 配置
- [x] Prettier 格式化
- [x] 组件命名规范
- [x] 文件结构规范

### 🧪 测试
- [ ] 单元测试框架搭建
- [ ] 组件测试
- [ ] API 测试
- [ ] E2E 测试

### 📚 文档
- [x] API 文档 (`docs/API.md`)
- [x] 加密文档 (`docs/ENCRYPTION.md`)
- [x] 用户信息缓存文档 (`docs/UserInfoCache.md`)
- [x] 开发列表 (`docs/DEVELOPMENT.md`)
- [ ] 部署文档
- [ ] 贡献指南

---

## 版本历史

### v1.0.0 (当前版本)
- ✅ 基础功能完成
- ✅ 用户认证系统
- ✅ 钱包和交易功能
- ✅ 倍投和理赔系统
- ✅ 足球赛事功能
- ✅ 图片缓存系统

### 计划版本
- v1.1.0: 邀请好友功能扩展（邀请记录、排行榜、文案优化）
- v1.2.0: 推送通知和数据统计
- v1.3.0: 安全增强和用户体验优化
- v2.0.0: 多平台支持和高级功能

---

## 贡献者
- 开发者: 项目主要开发工作

---

## 更新日志
- 2024-01-16: 创建开发列表文档
- 2024-01-16: 完成图片缓存功能开发
- 2024-01-16: 修复 expo-crypto 和 expo-file-system 相关问题
- 2024-01-16: 完成邀请好友数据统计功能集成
- 2024-01-16: 添加邀请好友功能完善任务到高优先级开发列表
- 2024-01-16: 完成邀请奖励发放机制功能
- 2024-01-16: 调整邀请记录列表和排行榜功能到下个版本开发
- 2024-01-16: 添加分享邀请和优化邀请文案功能到v1.1.0版本
- 2024-01-16: 将优化邀请文案调整为高优先级
- 2024-01-16: 添加优化缓存管理UI为高优先级任务
- 2024-01-16: 添加足球赛事状态管理验证为高优先级任务
- 2024-01-16: 添加充值二维码保存到相册功能验证为高优先级任务
- 2024-01-16: 将推送通知和数据统计功能推迟到v1.2.0版本
- 2024-01-16: 添加方案跟投验证最小投注金额为高优先级任务
- 2024-01-16: 添加方案跟投的确认投注接入真实API为高优先级任务
- 2024-01-16: 添加方案状态验证为高优先级任务
- 2024-01-16: 添加投注金额验证和重置倍投提示为高优先级任务
- 2024-01-16: 添加红单趋势图修改成最近30天为高优先级任务
- 2024-01-16: 添加理赔管理实现切换参与状态为高优先级任务
- 2024-01-16: 添加验证申请理赔功能为高优先级任务
- 2024-01-16: 添加确认开屏封面为高优先级任务
- 2024-01-16: 添加设计LOGO和设置logo相关icon为高优先级任务
- 2024-01-16: 添加发布预览版本为高优先级任务
- 2024-01-16: 添加用户认证系统优化为高优先级任务
- 2024-01-16: 整理开发列表结构，优化任务分类和描述
- 2024-01-16: 更新项目名称为ScoreRED，统一品牌标识
- 2024-01-16: 完成缓存管理UI优化，统一导航风格
- 2024-01-16: 添加新用户注册S3头像图片不存在问题到开发列表
- 2024-01-16: 添加波场转到正式网络任务到v1.0.0高优先级开发列表

---

*最后更新: 2024-01-16*
