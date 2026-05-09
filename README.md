# 匿名评价 - 来匿名评价我

一个匿名互动主页应用，让用户生成自己的匿名主页和二维码，访客可以匿名留言、匿名聊天。

## 功能特点

- 生成个人匿名主页和二维码
- 两种留言模式：完全匿名 / 可解锁身份
- 匿名访客记录（付费解锁身份）
- 实时匿名聊天（类似微信）
- 后台查看留言、访客、聊天列表
- Mock 支付解锁身份卡（第一版）

## 技术栈

- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- Supabase (数据库 + API + Realtime)
- Vercel 部署

## 项目结构

```
├── app/
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 首页 - 创建匿名主页
│   ├── globals.css         # 全局样式
│   ├── u/
│   │   └── [slug]/
│   │       └── page.tsx    # 用户匿名主页
│   ├── chat/
│   │   └── [slug]/
│   │       └── page.tsx    # 匿名聊天页
│   ├── sent/
│   │   └── page.tsx        # 留言成功页
│   ├── dashboard/
│   │   └── page.tsx        # 后台管理页
│   └── pay/
│       └── [messageId]/
│           └── page.tsx    # Mock 支付页
├── lib/
│   ├── supabase.ts         # Supabase 客户端配置
│   ├── utils.ts            # 工具函数
│   ├── visitor.ts          # 访客 token 管理
│   └── actions.ts          # Server Actions
├── sql/
│   ├── init.sql            # 数据库初始化 SQL
│   └── update.sql          # 新增表 SQL
├── .env.example            # 环境变量示例
└── README.md
```

## 快速开始

### 1. 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com) 并注册/登录
2. 创建一个新项目
3. 进入 SQL Editor，依次执行：
   - `sql/init.sql` - 初始化基础表
   - `sql/update.sql` - 新增访客和聊天表
4. 在 Settings -> API 中获取项目 URL 和 anon key

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

填入你的 Supabase 配置：

```env
NEXT_PUBLIC_SUPABASE_URL=你的项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. 安装依赖并启动

```bash
npm install
npm run dev
```

访问 http://localhost:3000

## 数据库结构

### profiles 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| nickname | TEXT | 昵称 |
| bio | TEXT | 简介 |
| slug | TEXT | 唯一标识符 |
| created_at | TIMESTAMPTZ | 创建时间 |

### messages 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| profile_id | UUID | 关联的用户主页 |
| content | TEXT | 留言内容 |
| mode | TEXT | 留言模式 (anonymous/revealable) |
| revealed | BOOLEAN | 是否已解锁 |
| created_at | TIMESTAMPTZ | 创建时间 |

### reveal_profiles 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| message_id | UUID | 关联的留言 |
| nickname | TEXT | 昵称 |
| contact_hint | TEXT | 联系方式提示 |
| intro | TEXT | 自我介绍 |
| consent_reveal | BOOLEAN | 同意解锁 |
| created_at | TIMESTAMPTZ | 创建时间 |

### visitors 表（新增）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| profile_id | UUID | 关联的用户主页 |
| visitor_token | TEXT | 访客唯一标识（浏览器生成） |
| nickname | TEXT | 昵称（解锁后可见） |
| avatar_url | TEXT | 头像（解锁后可见） |
| contact_info | TEXT | 联系方式（解锁后可见） |
| revealed | BOOLEAN | 是否已解锁 |
| created_at | TIMESTAMPTZ | 创建时间 |

### chats 表（新增）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| profile_id | UUID | 关联的用户主页 |
| visitor_token | TEXT | 访客唯一标识 |
| sender | TEXT | 发送者 (owner/visitor) |
| content | TEXT | 消息内容 |
| created_at | TIMESTAMPTZ | 创建时间 |

## 功能说明

### 匿名留言
- 访客访问主页后可以匿名留言
- 支持两种模式：完全匿名 / 可解锁身份
- 主人可以在后台查看留言列表

### 匿名访客
- 自动记录访问主页的访客
- 默认匿名，头像和名字统一隐藏
- 主人付费后可解锁访客身份

### 匿名聊天
- 访客可以直接给主页主人发消息
- 类似微信的聊天界面
- 聊天记录保留
- 身份默认匿名

## 部署到 Vercel

1. 将代码推送到 GitHub
2. 在 [vercel.com](https://vercel.com) 导入项目
3. 添加环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL`（你的 Vercel 域名）
4. 部署

## 隐私说明

- 完全匿名留言不会留下可查看身份
- 只有访客主动选择可解锁身份卡，主页主人才可查看
- 访客记录使用浏览器生成的唯一标识，不收集真实信息
- 聊天身份默认匿名，主人无法看到访客真实身份
- 第一版不收集 IP、不识别访客

## License

MIT
