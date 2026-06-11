## 1. 架构设计

```mermaid
flowchart TB
    subgraph "前端层"
        A["React 18 + TypeScript"]
        B["Tailwind CSS"]
        C["Zustand 状态管理"]
        D["React Router DOM"]
    end

    subgraph "数据持久层"
        E["localStorage"]
        F["Mock 数据引擎"]
    end

    A --> C
    A --> B
    A --> D
    C --> E
    C --> F
```

## 2. 技术说明

- **前端框架**：React@18 + TypeScript
- **样式方案**：Tailwind CSS@3
- **构建工具**：Vite
- **路由**：React Router DOM@6
- **状态管理**：Zustand（含 localStorage 持久化中间件）
- **图标库**：lucide-react
- **后端**：无（纯前端，使用 localStorage 持久化 + Mock 数据）
- **数据库**：无（localStorage 模拟持久化）

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| `/` | 工作台首页，展示待办统计、续方提醒、缺货预警 |
| `/prescriptions` | 处方登记页，新增和查看处方列表 |
| `/prescriptions/new` | 新增处方表单页 |
| `/prescriptions/:id` | 处方详情页 |
| `/reminders` | 续方提醒页，按日期分组显示提醒列表 |
| `/shortage` | 缺货管理页，缺货登记、替代方案、到货通知 |

## 4. 数据模型

### 4.1 数据模型定义

```mermaid
erDiagram
    Patient ||--o{ Prescription : "拥有"
    Prescription ||--o{ PrescriptionItem : "包含"
    Drug ||--o{ PrescriptionItem : "被处方"
    Drug ||--o{ ShortageRecord : "缺货"
    ShortageRecord ||--o{ SubstituteRecord : "替代"
    Patient ||--o{ Reminder : "收到"
    Prescription ||--o{ Reminder : "触发"

    Patient {
        string id PK
        string name
        string idCard
        string phone
        string diseaseType
    }

    Prescription {
        string id PK
        string patientId FK
        string insuranceType
        number remainingDays
        string pickupDate
        string status
        string createdAt
    }

    PrescriptionItem {
        string id PK
        string prescriptionId FK
        string drugId FK
        number quantity
        string dosage
        number remainingQuantity
    }

    Drug {
        string id PK
        string name
        string specification
        string category
        number stock
        string unit
    }

    ShortageRecord {
        string id PK
        string drugId FK
        number shortageQuantity
        string estimatedArrivalDate
        string status
        string createdAt
    }

    SubstituteRecord {
        string id PK
        string shortageId FK
        string substituteDrugId FK
        string reason
        string status
    }

    Reminder {
        string id PK
        string patientId FK
        string prescriptionId FK
        string type
        string remindDate
        string status
        string message
    }
```

### 4.2 数据定义

所有数据通过 Zustand store 管理，使用 `zustand/middleware` 的 `persist` 中间件自动同步到 localStorage。初始化时注入 Mock 数据（包含示例患者、药品、处方、提醒等）。

#### 核心类型定义

```typescript
type DiseaseType = 'hypertension' | 'diabetes' | 'both'
type InsuranceType = 'urban_employee' | 'urban_resident' | 'rural_coop' | 'self_pay'
type PrescriptionStatus = 'active' | 'completed' | 'expired'
type ShortageStatus = 'shortage' | 'substituted' | 'restocked'
type ReminderStatus = 'pending' | 'sent' | 'confirmed' | 'ignored'
type ReminderType = 'renewal_7d' | 'renewal_3d' | 'renewal_1d' | 'shortage_arrival' | 'substitute_notice'
```
