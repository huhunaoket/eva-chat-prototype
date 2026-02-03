/**
 * 模拟数据 - 用于模拟对话模式的静态展示
 */

import { ProcessItem, TurnDataV2 } from '../components/TurnMessageV2';
import { Scenario, MockMessageState, TaskProgress, Attachment, StopScenario } from '../types';

// 模拟附件数据
export const mockAttachments: Attachment[] = [
  {
    id: 'att_mock_001',
    type: 'image',
    name: '产品截图.png',
    size: 1024 * 512, // 512KB
    status: 'success',
    url: 'https://picsum.photos/200/200?random=1',
    previewUrl: 'https://picsum.photos/200/200?random=1',
  },
  {
    id: 'att_mock_002',
    type: 'document',
    name: '需求文档.pdf',
    size: 1024 * 1024 * 2.5, // 2.5MB
    status: 'success',
  },
];

// 场景 A 的模拟数据：直接回答
const scenarioAData = {
  processItems: [] as ProcessItem[],
  finalResult: `好的，我来帮你解答这个问题。

根据我的理解，这是一个关于产品功能的咨询。以下是详细说明：

1. **功能概述**：该功能支持多种操作模式
2. **使用方法**：可以通过界面或 API 调用
3. **注意事项**：请确保权限配置正确

如果还有其他问题，请随时告诉我。`,
};

// 场景 B 的模拟数据：工具调用（单个能力调用）
const scenarioBData = {
  processItems: [
    {
      type: 'tool_call' as const,
      toolName: 'task',
      status: 'done' as const,
      toolCallId: 'call_mock_001',
      input: {
        subagent_type: 'customer_service',
        description: '用户请求：查询产品使用指南相关信息。'
      }
    },
  ],
  finalResult: `根据知识库的查询结果，我找到了以下相关信息：

## 产品使用指南

### 1. 基础配置
首先需要在设置页面完成基础配置，包括：
- API 密钥设置
- 权限配置
- 通知偏好

### 2. 功能使用
配置完成后，可以开始使用以下功能：
- 智能问答
- 文档分析
- 数据报表

如需更多帮助，请查阅完整文档。`,
};

// 场景 C 的模拟数据：任务规划（无确认）- 单个能力调用
const scenarioCData = {
  processItems: [
    {
      type: 'tool_call' as const,
      toolName: 'task',
      status: 'done' as const,
      toolCallId: 'call_mock_002',
      input: {
        subagent_type: 'data_analysis',
        description: '用户请求：分析本月数据并生成报告。'
      }
    },
  ],
  todos: [
    { content: '收集相关数据', status: 'completed' },
    { content: '分析数据趋势', status: 'completed' },
    { content: '生成报告', status: 'completed' },
    { content: '发送通知', status: 'completed' },
  ],
  finalResult: `任务已完成！以下是执行结果：

## 数据分析报告

### 概要
- 数据收集：已完成
- 趋势分析：已完成
- 报告生成：已完成

### 关键发现
1. 本月数据较上月增长 15%
2. 主要增长来源于新用户
3. 建议继续优化用户体验

报告已保存，如需导出请告诉我。`,
};

