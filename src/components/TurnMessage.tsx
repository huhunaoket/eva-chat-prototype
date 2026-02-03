/**
 * Turn 消息组件 - 方案一：时间线式渲染
 *
 * 一个 Turn 包含：
 * - 一个或多个 assistant 消息（可能包含 tool_use）
 * - 零个或多个 tool 消息（工具调用结果）
 * - 流式文本内容
 */

import React, { useState, useMemo } from 'react';
import { Loader2, Copy, RefreshCw, ThumbsUp, ThumbsDown, Check, ChevronDown, ChevronRight, CheckCircle2, XCircle, AlertTriangle, Square } from 'lucide-react';
import { getToolFriendlyName, getSkillFriendlyName } from '../types/api';
import ReactMarkdown from 'react-markdown';
import { FeedbackPanel } from './FeedbackPanel';

// Turn 内的消息项
export interface TurnMessageItem {
  id: string;
  seq: number;
  role: 'assistant' | 'tool';
  status: 'in_progress' | 'final' | 'failed' | 'canceled';
  contentText: string;
  contentBlocks: ContentBlock[];
  toolCallId?: string;
  toolName?: string;
  skillKey?: string;
}

interface ContentBlock {
  type: 'text' | 'tool_use';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
}

export interface TurnData {
  turnId: string;
  status: 'pending' | 'streaming' | 'complete' | 'failed' | 'canceled';
  messages: TurnMessageItem[];
  streamingText: string;
}

interface TurnMessageProps {
  turn: TurnData;
  onRegenerate?: () => void;
}

// 工具调用卡片组件
const ToolCallCard: React.FC<{
  toolName: string;
  skillKey?: string;
  status: 'running' | 'done' | 'failed';
  input?: Record<string, unknown>;
}> = ({ toolName, skillKey, status, input }) => {
  const [expanded, setExpanded] = useState(false);

  // 不显示 write_todos（已在全局 TodoList 显示）
  if (toolName === 'write_todos') {
    return null;
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'done': return <CheckCircle2 size={14} className="text-green-500" />;
      case 'running': return <Loader2 size={14} className="animate-spin text-blue-500" />;
      case 'failed': return <XCircle size={14} className="text-red-500" />;
    }
  };

  const skillName = skillKey ? getSkillFriendlyName(skillKey) : null;
  const friendlyToolName = getToolFriendlyName(toolName);

  // 特殊处理 task 工具 - 显示子任务描述
  if (toolName === 'task' && input) {
    const description = input.description as string || '执行任务';
    const subagentType = input.subagent_type as string;
    // 截取描述前50字符作为简要说明
    const shortDesc = description.length > 50 ? description.slice(0, 50) + '...' : description;
    // 调用目标名称
    const targetName = subagentType || '子Agent';

    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden my-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-start gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 text-sm text-left cursor-pointer"
        >
          <span className="flex-shrink-0 mt-0.5">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">{targetName}</span>
              {getStatusIcon()}
            </div>
            <div className="text-xs text-gray-500 mt-0.5 truncate">{shortDesc}</div>
          </div>
        </button>
        {expanded && (
          <div className="px-3 py-2 border-t border-gray-200 text-xs space-y-1 bg-white">
            <div className="text-gray-600">
              <span className="font-medium text-gray-500">完整描述：</span>
              {description}
            </div>
            {subagentType && (
              <div className="text-gray-600">
                <span className="font-medium text-gray-500">Agent 类型：</span>
                {subagentType}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 普通工具调用 - 带 Skill 链
  if (skillName) {
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden my-2">
        <div className="flex items-start gap-2 px-3 py-2 bg-gray-50 text-sm">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">{skillName}</span>
              {getStatusIcon()}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{friendlyToolName}</div>
          </div>
        </div>
      </div>
    );
  }

  // 简单工具调用
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm my-1">
      <span className="text-gray-600">{friendlyToolName}</span>
      {getStatusIcon()}
    </div>
  );
};

// 工具结果卡片组件
const ToolResultCard: React.FC<{
  toolName: string;
  skillKey?: string;
  result: string;
  status: 'in_progress' | 'final' | 'failed';
}> = ({ toolName, skillKey, result, status }) => {
  const [expanded, setExpanded] = useState(false);

  // 不显示 write_todos 的结果（已经在调用时显示了任务列表）
  if (toolName === 'write_todos') {
    return null;
  }

  const isLong = result.length > 300;
  const displayResult = expanded || !isLong ? result : result.substring(0, 300) + '...';
  const friendlyToolName = getToolFriendlyName(toolName);
  const skillName = skillKey ? getSkillFriendlyName(skillKey) : null;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden my-2 ml-4">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200 text-sm">
        {skillName && (
          <>
            <span className="text-gray-600">{skillName}</span>
            <span className="text-gray-400">→</span>
          </>
        )}
        <span className="text-gray-600">{friendlyToolName}</span>
        {status === 'final' && <CheckCircle2 size={14} className="text-green-500" />}
        {status === 'in_progress' && <Loader2 size={14} className="animate-spin text-blue-500" />}
        {status === 'failed' && <XCircle size={14} className="text-red-500" />}
      </div>
      <div className="p-3 text-xs text-gray-500 font-mono whitespace-pre-wrap break-all max-h-60 overflow-auto">
        {displayResult}
      </div>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-3 py-1.5 text-xs text-blue-500 hover:bg-gray-50 border-t border-gray-200 cursor-pointer transition-colors duration-200"
        >
          {expanded ? '收起' : '展开全部'}
        </button>
      )}
    </div>
  );
};

