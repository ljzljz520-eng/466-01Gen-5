# 社区药房慢病配药台

> 专为社区药房设计的高血压、糖尿病等慢病患者长期配药数字化管理系统，彻底告别窗口纸条记录时代。

---

## ✨ 功能特性

### 🏥 核心业务模块

| 模块 | 功能说明 |
|------|----------|
| **处方登记** | 药师录入患者信息、医保类型（城镇职工/居民/新农合/自费）、药品明细、用法用量、剩余药量、取药日期 |
| **三级续方提醒** | 自动生成 7天/3天/1天 三档续方提醒，支持发送、回执确认、忽略、失败重试 |
| **缺货管理** | 缺货登记 → 替代方案登记（支持替代原因和受影响患者） → 到货确认自动入库 |
| **等待队列** | 缺货药品自动关联活跃处方患者，按序排队，到货自动通知 |
| **库存管理** | 处方发药自动扣减库存、缺货清零、到货入库、安全库存预警、库存变更全记录 |
| **审计日志** | 21种操作全记录，支持变更前后快照对比、操作人/角色/IP/UA 追踪 |

### 🔐 权限与角色系统

| 角色 | 权限范围 | 适用场景 |
|------|----------|----------|
| **系统管理员 (admin)** | 全部功能 + 数据重置 + 审计查看 | 药房主任、信息科 |
| **执业药师 (pharmacist)** | 处方/缺货/提醒全功能 + 库存调整 | 窗口配药药师 |
| **收费窗口 (cashier)** | 处方查看 + 完成 + 确认回执 | 收银/发药窗口 |
| **只读访客 (viewer)** | 所有页面浏览查询，不可修改 | 监管/视察人员 |

### 🔄 跨窗口同步

基于 `BroadcastChannel` API 实现多标签页实时数据同步：
- 登录登出状态同步
- 数据变更自动刷新
- 异地登录主动下线提示

---

## 🏗️ 系统架构

```
src/
├── services/                    # 业务服务层（模拟后端 API）
│   ├── mockDatabase.ts          # 数据访问层 + localStorage 持久化
│   ├── mockApi.ts               # API 接口（权限校验 + 业务校验 + 审计写入）
│   ├── authService.ts           # 认证服务（备用实现）
│   ├── auditService.ts          # 审计服务（备用实现）
│   └── broadcastSync.ts         # 多窗口广播同步
├── store/                       # 状态管理层（Zustand）
│   ├── usePharmacyStore.ts      # 主状态 + 异步业务编排
│   └── useToastStore.ts         # Toast 通知状态
├── hooks/                       # React 自定义 Hooks
│   ├── usePermissions.ts        # 权限检查 Hook
│   ├── useToast.ts              # Toast 调用 Hook
│   └── useTheme.ts              # 主题切换 Hook
├── types/
│   └── index.ts                 # 全局 TypeScript 类型定义
├── components/                  # 通用 UI 组件
│   ├── AppLayout.tsx            # 主布局 + 导航 + 用户菜单
│   ├── Modal.tsx                # 对话框组件
│   ├── StatCard.tsx             # 数据统计卡片
│   └── Toast.tsx                # 全局 Toast 容器
├── pages/                       # 业务页面
│   ├── Login.tsx                # 登录页 + 演示账号一键登录
│   ├── Dashboard.tsx            # 工作台：今日总览 + 预警
│   ├── Prescriptions.tsx        # 处方列表 + 搜索筛选
│   ├── NewPrescription.tsx      # 新增处方表单
│   ├── PrescriptionDetail.tsx   # 处方详情页
│   ├── Reminders.tsx            # 续方提醒管理
│   ├── Shortage.tsx             # 缺货登记与替代管理
│   └── AuditLogs.tsx            # 审计日志查询
└── App.tsx                      # 路由 + 鉴权 + 初始化
```

---

## 📋 业务流程详解

### 1. 新增处方流程

```
录入患者信息 ──► 选择医保类型 ──► 录入药品明细
      │                                        │
      ▼                                        ▼
  校验必填项                        校验库存 ≥ 处方量
      │                                        │
      ▼                                        ▼
  创建处方 ─────────► 扣减库存 ─────────► 写库存变更日志
      │
      ├──────────► 生成三档续方提醒（7/3/1天）
      │
      └──────────► 写入审计日志
```

**业务校验规则：**
- 必须选择患者、至少一种药品
- 库存不足时禁止创建
- 已缺货药品自动过滤不可选

### 2. 缺货登记流程

```
登记缺货 ──► 库存清零 ──► 查找活跃处方受影响患者
      │                          │
      ▼                          ▼
  写入审计日志            自动加入等待队列
      │
      └──────► 可补充：登记替代方案
                    │
                    ▼
              生成替代药品通知提醒
              通知相关患者
```

### 3. 到货确认流程

```
确认到货 ──► 按缺货数量入库 ──► 等待队列标记「已通知」
      │                              │
      ▼                              ▼
  写库存变更日志              自动生成到货提醒
      │
      └──────────► 写入审计日志
```

