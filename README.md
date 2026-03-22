# InkFlow (墨流) - AI 驱动的创作助手 / AI-Powered Creative Assistant

[中文](#中文) | [English](#english)

---

## 中文

InkFlow 是一款专为小说创作者设计的全功能 AI 辅助写作平台。它将先进的 AI 技术与深度的世界观管理相结合，帮助创作者从灵感爆发到成稿导出的全过程。

### 核心功能

#### 1. 智能小说管理
- **多作品管理**：轻松创建、编辑和删除多部小说作品。
- **作品元数据**：支持设置封面、类型、目标章节数及详细简介。
- **进度追踪**：实时监控字数、章节进度和创作状态。

#### 2. AI 深度辅助创作
- **分段式创作**：通过分段生成技术，确保长章节的逻辑连贯性与内容质量。
- **一键批量生成**：根据预设大纲，自动批量生成后续章节，大幅提升创作效率。
- **内容润色与重构**：利用 AI 对现有文本进行风格化润色、逻辑重组或情节优化。
- **标题与摘要生成**：AI 自动根据内容提炼吸睛的章节标题和简洁的剧情摘要。

#### 3. 强大的世界观构建 (World Building)
- **角色档案**：管理角色姓名、身份、性格特征及核心动机。
- **故事线规划**：清晰规划主线剧情与多条支线任务，确保埋伏笔与高潮点的精准把控。
- **世界设定**：定义地理环境、力量体系、历史背景及社会规则。
- **人物关系网**：可视化管理角色间的复杂联系与情感纽带。
- **AI 自动补充设定**：AI 能够分析已创作的章节，自动提取并更新角色、故事线和世界设定，保持设定的一致性。

#### 4. 大纲版本管理
- **多版本控制**：支持创建和切换不同版本的小说大纲，方便尝试不同的剧情走向。
- **AI 大纲优化**：利用 AI 对大纲进行结构化调整和逻辑优化。

#### 5. 数据统计与分析
- **Token 使用监控**：详细记录各作品、各日期的 AI Token 消耗情况。
- **创作趋势分析**：可视化展示创作字数增长与 Token 消耗分布。
- **操作日志**：记录系统关键活动，确保创作过程可追溯。

#### 6. 高度自定义的 AI 配置
- **多供应商支持**：原生支持 Google Gemini, OpenAI, DeepSeek 以及任何兼容 OpenAI 接口的自定义模型。
- **高级参数微调**：支持调整 Temperature, Top P, Top K 和最大 Token 数。

#### 7. 极致的写作体验
- **多样化排版**：提供标准、网文、传统三种排版风格，并支持实时预览。
- **Markdown 支持**：全功能 Markdown 渲染，提供简洁、专业的写作环境。
- **自动保存**：实时保存创作内容，防止灵感丢失。

#### 8. 自动化与导出
- **定时任务**：支持创建单次或每日重复的自动生成任务。
- **多格式导出**：支持将作品导出为 Markdown 或标准的 EPUB 电子书格式。

### 技术栈
- **前端**: React 18, TypeScript, Tailwind CSS, Lucide React, Framer Motion
- **后端**: Node.js (Express), SQLite (Better-SQLite3)
- **图表**: Recharts
- **导出**: JSZip, File-saver

### 快速开始
1. 安装依赖: `npm install`
2. 启动开发服务器: `npm run dev`
3. 在设置中配置您的 AI API 密钥。

---

## English

InkFlow is a full-featured AI-assisted writing platform designed specifically for novelists. It combines advanced AI technology with deep world-building management to help creators through the entire process from inspiration to export.

### Core Features

#### 1. Intelligent Novel Management
- **Multi-Work Management**: Easily create, edit, and delete multiple novel projects.
- **Novel Metadata**: Support for covers, genres, target chapter counts, and detailed descriptions.
- **Progress Tracking**: Real-time monitoring of word counts, chapter progress, and writing status.

#### 2. Deep AI-Assisted Writing
- **Segmented Writing**: Ensures logical coherence and content quality for long chapters through segmented generation technology.
- **One-Click Batch Generation**: Automatically generate subsequent chapters based on preset outlines to significantly boost efficiency.
- **Content Polishing & Refactoring**: Use AI to stylistically polish, logically restructure, or optimize plots of existing text.
- **Title & Summary Generation**: AI automatically extracts catchy chapter titles and concise plot summaries from content.

#### 3. Powerful World Building
- **Character Profiles**: Manage character names, identities, traits, and core motivations.
- **Storyline Planning**: Clearly plan main plots and multiple subplots to ensure precise control over foreshadowing and climaxes.
- **World Settings**: Define geography, power systems, history, and social rules.
- **Character Relationships**: Visually manage complex connections and emotional bonds between characters.
- **AI Auto-Supplement**: AI analyzes written chapters to automatically extract and update characters, storylines, and world settings, maintaining consistency.

#### 4. Outline Version Management
- **Multi-Version Control**: Support for creating and switching between different versions of novel outlines to experiment with different plot directions.
- **AI Outline Optimization**: Use AI for structural adjustments and logical optimization of outlines.

#### 5. Statistics & Analytics
- **Token Usage Monitoring**: Detailed recording of AI Token consumption by novel and date.
- **Writing Trend Analysis**: Visual display of word count growth and Token consumption distribution.
- **Operation Logs**: Record key system activities to ensure the creative process is traceable.

#### 6. Highly Customizable AI Configuration
- **Multi-Provider Support**: Native support for Google Gemini, OpenAI, DeepSeek, and any custom OpenAI-compatible endpoints.
- **Advanced Parameter Tuning**: Support for adjusting Temperature, Top P, Top K, and max tokens.

#### 7. Ultimate Writing Experience
- **Diverse Layouts**: Provides Standard, Web Novel, and Traditional layout styles with real-time preview.
- **Markdown Support**: Full-featured Markdown rendering provides a clean and professional writing environment.
- **Auto-Save**: Real-time saving of creative content to prevent loss of inspiration.

#### 8. Automation & Export
- **Scheduled Tasks**: Support for creating one-time or daily recurring automated generation tasks.
- **Multi-Format Export**: Support for exporting works to Markdown or standard EPUB ebook formats.

### Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React, Framer Motion
- **Backend**: Node.js (Express), SQLite (Better-SQLite3)
- **Charts**: Recharts
- **Export**: JSZip, File-saver

### Quick Start
1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Configure your AI API key in the settings menu.
