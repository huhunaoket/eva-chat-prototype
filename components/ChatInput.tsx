/**
 * 聊天输入框组件
 * 支持文字输入、附件上传（点击、粘贴、拖拽）
 */

import React, { useState, useRef, useCallback } from 'react';
import { Send, Square, Paperclip, X } from 'lucide-react';
import { PageStateConfig, Attachment, AttachmentType, SUPPORTED_IMAGE_TYPES, SUPPORTED_DOC_TYPES, MAX_IMAGE_SIZE, MAX_DOC_SIZE, MAX_ATTACHMENTS } from '../types';

interface ChatInputProps {
  stateConfig: PageStateConfig;
  onSend: (message: string, attachments?: Attachment[]) => void;
  onStop: () => void;
}

// 模拟上传（原型演示用）
const simulateUpload = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(URL.createObjectURL(file));
    }, 800 + Math.random() * 500);
  });
};

// 获取文件类型
const getAttachmentType = (file: File): AttachmentType | null => {
  if (SUPPORTED_IMAGE_TYPES.includes(file.type)) return 'image';
  if (SUPPORTED_DOC_TYPES.includes(file.type)) return 'document';
  return null;
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// 截断文件名（中间省略）
const truncateFileName = (name: string, maxLength: number = 16): string => {
  if (name.length <= maxLength) return name;
  const ext = name.lastIndexOf('.') > 0 ? name.slice(name.lastIndexOf('.')) : '';
  const baseName = name.slice(0, name.length - ext.length);
  const keepLength = maxLength - ext.length - 3;
  if (keepLength <= 0) return name.slice(0, maxLength - 3) + '...';
  return baseName.slice(0, keepLength) + '...' + ext;
};

// 获取文件图标背景色
const getFileIconBg = (name: string): string => {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['doc', 'docx'].includes(ext)) return 'bg-blue-100 text-blue-600';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'bg-green-100 text-green-600';
  if (['pdf'].includes(ext)) return 'bg-red-100 text-red-600';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'bg-purple-100 text-purple-600';
  return 'bg-slate-100 text-slate-600';
};

// 获取文件图标文字
const getFileIconText = (name: string): string => {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['doc', 'docx'].includes(ext)) return 'W';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'X';
  if (['pdf'].includes(ext)) return 'P';
  return ext.slice(0, 2).toUpperCase() || 'F';
};