// 场景 D 的模拟数据：任务规划（有确认）- 单轮多步骤执行
// 参考 chat-debug-2026-01-29T14-51-12-575Z.html
const scenarioDData = {
  processItems: [
    // Step 1: 创建任务列表
    {
      type: 'tool_call' as const,
      toolName: 'write_todos',
      status: 'done' as const,
      toolCallId: 'call_mock_d_001',
      input: {
        todos: [
          { content: '规划方案的整体步骤和结构', status: 'in_progress' },
          { content: '具体设计方案内容', status: 'pending' },
          { content: '撰写完整方案文档', status: 'pending' },
          { content: '复核并优化方案', status: 'pending' },
        ]
      }
    },
    // Step 1 说明文本
    {
      type: 'text' as const,
      content: '第一步，我将规划方案的整体步骤和结构。这一步是基础，明确整个方案的框架和内容布局。\n\n我现在开始进行这一步。'
    },
    // Step 1 执行
    {
      type: 'tool_call' as const,
      toolName: 'task',
      status: 'done' as const,
      toolCallId: 'call_mock_d_002',
      input: {
        subagent_type: 'customer_service',
        description: '请设计方案的整体步骤和结构，包括目标、范围、执行流程等。'
      }
    },
    // Step 2: 更新任务状态
    {
      type: 'tool_call' as const,
      toolName: 'write_todos',
      status: 'done' as const,
      toolCallId: 'call_mock_d_003',
      input: {
        todos: [
          { content: '规划方案的整体步骤和结构', status: 'completed' },
          { content: '具体设计方案内容', status: 'in_progress' },
          { content: '撰写完整方案文档', status: 'pending' },
          { content: '复核并优化方案', status: 'pending' },
        ]
      }
    },
    // Step 2 说明文本
    {
      type: 'text' as const,
      content: '我已经规划了方案的整体步骤和结构。\n\n接下来我将具体设计方案内容，需要调用专业能力来确保设计的合理性和完整性。'
    },
    // Step 2 执行
    {
      type: 'tool_call' as const,
      toolName: 'task',
      status: 'done' as const,
      toolCallId: 'call_mock_d_004',
      input: {
        subagent_type: 'customer_service',
        description: '请具体设计方案内容，包括详细的目标、用例设计、评估标准等。'
      }
    },
    // Step 3: 更新任务状态
    {
      type: 'tool_call' as const,
      toolName: 'write_todos',
      status: 'done' as const,
      toolCallId: 'call_mock_d_005',
      input: {
        todos: [
          { content: '规划方案的整体步骤和结构', status: 'completed' },
          { content: '具体设计方案内容', status: 'completed' },
          { content: '撰写完整方案文档', status: 'in_progress' },
          { content: '复核并优化方案', status: 'pending' },
        ]
      }
    },
    // Step 3 说明文本
    {
      type: 'text' as const,
      content: '我已经完成了方案的具体设计内容。\n\n接下来，我将撰写完整的方案文档，将之前的内容整合成一份连贯的文档。'
    },
    // Step 3 执行
    {
      type: 'tool_call' as const,
      toolName: 'task',
      status: 'done' as const,
      toolCallId: 'call_mock_d_006',
      input: {
        subagent_type: 'content_creator',
        description: '请将已规划的方案整体结构和具体设计内容整合，撰写成一份完整的方案文档。'
      }
    },
    // Step 4: 更新任务状态
    {
      type: 'tool_call' as const,
      toolName: 'write_todos',
      status: 'done' as const,
      toolCallId: 'call_mock_d_007',
      input: {
        todos: [
          { content: '规划方案的整体步骤和结构', status: 'completed' },
          { content: '具体设计方案内容', status: 'completed' },
          { content: '撰写完整方案文档', status: 'completed' },
          { content: '复核并优化方案', status: 'completed' },
        ]
      }
    },
  ],
  finalResult: `方案设计工作已完成，具体包括：

1. 方案整体步骤和结构规划，明确了目标、能力维度、验证方法及执行流程。
2. 具体设计了测试目标、测试用例示例、评估标准和测试环境需求。
3. 撰写了完整的方案文档，内容条理清晰、专业简洁，适合项目团队参考执行。
4. 对方案进行了复核和优化，确认方案完整、逻辑合理且实用。

如果您需要，我可以将方案文档内容提供给您，或根据复核建议进一步细化某些部分。`,
};

// 场景 D 的用户消息
export const scenarioDUserMessage = '我要写一个验证agent能力的方案，请你一步一步的完成';
export const scenarioDUserConfirmMessage = '好的，继续';

// 场景 D 多轮对话的用户消息列表
export const scenarioDUserMessages = [scenarioDUserMessage, scenarioDUserConfirmMessage];

