/**
 * Agent Service API 客户端
 * 支持 SSE 流式对话
 */

import { ChatRunResponse, ApiResponse, ConversationMessage, KnowledgeSearchCall } from './types';

// API 配置
const API_BASE_URL = '/agentService';

// 存储 token（演示用，实际应使用更安全的方式）
let authToken: string = '';

export function setAuthToken(token: string) {
  authToken = token;
}

export function getAuthToken(): string {
  return authToken;
}

// 通用请求头
function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
  };
}

// 创建 Chat Run
export async function createChatRun(
  agentId: string,
  message: string,
  conversationId?: string
): Promise<ChatRunResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/chat/runs`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      agent_id: agentId,
      message,
      conversation_id: conversationId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create chat run: ${response.status}`);
  }

  const result: ApiResponse<ChatRunResponse> = await response.json();
  return result.data;
}

// 取消 Chat Run
export async function cancelChatRun(runId: string): Promise<ChatRunResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/chat/runs/${runId}/cancel`, {
    method: 'PATCH',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to cancel chat run: ${response.status}`);
  }

  const result: ApiResponse<ChatRunResponse> = await response.json();
  return result.data;
}

// 获取会话消息
export async function getConversationMessages(
  agentId: string,
  conversationId: string,
  limit = 100,
  beforeSeq?: number
): Promise<{ messages: ConversationMessage[]; has_more: boolean }> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    ...(beforeSeq !== undefined ? { before_seq: beforeSeq.toString() } : {}),
  });

  const response = await fetch(
    `${API_BASE_URL}/api/v1/agents/${agentId}/conversations/${conversationId}/messages?${params}`,
    {
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get messages: ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

// SSE 事件流订阅
export interface SSECallbacks {
  onOpen?: () => void;
  onMessage?: (event: string, data: unknown) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

export function subscribeToRunEvents(
  runId: string,
  callbacks: SSECallbacks,
  afterEventId?: string
): () => void {
  const params = new URLSearchParams();
  if (afterEventId) {
    params.set('after', afterEventId);
  }

  const url = `${API_BASE_URL}/api/v1/chat/runs/${runId}/events?${params}`;

  // 使用 EventSource 进行 SSE 连接
  // 注意：EventSource 不支持自定义 header，需要通过 query param 或其他方式传递 token
  // 这里使用 fetch + ReadableStream 实现

  let aborted = false;
  const abortController = new AbortController();

  const connect = async () => {
    try {
      const response = await fetch(url, {
        headers: {
          ...getHeaders(),
          'Accept': 'text/event-stream',
        },
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`SSE connection failed: ${response.status}`);
      }

      callbacks.onOpen?.();

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (!aborted) {
        const { done, value } = await reader.read();

        if (done) {
          callbacks.onClose?.();
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // 解析 SSE 事件
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';
        let currentData = '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            currentData = line.slice(5).trim();
          } else if (line === '' && currentEvent && currentData) {
            // 空行表示事件结束
            try {
              const data = JSON.parse(currentData);
              callbacks.onMessage?.(currentEvent, data);
            } catch {
              // 非 JSON 数据
              callbacks.onMessage?.(currentEvent, currentData);
            }
            currentEvent = '';
            currentData = '';
          }
        }
      }
    } catch (error) {
      if (!aborted) {
        callbacks.onError?.(error as Error);
      }
    }
  };

  connect();

  // 返回取消函数
  return () => {
    aborted = true;
    abortController.abort();
  };
}

// 获取 Agent 列表
export async function getAgents(): Promise<Array<{
  id: string;
  name: string;
  username: string;
  status: string;
}>> {
  const response = await fetch(`${API_BASE_URL}/api/v1/agents`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get agents: ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

// 获取知识库搜索调用记录
export async function getKnowledgeSearchCalls(
  agentId: string,
  conversationId: string,
  messageId: string
): Promise<KnowledgeSearchCall[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/agents/${agentId}/conversations/${conversationId}/messages/${messageId}/knowledge-search-calls`,
    {
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    // 如果是 404，返回空数组（没有知识库调用）
    if (response.status === 404) {
      return [];
    }
    throw new Error(`Failed to get knowledge search calls: ${response.status}`);
  }

  const result = await response.json();
  return result.data || [];
}
