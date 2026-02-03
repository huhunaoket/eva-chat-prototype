/**
 * 状态切换器 - 可拖拽悬浮控制面板
 * 合并自 v1 eva-chat-prototype，增加对话模式切换
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Settings, GripVertical } from 'lucide-react';
import {
  ChatMode,
  ViewMode,
  Scenario,
  MockMessageState,
  TaskProgress,
  PageStateConfig,
  PageViewState,
  RenderMode,
  ResultStyle,
  StopScenario,
} from '../types';

interface StateSwitcherProps {
  // 对话模式
  chatMode: ChatMode;
  onChatModeChange: (mode: ChatMode) => void;
  // 视图模式
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  // 真实模式配置
  renderMode: RenderMode;
  onRenderModeChange: (mode: RenderMode) => void;
  resultStyle: ResultStyle;
  onResultStyleChange: (style: ResultStyle) => void;
  // 模拟模式配置
  stateConfig: PageStateConfig;
  onStateConfigChange: (config: PageStateConfig) => void;
  // Debug 开关
  showDebug: boolean;
  onShowDebugChange: (show: boolean) => void;
  // 工具卡片展开开关
  enableToolExpand: boolean;
  onEnableToolExpandChange: (enable: boolean) => void;
  // 终端用户执行过程展示模式
  userProcessMode: 'simple' | 'detailed';
  onUserProcessModeChange: (mode: 'simple' | 'detailed') => void;
}

const chatModeOptions: { value: ChatMode; label: string; description: string }[] = [
  { value: 'real', label: '真实对话', description: '连接 Agent Service API' },
  { value: 'mock', label: '模拟对话', description: '使用预设场景数据' },
];

const viewModeOptions: { value: ViewMode; label: string; description: string }[] = [
  { value: 'playground', label: 'Playground', description: '管理员测试视角' },
  { value: 'standalone', label: '独立网页', description: '终端用户独立页面' },
  { value: 'widget', label: '页面嵌入', description: '终端用户气泡模式' },
];

const renderModeOptions: { value: RenderMode; label: string }[] = [
  { value: 'timeline', label: '时间线' },
  { value: 'separated-smart', label: '智能混合' },
  { value: 'separated-realtime', label: '实时分离式' },
  { value: 'separated-delayed', label: '延迟分离式' },
];

const resultStyleOptions: { value: ResultStyle; label: string }[] = [
  { value: 'with-bg', label: '有底色' },
  { value: 'no-bg', label: '无底色' },
];

const scenarioOptions: { value: Scenario; label: string; description: string }[] = [
  { value: 'A', label: '场景A：直接回答', description: '无工具调用、无任务规划' },
  { value: 'B', label: '场景B：工具调用', description: '有调用栈，无任务列表' },
  { value: 'C', label: '场景C：任务规划（无确认）', description: '有任务列表，一次完成' },
  { value: 'D', label: '场景D：任务规划（有确认）', description: '多轮对话' },
];

const messageStateOptions: { value: MockMessageState; label: string }[] = [
  { value: 'thinking', label: '思考中' },
  { value: 'executing', label: '执行中' },
  { value: 'streaming', label: '流式输出' },
  { value: 'complete', label: '完成' },
  { value: 'stopped', label: '已停止' },
  { value: 'failed', label: '失败' },
];

const taskProgressOptions: { value: TaskProgress; label: string }[] = [
  { value: 'task1', label: '任务1执行中' },
  { value: 'task2', label: '任务2执行中' },
  { value: 'task3', label: '任务3执行中' },
  { value: 'task4', label: '任务4执行中' },
];

const stopScenarioOptions: { value: StopScenario; label: string; description: string }[] = [
  { value: 'thinking', label: '思考中停止', description: '无任何内容输出' },
  { value: 'executing', label: '执行过程停止', description: '有部分工具执行' },
  { value: 'streaming', label: '输出时停止', description: '有部分文本输出' },
];

const pageViewOptions: { value: PageViewState; label: string; description: string }[] = [
  { value: 'init', label: '初始化', description: '智能体创建中引导页' },
  { value: 'welcome', label: '欢迎页', description: '初始化完成后的欢迎页' },
  { value: 'conversation', label: '对话中', description: '正在进行对话' },
];

// 根据场景过滤可用的消息状态
const getAvailableStates = (scenario: Scenario): MockMessageState[] => {
  switch (scenario) {
    case 'A':
      return ['thinking', 'streaming', 'complete', 'stopped', 'failed'];
    case 'B':
    case 'C':
    case 'D':
      return ['thinking', 'executing', 'streaming', 'complete', 'stopped', 'failed'];
    default:
      return ['thinking', 'executing', 'streaming', 'complete', 'stopped', 'failed'];
  }
};

export const StateSwitcher: React.FC<StateSwitcherProps> = ({
  chatMode,
  onChatModeChange,
  viewMode,
  onViewModeChange,
  renderMode,
  onRenderModeChange,
  resultStyle,
  onResultStyleChange,
  stateConfig,
  onStateConfigChange,
  showDebug,
  onShowDebugChange,
  enableToolExpand,
  onEnableToolExpandChange,
  userProcessMode,
  onUserProcessModeChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 80 });  // 调整初始位置，避开头部
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);

  const handleScenarioChange = (scenario: Scenario) => {
    const availableStates = getAvailableStates(scenario);
    const newState: MockMessageState = availableStates.includes(stateConfig.messageState)
      ? stateConfig.messageState
      : 'thinking';

    onStateConfigChange({
      ...stateConfig,
      scenario,
      messageState: newState,
      taskProgress: (scenario === 'C' || scenario === 'D') ? 'task1' : undefined,
    });
  };

  const handlePageViewChange = (pageView: PageViewState) => {
    onStateConfigChange({
      ...stateConfig,
      pageView,
    });
  };

  const handleMessageStateChange = (messageState: MockMessageState) => {
    onStateConfigChange({
      ...stateConfig,
      messageState,
      // 当切换到已停止状态时，设置默认停止场景
      stopScenario: messageState === 'stopped' ? (stateConfig.stopScenario || 'executing') : stateConfig.stopScenario,
    });
  };

  const handleTaskProgressChange = (taskProgress: TaskProgress) => {
    onStateConfigChange({
      ...stateConfig,
      taskProgress,
    });
  };

  const handleStopScenarioChange = (stopScenario: StopScenario) => {
    onStateConfigChange({
      ...stateConfig,
      stopScenario,
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
  const showStopScenario = stateConfig.messageState === 'stopped';

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
            {/* 对话模式切换 */}
            <div>
              <div className="text-xs font-medium text-slate-500 mb-2">对话模式</div>
              <div className="space-y-2">
                {chatModeOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-2 cursor-pointer p-2 rounded-lg transition-colors ${
                      chatMode === opt.value ? 'bg-green-50 border border-green-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="chatMode"
                      checked={chatMode === opt.value}
                      onChange={() => onChatModeChange(opt.value)}
                      className="w-4 h-4 text-green-500 mt-0.5"
                    />
                    <div>
                      <div className="text-sm text-slate-700 font-medium">{opt.label}</div>
                      <div className="text-xs text-slate-400">{opt.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 视图模式 - 始终显示 */}
            <div>
              <div className="text-xs font-medium text-slate-500 mb-2">视图模式</div>
              <div className="space-y-2">
                {viewModeOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-2 cursor-pointer p-2 rounded-lg transition-colors ${
                      viewMode === opt.value ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="viewMode"
                      checked={viewMode === opt.value}
                      onChange={() => onViewModeChange(opt.value)}
                      className="w-4 h-4 text-indigo-500 mt-0.5"
                    />
                    <div>
                      <div className="text-sm text-slate-700 font-medium">{opt.label}</div>
                      <div className="text-xs text-slate-400">{opt.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 真实模式配置 */}
            {chatMode === 'real' && (
              <>
                {/* 渲染模式 */}
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-2">渲染模式</div>
                  <select
                    value={renderMode}
                    onChange={(e) => onRenderModeChange(e.target.value as RenderMode)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {renderModeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* 结果样式 */}
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-2">结果样式</div>
                  <select
                    value={resultStyle}
                    onChange={(e) => onResultStyleChange(e.target.value as ResultStyle)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {resultStyleOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* 工具卡片展开开关 */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableToolExpand}
                      onChange={(e) => onEnableToolExpandChange(e.target.checked)}
                      className="w-4 h-4 text-blue-500 rounded"
                    />
                    <span className="text-sm text-slate-600">允许展开能力调用卡片</span>
                  </label>
                </div>

                {/* 终端用户执行过程展示模式 */}
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-2">终端用户执行过程</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onUserProcessModeChange('simple')}
                      className={`flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        userProcessMode === 'simple'
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      简化文案
                    </button>
                    <button
                      onClick={() => onUserProcessModeChange('detailed')}
                      className={`flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        userProcessMode === 'detailed'
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      详细时间轴
                    </button>
                  </div>
                </div>

                {/* Debug 开关 */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showDebug}
                      onChange={(e) => onShowDebugChange(e.target.checked)}
                      className="w-4 h-4 text-blue-500 rounded"
                    />
                    <span className="text-sm text-slate-600">显示调试面板</span>
                  </label>
                </div>
              </>
            )}

            {/* 模拟模式配置 */}
            {chatMode === 'mock' && (
              <>
                {/* 页面视图状态 */}
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-2">页面状态</div>
                  <div className="flex flex-wrap gap-2">
                    {pageViewOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handlePageViewChange(opt.value)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          stateConfig.pageView === opt.value
                            ? 'bg-purple-500 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        title={opt.description}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 对话场景配置（仅在对话中状态显示） */}
                {stateConfig.pageView === 'conversation' && (
                  <>
                    {/* 场景选择 */}
                    <div>
                      <div className="text-xs font-medium text-slate-500 mb-2">场景（对齐 PRD v3）</div>
                  <div className="space-y-2">
                    {scenarioOptions.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-start gap-2 cursor-pointer p-2 rounded-lg transition-colors ${
                          stateConfig.scenario === opt.value ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="scenario"
                          checked={stateConfig.scenario === opt.value}
                          onChange={() => handleScenarioChange(opt.value)}
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
                              ? 'bg-blue-500 text-white'
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
                              ? 'bg-orange-500 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 停止场景（仅已停止状态） */}
                {showStopScenario && (
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-2">停止场景</div>
                    <div className="space-y-2">
                      {stopScenarioOptions.map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex items-start gap-2 cursor-pointer p-2 rounded-lg transition-colors ${
                            stateConfig.stopScenario === opt.value ? 'bg-gray-100 border border-gray-300' : 'hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="stopScenario"
                            checked={stateConfig.stopScenario === opt.value}
                            onChange={() => handleStopScenarioChange(opt.value)}
                            className="w-4 h-4 text-gray-500 mt-0.5"
                          />
                          <div>
                            <div className="text-sm text-slate-700 font-medium">{opt.label}</div>
                            <div className="text-xs text-slate-400">{opt.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                  </>
                )}

                {/* 当前状态摘要 */}
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs font-medium text-slate-500 mb-1">当前状态</div>
                  <div className="text-sm text-slate-700">
                    <span className="font-medium">{pageViewOptions.find(o => o.value === stateConfig.pageView)?.label}</span>
                    {stateConfig.pageView === 'conversation' && (
                      <>
                        <span className="mx-1">·</span>
                        <span>场景{stateConfig.scenario}</span>
                        <span className="mx-1">·</span>
                        <span>{messageStateOptions.find(o => o.value === stateConfig.messageState)?.label}</span>
                        {showTaskProgress && stateConfig.taskProgress && (
                          <>
                            <span className="mx-1">·</span>
                            <span>{taskProgressOptions.find(o => o.value === stateConfig.taskProgress)?.label}</span>
                          </>
                        )}
                        {showStopScenario && stateConfig.stopScenario && (
                          <>
                            <span className="mx-1">·</span>
                            <span>{stopScenarioOptions.find(o => o.value === stateConfig.stopScenario)?.label}</span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
