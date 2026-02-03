/**
 * 类型定义 - 对齐 Agent Service OpenAPI
 */

// 消息角色
export type MessageRole = 'user' | 'assistant' | 'tool' | 'system';

// 消息状态
export type MessageStatus = 'in_progress' | 'final' | 'failed' | 'canceled';

// Run 状态
export type RunStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';

// Content Block 类型
export interface TextContentBlock {
  type: 'text';
  text: string;
}

export interface ToolUseContentBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export type ContentBlock = TextContentBlock | ToolUseContentBlock;

// 消息结构（对齐 ConversationMessage schema）
export interface ConversationMessage {
  id: string;
  run_id: string;
  seq: number;
  role: MessageRole;
  status: MessageStatus;
  content_text: string | null;
  content_json: {
    role: string;
    content: ContentBlock[];
  } | null;
  tool_call_id?: string;
  tool_name?: string;
  skill_id?: string;
  skill_key?: string;
  skill_version?: number;
  created_at?: string;
  updated_at?: string;
}

// Chat Run 响应
export interface ChatRunResponse {
  run_id: string;
  conversation_id: string;
  status: RunStatus;
  active_run_id?: string;
}

// API 响应包装
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp?: string;
}

// SSE 事件类型
export interface SSEEvent {
  event: string;
  data: unknown;
  id?: string;
}

// 消息增量更新事件（实际格式）
export interface MessageDeltaEvent {
  turn_id: string;
  run_id: string;
  conversation_id: string;
  message_id: string;
  seq: number;
  offset: number;
  delta: string;  // 增量文本是字符串
  text_length: number;
  llm_call_id: string;
}

// 消息完整更新事件
export interface MessageUpsertEvent {
  message_id: string;
  seq: number;
  role: MessageRole;
  status: MessageStatus;
  content_text: string;
  content_json: {
    role: string;
    content: ContentBlock[];
    tool_call_id?: string;
    name?: string;
  };
  tool_call_id?: string;
  tool_name?: string;
  skill_id?: string;
  skill_key?: string;
  skill_version?: number;
  turn_id: string;
  run_id: string;
  conversation_id: string;
  llm_call_id?: string;
}

// 工具名称映射（管理员视角）
export const TOOL_NAME_MAP: Record<string, string> = {
  'knowledge_search_tool': '知识库查询',
  'web_search': '网络搜索',
  'weather_query': '天气查询',
  'calculator': '计算器',
  'write_todos': '更新任务列表',
  'task': '子任务',
  'search': '搜索',
  'read_file': '读取文件',
  'write_file': '写入文件',
};

// 工具名称映射（终端用户视角 - 执行中）
export const TOOL_NAME_MAP_USER_RUNNING: Record<string, string> = {
  'knowledge_search_tool': '正在查找资料...',
  'web_search': '正在搜索网络...',
  'weather_query': '正在查询天气...',
  'calculator': '正在计算...',
  'write_todos': '正在规划任务...',
  'task': '正在处理中...',
  'search': '正在搜索...',
  'read_file': '正在读取文件...',
  'write_file': '正在写入文件...',
};

// 工具名称映射（终端用户视角 - 完成过渡）
export const TOOL_NAME_MAP_USER_DONE: Record<string, string> = {
  'knowledge_search_tool': '资料查找完成，正在分析...',
  'web_search': '搜索完成，正在整理结果...',
  'weather_query': '天气查询完成，正在整理...',
  'calculator': '计算完成，正在整理结果...',
  'write_todos': '任务规划完成...',
  'task': '处理完成，正在整理...',
  'search': '搜索完成，正在整理...',
  'read_file': '文件读取完成...',
  'write_file': '文件写入完成...',
};

// Skill 名称映射（管理员视角）
export const SKILL_NAME_MAP: Record<string, string> = {
  'customer_service': '智能客服能力',
  'content_marketing': '内容营销能力',
  'content_creator': '营销内容创作能力',
  'sales_promotion': '销售推广能力',
  'business_intelligence': '商业情报能力',
  'data_analysis': '数据分析能力',
};

// Skill 名称映射（终端用户视角 - 执行中）
export const SKILL_NAME_MAP_USER_RUNNING: Record<string, string> = {
  'customer_service': '正在查询相关信息...',
  'content_marketing': '正在创作内容...',
  'content_creator': '正在创作内容...',
  'sales_promotion': '正在分析推广方案...',
  'business_intelligence': '正在分析商业信息...',
  'data_analysis': '正在分析数据...',
};

// Skill 名称映射（终端用户视角 - 完成过渡）
export const SKILL_NAME_MAP_USER_DONE: Record<string, string> = {
  'customer_service': '已完成查询，正在整理回复...',
  'content_marketing': '内容创作完成，正在整理...',
  'content_creator': '内容创作完成，正在整理...',
  'sales_promotion': '推广方案分析完成，正在整理...',
  'business_intelligence': '商业信息分析完成，正在整理...',
  'data_analysis': '数据分析完成，正在生成报告...',
};

// 获取工具友好名称（管理员视角）
export function getToolFriendlyName(toolName: string): string {
  return TOOL_NAME_MAP[toolName] || toolName;
}

// 获取工具友好名称（终端用户视角 - 执行中）
export function getToolFriendlyNameForUserRunning(toolName: string): string {
  return TOOL_NAME_MAP_USER_RUNNING[toolName] || '正在处理中...';
}

// 获取工具友好名称（终端用户视角 - 完成过渡）
export function getToolFriendlyNameForUserDone(toolName: string): string {
  return TOOL_NAME_MAP_USER_DONE[toolName] || '处理完成，正在整理...';
}

// 获取 Skill 友好名称（管理员视角）
export function getSkillFriendlyName(skillKey: string): string {
  return SKILL_NAME_MAP[skillKey] || skillKey;
}

// 获取 Skill 友好名称（终端用户视角 - 执行中）
export function getSkillFriendlyNameForUserRunning(skillKey: string): string {
  return SKILL_NAME_MAP_USER_RUNNING[skillKey] || '正在处理中...';
}

// 获取 Skill 友好名称（终端用户视角 - 完成过渡）
export function getSkillFriendlyNameForUserDone(skillKey: string): string {
  return SKILL_NAME_MAP_USER_DONE[skillKey] || '处理完成，正在整理...';
}

// 知识库搜索调用记录
export interface KnowledgeSearchCall {
  message_id: string;
  tool_call_id: string;
  request: {
    query?: string;
    limit?: number;
    [key: string]: unknown;
  };
  // response_json 可能是对象或字符串（需要解析）
  response_json?: unknown;
  response_text?: string;
  created_at?: string;
}

// 知识引用信息（用于 UI 展示）
export interface KnowledgeReference {
  fileName: string;
  filePath?: string;
  content?: string;
  score?: number;
}