// 场景 D 第一轮回复数据（规划阶段）
const scenarioDTurn1Data = {
  processItems: [
    // 创建任务列表
    {
      type: 'tool_call' as const,
      toolName: 'write_todos',
      status: 'done' as const,
      toolCallId: 'call_mock_d_001',
      input: {
        todos: [
          { content: '规划方案的整体步骤和结构', status: 'in_progress' },
          { content: '具体设计方案内容', status: 'pending' },
          { content: '撰写完整方案文档', status: 'pending' },
          { content: '复核并优化方案', status: 'pending' },
        ]
      }
    },
    // 说明文本
    {
      type: 'text' as const,
      content: '我将分步骤帮您完成这个方案。首先，让我规划一下整体的步骤和结构。'
    },
    // 执行规划
    {
      type: 'tool_call' as const,
      toolName: 'task',
      status: 'done' as const,
      toolCallId: 'call_mock_d_002',
      input: {
        subagent_type: 'customer_service',
        description: '请设计方案的整体步骤和结构，包括目标、范围、执行流程等。'
      }
    },
  ],
  finalResult: `我已经完成了方案的整体规划，主要包括以下几个部分：

1. **目标定义**：明确验证 Agent 能力的具体目标
2. **能力维度**：确定需要验证的能力范围
3. **验证方法**：设计具体的测试方案
4. **执行流程**：规划实施步骤

接下来我将进行详细设计，请确认是否继续？`,
};

// 场景 D 第二轮回复数据（执行阶段）
const scenarioDTurn2Data = {
  processItems: [
    // 更新任务状态
    {
      type: 'tool_call' as const,
      toolName: 'write_todos',
      status: 'done' as const,
      toolCallId: 'call_mock_d_003',
      input: {
        todos: [
          { content: '规划方案的整体步骤和结构', status: 'completed' },
          { content: '具体设计方案内容', status: 'in_progress' },
          { content: '撰写完整方案文档', status: 'pending' },
          { content: '复核并优化方案', status: 'pending' },
        ]
      }
    },
    // 说明文本
    {
      type: 'text' as const,
      content: '好的，我现在开始进行详细设计。'
    },
    // 执行详细设计
    {
      type: 'tool_call' as const,
      toolName: 'task',
      status: 'done' as const,
      toolCallId: 'call_mock_d_004',
      input: {
        subagent_type: 'customer_service',
        description: '请具体设计方案内容，包括详细的目标、用例设计、评估标准等。'
      }
    },
    // 更新任务状态
    {
      type: 'tool_call' as const,
      toolName: 'write_todos',
      status: 'done' as const,
      toolCallId: 'call_mock_d_005',
      input: {
        todos: [
          { content: '规划方案的整体步骤和结构', status: 'completed' },
          { content: '具体设计方案内容', status: 'completed' },
          { content: '撰写完整方案文档', status: 'in_progress' },
          { content: '复核并优化方案', status: 'pending' },
        ]
      }
    },
    // 撰写文档
    {
      type: 'tool_call' as const,
      toolName: 'task',
      status: 'done' as const,
      toolCallId: 'call_mock_d_006',
      input: {
        subagent_type: 'content_creator',
        description: '请将已规划的方案整体结构和具体设计内容整合，撰写成一份完整的方案文档。'
      }
    },
    // 最终更新任务状态
    {
      type: 'tool_call' as const,
      toolName: 'write_todos',
      status: 'done' as const,
      toolCallId: 'call_mock_d_007',
      input: {
        todos: [
          { content: '规划方案的整体步骤和结构', status: 'completed' },
          { content: '具体设计方案内容', status: 'completed' },
          { content: '撰写完整方案文档', status: 'completed' },
          { content: '复核并优化方案', status: 'completed' },
        ]
      }
    },
  ],
  finalResult: `方案设计工作已完成，具体包括：

1. 方案整体步骤和结构规划，明确了目标、能力维度、验证方法及执行流程。
2. 具体设计了测试目标、测试用例示例、评估标准和测试环境需求。
3. 撰写了完整的方案文档，内容条理清晰、专业简洁，适合项目团队参考执行。
4. 对方案进行了复核和优化，确认方案完整、逻辑合理且实用。

如果您需要，我可以将方案文档内容提供给您，或根据复核建议进一步细化某些部分。`,
};

