/**
 * 聊天消息区域组件
 * 对齐 PRD v3 3.3 过程态展示模块
 */

import React, { useState } from 'react';
import { PageStateConfig, FeatureOptions, Attachment, Scenario } from '../types';
import { AgentResponse } from './AgentResponse';
import { TaskList } from './TaskList';
import { AttachmentCard } from './ChatInput';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';

interface ChatAreaProps {
  stateConfig: PageStateConfig;
  features: FeatureOptions;
  isPlayground: boolean;
  onStateConfigChange?: (config: PageStateConfig) => void;
  hideWelcomeQuestions?: boolean;
  isEmptySession?: boolean;
}

// 推荐问题
const suggestedQuestions = [
  '你们的退换货政策是什么？',
  '产品价格怎么查询？',
  '如何联系人工客服？',
];

// 模拟附件数据（场景B使用）
const mockAttachments: Attachment[] = [
  {
    id: '1',
    type: 'image',
    name: 'pasted-image-1769154448206-hru4q1.png',
    size: 1024 * 26.43,
    status: 'success',
    previewUrl: 'https://picsum.photos/100/100?random=1',
    url: 'https://picsum.photos/800/600?random=1',
  },
];

export const ChatArea: React.FC<ChatAreaProps> = ({
  stateConfig,
  features,
  isPlayground,
  onStateConfigChange,
  hideWelcomeQuestions = false,
  isEmptySession = false,
}) => {
  const { scenario, messageState } = stateConfig;

  const handleRegenerate = () => {
    if (onStateConfigChange) {
      onStateConfigChange({
        ...stateConfig,
        messageState: 'streaming',
      });
    }
  };

  const handleSendQuestion = (question: string) => {
    if (onStateConfigChange) {
      onStateConfigChange({
        ...stateConfig,
        messageState: 'thinking',
      });
    }
  };

  // 空状态（欢迎页）- 当是空会话时显示
  const isEmptyState = isEmptySession;

  // 根据场景获取用户问题和附件
  const getUserContent = (): { text: string; attachments?: Attachment[] } => {
    switch (scenario) {
      case 'A':
        return { text: '你好' };
      case 'B':
        return {
          text: '请问退换货政策是什么？',
          attachments: mockAttachments
        };
      case 'C':
      case 'D':
        return { text: '帮我做一份竞品分析报告' };
      default:
        return { text: '你好' };
    }
  };

  const userContent = getUserContent();

  // 场景D：多轮对话展示
  const isScenarioD = scenario === 'D';
  const showScenarioDMultiTurn = isScenarioD && (messageState === 'executing' || messageState === 'streaming' || messageState === 'complete' || messageState === 'stopped');

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* 消息列表区域 - 可滚动 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide min-h-0">
        {/* 空会话欢迎页 */}
        {isEmptyState ? (
          <WelcomePage
            hideQuestions={hideWelcomeQuestions}
            onSendQuestion={handleSendQuestion}
          />
        ) : (
          <>
            {/* 用户消息 */}
            <UserMessage content={userContent.text} attachments={userContent.attachments} />

            {/* 场景D多轮对话：气泡1 + 用户确认 + 气泡2 */}
            {showScenarioDMultiTurn ? (
              <>
                {/* 气泡1：Agent 请求确认（已完成态） */}
                <AgentResponse
                  stateConfig={{
                    scenario: 'D',
                    messageState: 'complete',
                    taskProgress: 'task2',
                  }}
                  features={features}
                  isPlayground={isPlayground}
                  onRegenerate={handleRegenerate}
                  isFirstBubbleInD={true}
                />

                {/* 用户确认回复 */}
                <UserMessage content="继续" />

                {/* 气泡2：Agent 继续执行 */}
                <AgentResponse
                  stateConfig={stateConfig}
                  features={features}
                  isPlayground={isPlayground}
                  onRegenerate={handleRegenerate}
                  isSecondBubbleInD={true}
                />
              </>
            ) : (
              /* 其他场景：单气泡 */
              <AgentResponse
                stateConfig={stateConfig}
                features={features}
                isPlayground={isPlayground}
                onRegenerate={handleRegenerate}
              />
            )}
          </>
        )}
      </div>

      {/* 任务列表区域（场景C/D，位于输入框上方，固定不滚动） */}
      <div className="flex-shrink-0">
        <TaskList
          stateConfig={stateConfig}
          isPlayground={isPlayground}
        />
      </div>
    </div>
  );
};

