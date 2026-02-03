/**
 * Turn 消息组件 - 方案二：执行过程与输出结果分离
 *
 * 时间轴样式 UI：
 * - 竖线 + 节点圆点，突出流程感
 * - 子能力调用默认收起，右侧展开按钮
 * - 思考文字默认展开，支持收起
 * - 淡入动画效果
 */

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Copy, RefreshCw, ThumbsUp, ThumbsDown, Check, ChevronDown, ChevronUp, FileInput, FileOutput, AlertTriangle } from 'lucide-react';
import { getToolFriendlyName, getToolFriendlyNameForUserRunning, getToolFriendlyNameForUserDone, getSkillFriendlyName, getSkillFriendlyNameForUserRunning, getSkillFriendlyNameForUserDone, KnowledgeReference } from '../types/api';
import ReactMarkdown from 'react-markdown';
import { FeedbackPanel } from './FeedbackPanel';

// 代码块组件 - 支持复制
const CodeBlock: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className }) => {
  const [copied, setCopied] = useState(false);
  const codeContent = String(children).replace(/\n$/, '');
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // 降级方案：使用 execCommand
      const textarea = document.createElement('textarea');
      textarea.value = codeContent;
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

  // 检测是否是代码块（有语言标识）
  const match = /language-(\w+)/.exec(className || '');
  
  if (match) {
    // 多行代码块
    return (
      <div className="relative group my-2">
        <div className="absolute right-2 top-2">
          <button
            onClick={handleCopy}
            className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 hover:text-white transition-colors"
            title="复制代码"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
        <pre className="bg-gray-800 text-gray-100 rounded-lg p-3 pr-10 overflow-x-auto text-xs">
          <code className={className}>{codeContent}</code>
        </pre>
      </div>
    );
  }
  
  // 行内代码
  return <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs text-gray-700">{children}</code>;
};

// 执行过程项类型
export interface ProcessItem {
  type: 'text' | 'tool_call' | 'tool_result';
  content?: string;
  toolName?: string;
  skillKey?: string;
  status?: 'running' | 'done' | 'failed';
  input?: Record<string, unknown>;
  toolCallId?: string;
}

// 渲染模式类型
type RenderMode = 'timeline' | 'separated-realtime' | 'separated-delayed' | 'separated-smart';

// Turn 数据结构 - 方案二
export interface TurnDataV2 {
  turnId: string;
  status: 'pending' | 'streaming' | 'complete' | 'failed' | 'canceled';
  displayMode: 'loading' | 'process' | 'streaming' | 'result';  // 显示模式，新增 'streaming' 用于智能模式
  processItems: ProcessItem[];
  pendingText: string;
  finalResult: string;
  hasToolCall: boolean;
  isResultConfirmed: boolean;
  processedToolCallIds: Set<string>;
  // 智能模式相关
  smartStartTime?: number;  // 开始接收文本的时间戳
  smartSwitchedToStreaming?: boolean;  // 是否已切换到流式显示
  // 知识引用
  knowledgeReferences?: KnowledgeReference[];
}

interface TurnMessageV2Props {
  turn: TurnDataV2;
  renderMode: RenderMode;
  resultStyle?: 'with-bg' | 'no-bg';
  onRegenerate?: () => void;
  isLatest?: boolean;  // 是否是最新的气泡
  disableToolExpand?: boolean;  // 是否禁用工具卡片展开（独立网页和页面嵌入模式）
  showKnowledgeReferences?: boolean;  // 是否显示知识引用（仅 playground 模式）
  isUserView?: boolean;  // 是否是终端用户视角（独立网页/页面嵌入），影响文案显示
}

// ============================================
// 时间轴节点图标组件
// ============================================
const NodeIcon: React.FC<{
  status: 'pending' | 'running' | 'done' | 'failed';
}> = ({ status }) => {
  const baseClass = "w-3 h-3 rounded-full flex-shrink-0";

  switch (status) {
    case 'done':
      return <div className={`${baseClass} bg-gray-300`} />;
    case 'running':
      return <div className={`${baseClass} bg-gray-400 animate-pulse-node`} />;
    case 'failed':
      return <div className={`${baseClass} bg-red-400`} />;
    case 'pending':
    default:
      return <div className={`${baseClass} border-2 border-gray-200 bg-white`} />;
  }
};

