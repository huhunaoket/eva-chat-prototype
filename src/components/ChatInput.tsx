/**
 * 聊天输入框组件
 * 支持文字输入、附件上传（点击、粘贴、拖拽）
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUp, Square, Paperclip, X } from 'lucide-react';
import {
  Attachment,
  AttachmentType,
  SUPPORTED_IMAGE_TYPES,
  SUPPORTED_DOC_TYPES,
  MAX_IMAGE_SIZE,
  MAX_DOC_SIZE,
  MAX_ATTACHMENTS,
} from '../types';

interface ChatInputProps {
  onSend: (message: string, attachments?: Attachment[]) => void;
  onStop?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  compact?: boolean;  // 紧凑模式（用于 Widget）
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
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  return 'bg-gray-100 text-gray-600';
};

// 获取文件图标文字
const getFileIconText = (name: string): string => {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['doc', 'docx'].includes(ext)) return 'W';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'X';
  if (['pdf'].includes(ext)) return 'P';
  return ext.slice(0, 2).toUpperCase() || 'F';
};

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onStop,
  disabled = false,
  isLoading = false,
  placeholder = '输入您的问题...',
  compact = false,
}) => {
  const [message, setMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 自动调整高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

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

  const handleSubmit = () => {
    const hasContent = message.trim() || attachments.some(a => a.status === 'success');
    const hasUploading = attachments.some(a => a.status === 'uploading');
    
    if (hasContent && !disabled && !isLoading && !hasUploading) {
      onSend(message.trim(), attachments.filter(a => a.status === 'success'));
      setMessage('');
      setAttachments([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isComposing) return;
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = (message.trim() || attachments.some(a => a.status === 'success')) && 
                  !attachments.some(a => a.status === 'uploading');

  return (
    <div 
      className={`${compact ? 'px-0 pb-0 pt-2' : 'px-4 pb-4 pt-2'} relative overflow-visible ${isDragging ? 'ring-2 ring-blue-500 ring-inset rounded-lg' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Toast 提示 */}
      {toast && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-10">
          {toast}
        </div>
      )}

      {/* 拖拽提示 */}
      {isDragging && (
        <div className="absolute inset-2 bg-blue-50/90 flex items-center justify-center z-10 border-2 border-dashed border-blue-400 rounded-xl">
          <div className="text-center">
            <div className="text-3xl mb-2">📥</div>
            <div className="text-blue-600 font-medium">松开鼠标上传文件</div>
          </div>
        </div>
      )}

      {/* 输入框卡片 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-visible">
        {/* 附件预览区 - 增加上边距让删除按钮和tooltip有空间 */}
        {attachments.length > 0 && (
          <div className="px-4 pt-5 pb-2 border-b border-gray-100 overflow-visible">
            <div className="flex gap-3 overflow-visible">
              {attachments.map(att => (
                <AttachmentCard 
                  key={att.id} 
                  attachment={att} 
                  onRemove={() => removeAttachment(att.id)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex items-end">
          {/* 输入区域 */}
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              onPaste={handlePaste}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className="w-full resize-none border-none px-4 py-3 focus:outline-none focus:ring-0 disabled:bg-transparent disabled:cursor-not-allowed text-gray-700 placeholder-gray-400 bg-transparent"
              style={{ minHeight: compact ? '48px' : '72px', maxHeight: '200px' }}
            />
          </div>

          {/* 工具栏 */}
          <div className="flex items-center gap-1 pr-3 pb-2">
            {/* 附件按钮 */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || attachments.length >= MAX_ATTACHMENTS}
              className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="上传附件"
            >
              <Paperclip size={18} />
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
            {isLoading ? (
              <button
                onClick={onStop}
                className="w-9 h-9 flex items-center justify-center bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                title="停止生成"
              >
                <Square size={14} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={disabled}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
                  canSend 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'bg-gray-300 text-white cursor-not-allowed'
                }`}
                title="发送"
              >
                <ArrowUp size={18} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 附件卡片组件（导出供其他组件使用）
interface AttachmentCardProps {
  attachment: Attachment;
  onRemove?: () => void;
  canRemove?: boolean;
}

export const AttachmentCard: React.FC<AttachmentCardProps> = ({ attachment, onRemove, canRemove = true }) => {
  const { type, name, size, status, progress, previewUrl, url } = attachment;
  const [showTooltip, setShowTooltip] = useState(false);
  
  const isUploading = status === 'uploading';
  const isError = status === 'error';
  const truncatedName = truncateFileName(name, 14);
  const needsTooltip = name !== truncatedName;
  
  // 显示的图片URL（优先使用url，其次previewUrl）
  const displayImageUrl = url || previewUrl;

  return (
    <div 
      className="relative group flex-shrink-0"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* 完整文件名 Tooltip - 显示在上方 */}
      {needsTooltip && showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap z-50 shadow-lg">
          {name}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
        </div>
      )}

      <div className={`flex items-center gap-3 px-3 py-2 bg-gray-50 border rounded-xl min-w-[160px] max-w-[200px] ${
        isError ? 'border-red-200 bg-red-50' : 'border-gray-200'
      }`}>
        {/* 图标 */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isError ? 'bg-red-100 text-red-500' : 
          type === 'image' && displayImageUrl ? '' : getFileIconBg(name)
        }`}>
          {isUploading ? (
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          ) : isError ? (
            <X size={20} />
          ) : type === 'image' && displayImageUrl ? (
            <img src={displayImageUrl} alt={name} className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <span className="text-sm font-semibold">{getFileIconText(name)}</span>
          )}
        </div>

        {/* 文件信息 */}
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium truncate ${isError ? 'text-red-600' : 'text-gray-700'}`}>
            {isError ? '上传失败' : truncatedName}
          </div>
          <div className="text-xs text-gray-400">
            {isUploading ? `${progress}%` : formatFileSize(size)}
          </div>
        </div>

        {/* 删除按钮 */}
        {canRemove && onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute -top-2 -right-2 w-5 h-5 bg-gray-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 shadow-sm"
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );
};
