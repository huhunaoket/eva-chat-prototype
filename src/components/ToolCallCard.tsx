/**
 * 工具调用卡片组件
 * 展示 Skill 和 Tool 的调用状态
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { getToolFriendlyName, getSkillFriendlyName } from '../types/api';

export interface ToolCallInfo {
  id: string;
  name: string;
  status: 'running' | 'done' | 'failed';
  skillKey?: string;
}

interface ToolCallCardProps {
  tool: ToolCallInfo;
}

export const ToolCallCard: React.FC<ToolCallCardProps> = ({ tool }) => {
  const getStatusIcon = () => {
    switch (tool.status) {
      case 'done':
        return <span className="text-green-500">✅</span>;
      case 'running':
        return <Loader2 size={14} className="animate-spin text-blue-500" />;
      case 'failed':
        return <span className="text-red-500">❌</span>;
      default:
        return null;
    }
  };

  const skillName = tool.skillKey ? getSkillFriendlyName(tool.skillKey) : null;
  const toolName = getToolFriendlyName(tool.name);

  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
      {skillName && (
        <>
          <span className="text-gray-700">{skillName}</span>
          <span className="text-gray-400">→</span>
        </>
      )}
      <span className="text-gray-600">{toolName}</span>
      {getStatusIcon()}
    </div>
  );
};

// 工具调用列表组件
interface ToolCallListProps {
  tools: ToolCallInfo[];
  expanded?: boolean;
  onToggle?: () => void;
}

export const ToolCallList: React.FC<ToolCallListProps> = ({
  tools,
  expanded = true,
  onToggle,
}) => {
  if (tools.length === 0) return null;

  const hasRunning = tools.some(t => t.status === 'running');
  const allDone = tools.every(t => t.status === 'done' || t.status === 'failed');

  return (
    <div className="border-b border-gray-100">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-600">
          执行明细 ({tools.length})
        </span>
        <span className="flex items-center gap-2">
          {hasRunning && <Loader2 size={14} className="animate-spin text-blue-500" />}
          {allDone && <span className="text-green-500">✅</span>}
          <span className="text-gray-400">{expanded ? '▼' : '▶'}</span>
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          {tools.map((tool) => (
            <ToolCallCard key={tool.id} tool={tool} />
          ))}
        </div>
      )}
    </div>
  );
};
