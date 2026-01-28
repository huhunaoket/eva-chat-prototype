/**
 * 原型状态切换器 - 可拖拽悬浮控制面板
 * 对齐 PRD v3 3.3.2 场景交互详解
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Settings, GripVertical } from 'lucide-react';
import { ViewMode, Scenario, MessageState, TaskProgress, PageStateConfig, FeatureOptions, PageViewState } from '../types';

interface StateSwitcherProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  stateConfig: PageStateConfig;
  onStateConfigChange: (config: PageStateConfig) => void;
  features: FeatureOptions;
  onFeaturesChange: (features: FeatureOptions) => void;
  pageViewState: PageViewState;
  onPageViewStateChange: (state: PageViewState) => void;
}

const viewModeOptions: { value: ViewMode; label: string }[] = [
  { value: 'playground', label: 'Playground（管理员）' },
  { value: 'standalone', label: '终端用户（独立网页）' },
  { value: 'widget', label: '终端用户（Widget）' },
];

// 页面视图状态（对齐 PRD v3 3.1 欢迎页模块）
const pageViewStateOptions: { value: PageViewState; label: string; description: string }[] = [
  { value: 'init', label: '初始化引导', description: '企业未完成初始化' },
  { value: 'welcome', label: '欢迎页', description: '企业已初始化，空会话' },
  { value: 'conversation', label: '对话中', description: '有消息历史' },
];

// 场景定义（对齐 PRD v3）
const scenarioOptions: { value: Scenario; label: string; description: string }[] = [
  { value: 'A', label: '场景A：直接回答', description: '无工具调用、无任务规划' },
  { value: 'B', label: '场景B：工具调用', description: '有调用栈，无任务列表' },
  { value: 'C', label: '场景C：任务规划（无确认）', description: '有任务列表，一次完成' },
  { value: 'D', label: '场景D：任务规划（有确认）', description: '多轮对话' },
];

// 消息状态定义
const messageStateOptions: { value: MessageState; label: string }[] = [
  { value: 'thinking', label: '思考中' },
  { value: 'executing', label: '执行中' },
  { value: 'streaming', label: '流式输出' },
  { value: 'complete', label: '完成' },
  { value: 'stopped', label: '已停止' },
  { value: 'failed', label: '失败' },
];

// 任务进度定义（场景C/D）
const taskProgressOptions: { value: TaskProgress; label: string }[] = [
  { value: 'task1', label: '任务1执行中' },
  { value: 'task2', label: '任务2执行中' },
  { value: 'task3', label: '任务3执行中' },
  { value: 'task4', label: '任务4执行中' },
];

// 根据场景过滤可用的消息状态
const getAvailableStates = (scenario: Scenario): MessageState[] => {
  switch (scenario) {
    case 'A':
      // 直接回答：思考中 → 流式输出 → 完成/停止/失败
      return ['thinking', 'streaming', 'complete', 'stopped', 'failed'];
    case 'B':
      // 工具调用：思考中 → 执行中 → 流式输出 → 完成/停止/失败
      return ['thinking', 'executing', 'streaming', 'complete', 'stopped', 'failed'];
    case 'C':
    case 'D':
      // 任务规划：思考中 → 执行中 → 流式输出 → 完成/停止/失败
      return ['thinking', 'executing', 'streaming', 'complete', 'stopped', 'failed'];
    default:
      return ['thinking', 'executing', 'streaming', 'complete', 'stopped', 'failed'];
  }
};

export const StateSwitcher: React.FC<StateSwitcherProps> = ({
  viewMode,
  onViewModeChange,
  stateConfig,
  onStateConfigChange,
  features,
  onFeaturesChange,
  pageViewState,
  onPageViewStateChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);

  const toggleFeature = (key: keyof FeatureOptions) => {
    onFeaturesChange({ ...features, [key]: !features[key] });
  };

  const handleScenarioChange = (scenario: Scenario) => {
    // 切换场景时重置状态
    const availableStates = getAvailableStates(scenario);
    const newState: MessageState = availableStates.includes(stateConfig.messageState)
      ? stateConfig.messageState
      : 'thinking';

    onStateConfigChange({
      scenario,
      messageState: newState,
      taskProgress: (scenario === 'C' || scenario === 'D') ? 'task1' : undefined,
    });
  };

  const handleMessageStateChange = (messageState: MessageState) => {
    onStateConfigChange({
      ...stateConfig,
      messageState,
    });
  };

  const handleTaskProgressChange = (taskProgress: TaskProgress) => {
    onStateConfigChange({
      ...stateConfig,
      taskProgress,
    });
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

  const availableStates = getAvailableStates(stateConfig.scenario);
  const showTaskProgress = (stateConfig.scenario === 'C' || stateConfig.scenario === 'D')
    && stateConfig.messageState === 'executing';

  return (
    <div
      className="fixed z-[100]"
      style={{ right: position.x, top: position.y, cursor: isDragging ? 'grabbing' : 'default' }}
    >
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden w-[320px]">
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
              <span className="text-sm font-medium text-slate-700">场景状态切换</span>
            </div>
            {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
          </button>
        </div>

        {isExpanded && (
          <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-hide">
            {/* 视角切换 */}
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

            {/* 页面视图状态切换 */}
            <div>
              <div className="text-xs font-medium text-slate-500 mb-2">页面状态（对齐 PRD v3 3.1）</div>
              <div className="space-y-2">
                {pageViewStateOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-2 cursor-pointer p-2 rounded-lg transition-colors ${
                      pageViewState === opt.value ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="pageViewState"
                      checked={pageViewState === opt.value}
                      onChange={() => onPageViewStateChange(opt.value)}
                      className="w-4 h-4 text-blue-500 mt-0.5"
                    />
                    <div>
                      <div className="text-sm text-slate-700 font-medium">{opt.label}</div>
                      <div className="text-xs text-slate-400">{opt.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 场景选择（仅对话中状态显示） */}
            {pageViewState === 'conversation' && (
            <>
            <div>
              <div className="text-xs font-medium text-slate-500 mb-2">场景（对齐 PRD v3）</div>
              <div className="space-y-2">
                {scenarioOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-2 cursor-pointer p-2 rounded-lg transition-colors ${
                      stateConfig.scenario === opt.value ? 'bg-primary-50 border border-primary-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="scenario"
                      checked={stateConfig.scenario === opt.value}
                      onChange={() => handleScenarioChange(opt.value)}
                      className="w-4 h-4 text-primary-500 mt-0.5"
                    />
                    <div>
                      <div className="text-sm text-slate-700 font-medium">{opt.label}</div>
                      <div className="text-xs text-slate-400">{opt.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 消息状态 */}
            <div>
              <div className="text-xs font-medium text-slate-500 mb-2">消息状态</div>
              <div className="flex flex-wrap gap-2">
                {messageStateOptions
                  .filter(opt => availableStates.includes(opt.value))
                  .map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleMessageStateChange(opt.value)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        stateConfig.messageState === opt.value
                          ? 'bg-primary-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
              </div>
            </div>

            {/* 任务进度（仅场景C/D执行中） */}
            {showTaskProgress && (
              <div>
                <div className="text-xs font-medium text-slate-500 mb-2">任务进度</div>
                <div className="flex flex-wrap gap-2">
                  {taskProgressOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleTaskProgressChange(opt.value)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        stateConfig.taskProgress === opt.value
                          ? 'bg-warning-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 当前状态摘要 */}
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs font-medium text-slate-500 mb-1">当前状态</div>
              <div className="text-sm text-slate-700">
                <span className="font-medium">场景{stateConfig.scenario}</span>
                <span className="mx-1">·</span>
                <span>{messageStateOptions.find(o => o.value === stateConfig.messageState)?.label}</span>
                {showTaskProgress && stateConfig.taskProgress && (
                  <>
                    <span className="mx-1">·</span>
                    <span>{taskProgressOptions.find(o => o.value === stateConfig.taskProgress)?.label}</span>
                  </>
                )}
              </div>
            </div>
            </>
            )}

            {/* 功能开关 */}
            <div>
              <div className="text-xs font-medium text-slate-500 mb-2">功能演示</div>
              <div className="space-y-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={features.showKnowledgeRef}
                    onChange={() => toggleFeature('showKnowledgeRef')}
                    className="w-4 h-4 text-primary-500 rounded"
                  />
                  <span className="text-sm text-slate-600">显示知识引用</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={features.showFeedbackPanel}
                    onChange={() => toggleFeature('showFeedbackPanel')}
                    className="w-4 h-4 text-primary-500 rounded"
                  />
                  <span className="text-sm text-slate-600">显示反馈面板</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={features.showHistory}
                    onChange={() => toggleFeature('showHistory')}
                    className="w-4 h-4 text-primary-500 rounded"
                  />
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
