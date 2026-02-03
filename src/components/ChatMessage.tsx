/**
 * 聊天消息组件
 * 实现时间线式渲染，支持流式输出和工具调用展示
 */

import React, { useState } from 'react';
import { Loader2, Copy, RefreshCw, ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { ConversationMessage, getToolFriendlyName } from '../types/api';
import { ToolCallCard, ToolCallInfo } from './ToolCallCard';
import { FeedbackPanel } from './FeedbackPanel';

interface ChatMessageProps {
  message: ConversationMessage;
  isStreaming?: boolean;
  streamingText?: string;
  onRegenerate?: () => void;
}

// 用户消息组件
export const UserMessage: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="flex justify-end">
      <div className="flex items-start gap-2 max-w-[80%]">
        <div className="bg-blue-500 text-white px-4 py-3 rounded-2xl rounded-tr-md">
          {content}
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm flex-shrink-0">
          👤
        </div>
      </div>
    </div>
  );
};

// Agent 消息组件
export const AgentMessage: React.FC<ChatMessageProps> = ({
  message,
  isStreaming = false,
  streamingText,
  onRegenerate,
}) => {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [_toolsExpanded, _setToolsExpanded] = useState(true);
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
    console.log('Feedback submitted:', { reasons, comment, messageId: message.id });
    setShowFeedbackModal(false);
    // TODO: 发送反馈到后端
  };

  // 反馈提交成功
  const handleFeedbackSuccess = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const isComplete = message.status === 'final';
  const isFailed = message.status === 'failed';
  const isCanceled = message.status === 'canceled';
  const isInProgress = message.status === 'in_progress';

  // 解析 content_json 获取文本和工具调用
  const parseContent = () => {
    const textParts: string[] = [];
    const toolCalls: ToolCallInfo[] = [];

    if (message.content_json?.content) {
      for (const block of message.content_json.content) {
        if (block.type === 'text') {
          textParts.push(block.text);
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id,
            name: block.name,
            status: isComplete || isFailed || isCanceled ? 'done' : 'running',
            skillKey: message.skill_key,
          });
        }
      }
    }

    // 如果没有 content_json，使用 content_text
    if (textParts.length === 0 && message.content_text) {
      textParts.push(message.content_text);
    }

    return { textParts, toolCalls };
  };

  const { textParts, toolCalls } = parseContent();
  const displayText = isStreaming && streamingText !== undefined ? streamingText : textParts.join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(displayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-2 max-w-[80%]">
        {/* 头像 */}
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm flex-shrink-0">
          🤖
        </div>

        <div className="space-y-2 flex-1 min-w-[300px]">
          {/* 消息气泡 */}
          <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md shadow-sm overflow-hidden">
            {/* 状态栏 */}
            {isInProgress && !displayText && (
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                <Loader2 size={16} className="animate-spin text-blue-500" />
                <span className="text-sm text-gray-600">正在思考...</span>
              </div>
            )}

            {isFailed && (
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-red-50">
                <span className="text-red-500">⚠️</span>
                <span className="text-sm text-red-600">出了点问题</span>
              </div>
            )}

            {isCanceled && (
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
                <span className="text-gray-400">⏹️</span>
                <span className="text-sm text-gray-500">回答已停止</span>
              </div>
            )}

            {/* 工具调用展示（时间线式：按顺序展示） */}
            {toolCalls.length > 0 && (
              <div className="px-4 py-3 border-b border-gray-100 space-y-2">
                {toolCalls.map((tool) => (
                  <ToolCallCard key={tool.id} tool={tool} />
                ))}
              </div>
            )}

            {/* 文本内容 */}
            {displayText && (
              <div className="px-4 py-3">
                <div className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">
                  {displayText}
                  {isStreaming && <span className="typing-cursor">█</span>}
                </div>
              </div>
            )}

            {/* 操作栏 */}
            {(isComplete || isFailed || isCanceled) && (
              <div className="flex items-center gap-2 px-4 py-2 border-t border-gray-100">
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
                      className={`p-2 rounded-lg ${
                        liked ? 'text-blue-500 bg-blue-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                      title="点赞"
                    >
                      <ThumbsUp size={16} fill={liked ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={handleDislike}
                      className={`p-2 rounded-lg ${
                        disliked ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
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

// Tool 消息组件（工具调用结果）
export const ToolMessage: React.FC<{ message: ConversationMessage }> = ({ message }) => {
  const [expanded, setExpanded] = useState(false);

  const toolName = message.tool_name || 'unknown';
  const result = message.content_text || JSON.stringify(message.content_json);

  // 结果过长时截断
  const isLong = result.length > 200;
  const displayResult = expanded || !isLong ? result : result.substring(0, 200) + '...';

  return (
    <div className="flex justify-start ml-10">
      <div className="max-w-[70%]">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
          <div className="flex items-center gap-2 mb-2 text-gray-600">
            <span>{getToolFriendlyName(toolName)}</span>
            <span className="text-green-500">✅</span>
          </div>
          <div className="text-gray-500 font-mono text-xs whitespace-pre-wrap break-all">
            {displayResult}
          </div>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-blue-500 text-xs mt-2 hover:underline"
            >
              {expanded ? '收起' : '展开全部'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// 思考中占位组件
export const ThinkingIndicator: React.FC = () => {
  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm flex-shrink-0">
          🤖
        </div>
        <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-md shadow-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 size={16} className="animate-spin text-blue-500" />
            <span className="text-sm">正在思考...</span>
          </div>
        </div>
      </div>
    </div>
  );
};