// 保留旧的导出以兼容
export const scenarioDMultiTurn = {
  turns: [scenarioDTurn1Data, scenarioDTurn2Data],
  userMessages: scenarioDUserMessages,
};

// 获取场景 D 的多轮对话数据
export function getScenarioDMultiTurnData(
  messageState: MockMessageState,
  stopScenario?: StopScenario
): { userMessages: string[]; turns: TurnDataV2[] } {

  switch (messageState) {
    case 'thinking':
      // 思考中：第一轮，纯 loading 状态
      return {
        userMessages: [scenarioDUserMessage],
        turns: [{
          turnId: 'mock-turn-D-thinking',
          status: 'pending',
          displayMode: 'loading',
          processItems: [],
          pendingText: '',
          finalResult: '',
          hasToolCall: false,
          isResultConfirmed: false,
          processedToolCallIds: new Set(),
        }],
      };

    case 'executing':
      // 执行中：第一轮完成 + 用户确认 + 第二轮正在执行
      return {
        userMessages: [scenarioDUserMessage, scenarioDUserConfirmMessage],
        turns: [
          // 第一轮：已完成
          {
            turnId: 'mock-turn-D-1',
            status: 'complete',
            displayMode: 'result',
            processItems: scenarioDTurn1Data.processItems,
            pendingText: '',
            finalResult: scenarioDTurn1Data.finalResult,
            hasToolCall: true,
            isResultConfirmed: true,
            processedToolCallIds: new Set(scenarioDTurn1Data.processItems.filter(p => p.toolCallId).map(p => p.toolCallId!)),
          },
          // 第二轮：正在执行
          {
            turnId: 'mock-turn-D-2',
            status: 'streaming',
            displayMode: 'process',
            processItems: scenarioDTurn2Data.processItems.slice(0, 3).map((item, idx, arr) => ({
              ...item,
              status: idx === arr.length - 1 && item.type === 'tool_call' ? 'running' as const : item.status,
            })),
            pendingText: '',
            finalResult: '',
            hasToolCall: true,
            isResultConfirmed: false,
            processedToolCallIds: new Set(),
          },
        ],
      };

    case 'streaming':
      // 流式输出：两轮都完成，第二轮正在输出结果
      return {
        userMessages: [scenarioDUserMessage, scenarioDUserConfirmMessage],
        turns: [
          // 第一轮：已完成
          {
            turnId: 'mock-turn-D-1',
            status: 'complete',
            displayMode: 'result',
            processItems: scenarioDTurn1Data.processItems,
            pendingText: '',
            finalResult: scenarioDTurn1Data.finalResult,
            hasToolCall: true,
            isResultConfirmed: true,
            processedToolCallIds: new Set(scenarioDTurn1Data.processItems.filter(p => p.toolCallId).map(p => p.toolCallId!)),
          },
          // 第二轮：流式输出中
          {
            turnId: 'mock-turn-D-2',
            status: 'streaming',
            displayMode: 'streaming',
            processItems: scenarioDTurn2Data.processItems,
            pendingText: scenarioDTurn2Data.finalResult.slice(0, Math.floor(scenarioDTurn2Data.finalResult.length * 0.6)),
            finalResult: '',
            hasToolCall: true,
            isResultConfirmed: false,
            processedToolCallIds: new Set(scenarioDTurn2Data.processItems.filter(p => p.toolCallId).map(p => p.toolCallId!)),
          },
        ],
      };

    case 'complete':
      // 完成：两轮都完成
      return {
        userMessages: [scenarioDUserMessage, scenarioDUserConfirmMessage],
        turns: [
          // 第一轮：已完成
          {
            turnId: 'mock-turn-D-1',
            status: 'complete',
            displayMode: 'result',
            processItems: scenarioDTurn1Data.processItems,
            pendingText: '',
            finalResult: scenarioDTurn1Data.finalResult,
            hasToolCall: true,
            isResultConfirmed: true,
            processedToolCallIds: new Set(scenarioDTurn1Data.processItems.filter(p => p.toolCallId).map(p => p.toolCallId!)),
          },
          // 第二轮：已完成
          {
            turnId: 'mock-turn-D-2',
            status: 'complete',
            displayMode: 'result',
            processItems: scenarioDTurn2Data.processItems,
            pendingText: '',
            finalResult: scenarioDTurn2Data.finalResult,
            hasToolCall: true,
            isResultConfirmed: true,
            processedToolCallIds: new Set(scenarioDTurn2Data.processItems.filter(p => p.toolCallId).map(p => p.toolCallId!)),
          },
        ],
      };

    case 'stopped':
      // 已停止：根据 stopScenario 决定停止时的状态
      return getScenarioDStoppedData(stopScenario || 'executing');

    case 'failed':
      // 失败：第一轮完成，第二轮失败（工具执行中）
      return {
        userMessages: [scenarioDUserMessage, scenarioDUserConfirmMessage],
        turns: [
          {
            turnId: 'mock-turn-D-1',
            status: 'complete',
            displayMode: 'result',
            processItems: scenarioDTurn1Data.processItems,
            pendingText: '',
            finalResult: scenarioDTurn1Data.finalResult,
            hasToolCall: true,
            isResultConfirmed: true,
            processedToolCallIds: new Set(scenarioDTurn1Data.processItems.filter(p => p.toolCallId).map(p => p.toolCallId!)),
          },
          {
            turnId: 'mock-turn-D-2',
            status: 'failed',
            displayMode: 'process',
            // 保留部分执行过程，最后一个工具设为 running
            processItems: scenarioDTurn2Data.processItems.slice(0, 2).map((item, idx, arr) => ({
              ...item,
              status: idx === arr.length - 1 && item.type === 'tool_call' ? 'running' as const : item.status,
            })),
            pendingText: '',
            finalResult: '',
            hasToolCall: true,
            isResultConfirmed: false,
            processedToolCallIds: new Set(),
          },
        ],
      };

    default:
      // 默认返回完成状态
      return {
        userMessages: [scenarioDUserMessage, scenarioDUserConfirmMessage],
        turns: [
          {
            turnId: 'mock-turn-D-1',
            status: 'complete',
            displayMode: 'result',
            processItems: scenarioDTurn1Data.processItems,
            pendingText: '',
            finalResult: scenarioDTurn1Data.finalResult,
            hasToolCall: true,
            isResultConfirmed: true,
            processedToolCallIds: new Set(scenarioDTurn1Data.processItems.filter(p => p.toolCallId).map(p => p.toolCallId!)),
          },
          {
            turnId: 'mock-turn-D-2',
            status: 'complete',
            displayMode: 'result',
            processItems: scenarioDTurn2Data.processItems,
            pendingText: '',
            finalResult: scenarioDTurn2Data.finalResult,
            hasToolCall: true,
            isResultConfirmed: true,
            processedToolCallIds: new Set(scenarioDTurn2Data.processItems.filter(p => p.toolCallId).map(p => p.toolCallId!)),
          },
        ],
      };
  }
}

