import { useState } from 'react';
import { Shield, AlertTriangle, Edit2, MessageSquare, RotateCcw } from 'lucide-react';
import { Modal } from './Modal';

export const SecurityCenter = () => {
  // Business Rules State
  const [isBusinessRulesEnabled, setIsBusinessRulesEnabled] = useState(true);
  const [businessRules, setBusinessRules] = useState(
    "严禁向用户承诺任何具体的投资回报率或收益数字。\n禁止以任何形式贬低、抹黑竞争对手（如：某竞品）。\n涉及退款、赔偿等敏感资金问题，请引导用户联系人工客服。"
  );
  
  // Modal states for Business Rules
  const [isRedlinesModalOpen, setIsRedlinesModalOpen] = useState(false);
  const [tempRedlines, setTempRedlines] = useState("");

  // Rejection Response State
  const defaultRejection = "抱歉，我无法回答这个问题。您可以尝试询问其他与产品相关的问题，或联系人工客服获取帮助。";
  const [rejectionText, setRejectionText] = useState(defaultRejection);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [tempRejection, setTempRejection] = useState("");

  // Guardrails State
  const [guardrails, setGuardrails] = useState([
    {
      id: 'compliance',
      title: '内容合规检测',
      description: '检测并拦截智能体回答时可能会出现的政治敏感、暴力色情等违规信息。',
      enabled: true
    },
    {
      id: 'privacy',
      title: '敏感隐私保护',
      description: '检测智能体回答时可能会出现的个人/企业敏感信息，避免数据泄露。检测出的敏感信息将自动脱敏。',
      enabled: true
    },
    {
      id: 'attack-defense',
      title: '提示词攻击防御',
      description: '检测并拦截针对大模型设计的提示词操控，避免模型输出恶意内容或威胁系统安全。',
      enabled: false
    }
  ]);

  const toggleGuardrail = (id: string) => {
    setGuardrails(prev => prev.map(g => 
      g.id === id ? { ...g, enabled: !g.enabled } : g
    ));
  };

  // Handlers for Redlines
  const handleOpenRedlinesModal = () => {
    setTempRedlines(businessRules);
    setIsRedlinesModalOpen(true);
  };

  const handleSaveRedlines = () => {
    setBusinessRules(tempRedlines);
    setIsRedlinesModalOpen(false);
  };

  // Handlers for Rejection
  const handleOpenRejectionModal = () => {
    setTempRejection(rejectionText);
    setIsRejectionModalOpen(true);
  };

  const handleSaveRejection = () => {
    setRejectionText(tempRejection);
    setIsRejectionModalOpen(false);
  };

  const handleRestoreDefaultRejection = () => {
    setTempRejection(defaultRejection);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">安全中心</h1>
        <p className="text-gray-500">
          配置 AI Agent 的安全边界和合规性规则，确保交互安全可控。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* 1. Business Redlines Card (Top Left) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          {/* Card Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">业务红线与禁忌</h3>
            </div>
          </div>
          
          {/* Card Body */}
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">回答禁忌限制</h4>
              <button 
                onClick={() => setIsBusinessRulesEnabled(!isBusinessRulesEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  isBusinessRulesEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`${
                    isBusinessRulesEnabled ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </button>
            </div>
            
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              配置智能体在对话中必须遵守的业务纪律。系统将把这些规则作为最高优先级指令要求智能体，以干预智能体的回答内容。
            </p>
            
            <div className={`relative bg-gray-50 border border-gray-200 rounded-lg p-4 flex-1 min-h-[160px] transition-opacity duration-200 ${isBusinessRulesEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <pre className="font-sans text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mb-6">
                {businessRules}
              </pre>
              <div className="absolute bottom-3 right-3">
                <button 
                  onClick={handleOpenRedlinesModal}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1 transition-colors"
                >
                  <Edit2 className="w-3 h-3" /> 编辑
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Smart Security Guardrails Card (Top Right) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex items-start gap-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">智能安全护栏</h3>
              <p className="text-sm text-gray-500 mt-1">
                启用预置的安全检测模型，实时过滤潜在风险内容。
              </p>
            </div>
          </div>
          <div className="divide-y divide-gray-100 flex-1">
            {guardrails.map((item) => (
              <div key={item.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="pr-8 max-w-xl">
                  <div className="font-medium text-gray-900 mb-1">{item.title}</div>
                  <div className="text-sm text-gray-500 leading-relaxed">{item.description}</div>
                </div>
                <button
                  onClick={() => toggleGuardrail(item.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    item.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`${
                      item.enabled ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Unified Rejection Response (Bottom Full Width) */}
        <div className="col-span-1 lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-gray-100 text-gray-600 rounded-lg shrink-0">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">统一拒答话术</h3>
            </div>
            
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              当智能体遇到无法回答的问题或者用户的提问或智能体输出命中内容合规检测、提示词攻击安全护栏时，智能体将回复此文案。
            </p>

            <div className="relative bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-700 leading-relaxed mb-6">
                {rejectionText}
              </div>
              <div className="absolute bottom-3 right-3">
                <button 
                  onClick={handleOpenRejectionModal}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1 transition-colors"
                >
                  <Edit2 className="w-3 h-3" /> 编辑
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Redlines Edit Modal */}
      <Modal
        title="编辑业务红线与禁忌"
        isOpen={isRedlinesModalOpen}
        onClose={() => setIsRedlinesModalOpen(false)}
        width="600px"
        footer={
          <>
            <button 
              onClick={() => setIsRedlinesModalOpen(false)}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
            >
              取消
            </button>
            <button 
              onClick={handleSaveRedlines}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors shadow-sm"
            >
              保存更改
            </button>
          </>
        }
      >
        <div className="space-y-2">
          <div className="bg-amber-50 text-amber-800 text-xs px-3 py-2 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
            <span>请确保规则清晰明确，避免歧义。每行一条规则效果最佳。</span>
          </div>
          <textarea
            value={tempRedlines}
            onChange={(e) => setTempRedlines(e.target.value)}
            maxLength={200}
            className="w-full h-48 p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-sm leading-relaxed resize-none bg-white"
            placeholder="在此输入业务红线规则..."
          />
          <div className="flex justify-end">
            <span className={`text-xs ${tempRedlines.length >= 200 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
              {tempRedlines.length}/200
            </span>
          </div>
        </div>
      </Modal>

      {/* Rejection Response Edit Modal */}
      <Modal
        title="编辑统一拒答话术"
        isOpen={isRejectionModalOpen}
        onClose={() => setIsRejectionModalOpen(false)}
        width="600px"
        footer={
          <>
            <button 
              onClick={() => setIsRejectionModalOpen(false)}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
            >
              取消
            </button>
            <button 
              onClick={handleSaveRejection}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors shadow-sm"
            >
              保存更改
            </button>
          </>
        }
      >
        <div className="space-y-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">话术内容</span>
            <button 
              onClick={handleRestoreDefaultRejection}
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline"
            >
              <RotateCcw className="w-3 h-3" /> 恢复默认
            </button>
          </div>
          <textarea
            value={tempRejection}
            onChange={(e) => setTempRejection(e.target.value)}
            maxLength={200}
            className="w-full h-32 p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm leading-relaxed resize-none bg-white"
            placeholder="在此输入拒答话术..."
          />
          <div className="flex justify-end">
            <span className={`text-xs ${tempRejection.length >= 200 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
              {tempRejection.length}/200
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
};
