/**
 * Widget 布局 - 终端用户嵌入式视角
 */

import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { PageState, FeatureOptions, Attachment } from '../types';
import { ChatArea } from './ChatArea';
import { ChatInput } from './ChatInput';

interface WidgetLayoutProps {
  pageState: PageState;
  features: FeatureOptions;
  onPageStateChange: (state: PageState) => void;
}

export const WidgetLayout: React.FC<WidgetLayoutProps> = ({
  pageState,
  features,
  onPageStateChange,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleSend = (message: string, attachments?: Attachment[]) => {
    console.log('发送消息:', message, '附件:', attachments);
    onPageStateChange('thinking');
  };

  const handleStop = () => {
    onPageStateChange('stopped');
  };

  return (
    <div className="min-h-screen flex items-end justify-end p-6 bg-slate-100">
      {/* 收起态 - 浮动气泡 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-primary-500 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-primary-600 transition-colors hover:scale-105"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* 展开态 - Widget 窗口 */}
      {isOpen && (
        <div className="w-96 h-[600px] bg-white rounded-eva-lg shadow-eva-lg flex flex-col overflow-hidden">
          {/* 顶部栏 */}
          <div className="h-12 bg-primary-500 flex items-center justify-between px-4">
            <span className="font-medium text-white">示例企业</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* 聊天区域 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <ChatArea 
              pageState={pageState} 
              features={features} 
              isPlayground={false}
              onPageStateChange={onPageStateChange}
            />
            <ChatInput 
              pageState={pageState} 
              onSend={handleSend} 
              onStop={handleStop} 
            />
          </div>

          {/* 底部品牌 */}
          <div className="py-2 text-center border-t border-slate-100">
            <span className="text-xs text-slate-400">Powered by EVA</span>
          </div>
        </div>
      )}
    </div>
  );
};
