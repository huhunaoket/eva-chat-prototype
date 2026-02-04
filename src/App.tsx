/**
 * Agent Chat Prototype - 主应用
 *
 * 支持两种对话模式：
 * - 真实对话：连接 Agent Service API，SSE 流式对话
 * - 模拟对话：使用预设场景数据，静态状态展示
 *
 * 支持两种渲染方案：
 * - 方案一：时间线式渲染（Playground）
 * - 方案二：执行过程与输出结果分离（终端用户页）
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Download, Trash2, ChevronDown, ChevronRight, Loader2, CheckCircle2, ClipboardList, Clock, Plus, History, Copy, Check } from 'lucide-react';
import {
  createChatRun,
  cancelChatRun,
  subscribeToRunEvents,
  getAgents,
  setAuthToken,
  getConversationMessages,
  getKnowledgeSearchCalls,
} from './api';
import { TurnMessage, TurnData, TurnMessageItem } from './components/TurnMessage';
import { TurnMessageV2, TurnDataV2 } from './components/TurnMessageV2';
import { ChatInput } from './components/ChatInput';
import { StateSwitcher } from './components/StateSwitcher';
import { Sidebar, DashboardView, User, Company, mockUser, mockCompany } from './components/dashboard/Sidebar';
import { DeploymentView } from './components/dashboard/DeploymentView';
import { SecurityCenter } from './components/dashboard/SecurityCenter';
import { ChatHistory } from './components/ChatHistory';
import { StandaloneLayout } from './components/StandaloneLayout';
import { WidgetLayout } from './components/WidgetLayout';
import { getMockTurnData, getMockTodos, getScenarioDMultiTurnData, mockAttachments } from './data/mockData';
import {
  ChatMode,
  ViewMode,
  RenderMode,
  ResultStyle,
  PageStateConfig,
  Attachment,
} from './types';

// Agent 信息
interface AgentInfo {
  id: string;
  name: string;
}

// 默认凭据
const DEFAULT_TOKEN = 'da66e7e7-4efa-4623-83b4-6d9f3fcb684b';
const DEFAULT_AGENT_ID = 'd03261cb-3275-425b-8193-e3a7f6b66e65';

// 用户消息组件
interface UserMessageProps {
  content: string;
  attachments?: Attachment[];
}

const UserMessage: React.FC<UserMessageProps> = ({ content, attachments }) => {
  const hasAttachments = attachments && attachments.length > 0;
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!content) return;
    
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // 降级方案：使用 execCommand
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div 
      className="flex justify-end"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="max-w-[80%] space-y-2">
        {/* 附件展示 */}
        {hasAttachments && (
          <div className="flex flex-wrap gap-2 justify-end">
            {attachments.map(att => (
              <AttachmentCardDisplay 
                key={att.id} 
                attachment={att}
              />
            ))}
          </div>
        )}
        {/* 文字内容 */}
        {content && (
          <div className="bg-blue-500 text-white text-sm px-4 py-3 rounded-2xl rounded-tr-md whitespace-pre-wrap">
            {content}
          </div>
        )}
        {/* 操作栏 - 始终占位，hover 时显示，紧贴气泡 */}
        <div className="flex justify-end h-6 -mt-1">
          <button
            onClick={handleCopy}
            className={`p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            title="复制"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
};

// 用户消息中的附件卡片（简化版，不可删除）
const AttachmentCardDisplay: React.FC<{ attachment: Attachment }> = ({ attachment }) => {
  const { type, name, size, url, previewUrl } = attachment;
  const displayImageUrl = url || previewUrl;
  
  // 截断文件名
  const truncateFileName = (name: string, maxLength: number = 14): string => {
    if (name.length <= maxLength) return name;
    const ext = name.lastIndexOf('.') > 0 ? name.slice(name.lastIndexOf('.')) : '';
    const baseName = name.slice(0, name.length - ext.length);
    const keepLength = maxLength - ext.length - 3;
    if (keepLength <= 0) return name.slice(0, maxLength - 3) + '...';
    return baseName.slice(0, keepLength) + '...' + ext;
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 获取文件图标背景色
  const getFileIconBg = (name: string): string => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (['doc', 'docx'].includes(ext)) return 'bg-blue-100 text-blue-600';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'bg-green-100 text-green-600';
    if (['pdf'].includes(ext)) return 'bg-red-100 text-red-600';
    return 'bg-gray-100 text-gray-600';
  };

  // 获取文件图标文字
  const getFileIconText = (name: string): string => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (['doc', 'docx'].includes(ext)) return 'W';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'X';
    if (['pdf'].includes(ext)) return 'P';
    return ext.slice(0, 2).toUpperCase() || 'F';
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-white/90 border border-gray-200 rounded-xl min-w-[160px] max-w-[200px]">
      {/* 图标 */}
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
        type === 'image' && displayImageUrl ? '' : getFileIconBg(name)
      }`}>
        {type === 'image' && displayImageUrl ? (
          <img src={displayImageUrl} alt={name} className="w-10 h-10 rounded-lg object-cover" />
        ) : (
          <span className="text-sm font-semibold">{getFileIconText(name)}</span>
        )}
      </div>

      {/* 文件信息 */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate text-gray-700">
          {truncateFileName(name)}
        </div>
        <div className="text-xs text-gray-400">
          {formatFileSize(size)}
        </div>
      </div>
    </div>
  );
};

// 初始化引导页
const InitGuidePage: React.FC = () => (
  <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-12">
    <div className="w-16 h-16 mb-6 rounded-full bg-blue-100 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
    <h2 className="text-xl font-semibold text-slate-800 mb-3">智能体创建中</h2>
    <p className="text-slate-500 max-w-md">完成初始化后即可开始测试 Agent</p>
  </div>
);

