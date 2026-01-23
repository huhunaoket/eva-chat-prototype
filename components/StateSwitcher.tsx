/**
 * 原型状态切换器 - 可拖拽悬浮控制面板
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Settings, GripVertical } from 'lucide-react';
import { ViewMode, PageState, FeatureOptions } from '../types';

interface StateSwitcherProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  pageState: PageState;
  onPageStateChange: (state: PageState) => void;
  features: FeatureOptions;
  onFeaturesChange: (features: FeatureOptions) => void;
}

const viewModeOptions: { value: ViewMode; label: string }[] = [
  { value: 'playground', label: 'Playground（管理员）' },
  { value: 'standalone', label: '终端用户（独立网页）' },
  { value: 'widget', label: '终端用户（Widget）' },
];

const pageStateOptions: { value: PageState; label: string; group: string }[] = [
  { value: 'empty', label: '空状态（欢迎页）', group: '基础' },
  { value: 'with-attachment', label: '输入栏文件上传', group: '基础' },
  { value: 'thinking', label: '正在思考', group: '基础' },
  { value: 'failed', label: '生成失败', group: '基础' },
  { value: 'stopped', label: '已停止', group: '基础' },
  { value: 'streaming-direct', label: '流式输出（直接回答）', group: '直接回答' },
  { value: 'complete-direct', label: '完成（直接回答）', group: '直接回答' },
  { value: 'executing-single', label: '执行中（单能力）', group: '单能力' },
  { value: 'streaming-single', label: '流式输出（单能力）', group: '单能力' },
  { value: 'complete-single', label: '完成（单能力）', group: '单能力' },
  { value: 'executing-multi', label: '执行中（Plan）', group: 'Plan 模式' },
  { value: 'streaming-multi', label: '流式输出（Plan）', group: 'Plan 模式' },
  { value: 'complete-multi', label: '完成（Plan）', group: 'Plan 模式' },
];

export const StateSwitcher: React.FC<StateSwitcherProps> = ({
  viewMode,
  onViewModeChange,
  pageState,
  onPageStateChange,
  features,
  onFeaturesChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);

  const toggleFeature = (key: keyof FeatureOptions) => {
    onFeaturesChange({ ...features, [key]: !features[key] });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      const newX = dragRef.current.startPosX - deltaX;
      const newY = dragRef.current.startPosY + deltaY;
      const maxX = window.innerWidth - 300;
      const maxY = window.innerHeight - 100;
      setPosition({
        x: Math.max(16, Math.min(newX, maxX)),
        y: Math.max(16, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // 按组分类
  const groups = ['基础', '直接回答', '单能力', 'Plan 模式'];

  return (
    <div
      className="fixed z-[100]"
      style={{ right: position.x, top: position.y, cursor: isDragging ? 'grabbing' : 'default' }}
    >
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden w-[280px]">
        <div className="flex items-center border-b border-slate-100">
          <div
            onMouseDown={handleMouseDown}
            className="px-2 py-3 cursor-grab active:cursor-grabbing hover:bg-slate-50 border-r border-slate-100"
            title="拖拽移动"
          >
            <GripVertical size={16} className="text-slate-400" />
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 flex items-center justify-between gap-3 px-3 py-3 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings size={16} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-700">原型状态切换</span>
            </div>
            {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
          </button>
        </div>

        {isExpanded && (
          <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-hide">
            <div>
              <div className="text-xs font-medium text-slate-500 mb-2">视角</div>
              <div className="space-y-1">
                {viewModeOptions.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="viewMode"
                      checked={viewMode === opt.value}
                      onChange={() => onViewModeChange(opt.value)}
                      className="w-4 h-4 text-primary-500"
                    />
                    <span className="text-sm text-slate-600">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-slate-500 mb-2">页面状态</div>
              <div className="space-y-3">
                {groups.map((group) => (
                  <div key={group}>
                    <div className="text-xs text-slate-400 mb-1">{group}</div>
                    <div className="space-y-1">
                      {pageStateOptions
                        .filter((opt) => opt.group === group)
                        .map((opt) => (
                          <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="pageState"
                              checked={pageState === opt.value}
                              onChange={() => onPageStateChange(opt.value)}
                              className="w-4 h-4 text-primary-500"
                            />
                            <span className="text-sm text-slate-600">{opt.label}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-slate-500 mb-2">功能演示</div>
              <div className="space-y-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={features.showKnowledgeRef} onChange={() => toggleFeature('showKnowledgeRef')} className="w-4 h-4 text-primary-500 rounded" />
                  <span className="text-sm text-slate-600">显示知识引用</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={features.showFeedbackPanel} onChange={() => toggleFeature('showFeedbackPanel')} className="w-4 h-4 text-primary-500 rounded" />
                  <span className="text-sm text-slate-600">显示反馈面板</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={features.showHistory} onChange={() => toggleFeature('showHistory')} className="w-4 h-4 text-primary-500 rounded" />
                  <span className="text-sm text-slate-600">显示会话历史</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
