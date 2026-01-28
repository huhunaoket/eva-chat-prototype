/**
 * AgentResponse - Agent 消息组件
 * 对齐 PRD v3 3.3.3 组件规格
 *
 * 三层结构：
 * - 状态栏（StatusBar）：显示当前执行状态
 * - 调用栈（CallStack）：显示工具/能力调用
 * - 内容区（ContentArea）：显示文本输出和知识引用
 */

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Check,
  BookOpen,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import {
  PageStateConfig,
  FeatureOptions,
  KnowledgeSource,
  ToolCall,
  TOOL_NAME_MAP,
} from '../types';
import { FeedbackPanel } from './FeedbackPanel';

interface AgentResponseProps {
  stateConfig: PageStateConfig;
  features: FeatureOptions;
  isPlayground: boolean;
  onRegenerate?: () => void;
  // 场景D多轮对话支持
  isFirstBubbleInD?: boolean;  // 气泡1：请求确认
  isSecondBubbleInD?: boolean; // 气泡2：继续执行
}

// ============================================
// Mock 数据
// ============================================

const mockKnowledgeSources: KnowledgeSource[] = [
  { fileId: '1', fileName: 'EVA 产品介绍.pdf' },
  { fileId: '2', fileName: '功能清单.md' },
];

// 场景B：能力调用（嵌套工具）
const mockToolCalls_B: ToolCall[] = [
  {
    id: '1',
    toolId: 'task_customer_service',
    friendlyName: TOOL_NAME_MAP['task_customer_service'],
    status: 'done',
    children: [
      {
        id: '1-1',
        toolId: 'knowledge_search_tool',
        friendlyName: TOOL_NAME_MAP['knowledge_search_tool'],
        status: 'done',
      },
    ],
  },
];

const mockToolCalls_B_Running: ToolCall[] = [
  {
    id: '1',
    toolId: 'task_customer_service',
    friendlyName: TOOL_NAME_MAP['task_customer_service'],
    status: 'running',
    children: [
      {
        id: '1-1',
        toolId: 'knowledge_search_tool',
        friendlyName: TOOL_NAME_MAP['knowledge_search_tool'],
        status: 'running',
      },
    ],
  },
];

// 场景C/D：任务规划的嵌套调用（能力 -> 工具）
const mockToolCalls_C = (taskProgress: string): ToolCall[] => {
  const taskNum = parseInt(taskProgress.replace('task', ''));

  // 根据任务进度构建嵌套的工具调用
  const children: ToolCall[] = [];

  if (taskNum >= 1) {
    children.push({
      id: '1-1',
      toolId: 'knowledge_search_tool',
      friendlyName: TOOL_NAME_MAP['knowledge_search_tool'],
      status: taskNum > 1 ? 'done' : 'running',
    });
  }
  if (taskNum >= 2) {
    children.push({
      id: '1-2',
      toolId: 'web_search',
      friendlyName: TOOL_NAME_MAP['web_search'],
      status: taskNum > 2 ? 'done' : 'running',
    });
  }
  if (taskNum >= 3) {
    children.push({
      id: '1-3',
      toolId: 'calculator',
      friendlyName: TOOL_NAME_MAP['calculator'],
      status: taskNum > 3 ? 'done' : 'running',
    });
  }

  // 返回嵌套结构：能力包含工具
  return [
    {
      id: '1',
      toolId: 'task_business_intelligence',
      friendlyName: TOOL_NAME_MAP['task_business_intelligence'],
      status: taskNum > 3 ? 'done' : 'running',
      children,
    },
  ];
};

// 回答内容
const ANSWERS = {
  A: {
    full: `你好！我是智能助手，很高兴为您服务。

我可以帮您：
- 查询产品信息和价格
- 了解退换货政策
- 查询订单状态
- 联系人工客服

请问有什么可以帮您的？`,
    streaming: `你好！我是智能助手，很高兴为您服务。

我可以帮您：`,
  },
  B: {
    full: `根据我们的政策：

1. 7天内可无理由退换货
2. 质量问题30天内可退换
3. 退换货请保持商品完好并附带发票

如需办理退换货，请联系客服提供订单号。`,
    streaming: `根据我们的政策：

1. 7天内可无理由退换货
2. 质量问题30天内`,
  },
  C: {
    full: `根据分析，主要竞品有以下几家：

1. **竞品A**：市场份额约35%，主打性价比路线
2. **竞品B**：市场份额约25%，专注高端市场
3. **竞品C**：市场份额约15%，以服务见长

**建议**：关注竞品A的定价策略和竞品B的产品创新。`,
    streaming: `根据分析，主要竞品有以下几家：

1. **竞品A**：市场份额约35%，主打性价比`,
  },
  D_confirm: `我分析了以下 3 个竞品：
- 竞品A：xxx
- 竞品B：xxx
- 竞品C：xxx

请问是否继续整理报告？`,
  D_final: `根据分析，最终方案建议如下：

1. **短期策略**：加强价格竞争力
2. **中期策略**：提升产品差异化
3. **长期策略**：建立品牌护城河`,
};

