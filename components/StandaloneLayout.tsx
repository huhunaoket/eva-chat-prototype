/**
 * 独立网页布局 - 终端用户视角
 * 类似 ChatGPT 的左侧边栏布局
 */

import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, Menu, X } from 'lucide-react';
import { PageState, FeatureOptions, Attachment, ChatSession } from '../types';
import { ChatArea } from './ChatArea';
import { ChatInput } from './ChatInput';

interface StandaloneLayoutProps {
  pageState: PageState;
  features: FeatureOptions;
  onPageStateChange: (state: PageState) => void;
}

// 模拟会话历史数据
const mockSessions: ChatSession[] = [
  { id: '1', title: '退换货政策咨询', date: '2026-01-23', dateGroup: 'today' },
  { id: '2', title: '产品价格问题', date: '2026-01-23', dateGroup: 'today' },
  { id: '3', title: '订单状态查询', date: '2026-01-22', dateGroup: 'yesterday' },
  { id: '4', title: '售后服务咨询', date: '2026-01-20', dateGroup: 'earlier' },
];

export const StandaloneLayout: React.FC<StandaloneLayoutProps> = ({
  pageState,
  features,
  onPageStateChange,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessions] = useState<ChatSession[]>(mockSessions);

  const handleSend = (message: string, attachments?: Attachment[]) => {
    console.log('发送消息:', message, '附件:', attachments);
    onPageStateChange('thinking');
  };

  const handleStop = () => {
    onPageStateChange('stopped');
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    onPageStateChange('empty');
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    onPageStateChange('complete-single');
  };

  // 按日期分组
  const groupedSessions = {
    today: sessions.filter(s => s.dateGroup === 'today'),
    yesterday: sessions.filter(s => s.dateGroup === 'yesterday'),
    earlier: sessions.filter(s => s.dateGroup === 'earlier'),
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* 左侧边栏 */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 bg-slate-50 border-r border-slate-200 flex flex-col transition-all duration-300 overflow-hidden`}>
        {/* 新建对话按钮 */}
        <div className="p-3">
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

        {/* 底部品牌 */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">示</span>
            </div>
            <span className="text-sm font-medium text-slate-700">示例企业</span>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部栏 */}
        <div className="h-14 border-b border-slate-200 flex items-center px-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex-1 text-center">
            <span className="text-sm text-slate-500">
              {activeSessionId ? sessions.find(s => s.id === activeSessionId)?.title : '新对话'}
            </span>
          </div>
          <div className="w-10" /> {/* 占位，保持标题居中 */}
        </div>

        {/* 聊天区域 */}
        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
          <ChatArea 
            pageState={pageState} 
            features={features} 
            isPlayground={false}
            onPageStateChange={onPageStateChange}
            hideWelcomeQuestions={true}
          />
          <ChatInput 
            pageState={pageState} 
            onSend={handleSend} 
            onStop={handleStop} 
          />
        </div>

        {/* 底部品牌 */}
        <div className="py-2 text-center">
          <span className="text-xs text-slate-400">Powered by EVA</span>
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
              // 删除逻辑
            }}
          />
        </button>
      ))}
    </div>
  </div>
);