// 欢迎页
interface WelcomePageProps {
  onSendQuestion?: (question: string) => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onSendQuestion }) => {
  const suggestedQuestions = [
    '你们企业是做什么的',
    '模仿朱自清背景写一个2000字的作文',
    '帮我写一篇奥茗智源的小红书营销文章',
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-12 h-full">
      <div className="flex flex-col items-center justify-center flex-1">
        <p className="text-lg text-slate-600 mb-8">很高兴为您服务，请问有什么可以帮您？</p>
        {onSendQuestion && (
          <div className="flex flex-wrap justify-center gap-3 max-w-lg">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => onSendQuestion(q)}
                className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  // 对话模式
  const [chatMode, setChatMode] = useState<ChatMode>(() => {
    const saved = localStorage.getItem('chat_mode');
    if (saved === 'real' || saved === 'mock') return saved;
    return 'real';
  });

  // 视图模式
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('view_mode');
    if (saved === 'playground' || saved === 'standalone' || saved === 'widget') return saved;
    return 'playground';
  });

  // 模拟模式状态配置
  const [stateConfig, setStateConfig] = useState<PageStateConfig>({
    pageView: 'conversation',
    scenario: 'A',
    messageState: 'complete',
  });

  // Sidebar 状态
  const [currentView, setCurrentView] = useState<DashboardView>('playground');
  const [showHistory, setShowHistory] = useState(false);
  const [user] = useState<User>(mockUser);
  const [company] = useState<Company>(mockCompany);

  // 配置状态
  const [token] = useState(() => localStorage.getItem('agent_token') || DEFAULT_TOKEN);
  const [agentId, setAgentId] = useState(() => localStorage.getItem('agent_id') || DEFAULT_AGENT_ID);
  const [, setAgents] = useState<AgentInfo[]>([]);

  // 渲染方案切换
  const [renderMode, setRenderMode] = useState<RenderMode>(() => {
    const saved = localStorage.getItem('render_mode');
    // 兼容旧值
    if (saved === 'separated') return 'separated-smart';
    if (saved === 'timeline' || saved === 'separated-realtime' || saved === 'separated-delayed' || saved === 'separated-smart') {
      return saved;
    }
    return 'separated-smart';
  });

  // 结果样式状态
  const [resultStyle, setResultStyle] = useState<ResultStyle>(() => {
    const saved = localStorage.getItem('result_style');
    if (saved === 'with-bg' || saved === 'no-bg') {
      return saved;
    }
    return 'no-bg';
  });

  // 对话状态
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userMessages, setUserMessages] = useState<Array<{ id: string; content: string }>>([]);

  // 方案一的 Turn 数据
  const [turns, setTurns] = useState<Map<string, TurnData>>(new Map());
  // 方案二的 Turn 数据
  const [turnsV2, setTurnsV2] = useState<Map<string, TurnDataV2>>(new Map());

  const [_currentTurnId, setCurrentTurnId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);

  // 全局 TodoList 状态
  const [globalTodos, setGlobalTodos] = useState<Array<{ content: string; status: string; activeForm?: string }>>([]);
  const [todosExpanded, setTodosExpanded] = useState(true);

  // 调试状态
  const [debugLogs, setDebugLogs] = useState<Array<{ timestamp: string; event: string; data: unknown }>>([]);
  const [showDebug, setShowDebug] = useState(false);
  
  // 工具卡片展开开关（默认关闭）
  const [enableToolExpand, setEnableToolExpand] = useState(false);
  
  // 终端用户执行过程展示模式（默认简化）
  const [userProcessMode, setUserProcessMode] = useState<'simple' | 'detailed'>('simple');

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const cancelSSERef = useRef<(() => void) | null>(null);
  const isAtBottomRef = useRef(true);

  // 调试日志
  const addDebugLog = useCallback((event: string, data: unknown) => {
    const log = {
      timestamp: new Date().toISOString(),
      event,
      data: JSON.parse(JSON.stringify(data)),
    };
    setDebugLogs(prev => [...prev, log]);
    console.log(`[DEBUG] ${event}:`, data);
  }, []);

  const exportDebugLogs = () => {
    const blob = new Blob([JSON.stringify(debugLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 导出对话为 HTML（用于调试分析）
  const exportChatAsHTML = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const currentTurnsData = renderMode === 'timeline'
      ? Array.from(turns.values())
      : Array.from(turnsV2.values());

    // 生成 HTML 内容
    const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chat Debug Export - ${timestamp}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f3f4f6; padding: 20px; }
    .container { max-width: 900px; margin: 0 auto; }
    h1 { font-size: 1.5rem; margin-bottom: 1rem; color: #1f2937; }
    .meta { background: #e5e7eb; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 0.875rem; }
    .meta-item { margin: 4px 0; }
    .message { margin-bottom: 16px; }
    .user-message { display: flex; justify-content: flex-end; }
    .user-bubble { background: #3b82f6; color: white; padding: 12px 16px; border-radius: 16px; border-top-right-radius: 4px; max-width: 80%; }
    .assistant-message { display: flex; justify-content: flex-start; }
    .assistant-bubble { background: white; border: 1px solid #e5e7eb; padding: 12px 16px; border-radius: 16px; border-top-left-radius: 4px; max-width: 85%; }
    .process-area { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; margin-bottom: 12px; }
    .process-title { font-weight: 600; color: #4b5563; margin-bottom: 8px; font-size: 0.875rem; }
    .process-item { padding: 8px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 6px; font-size: 0.875rem; }
    .tool-call { color: #4b5563; }
    .tool-result { margin-left: 24px; background: #f3f4f6; font-family: monospace; font-size: 0.75rem; white-space: pre-wrap; word-break: break-all; max-height: 200px; overflow: auto; }
    .status-done { color: #22c55e; }
    .status-running { color: #3b82f6; }
    .status-failed { color: #ef4444; }
    .final-result { margin-top: 8px; }
    .debug-section { margin-top: 30px; border-top: 2px solid #e5e7eb; padding-top: 20px; }
    .debug-section h2 { font-size: 1.25rem; margin-bottom: 1rem; color: #374151; }
    .debug-log { background: #1f2937; color: #e5e7eb; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 0.75rem; white-space: pre-wrap; word-break: break-all; max-height: 400px; overflow: auto; margin-bottom: 12px; }
    .raw-data { background: #f3f4f6; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 0.75rem; white-space: pre-wrap; word-break: break-all; max-height: 500px; overflow: auto; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 Chat Debug Export</h1>

    <div class="meta">
      <div class="meta-item"><strong>导出时间:</strong> ${new Date().toLocaleString('zh-CN')}</div>
      <div class="meta-item"><strong>Agent ID:</strong> ${agentId}</div>
      <div class="meta-item"><strong>Conversation ID:</strong> ${conversationId || 'N/A'}</div>
      <div class="meta-item"><strong>渲染模式:</strong> ${renderMode === 'timeline' ? '时间线式' : renderMode === 'separated-realtime' ? '实时分离式' : '延迟分离式'}</div>
      <div class="meta-item"><strong>消息数量:</strong> ${userMessages.length} 条用户消息, ${currentTurnsData.length} 个 Turn</div>
    </div>

    <h2 style="margin-bottom: 16px;">💬 对话内容</h2>

    ${messageList.map((item) => {
      if (item.type === 'user') {
        return `<div class="message user-message">
          <div class="user-bubble">${escapeHtml(item.content || '')}</div>
        </div>`;
      } else if (item.type === 'turn') {
        if ((renderMode === 'separated-realtime' || renderMode === 'separated-delayed' || renderMode === 'separated-smart') && item.turnV2) {
          const turn = item.turnV2;
          return `<div class="message assistant-message">
            <div class="assistant-bubble">
              <div class="meta-item" style="font-size: 0.75rem; color: #9ca3af; margin-bottom: 8px;">
                Turn ID: ${turn.turnId} | Status: ${turn.status} | hasToolCall: ${turn.hasToolCall} | isResultConfirmed: ${turn.isResultConfirmed}
              </div>
              ${turn.hasToolCall || turn.processItems.length > 0 ? `
                <div class="process-area">
                  <div class="process-title">执行过程 (${turn.processItems.filter(p => p.type === 'tool_call').length})</div>
                  ${turn.processItems.map(p => {
                    if (p.type === 'text') {
                      return `<div class="process-item" style="color: #9ca3af; font-style: italic;">💬 ${escapeHtml(p.content || '')}</div>`;
                    } else if (p.type === 'tool_call') {
                      return `<div class="process-item tool-call">
                        🔧 ${p.skillKey ? `${p.skillKey} → ` : ''}${p.toolName}
                        <span class="status-${p.status}">${p.status === 'done' ? '✅' : p.status === 'running' ? '⏳' : '❌'}</span>
                        ${p.input ? `<div style="font-size: 0.7rem; color: #6b7280; margin-top: 4px;">Input: ${escapeHtml(JSON.stringify(p.input).substring(0, 200))}...</div>` : ''}
                      </div>`;
                    } else if (p.type === 'tool_result') {
                      return `<div class="process-item tool-result">↳ ${p.toolName} 返回:\n${escapeHtml((p.content || '').substring(0, 500))}${(p.content || '').length > 500 ? '...(truncated)' : ''}</div>`;
                    }
                    return '';
                  }).join('')}
                </div>
              ` : ''}
              ${turn.pendingText ? `<div class="process-item" style="color: #6b7280;">⏳ Pending: ${escapeHtml(turn.pendingText)}</div>` : ''}
              ${turn.finalResult ? `<div class="final-result">${escapeHtml(turn.finalResult)}</div>` : ''}
            </div>
          </div>`;
        } else if (renderMode === 'timeline' && item.turn) {
          const turn = item.turn;
          return `<div class="message assistant-message">
            <div class="assistant-bubble">
              <div class="meta-item" style="font-size: 0.75rem; color: #9ca3af; margin-bottom: 8px;">
                Turn ID: ${turn.turnId} | Status: ${turn.status} | Messages: ${turn.messages.length}
              </div>
              ${turn.messages.map(msg => `
                <div class="process-item">
                  <strong>${msg.role}</strong> (seq: ${msg.seq}, status: ${msg.status})
                  ${msg.toolName ? ` | Tool: ${msg.toolName}` : ''}
                  <div style="margin-top: 4px;">${escapeHtml(msg.contentText || '')}</div>
                </div>
              `).join('')}
              ${turn.streamingText ? `<div style="margin-top: 8px; color: #3b82f6;">Streaming: ${escapeHtml(turn.streamingText)}</div>` : ''}
            </div>
          </div>`;
        }
      }
      return '';
    }).join('\n')}

    <div class="debug-section">
      <h2>📋 调试日志 (${debugLogs.length} 条)</h2>
      ${debugLogs.slice(-50).map(log => `
        <div class="debug-log">
          <div style="color: #9ca3af;">${log.timestamp}</div>
          <div style="color: #60a5fa; margin: 4px 0;">[${log.event}]</div>
          <div>${escapeHtml(JSON.stringify(log.data, null, 2))}</div>
        </div>
      `).join('')}
    </div>

    <div class="debug-section">
      <h2>📦 原始数据</h2>
      <h3 style="font-size: 1rem; margin: 12px 0;">User Messages</h3>
      <div class="raw-data">${escapeHtml(JSON.stringify(userMessages, null, 2))}</div>

      <h3 style="font-size: 1rem; margin: 12px 0;">Turns Data (${renderMode})</h3>
      <div class="raw-data">${escapeHtml(JSON.stringify(
        currentTurnsData.map(t => ({
          ...t,
          processedToolCallIds: 'processedToolCallIds' in t && t.processedToolCallIds ? Array.from(t.processedToolCallIds as Set<string>) : undefined
        })), null, 2
      ))}</div>

      <h3 style="font-size: 1rem; margin: 12px 0;">Global Todos</h3>
      <div class="raw-data">${escapeHtml(JSON.stringify(globalTodos, null, 2))}</div>
    </div>
  </div>
</body>
</html>`;

    // 辅助函数：转义 HTML
    function escapeHtml(text: string): string {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br>');
    }

    // 下载文件
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-debug-${timestamp}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 滚动到底部（智能滚动 - 仅当用户在底部时）
  const scrollToBottom = useCallback((force = false) => {
    if (force || isAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // 检测是否在底部
  const checkIfAtBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      const threshold = 100; // 100px 容差
      isAtBottomRef.current =
        container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    }
  }, []);

  // 监听滚动事件
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkIfAtBottom);
      return () => container.removeEventListener('scroll', checkIfAtBottom);
    }
  }, [checkIfAtBottom]);

  // 当用户发送新消息时强制滚动到底部
  useEffect(() => {
    scrollToBottom(true);
  }, [userMessages.length, scrollToBottom]);

  // 流式输出时智能滚动（仅当已在底部时）
  useEffect(() => {
    scrollToBottom(false);
  }, [turns, turnsV2, scrollToBottom]);

  // 保存配置到 localStorage
  useEffect(() => {
    localStorage.setItem('agent_token', token);
    localStorage.setItem('agent_id', agentId);
    localStorage.setItem('render_mode', renderMode);
    setAuthToken(token);
  }, [token, agentId, renderMode]);

  // 加载 Agent 列表
  const loadAgents = async () => {
    if (!token) return;
    try {
      setAuthToken(token);
      const agentList = await getAgents();
      setAgents(agentList.map(a => ({ id: a.id, name: a.name })));
      if (!agentId && agentList.length > 0) {
        setAgentId(agentList[0].id);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  useEffect(() => {
    if (token) {
      loadAgents();
    }
  }, [token]);

  // 获取知识引用
  const fetchKnowledgeReferences = async (turnId: string, convId: string) => {
    if (!agentId || !convId) return;
    
    try {
      // 1. 获取会话消息
      const { messages } = await getConversationMessages(agentId, convId);
      addDebugLog('knowledge.messages', { turnId, convId, messageCount: messages.length, messages: messages.map(m => ({ id: m.id, role: m.role, tool_name: m.tool_name, run_id: m.run_id })) });
      
      // 筛选属于当前 turn 的 role=tool 消息（通过 run_id 匹配 turnId）
      const toolMessages = messages.filter(msg => msg.role === 'tool' && msg.run_id === turnId);
      
      if (toolMessages.length === 0) {
        addDebugLog('knowledge.noToolMessages', { turnId, convId });
        return;
      }
      
      // 2. 对每个 tool 消息尝试获取知识库调用
      const allReferences: Array<{ fileName: string; filePath?: string; content?: string; score?: number }> = [];
      
      for (const toolMsg of toolMessages) {
        try {
          const knowledgeCalls = await getKnowledgeSearchCalls(agentId, convId, toolMsg.id);
          addDebugLog('knowledge.searchCalls', { messageId: toolMsg.id, toolName: toolMsg.tool_name, callsCount: knowledgeCalls.length });
          
          // 从 response_json 中提取文件名
          for (const call of knowledgeCalls) {
            let responseJson = call.response_json;
            
            // 如果 response_json 是字符串，尝试解析
            if (typeof responseJson === 'string') {
              try {
                responseJson = JSON.parse(responseJson);
              } catch {
                addDebugLog('knowledge.parseError', { callId: call.tool_call_id });
                continue;
              }
            }
            
            if (!responseJson || typeof responseJson !== 'object') {
              addDebugLog('knowledge.noResponseJson', { callId: call.tool_call_id, type: typeof responseJson });
              continue;
            }
            
            // 支持两种格式：results 或 documents
            const responseObj = responseJson as { documents?: Array<Record<string, unknown>>; results?: Array<Record<string, unknown>> };
            const documents = responseObj.documents || [];
            const results = responseObj.results || [];
            const items = [...documents, ...results];
            
            addDebugLog('knowledge.extracting', { 
              callId: call.tool_call_id, 
              documentsCount: documents.length,
              resultsCount: results.length
            });
            
            for (const item of items) {
              // 支持两种字段名：file_name 或 title
              const fileName = (item.file_name || item.title) as string | undefined;
              if (fileName) {
                // 避免重复
                if (!allReferences.some(r => r.fileName === fileName)) {
                  allReferences.push({
                    fileName: fileName,
                    filePath: (item.file_path || item.link) as string | undefined,
                    content: item.content as string | undefined,
                    score: item.score as number | undefined,
                  });
                }
              }
            }
          }
        } catch (err) {
          // 404 是正常的，表示该消息没有知识库调用
          if (!(err instanceof Error && err.message.includes('404'))) {
            console.error('Failed to get knowledge calls for message:', toolMsg.id, err);
            addDebugLog('knowledge.error', { messageId: toolMsg.id, error: String(err) });
          }
        }
      }
      
      addDebugLog('knowledge.references', { turnId, references: allReferences });
      
      // 3. 更新 turn 的知识引用
      if (allReferences.length > 0) {
        setTurnsV2(prev => {
          const newTurns = new Map(prev);
          const turn = newTurns.get(turnId);
          if (turn) {
            newTurns.set(turnId, {
              ...turn,
              knowledgeReferences: allReferences,
            });
          }
          return newTurns;
        });
      }
    } catch (error) {
      console.error('Failed to fetch knowledge references:', error);
      addDebugLog('knowledge.error', { turnId, error: String(error) });
    }
  };

  // 发送消息
  const handleSendMessage = async (content: string, _attachments?: Attachment[]) => {
    if (!agentId || isLoading) return;
    // 注意：附件参数暂时未使用，等待后端接口支持

    // 添加用户消息
    const userMsgId = `user_${Date.now()}`;
    setUserMessages(prev => [...prev, { id: userMsgId, content }]);

    setIsLoading(true);

    try {
      // 创建 Chat Run
      addDebugLog('request.createChatRun', { agentId, content, conversationId });
      const runResponse = await createChatRun(agentId, content, conversationId || undefined);
      addDebugLog('response.createChatRun', runResponse);

      setCurrentRunId(runResponse.run_id);
      setConversationId(runResponse.conversation_id);
      setCurrentTurnId(runResponse.run_id); // turn_id 通常等于 run_id

      // 初始化 turn（方案一）
      setTurns(prev => {
        const newTurns = new Map(prev);
        newTurns.set(runResponse.run_id, {
          turnId: runResponse.run_id,
          status: 'pending',
          messages: [],
          streamingText: '',
        });
        return newTurns;
      });

      // 初始化 turn（方案二）
      setTurnsV2(prev => {
        const newTurns = new Map(prev);
        newTurns.set(runResponse.run_id, {
          turnId: runResponse.run_id,
          status: 'pending',
          displayMode: 'loading',  // 新增：初始为 loading 状态
          processItems: [],
          pendingText: '',
          finalResult: '',
          hasToolCall: false,
          isResultConfirmed: false,
          processedToolCallIds: new Set<string>(),
        });
        return newTurns;
      });

      // 订阅 SSE 事件
      const cancel = subscribeToRunEvents(runResponse.run_id, {
        onOpen: () => {
          console.log('SSE connection opened');
        },
        onMessage: (event, data) => {
          addDebugLog(event, data);
          handleSSEEvent(event, data, runResponse.run_id);
        },
        onError: (error) => {
          console.error('SSE error:', error);
          // 方案一
          setTurns(prev => {
            const newTurns = new Map(prev);
            const turn = newTurns.get(runResponse.run_id);
            if (turn) {
              newTurns.set(runResponse.run_id, { ...turn, status: 'failed' });
            }
            return newTurns;
          });
          // 方案二
          setTurnsV2(prev => {
            const newTurns = new Map(prev);
            const turn = newTurns.get(runResponse.run_id);
            if (turn) {
              newTurns.set(runResponse.run_id, { ...turn, status: 'failed' });
            }
            return newTurns;
          });
          setIsLoading(false);
        },
        onClose: () => {
          console.log('SSE connection closed');
          // 确保在连接关闭时，如果 turn 还没有确认结果，则标记为完成
          // 但要保留 canceled 状态
          setTurnsV2(prev => {
            const newTurns = new Map(prev);
            const turn = newTurns.get(runResponse.run_id);
            if (turn && !turn.isResultConfirmed) {
              // 如果已经是 canceled 状态，保持不变
              if (turn.status === 'canceled') {
                return newTurns;
              }
              // 将所有 running 状态的工具调用标记为完成
              const updatedProcessItems = turn.processItems.map(item => {
                if (item.type === 'tool_call' && item.status === 'running') {
                  return { ...item, status: 'done' as const };
                }
                return item;
              });
              newTurns.set(runResponse.run_id, {
                ...turn,
                processItems: updatedProcessItems,
                finalResult: turn.pendingText || turn.finalResult,
                pendingText: '',
                isResultConfirmed: true,
                status: turn.status === 'failed' ? 'failed' : 'complete',
              });
            }
            return newTurns;
          });
          setTurns(prev => {
            const newTurns = new Map(prev);
            const turn = newTurns.get(runResponse.run_id);
            if (turn && turn.status !== 'complete' && turn.status !== 'failed' && turn.status !== 'canceled') {
              newTurns.set(runResponse.run_id, { ...turn, status: 'complete' });
            }
            return newTurns;
          });
          setIsLoading(false);
          setCurrentRunId(null);
          setCurrentTurnId(null);
          cancelSSERef.current = null;
          
          // 获取知识引用
          fetchKnowledgeReferences(runResponse.run_id, runResponse.conversation_id);
        },
      });

      cancelSSERef.current = cancel;
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
    }
  };

  // 处理 SSE 事件
  const handleSSEEvent = (event: string, data: unknown, turnId: string) => {
    const eventData = data as Record<string, unknown>;

    switch (event) {
      case 'messages.delta': {
        // 流式文本更新
        const deltaText = typeof eventData.delta === 'string' ? eventData.delta : '';
        const messageId = eventData.message_id as string;

        if (deltaText) {
          // 方案一：更新 turns
          setTurns(prev => {
            const newTurns = new Map(prev);
            const turn = newTurns.get(turnId);
            if (turn) {
              // 找到对应的 assistant 消息并更新
              const updatedMessages = turn.messages.map(msg => {
                if (msg.id === messageId && msg.role === 'assistant') {
                  return {
                    ...msg,
                    contentText: msg.contentText + deltaText,
                  };
                }
                return msg;
              });
              newTurns.set(turnId, {
                ...turn,
                status: 'streaming',
                messages: updatedMessages,
                streamingText: turn.streamingText + deltaText,
              });
            }
            return newTurns;
          });

          // 方案二：文本先放到 pendingText 缓冲区
          setTurnsV2(prev => {
            const newTurns = new Map(prev);
            const turn = newTurns.get(turnId);
            if (turn && !turn.isResultConfirmed) {
              const now = Date.now();
              const newPendingText = turn.pendingText + deltaText;
              
              if (renderMode === 'separated-realtime') {
                // 实时模式：立即更新状态，触发 UI 显示
                newTurns.set(turnId, {
                  ...turn,
                  status: 'streaming',
                  pendingText: newPendingText,
                });
              } else if (renderMode === 'separated-delayed') {
                // 延迟模式：只累积文本，不改变 status 和 displayMode
                newTurns.set(turnId, {
                  ...turn,
                  pendingText: newPendingText,
                  // status 保持 'pending'，displayMode 保持 'loading'
                });
              } else if (renderMode === 'separated-smart') {
                // 智能模式：根据时间和内容长度决定是否切换到流式显示
                const startTime = turn.smartStartTime || now;
                const elapsed = now - startTime;
                const textLength = newPendingText.length;
                
                // 切换条件：超过 2 秒 或 文本超过 300 字符
                const shouldSwitchToStreaming = elapsed > 2000 || textLength > 300;
                
                if (turn.smartSwitchedToStreaming || shouldSwitchToStreaming) {
                  // 已切换或需要切换到流式显示
                  newTurns.set(turnId, {
                    ...turn,
                    status: 'streaming',
                    displayMode: 'streaming',
                    pendingText: newPendingText,
                    smartStartTime: startTime,
                    smartSwitchedToStreaming: true,
                  });
                } else {
                  // 继续缓冲，保持 loading 状态
                  newTurns.set(turnId, {
                    ...turn,
                    pendingText: newPendingText,
                    smartStartTime: startTime,
                  });
                }
              }
            }
            return newTurns;
          });
        }
        break;
      }

      case 'messages.upsert': {
        const msgId = eventData.message_id as string;
        const role = eventData.role as 'assistant' | 'tool';
        const status = eventData.status as 'in_progress' | 'final' | 'failed' | 'canceled';
        const contentText = (eventData.content_text as string) || '';
        const contentJson = eventData.content_json as { role: string; content: unknown[] } | null;
        const toolCallId = eventData.tool_call_id as string | undefined;
        const toolName = eventData.tool_name as string | undefined;
        const skillKey = eventData.skill_key as string | undefined;
        const seq = eventData.seq as number;

        // 解析 content blocks
        const contentBlocks: TurnMessageItem['contentBlocks'] = [];
        const toolUseBlocks: Array<{ id: string; name: string; input?: Record<string, unknown>; skillKey?: string }> = [];

        if (contentJson?.content && Array.isArray(contentJson.content)) {
          for (const block of contentJson.content) {
            const b = block as { type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> };
            if (b.type === 'text' && b.text) {
              contentBlocks.push({ type: 'text', text: b.text });
            } else if (b.type === 'tool_use') {
              contentBlocks.push({
                type: 'tool_use',
                id: b.id,
                name: b.name,
                input: b.input,
              });
              toolUseBlocks.push({ id: b.id!, name: b.name!, input: b.input, skillKey });
              // 提取 write_todos 更新全局 TodoList
              if (b.name === 'write_todos' && b.input?.todos) {
                setGlobalTodos(b.input.todos as Array<{ content: string; status: string; activeForm?: string }>);
              }
            }
          }
        }

        const newMessage: TurnMessageItem = {
          id: msgId,
          seq,
          role,
          status,
          contentText,
          contentBlocks,
          toolCallId,
          toolName,
          skillKey,
        };

        // 方案一：更新 turns
        setTurns(prev => {
          const newTurns = new Map(prev);
          const turn = newTurns.get(turnId);
          if (turn) {
            // 查找是否已存在该消息 - 按 seq + role 去重，避免重复消息
            const existingIndex = turn.messages.findIndex(m => m.seq === seq && m.role === role);
            let updatedMessages: TurnMessageItem[];

            if (existingIndex >= 0) {
              // 更新已有消息（相同 seq + role）
              updatedMessages = [...turn.messages];
              updatedMessages[existingIndex] = newMessage;
            } else {
              // 添加新消息
              updatedMessages = [...turn.messages, newMessage];
            }

            // 按 seq 排序
            updatedMessages.sort((a, b) => a.seq - b.seq);

            newTurns.set(turnId, {
              ...turn,
              messages: updatedMessages,
              status: status === 'final' && role === 'assistant' && contentBlocks.some(b => b.type === 'text')
                ? 'streaming' // 有文本内容说明可能还在流式输出
                : turn.status,
            });
          }
          return newTurns;
        });

        // 方案二：处理工具调用
        setTurnsV2(prev => {
          const newTurns = new Map(prev);
          const turn = newTurns.get(turnId);
          if (!turn) return newTurns;

          // 如果 turn 已完成，忽略后续的 upsert 事件（避免批量重发导致重复）
          if (turn.isResultConfirmed) {
            return newTurns;
          }

          // 检测到 tool_use，将 pendingText 移到 processItems
          if (toolUseBlocks.length > 0) {
            // 检查是否所有工具调用都已处理过（说明是批量重发）
            // 注意：需要同时检查 call_xxx 和 result_xxx，因为 result 可能先于 call 到达
            const allProcessed = toolUseBlocks.every(tb =>
              turn.processedToolCallIds.has(tb.id) || turn.processedToolCallIds.has(`result_${tb.id}`)
            );
            if (allProcessed) {
              // 批量重发的消息，跳过处理，保持 pendingText 不变
              return newTurns;
            }

            const newProcessItems = [...turn.processItems];
            const newProcessedIds = new Set(turn.processedToolCallIds);

            // 先把 pendingText 作为过程文字添加（只添加一次）
            if (turn.pendingText.trim()) {
              newProcessItems.push({ type: 'text', content: turn.pendingText });
            }

            // 添加工具调用（通过 tool_call_id 去重）
            for (const toolBlock of toolUseBlocks) {
              if (!newProcessedIds.has(toolBlock.id)) {
                newProcessItems.push({
                  type: 'tool_call',
                  toolName: toolBlock.name,
                  skillKey: toolBlock.skillKey,
                  status: 'running',
                  input: toolBlock.input,
                  toolCallId: toolBlock.id,
                });
                newProcessedIds.add(toolBlock.id);
              }
            }

            newTurns.set(turnId, {
              ...turn,
              processItems: newProcessItems,
              pendingText: '', // 清空缓冲区
              hasToolCall: true,
              status: 'streaming',
              // 延迟模式：检测到工具调用，切换到执行过程模式
              displayMode: renderMode === 'separated-delayed' ? 'process' : turn.displayMode,
              processedToolCallIds: newProcessedIds,
            });
          }
          // 处理工具结果
          else if (role === 'tool' && toolName && toolCallId) {
            // 只在 status === 'final' 时处理工具结果（忽略 in_progress）
            if (status !== 'final' && status !== 'failed') {
              return newTurns; // 跳过 in_progress 状态
            }

            const newProcessItems = [...turn.processItems];
            const newProcessedIds = new Set(turn.processedToolCallIds);
            const resultKey = `result_${toolCallId}`;

            // 检查是否已有该工具结果
            const existingResultIndex = newProcessItems.findIndex(
              p => p.type === 'tool_result' && p.toolCallId === toolCallId
            );

            if (existingResultIndex >= 0) {
              // 更新已存在的工具结果
              newProcessItems[existingResultIndex] = {
                ...newProcessItems[existingResultIndex],
                content: contentText,
                status: status === 'final' ? 'done' : 'failed',
                skillKey,
              };
            } else {
              // 添加新的工具结果
              newProcessItems.push({
                type: 'tool_result',
                toolName,
                skillKey,
                content: contentText,
                status: status === 'final' ? 'done' : 'failed',
                toolCallId,
              });
            }
            newProcessedIds.add(resultKey);

            // 更新对应工具调用的状态为完成
            const toolCallIndex = newProcessItems.findIndex(
              p => p.type === 'tool_call' && p.toolCallId === toolCallId
            );
            if (toolCallIndex >= 0) {
              newProcessItems[toolCallIndex] = {
                ...newProcessItems[toolCallIndex],
                status: status === 'final' ? 'done' : 'failed',
              };
            }

            newTurns.set(turnId, {
              ...turn,
              processItems: newProcessItems,
              status: 'streaming',
              processedToolCallIds: newProcessedIds,
            });
          }

          return newTurns;
        });
        break;
      }

      case 'run.status': {
        const status = eventData.status as string;
        // 支持多种完成状态值
        if (status === 'succeeded' || status === 'completed' || status === 'success' || status === 'finished' || status === 'done') {
          // 方案一
          setTurns(prev => {
            const newTurns = new Map(prev);
            const turn = newTurns.get(turnId);
            if (turn) {
              newTurns.set(turnId, { ...turn, status: 'complete' });
            }
            return newTurns;
          });

          // 方案二：流结束，确定 pendingText 的归属
          setTurnsV2(prev => {
            const newTurns = new Map(prev);
            const turn = newTurns.get(turnId);
            if (turn) {
              // 将所有 running 状态的工具调用标记为完成
              const updatedProcessItems = turn.processItems.map(item => {
                if (item.type === 'tool_call' && item.status === 'running') {
                  return { ...item, status: 'done' as const };
                }
                return item;
              });
              // pendingText 就是最终结果
              newTurns.set(turnId, {
                ...turn,
                processItems: updatedProcessItems,
                finalResult: turn.pendingText,
                pendingText: '',
                isResultConfirmed: true,
                status: 'complete',
                displayMode: 'result',  // 切换到结果模式
              });
            }
            return newTurns;
          });

          setIsLoading(false);
        } else if (status === 'failed') {
          setTurns(prev => {
            const newTurns = new Map(prev);
            const turn = newTurns.get(turnId);
            if (turn) {
              newTurns.set(turnId, { ...turn, status: 'failed' });
            }
            return newTurns;
          });
          setTurnsV2(prev => {
            const newTurns = new Map(prev);
            const turn = newTurns.get(turnId);
            if (turn) {
              // 保留已有内容，根据当前状态决定 displayMode
              let displayMode = turn.displayMode;
              if (turn.pendingText || turn.finalResult) {
                displayMode = 'result';
              } else if (turn.processItems.length > 0) {
                displayMode = 'process';
              }
              newTurns.set(turnId, { 
                ...turn, 
                status: 'failed',
                displayMode,
              });
            }
            return newTurns;
          });
          setIsLoading(false);
        } else if (status === 'canceled') {
          setTurns(prev => {
            const newTurns = new Map(prev);
            const turn = newTurns.get(turnId);
            if (turn) {
              newTurns.set(turnId, { ...turn, status: 'canceled' });
            }
            return newTurns;
          });
          setTurnsV2(prev => {
            const newTurns = new Map(prev);
            const turn = newTurns.get(turnId);
            if (turn) {
              // 保留已有内容，根据当前状态决定 displayMode
              // 如果有 pendingText 或 finalResult，说明已经有输出，displayMode 设为 result
              // 如果有 processItems 但没有输出，说明在执行过程中停止，displayMode 设为 process
              // 否则是思考中停止，displayMode 保持 loading
              let displayMode = turn.displayMode;
              if (turn.pendingText || turn.finalResult) {
                displayMode = 'result';
              } else if (turn.processItems.length > 0) {
                displayMode = 'process';
              }
              newTurns.set(turnId, { 
                ...turn, 
                status: 'canceled',
                displayMode,
              });
            }
            return newTurns;
          });
          setIsLoading(false);
        }
        break;
      }

      default:
        // console.log('Unhandled event:', event);
    }
  };

  // 停止生成
  const handleStop = async () => {
    if (currentRunId) {
      try {
        addDebugLog('request.cancelChatRun', { runId: currentRunId });
        const response = await cancelChatRun(currentRunId);
        addDebugLog('response.cancelChatRun', response);
        
        // 主动更新 turn 状态为 canceled（不等待 SSE 事件）
        const turnId = currentRunId;
        setTurns(prev => {
          const newTurns = new Map(prev);
          const turn = newTurns.get(turnId);
          if (turn && turn.status !== 'complete' && turn.status !== 'failed') {
            newTurns.set(turnId, { ...turn, status: 'canceled' });
          }
          return newTurns;
        });
        setTurnsV2(prev => {
          const newTurns = new Map(prev);
          const turn = newTurns.get(turnId);
          if (turn && turn.status !== 'complete' && turn.status !== 'failed') {
            // 根据当前已有内容决定 displayMode
            let displayMode = turn.displayMode;
            if (turn.pendingText || turn.finalResult) {
              displayMode = 'result';
            } else if (turn.processItems.length > 0) {
              displayMode = 'process';
            }
            
            // 如果有输出内容，将所有 running 的工具标记为 done
            // 因为如果已经在输出文本，说明工具调用已经完成了
            const hasOutput = turn.pendingText || turn.finalResult;
            const updatedProcessItems = turn.processItems.map(item => {
              if (item.type === 'tool_call' && item.status === 'running' && hasOutput) {
                return { ...item, status: 'done' as const };
              }
              return item;
            });
            
            newTurns.set(turnId, { 
              ...turn, 
              status: 'canceled',
              displayMode,
              processItems: updatedProcessItems,
            });
          }
          return newTurns;
        });
      } catch (error) {
        console.error('Failed to cancel run:', error);
        addDebugLog('error.cancelChatRun', { error: String(error) });
      }
    }
    // 关闭 SSE 连接
    if (cancelSSERef.current) {
      cancelSSERef.current();
      cancelSSERef.current = null;
    }
    setIsLoading(false);
    setCurrentRunId(null);
  };

  // 重试（删除当前回答，重新发送用户消息）
  const handleRegenerate = async (turnId: string) => {
    // 找到该 turn 对应的用户消息
    // messageList 中 user 和 turn 是交错的，turn 前面的 user 就是对应的用户消息
    const turnsArray = renderMode === 'timeline'
      ? Array.from(turns.keys())
      : Array.from(turnsV2.keys());
    
    const turnIndex = turnsArray.indexOf(turnId);
    if (turnIndex === -1 || turnIndex >= userMessages.length) {
      console.error('Cannot find corresponding user message for turn:', turnId);
      return;
    }
    
    const userMessage = userMessages[turnIndex];
    const messageContent = userMessage.content;
    
    // 删除该 turn 和对应的用户消息
    setUserMessages(prev => prev.filter((_, index) => index !== turnIndex));
    setTurns(prev => {
      const newTurns = new Map(prev);
      newTurns.delete(turnId);
      return newTurns;
    });
    setTurnsV2(prev => {
      const newTurns = new Map(prev);
      newTurns.delete(turnId);
      return newTurns;
    });
    
    // 清除 conversationId，避免后端对话历史中有未完成的 tool_call 导致错误
    setConversationId(null);
    
    // 重新发送消息
    await handleSendMessage(messageContent);
  };

  // 清空对话
  const handleClear = () => {
    setUserMessages([]);
    setTurns(new Map());
    setTurnsV2(new Map());
    setConversationId(null);
    setCurrentTurnId(null);
    setGlobalTodos([]);
  };

  // 模拟模式的 Turn 数据
  const mockTurnData = useMemo(() => {
    if (chatMode !== 'mock') return null;
    return getMockTurnData(stateConfig.scenario, stateConfig.messageState, stateConfig.taskProgress, stateConfig.stopScenario);
  }, [chatMode, stateConfig]);

  // 模拟模式的 Todo 数据
  const mockTodos = useMemo(() => {
    if (chatMode !== 'mock') return [];
    return getMockTodos(stateConfig.scenario, stateConfig.messageState, stateConfig.taskProgress);
  }, [chatMode, stateConfig]);

  // 模拟模式的用户消息（用于 standalone 和 widget 视图）
  const mockUserMessages = useMemo(() => {
    if (chatMode !== 'mock') return [];
    if (stateConfig.scenario === 'D') {
      const multiTurnData = getScenarioDMultiTurnData(stateConfig.messageState, stateConfig.stopScenario);
      return multiTurnData.userMessages.map((content, i) => ({
        id: `mock-user-D-${i + 1}`,
        content,
        attachments: i === 0 ? mockAttachments : undefined,
      }));
    }
    if (mockTurnData) {
      return [{ id: 'mock-user-1', content: '请帮我分析一下这个问题', attachments: mockAttachments }];
    }
    return [];
  }, [chatMode, stateConfig, mockTurnData]);

  // 模拟模式的 TurnsV2 Map（用于 standalone 和 widget 视图）
  const mockTurnsV2Map = useMemo(() => {
    const map = new Map<string, TurnDataV2>();
    if (chatMode !== 'mock') return map;
    if (stateConfig.scenario === 'D') {
      const multiTurnData = getScenarioDMultiTurnData(stateConfig.messageState, stateConfig.stopScenario);
      multiTurnData.turns.forEach(turn => {
        map.set(turn.turnId, turn);
      });
    } else if (mockTurnData) {
      map.set(mockTurnData.turnId, mockTurnData);
    }
    return map;
  }, [chatMode, stateConfig, mockTurnData]);

  // 构建消息列表（用户消息和 Turn 交错）
  const messageList = React.useMemo(() => {
    // 模拟模式：根据场景返回不同数据
    if (chatMode === 'mock') {
      // 场景 D：多轮对话
      if (stateConfig.scenario === 'D') {
        const multiTurnData = getScenarioDMultiTurnData(stateConfig.messageState, stateConfig.stopScenario);
        const list: Array<{ type: 'user' | 'turn'; id: string; content?: string; attachments?: Attachment[]; turn?: TurnData; turnV2?: TurnDataV2 }> = [];

        for (let i = 0; i < multiTurnData.turns.length; i++) {
          // 添加用户消息
          if (i < multiTurnData.userMessages.length) {
            list.push({
              type: 'user',
              id: `mock-user-D-${i + 1}`,
              content: multiTurnData.userMessages[i],
              // 第一条消息带附件
              attachments: i === 0 ? mockAttachments : undefined,
            });
          }
          // 添加 Turn
          list.push({
            type: 'turn',
            id: multiTurnData.turns[i].turnId,
            turnV2: multiTurnData.turns[i],
          });
        }

        return list;
      }

      // 其他场景：单轮对话（带附件示例）
      if (mockTurnData) {
        return [
          { 
            type: 'user' as const, 
            id: 'mock-user-1', 
            content: '请帮我分析一下这个问题',
            attachments: mockAttachments,
          },
          { type: 'turn' as const, id: mockTurnData.turnId, turnV2: mockTurnData },
        ];
      }
      return [];
    }

    // 真实模式：使用实际对话数据
    const list: Array<{ type: 'user' | 'turn'; id: string; content?: string; attachments?: Attachment[]; turn?: TurnData; turnV2?: TurnDataV2 }> = [];

    // 根据当前方案选择数据源
    const turnsArray = renderMode === 'timeline'
      ? Array.from(turns.values())
      : Array.from(turnsV2.values());

    let turnIndex = 0;

    for (let i = 0; i < userMessages.length; i++) {
      list.push({ type: 'user', id: userMessages[i].id, content: userMessages[i].content });
      if (turnIndex < turnsArray.length) {
        const turnData = turnsArray[turnIndex];
        if (renderMode === 'timeline') {
          list.push({ type: 'turn', id: (turnData as TurnData).turnId, turn: turnData as TurnData });
        } else {
          list.push({ type: 'turn', id: (turnData as TurnDataV2).turnId, turnV2: turnData as TurnDataV2 });
        }
        turnIndex++;
      }
    }

    // 添加剩余的 turns（如果有的话）
    while (turnIndex < turnsArray.length) {
      const turnData = turnsArray[turnIndex];
      if (renderMode === 'timeline') {
        list.push({ type: 'turn', id: (turnData as TurnData).turnId, turn: turnData as TurnData });
      } else {
        list.push({ type: 'turn', id: (turnData as TurnDataV2).turnId, turnV2: turnData as TurnDataV2 });
      }
      turnIndex++;
    }

    return list;
  }, [chatMode, mockTurnData, userMessages, turns, turnsV2, renderMode, stateConfig.scenario, stateConfig.messageState]);

  // 当前显示的 Todos（真实模式用 globalTodos，模拟模式用 mockTodos）
  const displayTodos = chatMode === 'mock' ? mockTodos : globalTodos;

  // 新对话
  const handleNewChat = () => {
    handleClear();
  };

  return (
    <>
      {/* StateSwitcher 悬浮控制面板 - 所有视图模式都显示 */}
      <StateSwitcher
        chatMode={chatMode}
        onChatModeChange={(mode) => {
          setChatMode(mode);
          localStorage.setItem('chat_mode', mode);
        }}
        viewMode={viewMode}
        onViewModeChange={(mode) => {
          setViewMode(mode);
          localStorage.setItem('view_mode', mode);
        }}
        renderMode={renderMode}
        onRenderModeChange={(mode) => {
          setRenderMode(mode);
          localStorage.setItem('render_mode', mode);
        }}
        resultStyle={resultStyle}
        onResultStyleChange={(style) => {
          setResultStyle(style);
          localStorage.setItem('result_style', style);
        }}
        stateConfig={stateConfig}
        onStateConfigChange={setStateConfig}
        showDebug={showDebug}
        onShowDebugChange={setShowDebug}
        enableToolExpand={enableToolExpand}
        onEnableToolExpandChange={setEnableToolExpand}
        userProcessMode={userProcessMode}
        onUserProcessModeChange={setUserProcessMode}
      />

      {/* 独立网页视图 - 全屏（真实模式和模拟模式都支持） */}
      {viewMode === 'standalone' && (
        <StandaloneLayout
          userMessages={chatMode === 'mock' ? mockUserMessages : userMessages}
          turnsV2={chatMode === 'mock' ? mockTurnsV2Map : turnsV2}
          isLoading={chatMode === 'mock' ? ['thinking', 'executing', 'streaming'].includes(stateConfig.messageState) : isLoading}
          renderMode={renderMode}
          resultStyle={resultStyle}
          userProcessMode={userProcessMode}
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStop}
          onRegenerate={handleRegenerate}
          onNewChat={handleNewChat}
          messagesContainerRef={messagesContainerRef}
          messagesEndRef={messagesEndRef}
        />
      )}

      {/* 页面嵌入视图 - 全屏背景 + Widget（真实模式和模拟模式都支持） */}
      {viewMode === 'widget' && (
        <WidgetLayout
          userMessages={chatMode === 'mock' ? mockUserMessages : userMessages}
          turnsV2={chatMode === 'mock' ? mockTurnsV2Map : turnsV2}
          isLoading={chatMode === 'mock' ? ['thinking', 'executing', 'streaming'].includes(stateConfig.messageState) : isLoading}
          renderMode={renderMode}
          resultStyle={resultStyle}
          userProcessMode={userProcessMode}
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStop}
          onRegenerate={handleRegenerate}
          onNewChat={handleNewChat}
          messagesContainerRef={messagesContainerRef}
          messagesEndRef={messagesEndRef}
        />
      )}

      {/* Playground 视图（默认） */}
      {viewMode === 'playground' && (
        <div className="h-screen bg-gray-50 flex overflow-hidden">
          {/* 左侧菜单 */}
          <Sidebar
            currentView={currentView}
            onViewChange={setCurrentView}
            user={user}
            company={company}
            onOpenProfile={() => console.log('Open profile')}
            onOpenCompany={() => console.log('Open company')}
            onLogout={() => console.log('Logout')}
          />

          {/* 会话历史抽屉 */}
          <ChatHistory
            isOpen={showHistory}
            onClose={() => setShowHistory(false)}
            onSelectSession={(id) => console.log('Select session:', id)}
            onDeleteSession={(id) => console.log('Delete session:', id)}
          />

          {/* 右侧主内容区 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 部署页面 */}
            {currentView === 'deploy' && <DeploymentView />}
            
            {/* 安全页面 */}
            {currentView === 'security' && <SecurityCenter />}
            
            {/* 其他页面占位 */}
            {currentView !== 'playground' && currentView !== 'deploy' && currentView !== 'security' && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-400">功能开发中...</p>
              </div>
            )}
            
            {/* Playground 聊天页面 */}
            {currentView === 'playground' && (
              <>
                {/* 头部 */}
                <header className="flex-shrink-0 bg-white border-b border-gray-200 h-14 px-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 w-32">
                    {chatMode === 'mock' && (
                      <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-600 rounded-full">模拟模式</span>
                    )}
                  </div>
                  {/* 标题居中：有消息时显示，无消息时不显示 */}
                  <div className="flex-1 text-center">
                    {messageList.length > 0 && (
                      <span className="text-sm font-medium text-slate-700">
                        {userMessages[0]?.content.slice(0, 20)}{userMessages[0]?.content.length > 20 ? '...' : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleNewChat}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Plus size={16} />
                      <span>新对话</span>
                    </button>
                    <button
                      onClick={() => setShowHistory(true)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <History size={16} />
                      <span>历史</span>
                    </button>
                  </div>
                </header>

                {/* 聊天区域 */}
                <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full overflow-hidden">
                  {/* 模拟模式：初始化页 */}
                  {chatMode === 'mock' && stateConfig.pageView === 'init' && (
                    <InitGuidePage />
                  )}

                  {/* 模拟模式：欢迎页 */}
                  {chatMode === 'mock' && stateConfig.pageView === 'welcome' && (
                    <>
                      <WelcomePage onSendQuestion={() => {
                        setStateConfig(prev => ({ ...prev, pageView: 'conversation' }));
                      }} />
                      <div className="flex-shrink-0">
                        <ChatInput
                          onSend={() => {
                            setStateConfig(prev => ({ ...prev, pageView: 'conversation' }));
                          }}
                          onStop={handleStop}
                          disabled={false}
                          isLoading={false}
                        />
                      </div>
                    </>
                  )}

                  {/* 对话内容（真实模式 或 模拟模式的对话中状态） */}
                  {(chatMode === 'real' || stateConfig.pageView === 'conversation') && (
                    <>
                      {/* 消息列表 */}
                      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                        {messageList.length === 0 ? (
                          <WelcomePage onSendQuestion={handleSendMessage} />
                        ) : (
                          messageList.map((item, index) => {
                            const lastMessage = messageList[messageList.length - 1];
                            const isWaitingForNewTurn = lastMessage?.type === 'user';
                            
                            const isLastTurn = item.type === 'turn' && 
                              messageList.slice(index + 1).every(m => m.type !== 'turn');
                            
                            const lastTurnItem = [...messageList].reverse().find(m => m.type === 'turn');
                            const lastTurnStatus = lastTurnItem?.turnV2?.status || lastTurnItem?.turn?.status;
                            const isLastTurnComplete = lastTurnStatus === 'complete' || lastTurnStatus === 'failed' || lastTurnStatus === 'canceled';
                            
                            const showActionBar = isLastTurn && !isWaitingForNewTurn && isLastTurnComplete;
                            
                            if (item.type === 'user') {
                              return <UserMessage key={item.id} content={item.content!} attachments={item.attachments} />;
                            } else if (item.type === 'turn') {
                              if (renderMode === 'timeline' && item.turn) {
                                return (
                                  <TurnMessage
                                    key={item.id}
                                    turn={item.turn}
                                    onRegenerate={() => handleRegenerate(item.turn!.turnId)}
                                  />
                                );
                              } else if ((renderMode === 'separated-realtime' || renderMode === 'separated-delayed' || renderMode === 'separated-smart') && item.turnV2) {
                                return (
                                  <TurnMessageV2
                                    key={item.id}
                                    turn={item.turnV2}
                                    renderMode={renderMode}
                                    resultStyle={resultStyle}
                                    onRegenerate={() => handleRegenerate(item.turnV2!.turnId)}
                                    isLatest={showActionBar}
                                    disableToolExpand={!enableToolExpand}
                                    showKnowledgeReferences={viewMode === 'playground'}
                                    isUserView={false}
                                  />
                                );
                              }
                            }
                            return null;
                          })
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* 底部固定区域 */}
                      <div className="flex-shrink-0">
                        {/* 全局 TodoList */}
                        {displayTodos.length > 0 && (
                          <div className="mx-4 mt-3 border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
                            <button
                              onClick={() => setTodosExpanded(!todosExpanded)}
                              className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                {todosExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                <span className="flex items-center gap-1.5 font-medium text-gray-700 text-sm">
                                  {displayTodos.every(t => t.status === 'completed' || t.status === 'done')
                                    ? <><CheckCircle2 size={14} className="text-green-500" /> 任务已完成</>
                                    : <><ClipboardList size={14} className="text-gray-500" /> 任务计划</>}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                ({displayTodos.filter(t => t.status === 'completed' || t.status === 'done').length}/{displayTodos.length})
                              </span>
                            </button>
                            {todosExpanded && (
                              <div className="p-3 space-y-1.5 border-t border-gray-200 max-h-32 overflow-y-auto">
                                {displayTodos.map((todo, index) => (
                                  <div key={index} className="flex items-center gap-2 text-sm">
                                    {todo.status === 'completed' || todo.status === 'done' ? (
                                      <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                                    ) : todo.status === 'in_progress' ? (
                                      <Loader2 size={14} className="animate-spin text-blue-500 flex-shrink-0" />
                                    ) : (
                                      <Clock size={14} className="text-gray-400 flex-shrink-0" />
                                    )}
                                    <span className={`${
                                      todo.status === 'completed' || todo.status === 'done'
                                        ? 'text-gray-500 line-through'
                                        : todo.status === 'in_progress'
                                          ? 'text-blue-700 font-medium'
                                          : 'text-gray-700'
                                    }`}>
                                      {todo.status === 'in_progress' && todo.activeForm ? todo.activeForm : todo.content}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 输入区域 */}
                        {(chatMode === 'real' || stateConfig.pageView === 'conversation') && (
                          <div>
                            <ChatInput
                              onSend={handleSendMessage}
                              onStop={handleStop}
                              disabled={chatMode === 'real' ? !agentId : false}
                              isLoading={chatMode === 'real' 
                                ? isLoading 
                                : ['thinking', 'executing', 'streaming'].includes(stateConfig.messageState)
                              }
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 调试面板 - 仅真实模式 Playground */}
      {chatMode === 'real' && viewMode === 'playground' && showDebug && (
        <div className="fixed bottom-0 left-0 right-0 h-80 bg-gray-900 text-gray-100 flex flex-col z-50">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
            <span className="text-sm font-medium">调试日志 ({debugLogs.length} 条)</span>
            <div className="flex items-center gap-2">
              <button
                onClick={exportChatAsHTML}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 hover:bg-green-700 rounded"
              >
                <Download size={14} />
                导出 HTML
              </button>
              <button
                onClick={exportDebugLogs}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded"
              >
                <Download size={14} />
                导出 JSON
              </button>
              <button
                onClick={() => setDebugLogs([])}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-red-600 hover:bg-red-700 rounded"
              >
                <Trash2 size={14} />
                清空
              </button>
              <button
                onClick={() => setShowDebug(false)}
                className="px-2 py-1 text-xs hover:bg-gray-700 rounded"
              >
                关闭
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-2 font-mono text-xs">
            {debugLogs.map((log, index) => (
              <div key={index} className="mb-2 border-b border-gray-800 pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-500">{log.timestamp.split('T')[1].split('.')[0]}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    log.event.includes('delta') ? 'bg-blue-800 text-blue-200' :
                    log.event.includes('upsert') ? 'bg-green-800 text-green-200' :
                    log.event.includes('status') ? 'bg-yellow-800 text-yellow-200' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {log.event}
                  </span>
                </div>
                <pre className="text-gray-400 whitespace-pre-wrap break-all">
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