export const ChatInput: React.FC<ChatInputProps> = ({ stateConfig, onSend, onStop }) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messageState } = stateConfig;
  const isGenerating = messageState === 'thinking' ||
                       messageState === 'executing' ||
                       messageState === 'streaming';

  // 显示 Toast 提示
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // 验证文件
  const validateFile = useCallback((file: File): string | null => {
    const type = getAttachmentType(file);
    if (!type) {
      return '不支持的文件类型，请上传图片或文档';
    }
    if (type === 'image' && file.size > MAX_IMAGE_SIZE) {
      return '图片大小超过限制（最大 10MB）';
    }
    if (type === 'document' && file.size > MAX_DOC_SIZE) {
      return '文档大小超过限制（最大 20MB）';
    }
    return null;
  }, []);

  // 处理文件上传
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remainingSlots = MAX_ATTACHMENTS - attachments.length;
    
    if (fileArray.length > remainingSlots) {
      showToast(`最多上传 ${MAX_ATTACHMENTS} 个附件`);
      return;
    }

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        showToast(error);
        continue;
      }

      const type = getAttachmentType(file)!;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const previewUrl = type === 'image' ? URL.createObjectURL(file) : undefined;

      const newAttachment: Attachment = {
        id,
        type,
        name: file.name,
        size: file.size,
        status: 'uploading',
        progress: 0,
        previewUrl,
      };

      setAttachments(prev => [...prev, newAttachment]);

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setAttachments(prev => prev.map(att => 
          att.id === id && att.status === 'uploading'
            ? { ...att, progress: Math.min((att.progress || 0) + 25, 90) }
            : att
        ));
      }, 150);

      try {
        const url = await simulateUpload(file);
        clearInterval(progressInterval);
        setAttachments(prev => prev.map(att => 
          att.id === id
            ? { ...att, status: 'success', progress: 100, url }
            : att
        ));
      } catch {
        clearInterval(progressInterval);
        setAttachments(prev => prev.map(att => 
          att.id === id
            ? { ...att, status: 'error', error: '上传失败' }
            : att
        ));
        showToast('上传失败，请重试');
      }
    }
  }, [attachments.length, validateFile, showToast]);

  // 删除附件
  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => {
      const att = prev.find(a => a.id === id);
      if (att?.previewUrl) {
        URL.revokeObjectURL(att.previewUrl);
      }
      return prev.filter(a => a.id !== id);
    });
  }, []);

  // 处理粘贴
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const imageItems: File[] = [];

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) imageItems.push(file);
      }
    }

    if (imageItems.length > 0) {
      e.preventDefault();
      handleFiles(imageItems);
    }
  }, [handleFiles]);

  // 处理拖拽
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  // 提交消息
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasContent = message.trim() || attachments.some(a => a.status === 'success');
    const hasUploading = attachments.some(a => a.status === 'uploading');
    
    if (hasContent && !isGenerating && !hasUploading) {
      onSend(message, attachments.filter(a => a.status === 'success'));
      setMessage('');
      setAttachments([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const canSend = (message.trim() || attachments.some(a => a.status === 'success')) && 
                  !attachments.some(a => a.status === 'uploading');

  return (
    <div
      className={`border-t border-slate-200 bg-white relative flex-shrink-0 ${isDragging ? 'ring-2 ring-primary-500 ring-inset' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Toast 提示 */}
      {toast && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-lg z-10">
          {toast}
        </div>
      )}

      {/* 拖拽提示 */}
      {isDragging && (
        <div className="absolute inset-0 bg-primary-50/90 flex items-center justify-center z-10 border-2 border-dashed border-primary-400 rounded-lg m-2">
          <div className="text-center">
            <div className="text-3xl mb-2">📥</div>
            <div className="text-primary-600 font-medium">松开鼠标上传文件</div>
          </div>
        </div>
      )}

      <div className="p-4">
        {/* 输入框容器 */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent relative">
          {/* 附件预览区 */}
          {attachments.length > 0 && (
            <div className="px-4 pt-3 pb-2 border-b border-slate-100">
              <div className="flex gap-3 overflow-x-auto pb-1">
                {attachments.map(att => (
                  <AttachmentCard 
                    key={att.id} 
                    attachment={att} 
                    onRemove={() => removeAttachment(att.id)}
                    canRemove={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 文本输入区 */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder='输入您的问题... (Enter 发送，Shift+Enter 换行)'
            disabled={isGenerating}
            rows={2}
            className="w-full px-4 py-3 bg-transparent resize-none focus:outline-none disabled:opacity-50 text-slate-700 placeholder:text-slate-400"
          />

          {/* 底部工具栏 */}
          <div className="flex items-center justify-end gap-2 px-3 pb-3">
            {/* 附件按钮 */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating || attachments.length >= MAX_ATTACHMENTS}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="上传附件"
            >
              <Paperclip size={20} />
            </button>

            {/* 隐藏的文件输入 */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={[...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_DOC_TYPES].join(',')}
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              className="hidden"
            />

            {/* 发送/停止按钮 */}
            {isGenerating ? (
              <button
                type="button"
                onClick={onStop}
                className="p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                <Square size={18} fill="currentColor" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSend}
                className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-3 text-center">
        <span className="text-xs text-slate-400">内容由 AI 生成，请仔细甄别</span>
      </div>
    </div>
  );
};

// 附件卡片组件（横向样式）
interface AttachmentCardProps {
  attachment: Attachment;
  onRemove?: () => void;
  canRemove?: boolean;
}

export const AttachmentCard: React.FC<AttachmentCardProps> = ({ attachment, onRemove, canRemove = false }) => {
  const { type, name, size, status, progress, previewUrl } = attachment;
  const [showTooltip, setShowTooltip] = useState(false);
  
  const isUploading = status === 'uploading';
  const isError = status === 'error';
  const truncatedName = truncateFileName(name, 14);
  const needsTooltip = name !== truncatedName;

  return (
    <div 
      className="relative group flex-shrink-0"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* 完整文件名 Tooltip - 显示在下方 */}
      {needsTooltip && showTooltip && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg whitespace-nowrap z-50 shadow-lg">
          {name}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-800" />
        </div>
      )}

      <div className={`flex items-center gap-3 px-3 py-2 bg-white border rounded-xl min-w-[160px] max-w-[200px] ${
        isError ? 'border-red-200 bg-red-50' : 'border-slate-200'
      }`}>
        {/* 图标 */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isError ? 'bg-red-100 text-red-500' : 
          type === 'image' && previewUrl ? '' : getFileIconBg(name)
        }`}>
          {isUploading ? (
            <div className="w-6 h-6 border-2 border-slate-300 border-t-primary-500 rounded-full animate-spin" />
          ) : isError ? (
            <X size={20} />
          ) : type === 'image' && previewUrl ? (
            <img src={previewUrl} alt={name} className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <span className="text-sm font-semibold">{getFileIconText(name)}</span>
          )}
        </div>

        {/* 文件信息 */}
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium truncate ${isError ? 'text-red-600' : 'text-slate-700'}`}>
            {isError ? '上传失败' : truncatedName}
          </div>
          <div className="text-xs text-slate-400">
            {isUploading ? `${progress}%` : formatFileSize(size)}
          </div>
        </div>

        {/* 删除按钮 */}
        {canRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className="absolute -top-2 -right-2 w-5 h-5 bg-slate-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 shadow-sm"
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );
};
