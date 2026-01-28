// 视角类型
export type ViewMode = 'playground' | 'standalone' | 'widget';

/**
 * 页面视图状态（对齐 PRD v3 3.1 欢迎页模块）
 * - init: 初始化引导页（企业未完成初始化）
 * - welcome: 欢迎页（企业已初始化，空会话）
 * - conversation: 对话中（有消息）
 */
export type PageViewState = 'init' | 'welcome' | 'conversation';

// ============================================
// 场景和状态定义（对齐 PRD v3 3.3.2 场景交互详解）
// ============================================

/**
 * 场景类型
 * - A: 直接回答（无工具调用、无任务规划）
 * - B: 工具调用（有调用栈，无任务列表）
 * - C: 任务规划-无确认（有任务列表，一次完成）
 * - D: 任务规划-有确认（有任务列表，多轮对话）
 */
export type Scenario = 'A' | 'B' | 'C' | 'D';

/**
 * 消息状态
 * - thinking: 正在思考（无输出）
 * - executing: 执行中（有工具调用或任务执行）
 * - streaming: 流式输出中
 * - complete: 正常完成
 * - stopped: 用户停止
 * - failed: 执行失败
 */
export type MessageState = 'thinking' | 'executing' | 'streaming' | 'complete' | 'stopped' | 'failed';

/**
 * 场景子状态（场景C/D的任务执行进度）
 * - task1: 任务1执行中
 * - task2: 任务2执行中
 * - task3: 任务3执行中
 * - task4: 任务4执行中
 * - confirm: 等待用户确认（场景D专用）
 */
export type TaskProgress = 'task1' | 'task2' | 'task3' | 'task4' | 'confirm';

/**
 * 页面状态配置
 */
export interface PageStateConfig {
  scenario: Scenario;
  messageState: MessageState;
  taskProgress?: TaskProgress;  // 仅场景C/D使用
}

// 旧版 PageState 类型（保留兼容）
export type PageState =
  | 'empty'              // 空状态（欢迎页）
  | 'with-attachment'    // 输入栏有附件
  | 'thinking'           // 正在思考
  | 'executing-multi'    // 执行中（多能力）
  | 'executing-single'   // 执行中（单能力）
  | 'streaming-multi'    // 流式输出（多能力）
  | 'streaming-single'   // 流式输出（单能力）
  | 'streaming-direct'   // 流式输出（直接回答）
  | 'complete-multi'     // 完成（多能力）
  | 'complete-single'    // 完成（单能力）
  | 'complete-direct'    // 完成（直接回答）
  | 'stopped'            // 已停止
  | 'failed';            // 生成失败

// ============================================
// Agent 消息三层结构（对齐 PRD v3 3.3.3 组件规格）
// ============================================

/**
 * 状态栏文案
 * - 思考中: "正在思考..."
 * - 执行任务: "正在执行：{任务描述}"
 * - 已停止: "回答已停止"
 * - 失败: "出了点问题"
 * - 完成: null (隐藏)
 */
export interface StatusBarConfig {
  visible: boolean;
  text: string;
  type: 'thinking' | 'executing' | 'stopped' | 'failed';
}

/**
 * 工具调用状态
 */
export type ToolStatus = 'running' | 'done' | 'failed';

/**
 * 工具调用项
 */
export interface ToolCall {
  id: string;
  toolId: string;       // 工具标识符
  friendlyName: string; // 友好名称（如：📚 查阅知识库）
  status: ToolStatus;
  children?: ToolCall[]; // 嵌套调用
}

/**
 * 调用栈配置
 */
export interface CallStackConfig {
  visible: boolean;
  expanded: boolean;     // 是否展开
  tools: ToolCall[];
}

/**
 * 内容区配置
 */
export interface ContentAreaConfig {
  visible: boolean;
  content: string;
  isStreaming: boolean;
  knowledgeSources?: KnowledgeSource[];
}

// ============================================
// 任务列表（对齐 PRD v3 3.3.3.4）
// ============================================

/**
 * 任务状态
 * - pending: 待执行 ⏳
 * - in_progress: 进行中 🔄
 * - completed: 已完成 ✅
 */
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

/**
 * 任务项
 */
export interface TaskItem {
  id: string;
  content: string;      // 任务描述
  status: TaskStatus;
}

/**
 * 任务列表配置
 */
export interface TaskListConfig {
  visible: boolean;
  expanded: boolean;
  title: string;        // "执行任务" / "已完成" / "已停止"
  tasks: TaskItem[];
  completedCount: number;
  totalCount: number;
}

// ============================================
// 工具名称映射（对齐 PRD v3 3.3.3.2）
// ============================================

export const TOOL_NAME_MAP: Record<string, string> = {
  'knowledge_search_tool': '📚 查阅知识库',
  'web_search': '🔍 搜索网络',
  'weather_query': '🌤️ 查询天气',
  'calculator': '🔢 计算',
  'task_customer_service': '⚡ 智能客服',
  'task_content_marketing': '⚡ 内容营销',
  'task_sales_promotion': '⚡ 销售推广',
  'task_business_intelligence': '⚡ 商业情报',
};

export const DEFAULT_TOOL_NAME = '🔧 使用工具中...';

// ============================================
// 其他类型定义
// ============================================

// 功能演示选项
export interface FeatureOptions {
  showKnowledgeRef: boolean;
  showFeedbackPanel: boolean;
  showHistory: boolean;
}

// 知识引用（按文件去重）
export interface KnowledgeSource {
  fileId: string;
  fileName: string;
}

// 执行步骤（旧版，保留兼容）
export interface ExecutionStep {
  id: string;
  name: string;
  status: 'done' | 'running' | 'pending';
  subSteps?: ExecutionSubStep[];
}

export interface ExecutionSubStep {
  id: string;
  name: string;
  status: 'done' | 'running' | 'pending';
}

// 会话历史
export interface ChatSession {
  id: string;
  title: string;
  date: string;
  dateGroup: 'today' | 'yesterday' | 'earlier';
}

// 反馈标签
export type FeedbackTag =
  | 'unmatched'
  | 'incorrect'
  | 'unhelpful'
  | 'privacy'
  | 'other'
  | 'unresolved'
  | 'wrong';

// 附件类型
export type AttachmentType = 'image' | 'document';

// 附件上传状态
export type AttachmentStatus = 'uploading' | 'success' | 'error';

// 附件
export interface Attachment {
  id: string;
  type: AttachmentType;
  name: string;
  size: number;
  url?: string;           // 上传成功后的 URL
  previewUrl?: string;    // 图片预览 URL（本地 blob URL）
  status: AttachmentStatus;
  progress?: number;      // 上传进度 0-100
  error?: string;         // 错误信息
}

// 支持的文件类型
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const SUPPORTED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv'
];

// 文件大小限制（字节）
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;  // 10MB
export const MAX_DOC_SIZE = 20 * 1024 * 1024;    // 20MB
export const MAX_ATTACHMENTS = 5;
