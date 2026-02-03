/**
 * 状态类型定义 - 来自 v1 eva-chat-prototype
 * 用于模拟对话模式的场景和状态切换
 */

// 对话模式
export type ChatMode = 'real' | 'mock';

// 视图模式（Playground / 独立网页 / 页面嵌入）
export type ViewMode = 'playground' | 'standalone' | 'widget';

// 场景类型
export type Scenario = 'A' | 'B' | 'C' | 'D';

// 消息状态
export type MockMessageState = 'thinking' | 'executing' | 'streaming' | 'complete' | 'stopped' | 'failed';

// 停止场景类型（当 messageState 为 stopped 时使用）
export type StopScenario = 'thinking' | 'executing' | 'streaming';

// 任务进度（场景C/D）
export type TaskProgress = 'task1' | 'task2' | 'task3' | 'task4';

// 页面视图状态
export type PageViewState = 'init' | 'welcome' | 'conversation';

// 页面状态配置
export interface PageStateConfig {
  pageView: PageViewState;
  scenario: Scenario;
  messageState: MockMessageState;
  taskProgress?: TaskProgress;
  stopScenario?: StopScenario;  // 停止场景（当 messageState 为 stopped 时使用）
}

// 渲染模式（来自 v2）
export type RenderMode = 'timeline' | 'separated-realtime' | 'separated-delayed' | 'separated-smart';

// 结果样式（来自 v2）
export type ResultStyle = 'with-bg' | 'no-bg';

// 会话历史
export interface ChatSession {
  id: string;
  title: string;
  date: string;
  dateGroup: 'today' | 'yesterday' | 'earlier';
}

// ============================================
// 附件相关类型
// ============================================

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
