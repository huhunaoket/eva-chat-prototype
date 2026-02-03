/**
 * 会话历史抽屉组件
 */

import React from 'react';
import { X } from 'lucide-react';
import { ChatSession } from '../types';

interface ChatHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

const mockSessions: ChatSession[] = [
  { id: '1', title: '退换货政策咨询', date: '10:30', dateGroup: 'today' },
  { id: '2', title: '产品价格问题', date: '09:15', dateGroup: 'today' },
  { id: '3', title: '订单状态查询', date: '昨天', dateGroup: 'yesterday' },
  { id: '4', title: '售后服务咨询', date: '3天前', dateGroup: 'earlier' },
];

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  isOpen,
  onClose,
  onSelectSession,
  onDeleteSession,
}) => {
  if (!isOpen) return null;

  const todaySessions = mockSessions.filter(s => s.dateGroup === 'today');
  const yesterdaySessions = mockSessions.filter(s => s.dateGroup === 'yesterday');
  const earlierSessions = mockSessions.filter(s => s.dateGroup === 'earlier');

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-72 bg-white shadow-eva-lg z-50 flex flex-col">
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
          <span className="font-medium text-slate-700">对话历史</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          {todaySessions.length > 0 && (
            <SessionGroup 
              title="今天" 
              sessions={todaySessions}
              onSelect={onSelectSession}
              onDelete={onDeleteSession}
            />
          )}
          {yesterdaySessions.length > 0 && (
            <SessionGroup 
              title="昨天" 
              sessions={yesterdaySessions}
              onSelect={onSelectSession}
              onDelete={onDeleteSession}
            />
          )}
          {earlierSessions.length > 0 && (
            <SessionGroup 
              title="更早" 
              sessions={earlierSessions}
              onSelect={onSelectSession}
              onDelete={onDeleteSession}
            />
          )}
        </div>
      </div>
    </>
  );
};

interface SessionGroupProps {
  title: string;
  sessions: ChatSession[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

const SessionGroup: React.FC<SessionGroupProps> = ({ title, sessions, onSelect, onDelete }) => (
  <div>
    <div className="text-xs font-medium text-slate-400 mb-2">{title}</div>
    <div className="space-y-1">
      {sessions.map((session) => (
        <div
          key={session.id}
          className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer"
          onClick={() => onSelect(session.id)}
        >
          <span className="text-sm text-slate-600 truncate">{session.title}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(session.id);
            }}
            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  </div>
);