// ============================================
// 时间轴节点容器组件
// ============================================
const TimelineNode: React.FC<{
  status: 'pending' | 'running' | 'done' | 'failed';
  isLast?: boolean;
  children: React.ReactNode;
}> = ({ status, isLast = false, children }) => {
  return (
    <div className="flex animate-fadeSlideIn">
      {/* 左侧：节点图标 + 连接线 */}
      <div className="flex flex-col items-center mr-3 pt-1">
        <NodeIcon status={status} />
        {!isLast && (
          <div className="w-px flex-1 bg-gray-200 mt-1 min-h-[16px]" />
        )}
      </div>

      {/* 右侧：内容区 */}
      <div className="flex-1 pb-3 min-w-0">
        {children}
      </div>
    </div>
  );
};

// ============================================
// 思考文字节点（直接显示，不可收起）
// ============================================
const ThinkingNode: React.FC<{
  content: string;
  status: 'running' | 'done';
  isLast?: boolean;
  isStreaming?: boolean;
}> = ({ content, status, isLast = false, isStreaming = false }) => {
  return (
    <TimelineNode status={status} isLast={isLast}>
      <div className="text-sm text-gray-500 italic prose prose-sm prose-gray max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-pre:my-2 prose-code:text-xs prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-800 prose-pre:text-gray-100">
        <ReactMarkdown components={{ code: CodeBlock }}>{content}</ReactMarkdown>
        {isStreaming && <span className="typing-cursor ml-0.5 not-italic">█</span>}
      </div>
    </TimelineNode>
  );
};