// 获取场景 D 停止状态的数据（根据停止场景）
function getScenarioDStoppedData(stopScenario: StopScenario): { userMessages: string[]; turns: TurnDataV2[] } {
  switch (stopScenario) {
    case 'thinking':
      // 思考中停止：无任何内容
      return {
        userMessages: [scenarioDUserMessage],
        turns: [{
          turnId: 'mock-turn-D-stopped-thinking',
          status: 'canceled',
          displayMode: 'loading',
          processItems: [],
          pendingText: '',
          finalResult: '',
          hasToolCall: false,
          isResultConfirmed: false,
          processedToolCallIds: new Set(),
        }],
      };

    case 'executing':
      // 执行过程停止：有部分工具执行，最后一个工具被中断
      return {
        userMessages: [scenarioDUserMessage, scenarioDUserConfirmMessage],
        turns: [
          {
            turnId: 'mock-turn-D-1',
            status: 'complete',
            displayMode: 'result',
            processItems: scenarioDTurn1Data.processItems,
            pendingText: '',
            finalResult: scenarioDTurn1Data.finalResult,
            hasToolCall: true,
            isResultConfirmed: true,
            processedToolCallIds: new Set(scenarioDTurn1Data.processItems.filter(p => p.toolCallId).map(p => p.toolCallId!)),
          },
          {
            turnId: 'mock-turn-D-2',
            status: 'canceled',
            displayMode: 'process',
            // 保留部分执行过程，最后一个工具设为 running（会被组件转为 interrupted）
            processItems: scenarioDTurn2Data.processItems.slice(0, 3).map((item, idx, arr) => ({
              ...item,
              status: idx === arr.length - 1 && item.type === 'tool_call' ? 'running' as const : item.status,
            })),
            pendingText: '',
            finalResult: '',
            hasToolCall: true,
            isResultConfirmed: false,
            processedToolCallIds: new Set(),
          },
        ],
      };

    case 'streaming':
      // 输出时停止：工具都已完成，有部分文本输出
      return {
        userMessages: [scenarioDUserMessage, scenarioDUserConfirmMessage],
        turns: [
          {
            turnId: 'mock-turn-D-1',
            status: 'complete',
            displayMode: 'result',
            processItems: scenarioDTurn1Data.processItems,
            pendingText: '',
            finalResult: scenarioDTurn1Data.finalResult,
            hasToolCall: true,
            isResultConfirmed: true,
            processedToolCallIds: new Set(scenarioDTurn1Data.processItems.filter(p => p.toolCallId).map(p => p.toolCallId!)),
          },
          {
            turnId: 'mock-turn-D-2',
            status: 'canceled',
            displayMode: 'result',
            // 所有工具都已完成（status 为 done）
            processItems: scenarioDTurn2Data.processItems.map(item => ({
              ...item,
              status: item.type === 'tool_call' ? 'done' as const : item.status,
            })),
            // 有部分文本输出
            pendingText: scenarioDTurn2Data.finalResult.slice(0, Math.floor(scenarioDTurn2Data.finalResult.length * 0.4)),
            finalResult: '',
            hasToolCall: true,
            isResultConfirmed: false,
            processedToolCallIds: new Set(scenarioDTurn2Data.processItems.filter(p => p.toolCallId).map(p => p.toolCallId!)),
          },
        ],
      };

    default:
      return getScenarioDStoppedData('executing');
  }
}