// 任务列表数据
const TASKS = [
  { id: '1', content: '收集需求信息' },
  { id: '2', content: '分析竞品数据' },
  { id: '3', content: '整理分析报告' },
  { id: '4', content: '输出最终方案' },
];

// 状态栏文案映射（根据工具类型展示通用文案）
const STATUS_TEXT_MAP: Record<string, string> = {
  'knowledge_search_tool': '正在翻阅资料...',
  'web_search': '正在联网搜索...',
  'calculator': '正在计算...',
  'weather_query': '正在查询天气...',
};

// 终端用户等待提示文字
const waitingTexts = [
  '正在理解您的问题...',
  '正在查询相关信息...',
  '正在整理答案...',
  '马上就好...',
];

// ============================================
// 子组件
// ============================================

// 状态栏组件
const StatusBar: React.FC<{
  visible: boolean;
  text: string;
  type: 'thinking' | 'executing' | 'stopped' | 'failed';
}> = ({ visible, text, type }) => {
  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'thinking':
      case 'executing':
        return <Loader2 size={16} className="animate-spin text-primary-500" />;
      case 'stopped':
        return <span className="text-slate-400">⏹️</span>;
      case 'failed':
        return <AlertTriangle size={16} className="text-danger-500" />;
    }
  };

  const getTextClass = () => {
    switch (type) {
      case 'failed':
        return 'text-danger-500';
      case 'stopped':
        return 'text-slate-400';
      default:
        return 'text-slate-600';
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
      {getIcon()}
      <span className={`text-sm ${getTextClass()}`}>{text}</span>
    </div>
  );
};

