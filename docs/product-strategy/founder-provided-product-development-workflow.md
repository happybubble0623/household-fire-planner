# Founder-Provided Product Development Workflow

Status: Source transcription from founder-provided screenshots

Date captured: 2026-06-08

This file preserves the content from the founder-provided workflow screenshots as a separate reference document.

## 【1】产品定位，形成 PRD 草稿

- 脑暴 with AI：和 AI 对话，围绕以下问题梳理产品
  - 这个产品解决什么问题？目标用户是谁？
  - 用户现在是怎么解决这个问题的？现有方案有什么不足？
  - 竞品是谁？我们的差异化（USP）在哪？借鉴点？（竞品调研）
  - MVP 应该包含哪些功能？哪些功能暂时不做？（黑名单）
  - 发布形态是什么？网页、小程序、插件、App，还是内部工具？
  - 算账：API 成本、服务器成本、时间成本是否可控？
- 明确技术的可行性，初步确认：
  - 前端用什么：React / Vue / Next.js / Vite
  - 后端/数据库：Supabase / Firebase / 纯前端 LocalStorage
  - AI 能力：DeepSeek / OpenAI / Silicon Flow / Gemini API
  - 部署：Vercel / Netlify / Cloudflare
  - 特殊能力：是否需要向量数据库、PDF 解析、Web Crawler？
- 产出 PRD 草稿：产品定位、用户、痛点、MVP、页面清单、核心流程、技术方案和主要风险

## 【2】视觉设计：灵感收集、UI 原型

- 在全网（Dribbble, Linear, v0 等）搜集喜欢的 UI 设计风格图，丢给 AI，让它提炼出设计关键词（整体气质、色彩、布局、卡片风格、避坑事项）
- 基于 PRD 草稿，用 Figma Make / Figma AI 生成并打磨 UI 原型，用于后续辅助 Coding Agent 理解产品逻辑和设计风格
- 根据 UI 原型反向修正 PRD

## 【3】准备开发：SDD 固化开发边界

打开工作目录，建立 docs/ 文件夹，把前面的 PRD 草稿 + UI 设计图喂给 Coding Agent，在 docs/中输出并维护 3 份核心文档：

- PRD.md：产品定位、用户痛点、核心用户旅程、MVP 核心功能列表、绝对不做的功能黑名单、验收标准。
- DESIGN.md：视觉主色调（Tailwind 颜色代码）、组件复用规范、关键交互动效、错误/加载中/空数据状态的视觉表现。
- ARCHITECTURE.md（开发约束）：技术栈、目录结构、数据模型、服务层约定、AI 引用机制、开发约束、禁止破坏的逻辑和验收标准。

## 【4】正式开发：小步迭代、测试上线

- 让 AI 同时读取 docs/ 里的规范文档，在根目录下生成一个 TODO.md 清单。
- 严禁多任务并行，按照 TODO.md 的顺序，一次只勾选一个任务。每轮都明确修改目标、允许修改范围、不允许破坏的逻辑和验收标准。
- 每完成一个模块就进行页面测试（必须测试主流程、加载中、为空、接口报错状态）；测通，立刻执行：git add . && git commit -m "feat: xxx 通过"
- 一旦下一步 AI 把代码写崩了且无法轻易修复，直接 git reset --hard
- 变更控制：发现新的需求，小需求当场修；大需求必须先同步更新 PRD.md 和 ARCHITECTURE.md，再加入 TODO.md 清单，避免 MVP 失控

## 【5】部署上线，闭环交付

- 代码推送到 Github，在 Vercel 等平台 deploy上线
- Coding Agent 扫描最终代码，把最新的实际目录结构更新到 ARCHITECTURE.md 中，并生成规范的 README.md