// 根据场景和状态生成模拟 Turn 数据
export function getMockTurnData(
  scenario: Scenario,
  messageState: MockMessageState,
  taskProgress?: TaskProgress,
  stopScenario?: StopScenario
): TurnDataV2 {
  const scenarioData = {
    A: scenarioAData,
    B: scenarioBData,
    C: scenarioCData,
    D: scenarioDData,
  }[scenario];

  // 根据消息状态决定显示内容
  let status: TurnDataV2['status'];
  let displayMode: TurnDataV2['displayMode'];
  let processItems: ProcessItem[] = [];
  let pendingText = '';
  let finalResult = '';

  switch (messageState) {
    case 'thinking':
      status = 'pending';
      displayMode = 'loading';
      break;

    case 'executing':
      status = 'streaming';
      displayMode = 'process';
      // 根据任务进度显示不同数量的 processItems
      if (scenario === 'C' || scenario === 'D') {
        const progressIndex = taskProgress ? parseInt(taskProgress.replace('task', '')) : 1;
        processItems = scenarioData.processItems.slice(0, progressIndex);
        // 最后一个设为 running
        if (processItems.length > 0) {
          processItems = processItems.map((item, idx) => ({
            ...item,
            status: idx === processItems.length - 1 ? 'running' as const : 'done' as const,
          }));
        }
      } else {
        processItems = scenarioData.processItems.map((item, idx) => ({
          ...item,
          status: idx === scenarioData.processItems.length - 1 ? 'running' as const : 'done' as const,
        }));
      }
      break;

    case 'streaming':
      status = 'streaming';
      displayMode = 'streaming';
      processItems = scenarioData.processItems;
      // 模拟流式输出：显示部分文本
      pendingText = scenarioData.finalResult.slice(0, Math.floor(scenarioData.finalResult.length * 0.6));
      break;

    case 'complete':
      status = 'complete';
      displayMode = 'result';
      processItems = scenarioData.processItems;
      finalResult = scenarioData.finalResult;
      break;

    case 'stopped':
      status = 'canceled';
      // 根据 stopScenario 决定停止时的状态
      switch (stopScenario) {
        case 'thinking':
          // 思考中停止：无任何内容
          displayMode = 'loading';
          processItems = [];
          pendingText = '';
          break;
        case 'streaming':
          // 输出时停止：工具都已完成，有部分文本输出
          displayMode = 'result';
          processItems = scenarioData.processItems.map(item => ({
            ...item,
            status: item.type === 'tool_call' ? 'done' as const : item.status,
          }));
          pendingText = scenarioData.finalResult.slice(0, Math.floor(scenarioData.finalResult.length * 0.4));
          break;
        case 'executing':
        default:
          // 执行过程停止：有部分工具执行，最后一个工具被中断
          displayMode = 'result';
          processItems = scenarioData.processItems.slice(0, Math.ceil(scenarioData.processItems.length / 2)).map((item, idx, arr) => ({
            ...item,
            status: idx === arr.length - 1 && item.type === 'tool_call' ? 'running' as const : item.status,
          }));
          pendingText = '';
          break;
      }
      break;

    case 'failed':
      status = 'failed';
      displayMode = 'result';
      // 保留已执行的内容，最后一个工具设为 running（会被组件转为 interrupted）
      processItems = scenarioData.processItems.slice(0, 1).map((item, idx, arr) => ({
        ...item,
        status: idx === arr.length - 1 && item.type === 'tool_call' ? 'running' as const : item.status,
      }));
      break;

    default:
      status = 'complete';
      displayMode = 'result';
      finalResult = scenarioData.finalResult;
  }

  return {
    turnId: `mock-turn-${scenario}-${messageState}`,
    status,
    displayMode,
    processItems,
    pendingText,
    finalResult,
    // 根据当前实际显示的 processItems 判断是否有工具调用
    hasToolCall: processItems.some(p => p.type === 'tool_call'),
    isResultConfirmed: messageState === 'complete',
    processedToolCallIds: new Set(processItems.filter(p => p.toolCallId).map(p => p.toolCallId!)),
  };
}