export const TurnMessage: React.FC<TurnMessageProps> = ({ turn, onRegenerate }) => {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // 点踩处理
  const handleDislike = () => {
    setDisliked(true);
    setLiked(false);
    setShowFeedbackModal(true);
  };

  // 点赞处理
  const handleLike = () => {
    setLiked(true);
    setDisliked(false);
    setShowFeedbackModal(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // 反馈关闭处理（自动提交）
  const handleFeedbackClose = (reasons: string[], comment: string) => {
    console.log('Feedback submitted:', { reasons, comment, turnId: turn.turnId });
    setShowFeedbackModal(false);
    // TODO: 发送反馈到后端
  };

  // 反馈提交成功
  const handleFeedbackSuccess = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const isComplete = turn.status === 'complete';
  const isFailed = turn.status === 'failed';
  const isCanceled = turn.status === 'canceled';
  const isStreaming = turn.status === 'streaming';
  const isPending = turn.status === 'pending';

  // 构建时间线内容
  const timeline = useMemo(() => {
    const items: Array<{
      type: 'text' | 'tool_call' | 'tool_result';
      content?: string;
      toolName?: string;
      skillKey?: string;
      status?: string;
      input?: Record<string, unknown>;
    }> = [];

    // 按 seq 排序消息
    const sortedMessages = [...turn.messages].sort((a, b) => a.seq - b.seq);

    for (const msg of sortedMessages) {
      if (msg.role === 'assistant') {
        // 处理 assistant 消息的 content blocks
        for (const block of msg.contentBlocks) {
          if (block.type === 'text' && block.text) {
            items.push({ type: 'text', content: block.text });
          } else if (block.type === 'tool_use') {
            items.push({
              type: 'tool_call',
              toolName: block.name,
              status: msg.status === 'final' ? 'done' : 'running',
              input: block.input,
            });
          }
        }
        // 如果有 content_text 但没有 blocks
        if (msg.contentText && msg.contentBlocks.length === 0) {
          items.push({ type: 'text', content: msg.contentText });
        }
      } else if (msg.role === 'tool') {
        items.push({
          type: 'tool_result',
          toolName: msg.toolName,
          skillKey: msg.skillKey,
          content: msg.contentText,
          status: msg.status,
        });
      }
    }

    // 添加流式文本
    if (turn.streamingText && isStreaming) {
      // 检查最后一项是否是文本，如果是则追加
      const lastItem = items[items.length - 1];
      if (lastItem?.type === 'text') {
        // 流式文本已经在 contentText 中了，不需要额外处理
      } else {
        items.push({ type: 'text', content: turn.streamingText });
      }
    }

    return items;
  }, [turn.messages, turn.streamingText, isStreaming]);

  // 获取最终文本内容（用于复制）
  const finalText = useMemo(() => {
    return timeline
      .filter(item => item.type === 'text')
      .map(item => item.content)
      .join('\n');
  }, [timeline]);

  const handleCopy = () => {
    navigator.clipboard.writeText(finalText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 检查是否有任何文本内容
  const hasTextContent = timeline.some(item => item.type === 'text' && item.content);
  const hasToolCalls = timeline.some(item => item.type === 'tool_call' || item.type === 'tool_result');

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%]">
        <div className="space-y-0 flex-1 min-w-[300px]">
          {/* 消息气泡 */}
          <div className="bg-white rounded-2xl rounded-tl-md shadow-sm overflow-hidden">
            {/* 思考中状态 */}
            {isPending && !hasTextContent && !hasToolCalls && (
              <div className="flex items-center gap-2 px-4 py-3">
                <span className="text-sm text-gray-600 animate-textPulse">正在思考...</span>
              </div>
            )}

            {/* 时间线内容 */}
            {timeline.length > 0 && (
              <div className="px-4 py-3 space-y-2">
                {timeline.map((item, index) => {
                  if (item.type === 'text' && item.content) {
                    return (
                      <div key={index} className="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none">
                        <ReactMarkdown>{item.content}</ReactMarkdown>
                        {isStreaming && index === timeline.length - 1 && (
                          <span className="typing-cursor">█</span>
                        )}
                      </div>
                    );
                  }
                  if (item.type === 'tool_call') {
                    return (
                      <ToolCallCard
                        key={index}
                        toolName={item.toolName!}
                        skillKey={item.skillKey}
                        status={item.status as 'running' | 'done' | 'failed'}
                        input={item.input}
                      />
                    );
                  }
                  if (item.type === 'tool_result' && item.toolName !== 'write_todos') {
                    return (
                      <ToolResultCard
                        key={index}
                        toolName={item.toolName!}
                        skillKey={item.skillKey}
                        result={item.content || ''}
                        status={item.status as 'in_progress' | 'final' | 'failed'}
                      />
                    );
                  }
                  return null;
                })}
              </div>
            )}

            {/* 失败状态 */}
            {isFailed && (
              <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 bg-red-50">
                <AlertTriangle size={16} className="text-red-500" />
                <span className="text-sm text-red-600">出了点问题</span>
              </div>
            )}

            {/* 已停止状态 */}
            {isCanceled && (
              <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50">
                <Square size={16} className="text-gray-400" />
                <span className="text-sm text-gray-500">回答已停止</span>
              </div>
            )}

            {/* 操作栏 */}
            {(isComplete || isFailed || isCanceled) && (
              <div className="flex items-center gap-1 px-4 py-2 border-t border-gray-100">
                {(isFailed || isCanceled) && onRegenerate && (
                  <button
                    onClick={onRegenerate}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <RefreshCw size={14} />
                    <span>{isFailed ? '重试' : '重新生成'}</span>
                  </button>
                )}

                {isComplete && (
                  <>
                    <button
                      onClick={onRegenerate}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                      title="重新生成"
                    >
                      <RefreshCw size={16} />
                    </button>
                    <button
                      onClick={handleCopy}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                      title="复制"
                    >
                      {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>
                    <button
                      onClick={handleLike}
                      className={`p-2 rounded-lg ${liked ? 'text-blue-500 bg-blue-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                      title="点赞"
                    >
                      <ThumbsUp size={16} fill={liked ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={handleDislike}
                      className={`p-2 rounded-lg ${disliked ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                      title="点踩"
                    >
                      <ThumbsDown size={16} fill={disliked ? 'currentColor' : 'none'} />
                    </button>
                  </>
                )}
              </div>
            )}

            {/* 反馈面板 */}
            <FeedbackPanel
              isOpen={showFeedbackModal}
              onClose={() => setShowFeedbackModal(false)}
              onSubmit={(reasons, comment) => {
                handleFeedbackClose(reasons, comment);
                handleFeedbackSuccess();
              }}
            />
          </div>
        </div>
      </div>

      {/* Toast 提示 */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-50 animate-fadeIn">
          感谢您的反馈
        </div>
      )}
    </div>
  );
};
