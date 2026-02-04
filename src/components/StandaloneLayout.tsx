/**
 * 独立网页布局 - 终端用户视角
 * 类似 ChatGPT 的左侧边栏布局
 */

import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, Menu, Copy, Check } from 'lucide-react';
import { ChatSession, Attachment, RenderMode, ResultStyle } from '../types';
import { TurnDataV2, TurnMessageV2 } from './TurnMessageV2';
import { ChatInput } from './ChatInput';

interface StandaloneLayoutProps {
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

// 模拟会话历史数据
const mockSessions: ChatSession[] = [
  { id: '1', title: '退换货政策咨询', date: '2026-02-03', dateGroup: 'today' },
  { id: '2', title: '产品价格问题', date: '2026-02-03', dateGroup: 'today' },
  { id: '3', title: '订单状态查询', date: '2026-02-02', dateGroup: 'yesterday' },
  { id: '4', title: '售后服务咨询', date: '2026-01-30', dateGroup: 'earlier' },
];

// 用户消息组件
const UserMessage: React.FC<{ content: string; attachments?: Attachment[] }> = ({ content }) => {
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
      <div className="max-w-[80%] space-y-2">
        {content && (
          <div className="bg-blue-500 text-white text-sm px-4 py-3 rounded-2xl rounded-tr-md whitespace-pre-wrap">
            {content}
          </div>
        )}
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

// 欢迎页（不显示推荐问题）
const WelcomePage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-12">
      <p className="text-lg text-slate-600">很高兴为您服务，请问有什么可以帮您？</p>
    </div>
  );
};

export const StandaloneLayout: React.FC<StandaloneLayoutProps> = ({
  userMessages,
  turnsV2,
  isLoading,
  renderMode,
  resultStyle,
  userProcessMode,
  onSendMessage,
  onStopGeneration,
  onRegenerate,
  onNewChat,
  messagesContainerRef,
  messagesEndRef,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessions] = useState<ChatSession[]>(mockSessions);

  const handleNewChat = () => {
    setActiveSessionId(null);
    onNewChat();
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    // TODO: 加载对应会话的历史消息
  };

  // 按日期分组
  const groupedSessions = {
    today: sessions.filter(s => s.dateGroup === 'today'),
    yesterday: sessions.filter(s => s.dateGroup === 'yesterday'),
    earlier: sessions.filter(s => s.dateGroup === 'earlier'),
  };

  // 构建消息列表
  const turnsArray = Array.from(turnsV2.values());
  const messageList: Array<{ type: 'user' | 'turn'; id: string; content?: string; attachments?: Attachment[]; turnV2?: TurnDataV2 }> = [];
  
  userMessages.forEach((msg, index) => {
    messageList.push({ type: 'user', id: msg.id, content: msg.content, attachments: msg.attachments });
    if (turnsArray[index]) {
      messageList.push({ type: 'turn', id: turnsArray[index].turnId, turnV2: turnsArray[index] });
    }
  });

  const hasMessages = userMessages.length > 0;

  return (
    <div className="h-screen flex bg-white overflow-hidden">
      {/* 左侧边栏 */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 bg-slate-50 border-r border-slate-200 flex flex-col transition-all duration-300 overflow-hidden`}>
        {/* 新建对话按钮 */}
        <div className="p-3 flex-shrink-0">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Plus size={18} />
            <span className="font-medium">新对话</span>
          </button>
        </div>

        {/* 会话列表 */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {groupedSessions.today.length > 0 && (
            <SessionGroup title="今天" sessions={groupedSessions.today} activeId={activeSessionId} onSelect={handleSelectSession} />
          )}
          {groupedSessions.yesterday.length > 0 && (
            <SessionGroup title="昨天" sessions={groupedSessions.yesterday} activeId={activeSessionId} onSelect={handleSelectSession} />
          )}
          {groupedSessions.earlier.length > 0 && (
            <SessionGroup title="更早" sessions={groupedSessions.earlier} activeId={activeSessionId} onSelect={handleSelectSession} />
          )}
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 顶部栏 */}
        <div className="h-14 flex-shrink-0 border-b border-slate-200 flex items-center px-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1 text-center">
            {/* 标题展示规则：
                - 初始状态（无消息）：空白
                - 开始对话后：显示"当前对话"
                - 选中历史会话时：显示该会话的标题
            */}
            {activeSessionId ? (
              <span className="text-sm font-medium text-slate-700">
                {sessions.find(s => s.id === activeSessionId)?.title}
              </span>
            ) : hasMessages ? (
              <span className="text-sm font-medium text-slate-700">当前对话</span>
            ) : null}
          </div>
          <div className="w-10" />
        </div>

        {/* 聊天区域 */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {!hasMessages ? (
            <>
              <WelcomePage />
              {/* 输入框 - 固定在底部 */}
              <div className="flex-shrink-0 px-6 pb-4">
                <div className="max-w-3xl mx-auto">
                  <ChatInput
                    onSend={onSendMessage}
                    onStop={onStopGeneration}
                    isLoading={isLoading}
                    disabled={false}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* 消息列表 - 可滚动 */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto scrollbar-hide"
              >
                <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
                  {messageList.map((item, index) => {
                    if (item.type === 'user') {
                      return <UserMessage key={item.id} content={item.content || ''} attachments={item.attachments} />;
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
              </div>

              {/* 输入框 - 固定在底部 */}
              <div className="flex-shrink-0">
                <div className="max-w-3xl mx-auto px-6 pb-4">
                  <ChatInput
                    onSend={onSendMessage}
                    onStop={onStopGeneration}
                    isLoading={isLoading}
                    disabled={false}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// 会话分组组件
interface SessionGroupProps {
  title: string;
  sessions: ChatSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

const SessionGroup: React.FC<SessionGroupProps> = ({ title, sessions, activeId, onSelect }) => (
  <div className="mb-4">
    <div className="text-xs font-medium text-slate-400 px-2 py-2">{title}</div>
    <div className="space-y-1">
      {sessions.map(session => (
        <button
          key={session.id}
          onClick={() => onSelect(session.id)}
          className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
            activeId === session.id
              ? 'bg-slate-200 text-slate-900'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare size={16} className="flex-shrink-0 opacity-60" />
          <span className="flex-1 truncate text-sm">{session.title}</span>
          <Trash2 
            size={14} 
            className="flex-shrink-0 opacity-0 group-hover:opacity-60 hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
            }}
          />
        </button>
      ))}
    </div>
  </div>
);