// 获取模拟的 Todo 列表
export function getMockTodos(
  scenario: Scenario,
  messageState: MockMessageState,
  taskProgress?: TaskProgress
): Array<{ content: string; status: string; activeForm?: string }> {
  if (scenario !== 'C' && scenario !== 'D') {
    return [];
  }

  const allTodos = [
    { content: '收集相关数据', activeForm: '收集相关数据中' },
    { content: '分析数据趋势', activeForm: '分析数据趋势中' },
    { content: '生成报告', activeForm: '生成报告中' },
    { content: '发送通知', activeForm: '发送通知中' },
  ];

  if (messageState === 'complete') {
    return allTodos.map(t => ({ ...t, status: 'completed' }));
  }

  if (messageState === 'stopped' || messageState === 'failed') {
    return allTodos.slice(0, 2).map((t, idx) => ({
      ...t,
      status: idx === 0 ? 'completed' : 'pending',
    }));
  }

  if (messageState === 'executing' && taskProgress) {
    const progressIndex = parseInt(taskProgress.replace('task', ''));
    return allTodos.map((t, idx) => ({
      ...t,
      status: idx < progressIndex - 1 ? 'completed' : idx === progressIndex - 1 ? 'in_progress' : 'pending',
    }));
  }

  return allTodos.map(t => ({ ...t, status: 'pending' }));
}