### 4. 提醒发送流程

```
点击发送 ──► 状态→发送中 ──► 模拟短信发送（最多3次重试）
      │                                    │
      │                           ┌────────┴─────────┐
      ▼                           ▼                  ▼
  发送成功                    发送失败           写通知发送记录
  状态→已发送                 状态→失败           写入审计日志
  生成通知记录
  写入审计日志
```

---

## 🚀 快速开始

### 环境要求

- Node.js ≥ 18
- npm ≥ 9

### 安装与启动

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 类型检查
npm run check

# Lint 检查
npm run lint

# 生产构建
npm run build

# 预览构建结果
npm run preview
```

### 演示账号

| 账号 | 密码 | 角色 | 说明 |
|------|------|------|------|
| `admin` | `123456` | 系统管理员 | 全部功能 + 审计日志 + 数据重置 |
| `pharmacist1` | `123456` | 执业药师 | **推荐**，日常配药全功能 |
| `cashier1` | `123456` | 收费窗口 | 处方查看、发药、确认回执 |
| `viewer1` | `123456` | 只读访客 | 仅浏览查询 |

> 登录页提供一键演示账号卡片，点击即可快速登录体验。

---

## 📊 数据模型总览

| 实体 | 关键字段 | 说明 |
|------|----------|------|
| **User** | id, username, name, role, password | 系统用户，4种角色 |
| **Patient** | id, name, idCard, phone, diseaseType | 慢病患者，3种慢病类型 |
| **Drug** | id, name, specification, category, stock, safetyStock | 药品基础信息 + 安全库存 |
| **Prescription** | id, patientId, registeredBy, insuranceType, remainingDays, pickupDate, status, items[] | 处方主表 + 明细行 |
| **ShortageRecord** | id, drugId, shortageQuantity, estimatedArrivalDate, status, substitutes[] | 缺货记录 + 替代方案 |
| **Reminder** | id, patientId, prescriptionId, shortageId, type, remindDate, status, retryCount | 提醒记录（5种类型、6种状态） |
| **WaitQueueEntry** | id, shortageId, patientId, position, status | 患者等待队列 |
| **AuditLog** | id, action, entityType, entityId, operator, operatorRole, before/afterSnapshot, changes, ip, ua | 审计追踪 |
| **StockChangeLog** | id, drugId, changeQuantity, before/afterStock, reason, operator, referenceId | 库存流水 |
| **Notification** | id, reminderId, patientId, channel, recipient, content, status | 通知发送记录 |

---

## 🔧 技术栈

| 分类 | 技术 | 版本 |
|------|------|------|
| **前端框架** | React | 18.3 |
| **语言** | TypeScript | 5.8 |
| **构建工具** | Vite | 6.3 |
| **路由** | React Router | 7.3 |
| **状态管理** | Zustand | 5.0 |
| **样式** | Tailwind CSS | 3.4 |
| **图标** | Lucide React | 0.511 |
| **持久化** | localStorage (Zustand persist) | - |
| **跨窗口** | BroadcastChannel API | - |
| **代码规范** | ESLint + TypeScript ESLint | 9.x / 8.x |

---

## 📝 Mock 后端说明

本项目为前端演示项目，所有后端接口均通过 `services/mockApi.ts` 模拟：

### ✅ 已实现的后端模拟能力

| 能力 | 实现方式 |
|------|----------|
| **接口延迟** | 100-800ms 随机延迟，模拟网络请求 |
| **业务校验** | 参数校验、库存校验、重复登记校验、权限校验 |
| **事务一致性** | 处方创建=扣库存+写日志+生成提醒 原子操作 |
| **通知发送** | 模拟短信通道发送 + 3次重试 + 失败记录 |
| **权限控制** | RBAC 权限矩阵，API 层拦截 |
| **审计记录** | 所有写操作自动写入审计日志 |
| **数据持久化** | localStorage 存储，刷新不丢失 |
| **多窗口同步** | BroadcastChannel 实时广播 |

### ⚠️ 生产环境接入指引

如需接入真实后端，只需：

1. 替换 `services/mockApi.ts` 中的 API 实现为 HTTP 请求（推荐 axios）
2. 替换 `services/mockDatabase.ts` 为后端接口调用
3. 将 localStorage 用户会话改为 Cookie / JWT Token 方案
4. 通知发送改为真实短信/微信服务端接口
5. 数据重置、跨窗口同步等功能按后端能力改造

---

## 🧪 内置演示数据

系统初始化内置：

- **8 位慢病患者**（高血压4人 / 糖尿病2人 / 合并2人）
- **10 种常用药品**（含 2 种已缺货演示）
- **6 张活跃处方**（不同剩余天数用于提醒展示）
- **2 条缺货记录**（含 1 条已替代）
- **3 条等待队列记录**
- **8 条续方提醒**（含已发送/待发送/紧急状态）
- **4 条审计日志样例**
- **4 位系统用户**（4 种角色各 1 位）

---

## 📄 License

MIT License - 仅供学习与演示使用
