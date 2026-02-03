/**
 * 内联反馈面板组件
 * 点踩后在气泡下方展开
 */

import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface FeedbackPanelProps {
  isOpen: boolean;
  onClose: () => void;  // 关闭面板
  onSubmit: (reasons: string[], comment: string) => void;  // 提交反馈
}

const FEEDBACK_OPTIONS = [
  '内容有错误',
  '答非所问',
  '内容形式不对',
  '未参考之前的内容',
  '工具调用有问题',
  '其他',
];

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  // 重置状态当面板关闭时
  useEffect(() => {
    if (!isOpen) {
      setSelectedReasons([]);
      setComment('');
    }
  }, [isOpen]);

  // 展开时滚动到可见区域
  useEffect(() => {
    if (isOpen && panelRef.current) {
      const timer = setTimeout(() => {
        if (panelRef.current) {
          const scrollContainer = panelRef.current.closest('.overflow-y-auto');
          if (scrollContainer) {
            const panelRect = panelRef.current.getBoundingClientRect();
            const containerRect = scrollContainer.getBoundingClientRect();
            const bottomOverflow = panelRect.bottom - containerRect.bottom + 20;
            
            if (bottomOverflow > 0) {
              scrollContainer.scrollBy({ top: bottomOverflow, behavior: 'smooth' });
            }
          } else {
            panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleReasonClick = (reason: string) => {
    setSelectedReasons(prev => 
      prev.includes(reason) 
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  const handleSubmit = () => {
    onSubmit(selectedReasons, comment);
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={panelRef}
      className="mt-2 bg-white border border-gray-200 rounded-xl shadow-sm animate-slideDown"
    >
      {/* 标题行 */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          请与我们分享更多信息：
        </span>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="关闭"
        >
          <X size={16} />
        </button>
      </div>

      {/* 选项标签 */}
      <div className="px-4 pb-3">
        <div className="flex flex-wrap gap-2">
          {FEEDBACK_OPTIONS.map(option => (
            <button
              key={option}
              onClick={() => handleReasonClick(option)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                selectedReasons.includes(option)
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* 文本输入框 - 始终显示 */}
      <div className="px-4 pb-3">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="请详细说明你的意见（选填）"
          className="w-full h-20 px-3 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-700 placeholder-gray-400"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* 按钮区域 */}
      <div className="px-4 pb-3 flex justify-end">
        <button
          onClick={handleSubmit}
          className="px-4 py-1.5 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
        >
          提交
        </button>
      </div>
    </div>
  );
};
