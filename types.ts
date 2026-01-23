// 视角类型
export type ViewMode = 'playground' | 'standalone' | 'widget';

// 页面状态类型
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

// 执行步骤
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
