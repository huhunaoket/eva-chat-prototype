/**
 * 聊天消息区域组件
 */

import React, { useState } from 'react';
import { PageState, FeatureOptions, Attachment } from '../types';
import { AgentResponse } from './AgentResponse';
import { AttachmentCard } from './ChatInput';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';

interface ChatAreaProps {
  pageState: PageState;
  features: FeatureOptions;
  isPlayground: boolean;
  onPageStateChange?: (state: PageState) => void;
  hideWelcomeQuestions?: boolean;
}

// 推荐问题
const suggestedQuestions = [
  '你们的退换货政策是什么？',
  '产品价格怎么查询？',
  '如何联系人工客服？',
];

// 模拟附件数据
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

const mockMultiAttachments: Attachment[] = [
  {
    id: '1',
    type: 'image',
    name: 'pasted-image-1769154448206-hru4q1.png',
    size: 1024 * 17.86,
    status: 'success',
    previewUrl: 'https://picsum.photos/100/100?random=2',
    url: 'https://picsum.photos/800/600?random=2',
  },
  {
    id: '2',
    type: 'document',
    name: 'FDE 数字员工系统设计文档.docx',
    size: 1024 * 8.02,
    status: 'success',
    url: '#',
  },
];

export const ChatArea: React.FC<ChatAreaProps> = ({ pageState, features, isPlayground, onPageStateChange, hideWelcomeQuestions = false }) => {
  const handleRegenerate = () => {
    if (onPageStateChange) {
      onPageStateChange('streaming-multi');
    }
  };

  // 空状态（欢迎页）- 简化版
  if (pageState === 'empty') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <p className="text-lg text-slate-600 mb-8">很高兴为您服务，请问有什么可以帮您？</p>
        {!hideWelcomeQuestions && (
          <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => onPageStateChange?.('complete-single')}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm text-slate-600 hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 根据状态获取用户问题和附件
  const getUserContent = (): { text: string; attachments?: Attachment[] } => {
    if (pageState.includes('direct')) return { text: '你好' };
    if (pageState.includes('single')) return { 
      text: '请问退换货政策是什么？',
      attachments: mockAttachments 
    };
    return { 
      text: '你是怎么处理我上传的这些图片和文件的',
      attachments: mockMultiAttachments 
    };
  };

  const userContent = getUserContent();

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
      {/* 用户消息 */}
      <UserMessage content={userContent.text} attachments={userContent.attachments} />

      {/* Agent 响应 */}
      <AgentResponse
        pageState={pageState}
        features={features}
        isPlayground={isPlayground}
        onRegenerate={handleRegenerate}
      />
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