// 调用栈组件
const CallStack: React.FC<{
  visible: boolean;
  expanded: boolean;
  tools: ToolCall[];
  isExecuting: boolean;
  onToggle: () => void;
}> = ({ visible, expanded, tools, isExecuting, onToggle }) => {
  if (!visible || tools.length === 0) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <span className="text-success-500">✅</span>;
      case 'running':
        return <Loader2 size={14} className="animate-spin text-primary-500" />;
      case 'failed':
        return <span className="text-danger-500">❌</span>;
      default:
        return null;
    }
  };

  // 执行中时始终展开，完成后可折叠
  const showContent = isExecuting || expanded;

  return (
    <div className="border-b border-slate-100">
      {isExecuting ? (
        <div className="flex items-center justify-between px-4 py-2 text-sm font-medium text-slate-600">
          <span>执行明细</span>
          <ChevronUp size={14} className="text-slate-400" />
        </div>
      ) : (
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 transition-colors"
        >
          <span className="text-sm font-medium text-slate-600">执行明细</span>
          {expanded ? (
            <ChevronUp size={14} className="text-slate-400" />
          ) : (
            <ChevronDown size={14} className="text-slate-400" />
          )}
        </button>
      )}
      {showContent && (
        <div className="px-4 pb-3 space-y-1">
          {tools.map((tool) => (
            <div key={tool.id}>
              {/* 父级能力 */}
              <div className="flex items-center gap-2 py-1">
                <span className="text-sm">{tool.friendlyName}</span>
                {getStatusIcon(tool.status)}
              </div>
              {/* 子级工具（嵌套） */}
              {tool.children && tool.children.length > 0 && (
                <div className="ml-4 border-l-2 border-slate-200 pl-3 space-y-1">
                  {tool.children.map((child, index) => (
                    <div key={child.id} className="flex items-center gap-2 py-1">
                      <span className="text-slate-400 text-xs">
                        {index === tool.children!.length - 1 ? '└─' : '├─'}
                      </span>
                      <span className="text-sm text-slate-600">{child.friendlyName}</span>
                      {getStatusIcon(child.status)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 内容区组件
const ContentArea: React.FC<{
  visible: boolean;
  content: string;
  isStreaming: boolean;
  knowledgeSources?: KnowledgeSource[];
  showKnowledgeRef: boolean;
  isPlayground: boolean;
}> = ({ visible, content, isStreaming, knowledgeSources, showKnowledgeRef, isPlayground }) => {
  const [knowledgeExpanded, setKnowledgeExpanded] = useState(false);

  if (!visible) return null;

  const hasKnowledge = knowledgeSources && knowledgeSources.length > 0 && showKnowledgeRef && isPlayground;

  return (
    <>
      <div className="px-4 py-3">
        <div className="whitespace-pre-wrap text-slate-700 text-sm leading-relaxed">
          {content}
          {isStreaming && <span className="typing-cursor">█</span>}
        </div>
      </div>

      {/* 知识引用 */}
      {hasKnowledge && !isStreaming && (
        <div className="border-t border-slate-100">
          <button
            onClick={() => setKnowledgeExpanded(!knowledgeExpanded)}
            className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50"
          >
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <BookOpen size={14} />
              <span>📚 引用了 {knowledgeSources!.length} 个知识源</span>
            </div>
            {knowledgeExpanded ? (
              <ChevronUp size={14} className="text-slate-400" />
            ) : (
              <ChevronDown size={14} className="text-slate-400" />
            )}
          </button>
          {knowledgeExpanded && (
            <div className="px-4 pb-3 space-y-1">
              {knowledgeSources!.map((source, index) => (
                <div key={source.fileId} className="flex items-center gap-2 text-sm text-slate-500">
                  <span>{index === knowledgeSources!.length - 1 ? '└─' : '├─'}</span>
                  <span>{source.fileName}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

// 操作栏组件
const ActionBar: React.FC<{
  visible: boolean;
  showRegenerate: boolean;
  showAllActions: boolean;
  isRetry?: boolean;
  onRegenerate?: () => void;
  onCopy: () => void;
  onLike: () => void;
  onDislike: () => void;
  copied: boolean;
  liked: boolean;
  disliked: boolean;
}> = ({
  visible,
  showRegenerate,
  showAllActions,
  isRetry,
  onRegenerate,
  onCopy,
  onLike,
  onDislike,
  copied,
  liked,
  disliked,
}) => {
  if (!visible) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t border-slate-100">
      {showRegenerate && (
        <button
          onClick={onRegenerate}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        >
          <RefreshCw size={14} />
          <span>{isRetry ? '重试' : '重新生成'}</span>
        </button>
      )}
      {showAllActions && (
        <>
          <button
            onClick={onRegenerate}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
            title="重新生成"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={onCopy}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
            title="复制"
          >
            {copied ? <Check size={16} className="text-success-500" /> : <Copy size={16} />}
          </button>
          <button
            onClick={onLike}
            className={`p-2 rounded-lg ${
              liked ? 'text-primary-500 bg-primary-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
            title="点赞"
          >
            <ThumbsUp size={16} />
          </button>
          <button
            onClick={onDislike}
            className={`p-2 rounded-lg ${
              disliked ? 'text-danger-500 bg-danger-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
            title="点踩"
          >
            <ThumbsDown size={16} />
          </button>
        </>
      )}
    </div>
  );
};

// ============================================
// 主组件
// ============================================

export const AgentResponse: React.FC<AgentResponseProps> = ({
  stateConfig,
  features,
  isPlayground,
  onRegenerate,
  isFirstBubbleInD = false,
  isSecondBubbleInD = false,
}) => {
  const { scenario, messageState, taskProgress } = stateConfig;

  // 状态
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [callStackExpanded, setCallStackExpanded] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [waitingTextIndex, setWaitingTextIndex] = useState(0);

  // 终端用户等待文字轮换
  useEffect(() => {
    const isWaiting = !isPlayground && (messageState === 'thinking' || messageState === 'executing');
    if (isWaiting) {
      const interval = setInterval(() => {
        setWaitingTextIndex((prev) => (prev + 1) % waitingTexts.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isPlayground, messageState]);

  // 处理函数
  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLike = () => {
    setLiked(true);
    setDisliked(false);
  };

  const handleDislike = () => {
    setDisliked(true);
    setLiked(false);
    if (features.showFeedbackPanel) {
      setShowFeedback(true);
    }
  };

  // ============================================
  // 根据状态计算各层配置
  // ============================================

  // 状态栏配置
  const getStatusBarConfig = () => {
    // 完成状态：隐藏状态栏
    if (messageState === 'complete') {
      return { visible: false, text: '', type: 'thinking' as const };
    }

    // 流式输出：隐藏状态栏（内容已在输出，无需状态提示）
    if (messageState === 'streaming') {
      return { visible: false, text: '', type: 'thinking' as const };
    }

    // 停止状态
    if (messageState === 'stopped') {
      return { visible: true, text: '回答已停止', type: 'stopped' as const };
    }

    // 失败状态
    if (messageState === 'failed') {
      return { visible: true, text: '出了点问题', type: 'failed' as const };
    }

    // 终端用户：显示友好提示（轮换文案）
    if (!isPlayground && (messageState === 'thinking' || messageState === 'executing')) {
      return { visible: true, text: waitingTexts[waitingTextIndex], type: 'thinking' as const };
    }

    // 执行中状态：根据调用栈最新工具展示对应文案
    if (messageState === 'thinking' || messageState === 'executing') {
      // 获取当前调用栈中正在执行的工具
      let currentToolId: string | null = null;

      if (scenario === 'B') {
        const tools = messageState === 'executing' ? mockToolCalls_B_Running : [];
        // 找到正在执行的子工具
        for (const tool of tools) {
          if (tool.children) {
            const runningChild = tool.children.find(c => c.status === 'running');
            if (runningChild) {
              currentToolId = runningChild.toolId;
              break;
            }
          }
        }
      } else if (scenario === 'C' || scenario === 'D') {
        const tools = taskProgress ? mockToolCalls_C(taskProgress) : [];
        // 找到正在执行的子工具
        for (const tool of tools) {
          if (tool.children) {
            const runningChild = tool.children.find(c => c.status === 'running');
            if (runningChild) {
              currentToolId = runningChild.toolId;
              break;
            }
          }
        }
      }

      // 根据工具类型返回对应文案，无匹配则兜底"正在思考..."
      const statusText = currentToolId ? (STATUS_TEXT_MAP[currentToolId] || '正在思考...') : '正在思考...';
      return { visible: true, text: statusText, type: 'thinking' as const };
    }

    return { visible: false, text: '', type: 'thinking' as const };
  };

  // 调用栈配置
  const getCallStackConfig = () => {
    // 场景A：无调用栈
    if (scenario === 'A') {
      return { visible: false, expanded: false, tools: [] };
    }

    // 停止状态：隐藏调用栈
    if (messageState === 'stopped') {
      return { visible: false, expanded: false, tools: [] };
    }

    // 场景B：工具调用
    if (scenario === 'B') {
      const isExecuting = messageState === 'executing';
      const tools = isExecuting ? mockToolCalls_B_Running : mockToolCalls_B;
      return {
        visible: messageState !== 'thinking',
        expanded: isExecuting || callStackExpanded,
        tools,
      };
    }

    // 场景D气泡1：显示任务1-2的已完成调用栈
    if (isFirstBubbleInD) {
      return {
        visible: true,
        expanded: callStackExpanded,
        tools: mockToolCalls_C('task2'), // 任务1-2已完成
      };
    }

    // 场景D气泡2：显示任务3-4的调用栈
    if (isSecondBubbleInD) {
      const isExecuting = messageState === 'executing';
      // 执行中显示任务3进度，完成显示任务4
      const tools = isExecuting
        ? mockToolCalls_C('task3')
        : mockToolCalls_C('task4');
      return {
        visible: messageState !== 'thinking',
        expanded: isExecuting || callStackExpanded,
        tools,
      };
    }

    // 场景C/D：任务规划
    if (scenario === 'C' || scenario === 'D') {
      const isExecuting = messageState === 'executing';
      const tools = isExecuting && taskProgress
        ? mockToolCalls_C(taskProgress)
        : mockToolCalls_C('task4'); // 完成时显示所有
      return {
        visible: messageState !== 'thinking',
        expanded: isExecuting || callStackExpanded,
        tools,
      };
    }

    return { visible: false, expanded: false, tools: [] };
  };

  // 内容区配置
  const getContentAreaConfig = () => {
    // 停止状态：不显示内容
    if (messageState === 'stopped' || messageState === 'failed') {
      return { visible: false, content: '', isStreaming: false };
    }

    // 思考中/执行中：无内容
    if (messageState === 'thinking' || messageState === 'executing') {
      return { visible: false, content: '', isStreaming: false };
    }

    // 场景D多轮对话：气泡1使用确认内容
    if (isFirstBubbleInD) {
      return { visible: true, content: ANSWERS.D_confirm, isStreaming: false };
    }

    // 场景D多轮对话：气泡2使用最终内容
    if (isSecondBubbleInD) {
      // 流式输出
      if (messageState === 'streaming') {
        return { visible: true, content: ANSWERS.D_final.substring(0, 50) + '...', isStreaming: true };
      }
      // 完成
      if (messageState === 'complete') {
        return { visible: true, content: ANSWERS.D_final, isStreaming: false };
      }
    }

    // 流式输出
    if (messageState === 'streaming') {
      const answer = ANSWERS[scenario as keyof typeof ANSWERS];
      const content = typeof answer === 'object' ? answer.streaming : answer;
      return { visible: true, content, isStreaming: true };
    }

    // 完成
    if (messageState === 'complete') {
      const answer = ANSWERS[scenario as keyof typeof ANSWERS];
      const content = typeof answer === 'object' ? answer.full : answer;
      return { visible: true, content, isStreaming: false };
    }

    return { visible: false, content: '', isStreaming: false };
  };

  // 操作栏配置
  const getActionBarConfig = () => {
    // 场景D气泡1：只显示复制和反馈，不显示重新生成
    if (isFirstBubbleInD) {
      return {
        visible: true,
        showRegenerate: false,
        showAllActions: true,
        isRetry: false,
      };
    }

    const showRegenerate = messageState === 'stopped' || messageState === 'failed';
    const showAllActions = messageState === 'complete';
    const isRetry = messageState === 'failed';

    return {
      visible: showRegenerate || showAllActions,
      showRegenerate,
      showAllActions,
      isRetry,
    };
  };

  const statusBarConfig = getStatusBarConfig();
  const callStackConfig = getCallStackConfig();
  const contentAreaConfig = getContentAreaConfig();
  const actionBarConfig = getActionBarConfig();

  // 是否显示消息气泡
  const showBubble = messageState !== 'thinking' || isPlayground;

  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-2 max-w-[80%]">
        {/* 头像 */}
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm flex-shrink-0">
          🤖
        </div>

        <div className="space-y-2 flex-1 min-w-[300px]">
          {/* 思考中状态（终端用户简化展示） */}
          {messageState === 'thinking' && (
            <div className="bg-white border border-slate-200 px-4 py-3 rounded-eva-sm rounded-tl-sm shadow-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Loader2 size={16} className="animate-spin text-primary-500" />
                <span className="text-sm">
                  {isPlayground ? '正在思考...' : waitingTexts[waitingTextIndex]}
                </span>
              </div>
            </div>
          )}

          {/* 主消息气泡（非思考中状态） */}
          {messageState !== 'thinking' && (
            <div className="bg-white border border-slate-200 rounded-eva-sm rounded-tl-sm shadow-sm overflow-hidden">
              {/* 状态栏 */}
              <StatusBar
                visible={statusBarConfig.visible}
                text={statusBarConfig.text}
                type={statusBarConfig.type}
              />

              {/* 调用栈 */}
              {isPlayground && (
                <CallStack
                  visible={callStackConfig.visible}
                  expanded={callStackConfig.expanded}
                  tools={callStackConfig.tools}
                  isExecuting={messageState === 'executing'}
                  onToggle={() => setCallStackExpanded(!callStackExpanded)}
                />
              )}

              {/* 内容区 */}
              <ContentArea
                visible={contentAreaConfig.visible}
                content={contentAreaConfig.content}
                isStreaming={contentAreaConfig.isStreaming}
                knowledgeSources={mockKnowledgeSources}
                showKnowledgeRef={features.showKnowledgeRef}
                isPlayground={isPlayground}
              />

              {/* 操作栏 */}
              <ActionBar
                visible={actionBarConfig.visible}
                showRegenerate={actionBarConfig.showRegenerate}
                showAllActions={actionBarConfig.showAllActions}
                isRetry={actionBarConfig.isRetry}
                onRegenerate={onRegenerate}
                onCopy={handleCopy}
                onLike={handleLike}
                onDislike={handleDislike}
                copied={copied}
                liked={liked}
                disliked={disliked}
              />
            </div>
          )}

          {/* 反馈面板 */}
          {showFeedback && (
            <FeedbackPanel
              isPlayground={isPlayground}
              onClose={() => setShowFeedback(false)}
              onSubmit={() => setShowFeedback(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};
