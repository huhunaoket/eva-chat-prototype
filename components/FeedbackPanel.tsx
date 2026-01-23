/**
 * 反馈面板组件
 */

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { FeedbackTag } from '../types';

interface FeedbackPanelProps {
  isPlayground: boolean;
  onClose: () => void;
  onSubmit: (tags: FeedbackTag[], comment: string) => void;
}

const playgroundTags: { value: FeedbackTag; label: string }[] = [
  { value: 'unmatched', label: '未匹配内容' },
  { value: 'incorrect', label: '内容错误' },
  { value: 'unhelpful', label: '没有帮助' },
  { value: 'privacy', label: '隐私相关' },
  { value: 'other', label: '其他' },
];

const endUserTags: { value: FeedbackTag; label: string }[] = [
  { value: 'unresolved', label: '未解决问题' },
  { value: 'wrong', label: '内容有误' },
  { value: 'other', label: '其他' },
];

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ isPlayground, onClose, onSubmit }) => {
  const [selectedTags, setSelectedTags] = useState<FeedbackTag[]>([]);
  const [comment, setComment] = useState('');

  const tags = isPlayground ? playgroundTags : endUserTags;

  const toggleTag = (tag: FeedbackTag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    onSubmit(selectedTags, comment);
  };

  // 终端用户轻量提示
  if (!isPlayground) {
    return (
      <div className="bg-white border border-slate-200 rounded-eva-sm shadow-sm p-4">
        <p className="text-sm text-slate-600 mb-3">感谢反馈！能告诉我们哪里不好吗？</p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.value}
              onClick={() => toggleTag(tag.value)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                selectedTags.includes(tag.value)
                  ? 'bg-primary-100 border-primary-300 text-primary-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {tag.label}
            </button>
          ))}
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-600"
          >
            跳过
          </button>
        </div>
      </div>
    );
  }

  // Playground 详细面板
  return (
    <div className="bg-white border border-slate-200 rounded-eva-sm shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <span className="text-sm font-medium text-slate-700">你觉得哪里不满意？</span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X size={16} />
        </button>
      </div>
      <div className="p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.value}
              onClick={() => toggleTag(tag.value)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                selectedTags.includes(tag.value)
                  ? 'bg-primary-100 border-primary-300 text-primary-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="补充说明（选填）..."
          className="w-full h-20 px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
          >
            提交反馈
          </button>
        </div>
      </div>
    </div>
  );
};