// 用户消息组件
interface UserMessageProps {
  content: string;
  attachments?: Attachment[];
}

const UserMessage: React.FC<UserMessageProps> = ({ content, attachments }) => {
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const hasAttachments = attachments && attachments.length > 0;

  return (
    <>
      <div className="flex justify-end">
        <div className="flex items-start gap-2 max-w-[80%]">
          <div className="space-y-2">
            {/* 附件展示 - 使用统一的卡片样式 */}
            {hasAttachments && (
              <div className="flex flex-wrap gap-2 justify-end">
                {attachments.map(att => (
                  <div 
                    key={att.id}
                    onClick={() => att.type === 'image' && att.url && setViewingImage(att.url)}
                    className={att.type === 'image' ? 'cursor-pointer' : ''}
                  >
                    <AttachmentCard 
                      attachment={att} 
                      canRemove={false}
                    />
                  </div>
                ))}
              </div>
            )}
            {/* 文字内容 */}
            {content && (
              <div className="bg-primary-500 text-white px-4 py-3 rounded-2xl rounded-tr-md">
                {content}
              </div>
            )}
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm flex-shrink-0">
            👤
          </div>
        </div>
      </div>

      {/* 图片查看器 */}
      {viewingImage && (
        <ImageViewer 
          src={viewingImage} 
          onClose={() => setViewingImage(null)} 
        />
      )}
    </>
  );
};

// 图片查看器组件
interface ImageViewerProps {
  src: string;
  onClose: () => void;
}

// 欢迎页组件
interface WelcomePageProps {
  hideQuestions?: boolean;
  onSendQuestion?: (question: string) => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ hideQuestions = false, onSendQuestion }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-12">
      {/* Agent 头像 */}
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-3xl mb-6 shadow-lg">
        🤖
      </div>
      {/* 开场白 */}
      <h2 className="text-xl font-semibold text-slate-800 mb-2">你好，我是智能助手</h2>
      <p className="text-slate-500 mb-8">很高兴为您服务！</p>
      {/* 推荐问题（Playground显示，终端用户隐藏） */}
      {!hideQuestions && (
        <div className="w-full max-w-md space-y-3">
          {suggestedQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => onSendQuestion?.(question)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl text-left text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
            >
              <span className="text-primary-500">🔹</span>
              <span>{question}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ImageViewer: React.FC<ImageViewerProps> = ({ src, onClose }) => {
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex flex-col"
      onClick={onClose}
    >
      {/* 关闭按钮 */}
      <div className="flex justify-end p-4">
        <button 
          className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          onClick={onClose}
        >
          <X size={24} />
        </button>
      </div>

      {/* 图片区域 */}
      <div 
        className="flex-1 flex items-center justify-center overflow-auto p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={src} 
          alt="查看图片"
          style={{ transform: `scale(${zoom / 100})` }}
          className="max-w-full max-h-full object-contain transition-transform"
        />
      </div>

      {/* 底部工具栏 */}
      <div 
        className="flex items-center justify-center gap-4 p-4 bg-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50"
          onClick={handleZoomOut}
          disabled={zoom <= 50}
        >
          <ZoomOut size={20} />
        </button>
        <span className="text-white min-w-[60px] text-center">{zoom}%</span>
        <button 
          className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50"
          onClick={handleZoomIn}
          disabled={zoom >= 200}
        >
          <ZoomIn size={20} />
        </button>
        <div className="w-px h-6 bg-white/20 mx-2" />
        <a 
          href={src}
          download
          className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <Download size={20} />
        </a>
      </div>
    </div>
  );
};
