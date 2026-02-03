/**
 * Widget 布局 - 终端用户嵌入式视角（气泡模式）
 */

import React, { useState } from 'react';
import { MessageCircle, X, Copy, Check } from 'lucide-react';
import { Attachment, RenderMode, ResultStyle } from '../types';
import { TurnDataV2, TurnMessageV2 } from './TurnMessageV2';
import { ChatInput } from './ChatInput';

interface WidgetLayoutProps {
  // 对话数据
  userMessages: Array<{ id: string; content: string; attachments?: Attachment[] }>;
  turnsV2: Map<string, TurnDataV2>;
  isLoading: boolean;
  // 渲染配置
  renderMode: RenderMode;
  resultStyle: ResultStyle;
  // 终端用户执行过程展示模式
  userProcessMode: 'simple' | 'detailed';
  // 回调
  onSendMessage: (content: string, attachments?: Attachment[]) => void;
  onStopGeneration: () => void;
  onRegenerate: (turnId: string) => void;
  onNewChat: () => void;
  // Refs
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

// 用户消息组件
const UserMessage: React.FC<{ content: string }> = ({ content }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div 
      className="flex justify-end"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="max-w-[85%] space-y-1">
        <div className="bg-blue-500 text-white text-sm px-3 py-2 rounded-2xl rounded-tr-md whitespace-pre-wrap">
          {content}
        </div>
        <div className="flex justify-end h-5">
          <button
            onClick={handleCopy}
            className={`p-0.5 text-gray-400 hover:text-gray-600 rounded transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            title="复制"
          >
            {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
          </button>
        </div>
      </div>
    </div>
  );
};

// 欢迎页（不显示推荐问题）
const WelcomePage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8">
      <p className="text-base text-slate-600">有什么可以帮您？</p>
    </div>
  );
};

export const WidgetLayout: React.FC<WidgetLayoutProps> = ({
  userMessages,
  turnsV2,
  isLoading,
  renderMode,
  resultStyle,
  userProcessMode,
  onSendMessage,
  onStopGeneration,
  onRegenerate,
  onNewChat: _onNewChat,
  messagesContainerRef,
  messagesEndRef,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
  };

  // 构建消息列表
  const turnsArray = Array.from(turnsV2.values());
  const messageList: Array<{ type: 'user' | 'turn'; id: string; content?: string; turnV2?: TurnDataV2 }> = [];
  
  userMessages.forEach((msg, index) => {
    messageList.push({ type: 'user', id: msg.id, content: msg.content });
    if (turnsArray[index]) {
      messageList.push({ type: 'turn', id: turnsArray[index].turnId, turnV2: turnsArray[index] });
    }
  });

  const hasMessages = userMessages.length > 0;

  return (
    <div className="min-h-screen flex items-end justify-end p-6 bg-slate-100">
      {/* 收起态 - 浮动气泡 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-blue-500 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-blue-600 transition-colors hover:scale-105"
          title="有问题？问我！"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* 展开态 - Widget 窗口 */}
      {isOpen && (
        <div className="w-96 h-[600px] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden relative">
          {/* 顶部栏 */}
          <div className="h-12 bg-blue-500 flex items-center justify-between px-4 relative">
            {/* 左侧：占位 */}
            <div className="w-10" />
            {/* 中间：标题 */}
            <span className="font-medium text-white">示例企业</span>
            {/* 右侧：关闭按钮 */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="关闭"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* 聊天区域 */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {!hasMessages ? (
              <WelcomePage />
            ) : (
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-3 py-4 space-y-4"
              >
                {messageList.map((item, index) => {
                  if (item.type === 'user') {
                    return <UserMessage key={item.id} content={item.content || ''} />;
                  } else if (item.type === 'turn' && item.turnV2) {
                    const isLatest = index === messageList.length - 1;
                    return (
                      <TurnMessageV2
                        key={item.id}
                        turn={item.turnV2}
                        renderMode={renderMode}
                        resultStyle={resultStyle}
                        onRegenerate={() => onRegenerate(item.turnV2!.turnId)}
                        isLatest={isLatest}
                        disableToolExpand={true}
                        isUserView={userProcessMode === 'simple'}
                      />
                    );
                  }
                  return null;
                })}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* 输入框 */}
            <div className="px-3 pb-3">
              <ChatInput
                onSend={onSendMessage}
                onStop={onStopGeneration}
                isLoading={isLoading}
                disabled={false}
                compact={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
