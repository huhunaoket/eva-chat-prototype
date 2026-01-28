/**
 * Widget 布局 - 终端用户嵌入式视角（气泡模式）
 * 对齐 PRD 008 3.2.5 气泡模式交互设计
 */

import React, { useState } from 'react';
import { MessageCircle, X, Minus, MoreHorizontal, Plus, History, MessageSquare, Trash2 } from 'lucide-react';
import { PageStateConfig, FeatureOptions, Attachment, ChatSession } from '../types';
import { ChatArea } from './ChatArea';
import { ChatInput } from './ChatInput';

interface WidgetLayoutProps {
  stateConfig: PageStateConfig;
  features: FeatureOptions;
  onStateConfigChange: (config: PageStateConfig) => void;
}

// 模拟会话历史数据
const mockSessions: ChatSession[] = [
  { id: '1', title: '退换货政策咨询', date: '2026-01-23', dateGroup: 'today' },
  { id: '2', title: '产品价格问题', date: '2026-01-23', dateGroup: 'today' },
  { id: '3', title: '订单状态查询', date: '2026-01-22', dateGroup: 'yesterday' },
  { id: '4', title: '售后服务咨询', date: '2026-01-20', dateGroup: 'earlier' },
];

export const WidgetLayout: React.FC<WidgetLayoutProps> = ({
  stateConfig,
  features,
  onStateConfigChange,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessions] = useState<ChatSession[]>(mockSessions);

  // 终端用户需要看到反馈面板
  const endUserFeatures: FeatureOptions = {
    ...features,
    showFeedbackPanel: true,
    showKnowledgeRef: false, // 终端用户隐藏知识引用
  };

  const handleSend = (message: string, attachments?: Attachment[]) => {
    console.log('发送消息:', message, '附件:', attachments);
    // 首次发送消息时，如果是新会话，创建会话
    if (activeSessionId === null) {
      setActiveSessionId('new-' + Date.now());
    }
    onStateConfigChange({
      ...stateConfig,
      messageState: 'thinking',
    });
  };

  const handleStop = () => {
    onStateConfigChange({
      ...stateConfig,
      messageState: 'stopped',
    });
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setShowMenu(false);
    onStateConfigChange({
      scenario: 'A',
      messageState: 'complete',
    });
  };

  const handleShowHistory = () => {
    setShowHistory(true);
    setShowMenu(false);
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    setShowHistory(false);
    onStateConfigChange({
      scenario: 'A',
      messageState: 'complete',
    });
  };

  const handleMinimize = () => {
    setIsOpen(false);
    setShowMenu(false);
    setShowHistory(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setShowMenu(false);
    setShowHistory(false);
  };

  // 按日期分组
  const groupedSessions = {
    today: sessions.filter(s => s.dateGroup === 'today'),
    yesterday: sessions.filter(s => s.dateGroup === 'yesterday'),
    earlier: sessions.filter(s => s.dateGroup === 'earlier'),
  };

  return (
    <div className="min-h-screen flex items-end justify-end p-6 bg-slate-100">
      {/* 收起态 - 浮动气泡 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-primary-500 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-primary-600 transition-colors hover:scale-105"
          title="有问题？问我！"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* 展开态 - Widget 窗口 */}
      {isOpen && (
        <div className="w-96 h-[600px] bg-white rounded-eva-lg shadow-eva-lg flex flex-col overflow-hidden">
          {/* 顶部栏 */}
          <div className="h-12 bg-primary-500 flex items-center justify-between px-4 relative">
            <span className="font-medium text-white">示例企业</span>
            <div className="flex items-center gap-1">
              {/* 扩展菜单按钮 */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="更多操作"
                >
                  <MoreHorizontal size={18} />
                </button>
                {/* 下拉菜单 */}
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                    <button
                      onClick={handleNewChat}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Plus size={16} />
                      <span>新建对话</span>
                    </button>
                    <button
                      onClick={handleShowHistory}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <History size={16} />
                      <span>历史记录</span>
                    </button>
                  </div>
                )}
              </div>
              {/* 最小化按钮 */}
              <button
                onClick={handleMinimize}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="最小化"
              >
                <Minus size={18} />
              </button>
              {/* 关闭按钮 */}
              <button
                onClick={handleClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="关闭"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* 点击菜单外部关闭 */}
          {showMenu && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
          )}

          {/* 聊天区域 */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <ChatArea
              stateConfig={stateConfig}
              features={endUserFeatures}
              isPlayground={false}
              onStateConfigChange={onStateConfigChange}
              hideWelcomeQuestions={true}
              isEmptySession={activeSessionId === null}
            />
            <ChatInput
              stateConfig={stateConfig}
              onSend={handleSend}
              onStop={handleStop}
            />
          </div>

          {/* 底部品牌 */}
          <div className="py-2 text-center border-t border-slate-100">
            <span className="text-xs text-slate-400">Powered by EVA</span>
          </div>

          {/* 历史记录弹窗 */}
          {showHistory && (
            <div className="absolute inset-0 bg-white flex flex-col rounded-eva-lg overflow-hidden">
              {/* 历史记录标题栏 */}
              <div className="h-12 bg-primary-500 flex items-center justify-between px-4">
                <span className="font-medium text-white">历史记录</span>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              {/* 历史列表 */}
              <div className="flex-1 overflow-y-auto p-3">
                {groupedSessions.today.length > 0 && (
                  <SessionGroup
                    title="今天"
                    sessions={groupedSessions.today}
                    activeId={activeSessionId}
                    onSelect={handleSelectSession}
                  />
                )}
                {groupedSessions.yesterday.length > 0 && (
                  <SessionGroup
                    title="昨天"
                    sessions={groupedSessions.yesterday}
                    activeId={activeSessionId}
                    onSelect={handleSelectSession}
                  />
                )}
                {groupedSessions.earlier.length > 0 && (
                  <SessionGroup
                    title="更早"
                    sessions={groupedSessions.earlier}
                    activeId={activeSessionId}
                    onSelect={handleSelectSession}
                  />
                )}
                {sessions.length === 0 && (
                  <div className="text-center text-slate-400 py-8">
                    暂无历史记录
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
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
              ? 'bg-primary-50 text-primary-700'
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
