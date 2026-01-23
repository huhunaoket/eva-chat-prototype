/**
 * AgentResponse - 统一的 Agent 响应块组件
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, Copy, ThumbsUp, ThumbsDown, Check, BookOpen, ChevronDown, ChevronUp, AlertTriangle, Loader2, Clock, Zap } from 'lucide-react';
import { PageState, FeatureOptions, KnowledgeSource, ExecutionStep } from '../types';
import { FeedbackPanel } from './FeedbackPanel';

interface AgentResponseProps {
  pageState: PageState;
  features: FeatureOptions;
  isPlayground: boolean;
  onRegenerate?: () => void;
}

// Mock 数据 - 知识引用（按文件去重）
const mockKnowledgeSources: KnowledgeSource[] = [
  { fileId: '1', fileName: '产品手册.pdf' },
  { fileId: '2', fileName: '服务指南.docx' },
];

// Plan 模式执行中
const mockPlanExecutingSteps: ExecutionStep[] = [
  { id: '1', name: '分析用户需求', status: 'done' },
  { id: '2', name: '收集竞品信息', status: 'running', subSteps: [
    { id: '2-1', name: '商业情报', status: 'running' }
  ]},
  { id: '3', name: '整理分析报告', status: 'pending' },
  { id: '4', name: '生成最终回答', status: 'pending' },
];

// Plan 模式完成（展示完整 Plan + 调用的能力）
const mockPlanCompletedSteps: ExecutionStep[] = [
  { id: '1', name: '分析用户需求', status: 'done' },
  { id: '2', name: '收集竞品信息', status: 'done', subSteps: [
    { id: '2-1', name: '商业情报', status: 'done' }
  ]},
  { id: '3', name: '整理分析报告', status: 'done', subSteps: [
    { id: '3-1', name: '智能客服', status: 'done' },
    { id: '3-2', name: '内容营销', status: 'done' }
  ]},
  { id: '4', name: '生成最终回答', status: 'done' },
];

// 单能力执行中
const mockSingleExecutingSteps: ExecutionStep[] = [
  { id: '1', name: '智能客服', status: 'running', subSteps: [{ id: '1-1', name: '正在查阅知识库...', status: 'running' }] },
];

// 单能力完成
const mockSingleCompletedSteps: ExecutionStep[] = [
  { id: '1', name: '智能客服', status: 'done', subSteps: [{ id: '1-1', name: '查阅了 2 条知识', status: 'done' }] },
];

// 终端用户等待提示文字
const waitingTexts = [
  '正在理解您的问题...',
  '正在查询相关信息...',
  '正在整理答案...',
  '马上就好...',
];

const multiAnswer = `根据分析，主要竞品有以下几家：

1. 竞品A：市场份额约35%，主打性价比路线
2. 竞品B：市场份额约25%，专注高端市场
3. 竞品C：市场份额约15%，以服务见长

建议关注竞品A的定价策略和竞品B的产品创新。`;

const singleAnswer = `根据我们的政策：

1. 7天内可无理由退换货
2. 质量问题30天内可退换
3. 退换货请保持商品完好并附带发票

如需办理退换货，请联系客服提供订单号。`;

const directAnswer = `你好！我是智能助手小E，很高兴为您服务。

我可以帮您：
- 查询产品信息和价格
- 了解退换货政策
- 查询订单状态
- 联系人工客服

请问有什么可以帮您的？`;

export const AgentResponse: React.FC<AgentResponseProps> = ({
  pageState,
  features,
  isPlayground,
  onRegenerate,
}) => {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [showKnowledgeExpanded, setShowKnowledgeExpanded] = useState(false);
  const [stepsExpanded, setStepsExpanded] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [waitingTextIndex, setWaitingTextIndex] = useState(0);

  // 终端用户等待文字轮换
  useEffect(() => {
    const isWaiting = !isPlayground && (
      pageState === 'thinking' || 
      pageState === 'executing-multi' || 
      pageState === 'executing-single'
    );
    if (isWaiting) {
      const interval = setInterval(() => {
        setWaitingTextIndex((prev) => (prev + 1) % waitingTexts.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isPlayground, pageState]);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDislike = () => {
    setDisliked(true);
    setLiked(false);
    if (features.showFeedbackPanel) {
      setShowFeedback(true);
    }
  };

  // 判断场景类型
  const isPlan = pageState.includes('multi');  // Plan 模式
  const isSingle = pageState.includes('single');
  const isDirect = pageState.includes('direct');
  const isExecuting = pageState.startsWith('executing');
  const isStreaming = pageState.startsWith('streaming');
  const isComplete = pageState.startsWith('complete');
  const hasSteps = isPlan || isSingle;

  // 获取执行步骤
  const getSteps = (): ExecutionStep[] | null => {
    if (isPlan) {
      return isExecuting ? mockPlanExecutingSteps : mockPlanCompletedSteps;
    }
    if (isSingle) {
      return isExecuting ? mockSingleExecutingSteps : mockSingleCompletedSteps;
    }
    return null;
  };

  // 获取回答内容
  const getAnswer = (): { content: string; isStreaming: boolean } | null => {
    if (pageState === 'stopped') {
      return null; // 停止时不显示内容
    }
    if (isStreaming || isComplete) {
      const streaming = isStreaming;
      if (isPlan) {
        return { content: streaming ? '根据分析，主要竞品有以下几家：\n\n1. 竞品A：市场份额约35%，主打性价比' : multiAnswer, isStreaming: streaming };
      }
      if (isSingle) {
        return { content: streaming ? '根据我们的政策：\n\n1. 7天内可无理由退换货\n2. 质量问题30天内可退换' : singleAnswer, isStreaming: streaming };
      }
      if (isDirect) {
        return { content: streaming ? '你好！我是智能助手小E，很高兴为您服务。\n\n我可以帮您：' : directAnswer, isStreaming: streaming };
      }
    }
    return null;
  };

  const steps = getSteps();
  const answer = getAnswer();
  const showActions = isComplete || pageState === 'stopped' || pageState === 'failed';

  // 计算进度
  const getProgress = () => {
    if (!steps) return null;
    const done = steps.filter(s => s.status === 'done').length;
    return { done, total: steps.length };
  };

  const progress = getProgress();

  // 获取执行中标题
  const getExecutingTitle = () => {
    if (isSingle) return '正在执行...';
    if (isPlan && progress) return `正在执行 (${progress.done}/${progress.total})`;
    return '正在处理...';
  };

  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-2 max-w-[80%]">
        {/* 单一头像 */}
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm flex-shrink-0">
          🤖
        </div>

        <div className="space-y-2 flex-1">
          {/* 正在思考状态 */}
          {pageState === 'thinking' && (
            <div className="bg-white border border-slate-200 px-4 py-3 rounded-eva-sm rounded-tl-sm shadow-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Loader2 size={16} className="animate-spin text-primary-500" />
                <span>{isPlayground ? '正在思考...' : waitingTexts[waitingTextIndex]}</span>
              </div>
            </div>
          )}

          {/* 终端用户等待状态 */}
          {!isPlayground && isExecuting && (
            <div className="bg-white border border-slate-200 px-4 py-3 rounded-eva-sm rounded-tl-sm shadow-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Loader2 size={16} className="animate-spin text-primary-500" />
                <span>{waitingTexts[waitingTextIndex]}</span>
              </div>
            </div>
          )}

          {/* Playground 执行过程（仅多能力/单能力场景） */}
          {isPlayground && hasSteps && steps && (
            <div className="bg-white border border-slate-200 rounded-eva-sm shadow-sm overflow-hidden min-w-[300px]">
              {/* 标题栏 */}
              {isExecuting ? (
                <div className="px-4 py-3 border-b border-slate-100">
                  <span className="text-sm font-medium text-slate-700">{getExecutingTitle()}</span>
                </div>
              ) : (
                <button
                  onClick={() => setStepsExpanded(!stepsExpanded)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-sm font-medium text-slate-700">执行过程</span>
                  {stepsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              )}

              {/* 步骤列表 */}
              {(isExecuting || stepsExpanded) && (
                <div className="px-4 py-2">
                  {steps.map((step) => (
                    <div key={step.id} className="py-1">
                      <div className="flex items-center gap-2">
                        <StepIcon status={step.status} />
                        <span className={`text-sm ${step.status === 'pending' ? 'text-slate-400' : 'text-slate-600'}`}>
                          {step.name}
                        </span>
                      </div>
                      {step.subSteps?.map((sub) => (
                        <div key={sub.id} className="flex items-center gap-2 ml-6 py-1">
                          <SubStepIcon status={sub.status} name={sub.name} />
                          <span className="text-xs text-slate-500">{sub.name}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 回答内容 */}
          {answer && (
            <div className="bg-white border border-slate-200 px-4 py-3 rounded-eva-sm rounded-tl-sm shadow-sm">
              <div className="whitespace-pre-wrap text-slate-700">
                {answer.content}
                {answer.isStreaming && <span className="typing-cursor">█</span>}
              </div>
            </div>
          )}

          {/* 已停止状态 */}
          {pageState === 'stopped' && (
            <div className="bg-white border border-slate-200 px-4 py-3 rounded-eva-sm rounded-tl-sm shadow-sm">
              <span className="text-slate-400">回答已停止</span>
            </div>
          )}

          {/* 失败状态 */}
          {pageState === 'failed' && (
            <div className="bg-white border border-slate-200 px-4 py-3 rounded-eva-sm rounded-tl-sm shadow-sm">
              <div className="flex items-center gap-2 text-danger-500">
                <AlertTriangle size={16} />
                <span>抱歉，回答生成失败，请重试</span>
              </div>
            </div>
          )}

          {/* 知识引用 (仅 Playground 完成态，且有能力调用) */}
          {isPlayground && features.showKnowledgeRef && isComplete && hasSteps && (
            <div className="bg-white border border-slate-200 rounded-eva-sm overflow-hidden">
              <button
                onClick={() => setShowKnowledgeExpanded(!showKnowledgeExpanded)}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50"
              >
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <BookOpen size={14} />
                  <span>引用了 {mockKnowledgeSources.length} 条知识</span>
                </div>
                {showKnowledgeExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showKnowledgeExpanded && (
                <div className="border-t border-slate-100 px-4 py-2">
                  {mockKnowledgeSources.map((source) => (
                    <div key={source.fileId} className="py-1.5 text-sm text-slate-600">
                      {source.fileName}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 操作按钮 */}
          {showActions && (
            <div className="flex items-center gap-2">
              {(pageState === 'stopped' || pageState === 'failed') && (
                <button
                  onClick={onRegenerate}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <RefreshCw size={14} />
                  <span>{pageState === 'failed' ? '重试' : '重新生成'}</span>
                </button>
              )}
              {isComplete && (
                <>
                  <button onClick={onRegenerate} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                    <RefreshCw size={16} />
                  </button>
                  <button onClick={handleCopy} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                    {copied ? <Check size={16} className="text-success-500" /> : <Copy size={16} />}
                  </button>
                  <button
                    onClick={() => { setLiked(true); setDisliked(false); }}
                    className={`p-2 rounded-lg ${liked ? 'text-primary-500 bg-primary-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                  >
                    <ThumbsUp size={16} />
                  </button>
                  <button
                    onClick={handleDislike}
                    className={`p-2 rounded-lg ${disliked ? 'text-danger-500 bg-danger-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                  >
                    <ThumbsDown size={16} />
                  </button>
                </>
              )}
            </div>
          )}

          {/* 反馈面板 */}
          {showFeedback && (
            <FeedbackPanel
              isPlayground={isPlayground}
              onClose={() => setShowFeedback(false)}
              onSubmit={() => setShowFeedback(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// 步骤图标组件
const StepIcon: React.FC<{ status: 'done' | 'running' | 'pending' }> = ({ status }) => {
  switch (status) {
    case 'done':
      return <div className="w-4 h-4 rounded-full bg-success-500 flex items-center justify-center"><Check size={10} className="text-white" /></div>;
    case 'running':
      return <Loader2 size={16} className="text-primary-500 animate-spin" />;
    case 'pending':
      return <Clock size={16} className="text-slate-300" />;
  }
};

// 子步骤图标组件
const SubStepIcon: React.FC<{ status: 'done' | 'running' | 'pending'; name: string }> = ({ status, name }) => {
  if (name.includes('查阅') || name.includes('知识')) {
    return <BookOpen size={12} className="text-primary-400" />;
  }
  if (name.includes('分析')) {
    return <Zap size={12} className={status === 'running' ? 'text-warning-500' : 'text-primary-400'} />;
  }
  switch (status) {
    case 'done':
      return <Check size={12} className="text-success-500" />;
    case 'running':
      return <Zap size={12} className="text-warning-500" />;
    case 'pending':
      return <Clock size={12} className="text-slate-300" />;
  }
};
