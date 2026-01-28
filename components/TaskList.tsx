/**
 * TaskList - 任务列表组件
 * 对齐 PRD v3 3.3.3.4 任务列表
 *
 * 位置：输入框上方，独立区域（会话级别）
 * 功能：展示任务进度，支持展开/收起
 */

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, ClipboardList, Loader2, Check, Clock } from 'lucide-react';
import { PageStateConfig, TaskItem, TaskStatus } from '../types';

interface TaskListProps {
  stateConfig: PageStateConfig;
  isPlayground: boolean;
}

// Mock 任务数据
const MOCK_TASKS: TaskItem[] = [
  { id: '1', content: '收集需求信息', status: 'pending' },
  { id: '2', content: '分析竞品数据', status: 'pending' },
  { id: '3', content: '整理分析报告', status: 'pending' },
  { id: '4', content: '输出最终方案', status: 'pending' },
];

// 根据状态配置计算任务列表
const getTasksForState = (stateConfig: PageStateConfig): TaskItem[] => {
  const { scenario, messageState, taskProgress } = stateConfig;

  // 只有场景C和D才显示任务列表
  if (scenario !== 'C' && scenario !== 'D') {
    return [];
  }

  // 思考中状态：不显示任务列表
  if (messageState === 'thinking') {
    return [];
  }

  // 获取当前任务编号
  const getCurrentTaskNum = (): number => {
    if (taskProgress) {
      return parseInt(taskProgress.replace('task', ''));
    }
    return 4; // 默认完成状态
  };

  const taskNum = getCurrentTaskNum();

  return MOCK_TASKS.map((task, index) => {
    const taskIndex = index + 1;
    let status: TaskStatus = 'pending';

    if (messageState === 'stopped') {
      // 停止状态：已完成的保持完成，进行中的回退为待执行
      if (taskIndex < taskNum) {
        status = 'completed';
      } else {
        status = 'pending';
      }
    } else if (messageState === 'failed') {
      // 失败状态：保持当前状态
      if (taskIndex < taskNum) {
        status = 'completed';
      } else if (taskIndex === taskNum) {
        status = 'in_progress';
      } else {
        status = 'pending';
      }
    } else if (messageState === 'complete') {
      // 完成状态：全部完成
      status = 'completed';
    } else if (messageState === 'streaming') {
      // 流式输出：前3个完成，第4个进行中
      if (taskIndex <= 3) {
        status = 'completed';
      } else if (taskIndex === 4) {
        status = 'in_progress';
      }
    } else if (messageState === 'executing') {
      // 执行中：根据 taskProgress 判断
      if (taskIndex < taskNum) {
        status = 'completed';
      } else if (taskIndex === taskNum) {
        status = 'in_progress';
      } else {
        status = 'pending';
      }
    }

    return { ...task, status };
  });
};

// 任务状态图标
const TaskStatusIcon: React.FC<{ status: TaskStatus }> = ({ status }) => {
  switch (status) {
    case 'completed':
      return <span className="text-success-500">✅</span>;
    case 'in_progress':
      return <Loader2 size={16} className="animate-spin text-primary-500" />;
    case 'pending':
      return <span className="text-slate-300">⏳</span>;
  }
};

export const TaskList: React.FC<TaskListProps> = ({
  stateConfig,
  isPlayground,
}) => {
  const { scenario, messageState } = stateConfig;

  // 计算任务列表
  const tasks = getTasksForState(stateConfig);

  // 是否显示
  const visible = tasks.length > 0;

  // 自动展开/收起逻辑
  const [expanded, setExpanded] = useState(true);

  // 完成状态自动收起
  useEffect(() => {
    if (messageState === 'complete') {
      const timer = setTimeout(() => {
        setExpanded(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (messageState === 'executing' || messageState === 'streaming') {
      setExpanded(true);
    }
  }, [messageState]);

  if (!visible || !isPlayground) {
    return null;
  }

  // 计算进度
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const totalCount = tasks.length;

  // 获取当前执行中的任务名称
  const getCurrentTaskName = (): string => {
    const inProgressTask = tasks.find(t => t.status === 'in_progress');
    if (inProgressTask) {
      // 截断规则：超过15个汉字显示...
      const content = inProgressTask.content;
      return content.length > 15 ? content.substring(0, 15) + '...' : content;
    }
    return '';
  };

  // 获取左侧标题（状态 + 文案）
  // 展开时只显示"正在执行"，收起时显示"正在执行：{任务名}"
  const getLeftTitle = (isExpanded: boolean) => {
    if (messageState === 'complete') {
      return '✅ 所有任务已完成';
    }
    if (messageState === 'stopped') {
      return '🛑 任务已停止';
    }
    if (messageState === 'failed') {
      return '❌ 任务执行失败';
    }
    // 进行中状态：展开时只显示"正在执行"，收起时显示任务名
    if (isExpanded) {
      return '🔄 正在执行';
    }
    const taskName = getCurrentTaskName();
    return `🔄 正在执行：${taskName}`;
  };

  // 获取右侧进度信息
  const getRightInfo = () => {
    return `(${completedCount}/${totalCount})`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-eva-sm shadow-sm overflow-hidden">
      {/* 标题栏 - 左右分栏布局 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        {/* 左侧：状态与标题 */}
        <span className="text-sm font-medium text-slate-700">{getLeftTitle(expanded)}</span>
        {/* 右侧：进度与操作 */}
        <div className="flex items-center gap-2 text-slate-500">
          <span className="text-sm">{getRightInfo()}</span>
          {expanded ? (
            <ChevronUp size={16} className="text-slate-400" />
          ) : (
            <ChevronDown size={16} className="text-slate-400" />
          )}
        </div>
      </button>

      {/* 任务列表 */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-2">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3 py-2">
              <TaskStatusIcon status={task.status} />
              <span
                className={`text-sm ${
                  task.status === 'pending'
                    ? 'text-slate-400'
                    : task.status === 'in_progress'
                    ? 'text-slate-700 font-medium'
                    : 'text-slate-600'
                }`}
              >
                {task.content}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
