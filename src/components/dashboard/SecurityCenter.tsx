import { useState } from 'react';
import { Shield, AlertTriangle, Edit2, MessageSquare, RotateCcw } from 'lucide-react';

export const SecurityCenter = () => {
  // Business Rules State
  const [isBusinessRulesEnabled, setIsBusinessRulesEnabled] = useState(false);
  const [businessRules, setBusinessRules] = useState('');
  
  // 编辑态状态
  const [isEditingRedlines, setIsEditingRedlines] = useState(false);
  const [tempRedlines, setTempRedlines] = useState("");

  // Rejection Response State
  const defaultRejection = "抱歉，我无法回答这个问题。您可以尝试询问其他与产品相关的问题，或联系人工客服获取帮助。";
  const [rejectionText, setRejectionText] = useState(defaultRejection);
  const [isEditingRejection, setIsEditingRejection] = useState(false);
  const [tempRejection, setTempRejection] = useState("");

  // Guardrails State
  const [guardrails, setGuardrails] = useState([
    {
      id: 'compliance',
      title: '内容合规检测',
      description: '检测并拦截智能体回答时可能会出现的政治敏感、暴力色情等违规信息',
      enabled: true
    },
    {
      id: 'privacy',
      title: '敏感隐私保护',
      description: '检测智能体回答时可能会出现的个人/企业敏感信息，避免数据泄露。检测出的敏感信息将自动脱敏',
      enabled: true
    },
    {
      id: 'attack-defense',
      title: '提示词攻击防御',
      description: '检测并拦截针对大模型设计的提示词操控，避免模型输出恶意内容或威胁系统安全',
      enabled: false
    }
  ]);

  const toggleGuardrail = (id: string) => {
    setGuardrails(prev => prev.map(g => 
      g.id === id ? { ...g, enabled: !g.enabled } : g
    ));
  };

  // Handlers for Redlines - 原地编辑
  const handleStartEditRedlines = () => {
    setTempRedlines(businessRules);
    setIsEditingRedlines(true);
  };

  const handleSaveRedlines = () => {
    setBusinessRules(tempRedlines);
    setIsEditingRedlines(false);
  };

  const handleCancelRedlines = () => {
    setTempRedlines("");
    setIsEditingRedlines(false);
  };

  // Handlers for Rejection - 原地编辑
  const handleStartEditRejection = () => {
    setTempRejection(rejectionText);
    setIsEditingRejection(true);
  };

  const handleSaveRejection = () => {
    setRejectionText(tempRejection);
    setIsEditingRejection(false);
  };

  const handleCancelRejection = () => {
    setTempRejection("");
    setIsEditingRejection(false);
  };

  const handleRestoreDefaultRejection = () => {
    setTempRejection(defaultRejection);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">安全中心</h1>
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
                onClick={() => {
                  const newEnabled = !isBusinessRulesEnabled;
                  setIsBusinessRulesEnabled(newEnabled);
                  if (newEnabled && !businessRules) {
                    setTempRedlines('');
                    setIsEditingRedlines(true);
                  }
                }}
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
              配置智能体在对话中必须遵守的业务纪律。系统将把这些规则作为最高优先级指令要求智能体，以干预智能体的回答内容
            </p>
            
            {isBusinessRulesEnabled && (
              <div className="flex-1 min-h-[160px]">
                {!isEditingRedlines ? (
                  <div className="relative bg-gray-50 border border-gray-200 rounded-lg p-4 h-full">
                    <button 
                      onClick={handleStartEditRedlines}
                      className="absolute top-3 right-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> 编辑
                    </button>
                    {businessRules ? (
                      <pre className="font-sans text-sm text-gray-700 whitespace-pre-wrap leading-relaxed pr-16">
                        {businessRules}
                      </pre>
                    ) : (
                      <span className="text-sm text-gray-400">未配置规则，禁忌限制未生效</span>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col">
                    <div className="bg-amber-50 text-amber-800 text-xs px-3 py-2 rounded-lg flex items-start gap-2 mb-2">
                      <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                      <span>请确保规则清晰明确，避免歧义。每行一条规则效果最佳</span>
                    </div>
                    <div className="relative flex-1">
                      <textarea
                        value={tempRedlines}
                        onChange={(e) => setTempRedlines(e.target.value)}
                        maxLength={200}
                        className="w-full h-full p-3 pb-6 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm leading-relaxed resize-none bg-white min-h-[120px]"
                        placeholder="在此输入业务红线规则..."
                        autoFocus
                      />
                      <span className={`absolute bottom-2 right-3 text-xs ${tempRedlines.length >= 200 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                        {tempRedlines.length}/200
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-2">
                      <button 
                        onClick={handleCancelRedlines}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        取消
                      </button>
                      <button 
                        onClick={handleSaveRedlines}
                        className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                      >
                        保存
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2. Smart Security Guardrails Card (Top Right) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex items-center gap-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">智能安全护栏</h3>
          </div>
          <div className="divide-y divide-gray-100 flex-1">
            {guardrails.map((item) => (
              <div key={item.id} className="p-6 flex items-start justify-between hover:bg-gray-50/50 transition-colors">
                <div className="pr-8 max-w-xl">
                  <div className="font-medium text-gray-900 mb-1">{item.title}</div>
                  <div className="text-sm text-gray-500 leading-relaxed">{item.description}</div>
                </div>
                <button
                  onClick={() => toggleGuardrail(item.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shrink-0 mt-0.5 ${
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
              当智能体遇到无法回答的问题或者用户的提问或智能体输出命中内容合规检测、提示词攻击安全护栏时，智能体将回复此文案
            </p>

            {!isEditingRejection ? (
              <div className="relative bg-gray-50 border border-gray-200 rounded-lg p-4">
                <button 
                  onClick={handleStartEditRejection}
                  className="absolute top-3 right-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> 编辑
                </button>
                {rejectionText ? (
                  <div className="text-sm text-gray-700 leading-relaxed pr-16">
                    {rejectionText}
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">未配置话术，将使用系统默认话术拒答：抱歉，我无法回答这个问题。</span>
                )}
              </div>
            ) : (
              <div>
                <div className="relative">
                  <textarea
                    value={tempRejection}
                    onChange={(e) => setTempRejection(e.target.value)}
                    maxLength={200}
                    className="w-full h-24 p-3 pb-6 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm leading-relaxed resize-none bg-white"
                    placeholder="在此输入拒答话术..."
                    autoFocus
                  />
                  <span className={`absolute bottom-2 right-3 text-xs ${tempRejection.length >= 200 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                    {tempRejection.length}/200
                  </span>
                </div>
                <div className="flex items-center justify-end mt-2">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleRestoreDefaultRejection}
                      className="px-3 py-1.5 text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" /> 恢复默认
                    </button>
                    <button 
                      onClick={handleCancelRejection}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      取消
                    </button>
                    <button 
                      onClick={handleSaveRejection}
                      className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      保存
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