// ============================================
// 子能力调用节点（可收起，默认收起）
// ============================================
const ToolCallNode: React.FC<{
  toolName: string;
  skillKey?: string;
  status: 'running' | 'done' | 'failed' | 'interrupted';
  input?: Record<string, unknown>;
  result?: string;
  isLast?: boolean;
  disableExpand?: boolean;  // 是否禁用展开
  isUserView?: boolean;  // 是否是终端用户视角
}> = ({ toolName, skillKey, status, input, result, isLast = false, disableExpand = false, isUserView = false }) => {
  const [expanded, setExpanded] = useState(false);

  // 不显示 write_todos
  if (toolName === 'write_todos') return null;

  // 根据视角选择不同的名称获取函数
  // 终端用户视角使用 Running 版本（因为这里只在执行过程中显示）
  const skillName = skillKey 
    ? (isUserView ? getSkillFriendlyNameForUserRunning(skillKey) : getSkillFriendlyName(skillKey)) 
    : null;
  const friendlyToolName = isUserView ? getToolFriendlyNameForUserRunning(toolName) : getToolFriendlyName(toolName);

  // 获取显示名称
  let displayName = friendlyToolName;
  if (toolName === 'task' && input) {
    const subagentType = input.subagent_type as string;
    if (subagentType) {
      displayName = isUserView 
        ? getSkillFriendlyNameForUserRunning(subagentType) 
        : (getSkillFriendlyName(subagentType) || subagentType);
    } else {
      displayName = isUserView ? '正在处理...' : '子能力';
    }
  } else if (skillName) {
    displayName = skillName;
  }

  // 获取描述（展开时显示）
  const description = input?.description as string || input?.prompt as string || '';

  // 状态图标 - 终端用户视角不显示状态标签
  const getStatusBadge = () => {
    if (isUserView) return null;  // 终端用户不显示状态标签
    
    switch (status) {
      case 'done':
        return <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">完成</span>;
      case 'running':
        return (
          <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded flex items-center gap-1">
            <Loader2 size={10} className="animate-spin" />
            执行中
          </span>
        );
      case 'failed':
        return <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded">失败</span>;
      case 'interrupted':
        return <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">已停止</span>;
    }
  };

  // 节点图标状态映射
  const nodeStatus = status === 'interrupted' ? 'failed' : status;

  // 禁用展开时，不显示展开按钮和展开内容
  if (disableExpand) {
    return (
      <TimelineNode status={nodeStatus} isLast={isLast}>
        <div className="bg-gray-100 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-sm font-medium text-gray-700 truncate">
                {displayName}
              </span>
              {getStatusBadge()}
            </div>
          </div>
        </div>
      </TimelineNode>
    );
  }

  return (
    <TimelineNode status={nodeStatus} isLast={isLast}>
      <div className="bg-gray-100 rounded-lg overflow-hidden">
        {/* 标题行 */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 transition-colors duration-200 text-left cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-sm font-medium text-gray-700 truncate">
              {displayName}
            </span>
            {getStatusBadge()}
          </div>
          <span className="text-gray-400 flex-shrink-0 ml-2">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </button>

        {/* 展开内容 */}
        {expanded && (
          <div className="animate-fadeSlideIn">
            {/* 输入参数 */}
            {description && (
              <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                  <FileInput size={12} />
                  <span>输入</span>
                </div>
                <div className="text-sm text-gray-500">{description}</div>
              </div>
            )}

            {result && (
              <div className="px-3 py-2 bg-gray-50">
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                  <FileOutput size={12} />
                  <span>返回结果</span>
                </div>
                <div className="text-xs text-gray-500 font-mono whitespace-pre-wrap break-all max-h-32 overflow-auto">
                  {result}
                </div>
              </div>
            )}

            {/* 执行中但无结果 */}
            {status === 'running' && !result && (
              <div className="px-3 py-2 bg-gray-50">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Loader2 size={12} className="animate-spin" />
                  <span>正在执行...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </TimelineNode>
  );
};

// ============================================
// 骨架屏等待节点（工具调用完成后等待新内容）
// ============================================
const SkeletonWaitingNode: React.FC<{ isLast?: boolean }> = ({ isLast = true }) => (
  <TimelineNode status="running" isLast={isLast}>
    <div className="space-y-2 py-1">
      <div className="h-3 w-3/4 rounded skeleton-shimmer" />
      <div className="h-3 w-1/2 rounded skeleton-shimmer" />
      <div className="h-3 w-2/3 rounded skeleton-shimmer" />
    </div>
  </TimelineNode>
);

// ============================================
// 知识引用组件
// ============================================
const KnowledgeReferencesDisplay: React.FC<{
  references: KnowledgeReference[];
}> = ({ references }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!references || references.length === 0) return null;

  // 最多显示 3 个，其余折叠
  const visibleRefs = expanded ? references : references.slice(0, 3);
  const hasMore = references.length > 3;

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        <span>引用了 {references.length} 个知识文件</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {visibleRefs.map((ref, index) => (
          <div
            key={index}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg cursor-default"
            title={ref.fileName}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="max-w-[150px] truncate">{ref.fileName}</span>
          </div>
        ))}
        {hasMore && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            +{references.length - 3} 更多
          </button>
        )}
        {expanded && hasMore && (
          <button
            onClick={() => setExpanded(false)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            收起
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================
// 主组件：TurnMessageV2
// ============================================
export const TurnMessageV2: React.FC<TurnMessageV2Props> = ({ turn, renderMode, resultStyle = 'with-bg', onRegenerate, isLatest = false, disableToolExpand = false, showKnowledgeReferences = false, isUserView = false }) => {
  const [processExpanded, setProcessExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'like' | 'dislike'>('like');  // 区分点赞/点踩的 toast
  const [isHovered, setIsHovered] = useState(false);
  
  // 终端用户视角：追踪工具完成状态，用于显示"完成过渡"文案
  const [lastCompletedToolId, setLastCompletedToolId] = useState<string | null>(null);
  const [showCompletedText, setShowCompletedText] = useState(false);
  const lastToolCallIdRef = useRef<string | null>(null);
  
  // 监听工具调用状态变化，触发"完成过渡"文案
  useEffect(() => {
    if (!isUserView) return;
    
    const toolCalls = turn.processItems.filter(item => item.type === 'tool_call');
    if (toolCalls.length === 0) return;
    
    const lastToolCall = toolCalls[toolCalls.length - 1];
    const currentToolId = lastToolCall.toolCallId || null;
    
    // 检测最后一个工具是否刚完成
    if (lastToolCall.status === 'done' && currentToolId && currentToolId !== lastCompletedToolId) {
      // 新工具完成了，显示完成文案
      setLastCompletedToolId(currentToolId);
      setShowCompletedText(true);
      
      // 1.5秒后隐藏完成文案
      const timer = setTimeout(() => {
        setShowCompletedText(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
    
    // 如果有新的 running 工具，立即切换到执行中文案
    if (lastToolCall.status === 'running' && currentToolId !== lastToolCallIdRef.current) {
      setShowCompletedText(false);
      lastToolCallIdRef.current = currentToolId;
    }
  }, [isUserView, turn.processItems, lastCompletedToolId]);

  // 点踩处理
  const handleDislike = () => {
    if (liked || disliked) return; // 已经确认点过就不能再点
    if (showFeedbackModal) {
      // 再次点击点踩：关闭面板，取消这次点踩操作
      setShowFeedbackModal(false);
      return;
    }
    // 初次点击：打开反馈面板，点赞按钮不消失
    setShowFeedbackModal(true);
  };

  // 点赞处理（不支持取消）
  const handleLike = () => {
    if (liked || disliked) return; // 已经点过就不能再点
    if (showFeedbackModal) {
      // 如果点踩面板打开中，关闭它并取消点踩
      setShowFeedbackModal(false);
    }
    setLiked(true);
    // 显示 toast
    setToastType('like');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // 反馈面板关闭处理（确认点踩，不取消）
  const handleFeedbackClose = () => {
    setShowFeedbackModal(false);
    setDisliked(true);  // 关闭时确认点踩
    // 显示 toast
    setToastType('dislike');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // 反馈提交处理
  const handleFeedbackSubmit = (reasons: string[], comment: string) => {
    console.log('Feedback submitted:', { reasons, comment, turnId: turn.turnId });
    setShowFeedbackModal(false);
    setDisliked(true);  // 提交时确认点踩
    // 显示 toast
    setToastType('dislike');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
    // TODO: 发送反馈到后端
  };

  // 切换动画状态
  const [isTransitioning, setIsTransitioning] = useState(false);
  // 是否已自动收起过（确保只自动收起一次）
  const [hasAutoCollapsed, setHasAutoCollapsed] = useState(false);
  // 结果区域动画阶段
  const [resultPhase, setResultPhase] = useState<'hidden' | 'bubble' | 'skeleton' | 'content'>('hidden');
  const prevIsResultConfirmedRef = useRef(turn.isResultConfirmed);


  // 检测需要触发切换动画的场景
  useEffect(() => {
    if (turn.isResultConfirmed && !prevIsResultConfirmedRef.current) {
      if (!turn.hasToolCall) {
        // 无工具调用时，触发切换动画
        setIsTransitioning(true);
        const timer = setTimeout(() => setIsTransitioning(false), 400);
        return () => clearTimeout(timer);
      }
    }
    prevIsResultConfirmedRef.current = turn.isResultConfirmed;
  }, [turn.isResultConfirmed, turn.hasToolCall]);

  // 停止时自动收起执行过程区（当有输出内容时）
  useEffect(() => {
    if (turn.status === 'canceled' && (turn.pendingText || turn.finalResult) && turn.hasToolCall) {
      setProcessExpanded(false);
    }
  }, [turn.status, turn.pendingText, turn.finalResult, turn.hasToolCall]);

  // 自动收起执行过程区，收起完成后再显示结果
  // 注意：不要将 hasAutoCollapsed 放入依赖数组，否则 setHasAutoCollapsed 会触发 effect 重新运行，
  // cleanup 会清除 setTimeout，导致自动收起无法完成
  useEffect(() => {
    if (turn.isResultConfirmed && turn.hasToolCall && !hasAutoCollapsed) {
      setHasAutoCollapsed(true);
      
      // 立即开始收起执行过程区
      setProcessExpanded(false);
      
      // 等收起动画完成后（200ms）再开始显示结果
      if (turn.finalResult && resultPhase === 'hidden') {
        const collapseDelay = 200; // 等待收起动画
        
        const bubbleTimer = setTimeout(() => setResultPhase('bubble'), collapseDelay);
        const skeletonTimer = setTimeout(() => setResultPhase('skeleton'), collapseDelay + 200);
        const contentTimer = setTimeout(() => setResultPhase('content'), collapseDelay + 400);
        
        return () => {
          clearTimeout(bubbleTimer);
          clearTimeout(skeletonTimer);
          clearTimeout(contentTimer);
        };
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn.isResultConfirmed, turn.hasToolCall]);

  // 结果区域三阶段动画（仅用于无工具调用的情况）
  // 注意：不要将 resultPhase 放入依赖数组，否则 setResultPhase 会触发 effect 重新运行，
  // cleanup 会清除 setTimeout，导致动画无法完成
  useEffect(() => {
    // 有工具调用时，动画由上面的 effect 处理
    if (turn.hasToolCall) return;
    
    const showResultArea = turn.isResultConfirmed && turn.finalResult;
    if (showResultArea && resultPhase === 'hidden') {
      // 阶段1: 显示气泡
      setResultPhase('bubble');

      // 阶段2: 显示骨架屏 (200ms后)
      const skeletonTimer = setTimeout(() => setResultPhase('skeleton'), 200);

      // 阶段3: 显示真实内容 (400ms后)
      const contentTimer = setTimeout(() => setResultPhase('content'), 400);

      return () => {
        clearTimeout(skeletonTimer);
        clearTimeout(contentTimer);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn.isResultConfirmed, turn.finalResult, turn.hasToolCall]);

  const isComplete = turn.status === 'complete';
  const isFailed = turn.status === 'failed';
  const isCanceled = turn.status === 'canceled';
  const isStreaming = turn.status === 'streaming';
  const isPending = turn.status === 'pending';

  // 是否显示执行过程区
  // 实时模式：有工具调用或有待判断文本时显示
  // 延迟模式：displayMode 为 'process' 时显示，或者已完成但有工具调用时也显示
  // 智能模式：有工具调用时显示，或者切换到流式显示且有待判断文本时显示
  // 停止/失败时：如果有 processItems 也要显示
  // 终端用户视角：完成后隐藏执行过程区
  const showProcessArea = (() => {
    // 终端用户视角：完成后不显示执行过程区
    if (isUserView && turn.isResultConfirmed) {
      return false;
    }
    // 停止/失败时，如果有执行过程内容，显示执行过程区
    if ((isCanceled || isFailed) && turn.processItems.length > 0) {
      return true;
    }
    if (renderMode === 'separated-delayed') {
      return turn.displayMode === 'process' || (turn.displayMode === 'result' && turn.hasToolCall);
    }
    if (renderMode === 'separated-smart') {
      // 智能模式：只有工具调用时才显示执行过程区
      return turn.hasToolCall;
    }
    // 实时模式
    return turn.hasToolCall || (turn.pendingText && !turn.isResultConfirmed);
  })();

  // 是否显示流式文本区（智能模式专用）
  const showStreamingArea = renderMode === 'separated-smart' 
    && turn.displayMode === 'streaming' 
    && turn.pendingText 
    && !turn.isResultConfirmed
    && !turn.hasToolCall
    && !isCanceled
    && !isFailed;

  // 是否显示输出结果区
  // 实时模式：结果已确认且有最终结果时显示
  // 延迟模式：displayMode 为 'result' 时显示
  // 智能模式：结果已确认且有最终结果时显示
  // 停止/失败时：如果有部分结果也要显示
  const showResultArea = (() => {
    // 停止/失败时，如果有部分结果，显示结果区
    if ((isCanceled || isFailed) && (turn.pendingText || turn.finalResult)) {
      return true;
    }
    if (renderMode === 'separated-delayed') {
      return turn.displayMode === 'result' && turn.finalResult;
    }
    // 实时模式和智能模式
    return turn.isResultConfirmed && turn.finalResult;
  })();

  // 是否显示 loading 状态
  // 延迟模式：displayMode 为 'loading' 时显示
  // 智能模式：displayMode 为 'loading' 且未切换到流式时显示
  // 停止/失败时不显示 loading
  const showLoading = (() => {
    if (isCanceled || isFailed) return false;
    if (renderMode === 'separated-delayed') {
      return turn.displayMode === 'loading';
    }
    if (renderMode === 'separated-smart') {
      return turn.displayMode === 'loading' && !turn.smartSwitchedToStreaming && !turn.hasToolCall;
    }
    return false;
  })();

  // 执行过程标题
  const processTitle = (() => {
    if (isCanceled || isFailed) {
      // 停止或失败时，统一显示"已停止"
      return '已停止';
    }
    return turn.isResultConfirmed && turn.hasToolCall ? '已完成' : '任务进行中';
  })();

  // 停止/失败时的提示文案
  const getStatusMessage = () => {
    return isCanceled ? '您停止了这条回答' : '出了点问题';
  };

  // 复制内容
  const handleCopy = async () => {
    const textToCopy = turn.finalResult || turn.pendingText;
    if (!textToCopy) return;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // 降级方案：使用 execCommand
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
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

  // 构建时间轴节点列表
  const buildTimelineNodes = () => {
    const nodes: React.ReactNode[] = [];
    const renderedToolCallIds = new Set<string>();
    const items = turn.processItems;
    // 当停止/失败且有输出内容时，pendingText 应该在结果区显示，不在执行过程区显示
    const shouldShowPendingInProcess = turn.pendingText && !turn.isResultConfirmed && !((isCanceled || isFailed) && (turn.pendingText || turn.finalResult));
    const isTaskComplete = turn.isResultConfirmed && turn.hasToolCall;

    // 预先建立 toolCallId -> tool_result 的映射（支持结果在调用之前或之后）
    const resultMap = new Map<string, ProcessItem>();
    items.forEach(item => {
      if (item.type === 'tool_result' && item.toolCallId) {
        resultMap.set(item.toolCallId, item);
      }
    });

    // 预先计算是否显示骨架屏
    const toolCalls = items.filter(item => item.type === 'tool_call');
    const allToolCallsDone = toolCalls.length > 0 && toolCalls.every(tc => {
      const result = resultMap.get(tc.toolCallId || '');
      return !!result;
    });
    const showSkeleton = allToolCallsDone && !shouldShowPendingInProcess && !isTaskComplete && isStreaming;

    // 开始任务节点 - 已移除

    items.forEach((item, index) => {
      // 跳过工具结果（它们会在对应的 tool_call 中渲染）
      if (item.type === 'tool_result') return;

      // 计算当前是否是最后一个可渲染的节点
      const isLastItem = index === items.length - 1;
      const isLastNode = isLastItem && !shouldShowPendingInProcess && !showSkeleton;

      if (item.type === 'text' && item.content) {
        nodes.push(
          <ThinkingNode
            key={`text-${index}`}
            content={item.content}
            status="done"
            isLast={isLastNode}
          />
        );
      }

      if (item.type === 'tool_call' && item.toolName && item.toolCallId) {
        // 跳过已渲染过的工具调用（处理重复）
        if (renderedToolCallIds.has(item.toolCallId)) return;
        renderedToolCallIds.add(item.toolCallId);

        // 从预建的映射中查找对应的工具结果（不依赖位置顺序）
        const resultItem = resultMap.get(item.toolCallId);
        const hasResult = !!resultItem;

        // 计算有效状态：停止/失败时，running 改为 interrupted
        // 但如果有内容输出（pendingText 或 finalResult），说明工具已完成，不需要改为 interrupted
        let effectiveStatus: 'running' | 'done' | 'failed' | 'interrupted' = hasResult ? 'done' : (item.status || 'running');
        if ((isCanceled || isFailed) && effectiveStatus === 'running') {
          // 只有在没有内容输出时才显示 interrupted
          if (!turn.pendingText && !turn.finalResult) {
            effectiveStatus = 'interrupted';
          }
        }

        nodes.push(
          <ToolCallNode
            key={`tool-${item.toolCallId}`}
            toolName={item.toolName}
            skillKey={item.skillKey}
            status={effectiveStatus}
            input={item.input}
            result={resultItem?.content}
            isLast={isLastNode}
            disableExpand={disableToolExpand}
            isUserView={isUserView}
          />
        );
      }
    });

    // 待判断的文本（流式显示）- 停止/失败时不显示光标
    // 当停止/失败且有输出内容时，不在这里显示（会在结果区显示）
    if (shouldShowPendingInProcess) {
      const isPendingLast = !showSkeleton;
      nodes.push(
        <ThinkingNode
          key="pending"
          content={turn.pendingText}
          status={isCanceled || isFailed ? 'done' : 'running'}
          isLast={isPendingLast}
          isStreaming={isStreaming && !isCanceled && !isFailed}
        />
      );
    }

    // 骨架屏等待节点：工具调用完成后等待新内容
    // 条件：有工具调用、最后一个工具调用已完成、没有待处理文本、任务未完成
    const showSkeletonNode = allToolCallsDone && !shouldShowPendingInProcess && !isTaskComplete && isStreaming;

    if (showSkeletonNode) {
      nodes.push(<SkeletonWaitingNode key="skeleton" isLast={true} />);
    }

    // 任务已完成节点 - 已移除

    return nodes;
  };

  // 获取终端用户视角的简化提示文案
  const getUserViewProcessText = () => {
    const toolCalls = turn.processItems.filter(item => item.type === 'tool_call');
    
    // 无工具调用时
    if (toolCalls.length === 0) {
      return '正在思考...';
    }
    
    // 取最后一个工具调用
    const lastToolCall = toolCalls[toolCalls.length - 1];
    const isDone = lastToolCall.status === 'done';
    
    // 获取实际的能力类型（优先从 input.subagent_type 获取，其次是 skillKey）
    const effectiveSkillKey = (lastToolCall.toolName === 'task' && lastToolCall.input?.subagent_type) 
      ? (lastToolCall.input.subagent_type as string)
      : lastToolCall.skillKey;
    
    // 如果工具完成且在显示完成文案的时间窗口内
    if (isDone && showCompletedText) {
      if (effectiveSkillKey) {
        return getSkillFriendlyNameForUserDone(effectiveSkillKey);
      }
      if (lastToolCall.toolName && lastToolCall.toolName !== 'task') {
        return getToolFriendlyNameForUserDone(lastToolCall.toolName);
      }
      return '处理完成，正在整理...';
    }
    
    // 执行中或完成文案已过期，显示执行中文案
    if (effectiveSkillKey) {
      return getSkillFriendlyNameForUserRunning(effectiveSkillKey);
    }
    if (lastToolCall.toolName && lastToolCall.toolName !== 'task') {
      return getToolFriendlyNameForUserRunning(lastToolCall.toolName);
    }
    return '正在处理中...';
  };

  return (
    <div className="flex justify-start">
      <div className={resultStyle === 'no-bg' ? 'w-full' : 'max-w-[80%]'}>
        <div className="space-y-3 flex-1 min-w-[300px]">
          {/* 执行过程区 */}
          {showProcessArea && (
            <div className={`rounded-xl overflow-hidden ${isTransitioning ? 'opacity-0 transition-opacity duration-300' : ''}`}>
              {/* 终端用户视角：简化显示，不可收起 */}
              {isUserView ? (
                <div className="py-2 overflow-hidden">
                  <span 
                    key={getUserViewProcessText()} 
                    className="text-sm text-gray-500 animate-fadeInText animate-textPulse inline-block"
                  >
                    {getUserViewProcessText()}
                  </span>
                </div>
              ) : (
                <>
                  {/* 管理员视角：标题栏 - 始终可见 */}
                  <button
                    onClick={() => setProcessExpanded(!processExpanded)}
                    className="inline-flex items-center gap-1 py-2 hover:bg-gray-50/50 transition-colors duration-200 cursor-pointer rounded"
                  >
                    <span className={`text-sm text-gray-500 ${(isStreaming || isPending) && !turn.isResultConfirmed ? 'animate-textPulse' : ''}`}>
                      {processTitle}
                    </span>
                    <span className="text-gray-400">
                      {processExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                  </button>

                  {/* 时间轴内容区 - 可收起 */}
                  <div
                    className="collapsing-wrapper"
                    style={{ maxHeight: processExpanded ? '2000px' : '0' }}
                  >
                    <div className="pb-3 bg-gray-50/50 rounded-xl">
                      <div className="px-4 pt-3">
                        {turn.processItems.length === 0 && !turn.pendingText && isPending && !isCanceled && !isFailed ? (
                          <>
                            {/* 思考中节点 */}
                            <TimelineNode status="running" isLast={true}>
                              <span className="text-sm text-gray-500 animate-textPulse">正在思考...</span>
                            </TimelineNode>
                          </>
                        ) : (
                          buildTimelineNodes()
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 智能模式的流式文本区 */}
          {showStreamingArea && (
            <div className="animate-fadeSlideIn">
              {resultStyle === 'no-bg' ? (
                <div className="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none">
                  <ReactMarkdown components={{ code: CodeBlock }}>{turn.pendingText}</ReactMarkdown>
                  <span className="typing-cursor">█</span>
                </div>
              ) : (
                <div className="bg-white rounded-2xl rounded-tl-md shadow-sm overflow-hidden">
                  <div className="px-4 py-3">
                    <div className="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none">
                      <ReactMarkdown components={{ code: CodeBlock }}>{turn.pendingText}</ReactMarkdown>
                      <span className="typing-cursor">█</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 输出结果区 */}
          {showResultArea && (
            <div className="animate-bubbleSlideIn">
              {resultStyle === 'no-bg' ? (
                // 无底色版本
                <div 
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <div className="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none">
                    <ReactMarkdown components={{ code: CodeBlock }}>{turn.finalResult || turn.pendingText}</ReactMarkdown>
                  </div>
                  {/* 知识引用 - 仅 playground 模式显示 */}
                  {showKnowledgeReferences && turn.knowledgeReferences && turn.knowledgeReferences.length > 0 && (
                    <KnowledgeReferencesDisplay references={turn.knowledgeReferences} />
                  )}
                  {/* 操作栏 - 始终占位，通过透明度控制显示 */}
                  {isComplete && (
                    <div className={`flex items-center gap-1 mt-1 h-7 transition-opacity duration-200 ${isLatest || isHovered ? 'opacity-100' : 'opacity-0'}`}>
                      {/* 重试按钮 - 只有最新气泡才显示 */}
                      {isLatest && (
                        <button
                          onClick={onRegenerate}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="重新生成"
                        >
                          <RefreshCw size={14} />
                        </button>
                      )}
                      <button
                        onClick={handleCopy}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="复制"
                      >
                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                      {/* 点赞 - 点踩后隐藏 */}
                      {!disliked && (
                        <button
                          onClick={handleLike}
                          className={`p-1.5 rounded-lg ${liked ? 'text-gray-600 bg-gray-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                          title="点赞"
                        >
                          <ThumbsUp size={14} fill={liked ? 'currentColor' : 'none'} />
                        </button>
                      )}
                      {/* 点踩 - 点赞后隐藏，反馈面板打开时显示实心 */}
                      {!liked && (
                        <button
                          onClick={handleDislike}
                          className={`p-1.5 rounded-lg ${disliked || showFeedbackModal ? 'text-gray-600 bg-gray-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                          title="点踩"
                        >
                          <ThumbsDown size={14} fill={disliked || showFeedbackModal ? 'currentColor' : 'none'} />
                        </button>
                      )}
                    </div>
                  )}
                  {/* 反馈面板 - 无底色版本 */}
                  <FeedbackPanel
                    isOpen={showFeedbackModal}
                    onClose={handleFeedbackClose}
                    onSubmit={handleFeedbackSubmit}
                  />
                </div>
              ) : (
                // 有底色版本（原有代码）
                <div 
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <div className="bg-white rounded-2xl rounded-tl-md shadow-sm overflow-hidden">
                    <div className="px-4 py-3">
                      {/* 骨架屏阶段 */}
                      {(resultPhase === 'bubble' || resultPhase === 'skeleton') && (
                        <div className={`space-y-2 ${resultPhase === 'skeleton' ? 'animate-fadeIn' : 'opacity-0'}`}>
                          <div className="h-4 w-3/4 rounded skeleton-shimmer" />
                          <div className="h-4 w-1/2 rounded skeleton-shimmer" />
                          <div className="h-4 w-2/3 rounded skeleton-shimmer" />
                        </div>
                      )}

                      {/* 真实内容阶段 */}
                      {resultPhase === 'content' && (
                        <div className="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none animate-textFadeIn">
                          <ReactMarkdown components={{ code: CodeBlock }}>{turn.finalResult || turn.pendingText}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                    {/* 知识引用 - 仅 playground 模式显示 */}
                    {showKnowledgeReferences && turn.knowledgeReferences && turn.knowledgeReferences.length > 0 && resultPhase === 'content' && (
                      <div className="px-4 pb-3">
                        <KnowledgeReferencesDisplay references={turn.knowledgeReferences} />
                      </div>
                    )}
                  </div>

                  {/* 操作栏 - 始终占位，通过透明度控制显示 */}
                  {isComplete && (
                    <div className={`flex items-center gap-1 px-1 mt-1 h-7 transition-opacity duration-200 ${isLatest || isHovered ? 'opacity-100' : 'opacity-0'}`}>
                      {/* 重试按钮 - 只有最新气泡才显示 */}
                      {isLatest && (
                        <button
                          onClick={onRegenerate}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="重新生成"
                        >
                          <RefreshCw size={14} />
                        </button>
                      )}
                      <button
                        onClick={handleCopy}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="复制"
                      >
                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                      {/* 点赞 - 点踩后隐藏 */}
                      {!disliked && (
                        <button
                          onClick={handleLike}
                          className={`p-1.5 rounded-lg ${liked ? 'text-gray-600 bg-gray-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                          title="点赞"
                        >
                          <ThumbsUp size={14} fill={liked ? 'currentColor' : 'none'} />
                        </button>
                      )}
                      {/* 点踩 - 点赞后隐藏，反馈面板打开时显示实心 */}
                      {!liked && (
                        <button
                          onClick={handleDislike}
                          className={`p-1.5 rounded-lg ${disliked || showFeedbackModal ? 'text-gray-600 bg-gray-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                          title="点踩"
                        >
                          <ThumbsDown size={14} fill={disliked || showFeedbackModal ? 'currentColor' : 'none'} />
                        </button>
                      )}
                    </div>
                  )}
                  {/* 反馈面板 - 有底色版本 */}
                  <FeedbackPanel
                    isOpen={showFeedbackModal}
                    onClose={handleFeedbackClose}
                    onSubmit={handleFeedbackSubmit}
                  />
                </div>
              )}
            </div>
          )}

          {/* 延迟模式的 loading 状态 */}
          {showLoading && (
            <div className="py-2 animate-fadeSlideIn">
              <span className="text-gray-500 text-sm animate-textPulse">正在思考...</span>
            </div>
          )}

          {/* 实时模式的纯思考中状态（无任何内容时） */}
          {renderMode === 'separated-realtime' && isPending && !showProcessArea && !showResultArea && !isCanceled && !isFailed && (
            <div className="py-2 animate-fadeSlideIn">
              <span className="text-gray-500 text-sm animate-textPulse">正在思考...</span>
            </div>
          )}

          {/* 失败状态 */}
          {isFailed && (
            <div className="flex items-center gap-2 text-red-500 text-sm animate-fadeSlideIn">
              <AlertTriangle size={14} />
              <span>{getStatusMessage()}</span>
              {isLatest && (
                <button
                  onClick={onRegenerate}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="重试"
                >
                  <RefreshCw size={14} />
                </button>
              )}
            </div>
          )}

          {/* 已停止状态 */}
          {isCanceled && (
            <div className="flex items-center gap-2 text-gray-500 animate-fadeSlideIn">
              <span className="text-base italic">{getStatusMessage()}</span>
              {isLatest && (
                <button
                  onClick={onRegenerate}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="重新生成"
                >
                  <RefreshCw size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toast 提示 */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-50 animate-fadeIn">
          {toastType === 'like' 
            ? '感谢反馈' 
            : (isUserView ? '感谢反馈' : '已记录反馈，后续可作用于Agent进化')
          }
        </div>
      )}
    </div>
  );
};
