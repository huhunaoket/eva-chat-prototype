import React, { useState } from 'react';
import { 
  Monitor, 
  Code, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  Check,
  Terminal,
  AlertCircle,
  ChevronDown,
  Edit2
} from 'lucide-react';
import { Modal } from './Modal';

// 模拟初始化状态：0=未配置, 1=创建中, 2=已完成
const MOCK_INIT_STATUS = 2;

export const DeploymentView: React.FC = () => {
  // 链接状态：null=未生成, string=已生成
  const [webUrl, setWebUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // 手风琴展开状态
  const [embedExpanded, setEmbedExpanded] = useState(false);
  
  // Modals
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showInitWarning, setShowInitWarning] = useState(false);

  // Embed Config State
  const [whitelistEnabled, setWhitelistEnabled] = useState(false);
  const [whitelistDomains, setWhitelistDomains] = useState('');
  const [tempWhitelistDomains, setTempWhitelistDomains] = useState('');
  const [isEditingWhitelist, setIsEditingWhitelist] = useState(false);
  const [embedStyle, setEmbedStyle] = useState<'full' | 'bubble'>('full');
  const [isSavingWhitelist, setIsSavingWhitelist] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const checkInitStatus = (): boolean => {
    return MOCK_INIT_STATUS === 2;
  };

  const handleGenerateLink = async () => {
    if (!checkInitStatus()) {
      setShowInitWarning(true);
      return;
    }
    
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newId = Math.random().toString(36).substring(7);
    setWebUrl(`https://eva.ai/s/${newId}`);
    setIsGenerating(false);
  };

  const handleResetLink = async () => {
    setIsGenerating(true);
    setShowResetConfirm(false);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newId = Math.random().toString(36).substring(7);
    setWebUrl(`https://eva.ai/s/${newId}`);
    setIsGenerating(false);
  };

  const handleToggleEmbed = () => {
    if (!embedExpanded && !checkInitStatus()) {
      setShowInitWarning(true);
      return;
    }
    setEmbedExpanded(!embedExpanded);
  };

  const handleSaveWhitelist = async () => {
    setIsSavingWhitelist(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setWhitelistDomains(tempWhitelistDomains);
    setIsSavingWhitelist(false);
    setIsEditingWhitelist(false);
  };

  const handleStartEditWhitelist = () => {
    setTempWhitelistDomains(whitelistDomains);
    setIsEditingWhitelist(true);
  };

  const handleCancelEditWhitelist = () => {
    setTempWhitelistDomains('');
    setIsEditingWhitelist(false);
  };

  const embedCode = `<!-- 以下代码请放入前端html文件的body内 -->
<script src="https://eva.ai/embed.js" async></script>
<script>
  new EmbedLiteSDK({
    appId: '67ac480d52344b078cddb1d80884733c',
    style: '${embedStyle}',
    code: 'embedJcb4xyURmlxL2wkQGZKE'
  });
</script>`;

  return (
    <div className="p-8 w-full overflow-auto">
      <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">部署</h1>
      </div>

      <div className="space-y-6">
        {/* Independent Webpage Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start gap-6">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shrink-0 text-white">
              <Monitor size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">独立网页</h3>
              <p className="text-gray-500 text-sm mt-1 mb-5">提供独立访问链接，用户打开即可与智能体对话</p>
              
              {!webUrl ? (
                // 未生成状态
                <div className="flex items-center justify-end">
                  <button 
                    onClick={handleGenerateLink}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        生成中...
                      </>
                    ) : (
                      '生成链接'
                    )}
                  </button>
                </div>
              ) : (
                // 已生成状态 - 全部靠右
                <div className="flex items-center justify-end gap-3">
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className="text-gray-700 text-sm font-mono">{webUrl}</span>
                  </div>
                  <button 
                    onClick={() => handleCopy(webUrl, 'url')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    {copied === 'url' ? <Check size={15} /> : <Copy size={15} />}
                    {copied === 'url' ? '已复制' : '复制'}
                  </button>
                  <button 
                    onClick={() => setShowResetConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    <RefreshCw size={15} />
                    重置
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Website Embedding Card - Accordion */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div 
            onClick={handleToggleEmbed}
            className="p-6 flex items-start gap-6 cursor-pointer hover:bg-gray-50/50 transition-colors"
          >
            <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shrink-0 text-white">
              <Code size={24} />
            </div>
            <div className="flex-1 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">网站嵌入</h3>
                <p className="text-gray-500 text-sm mt-1">将智能体以页面或聊天气泡的形式，快速集成到您的网站</p>
              </div>
              <ChevronDown 
                size={20} 
                className={`text-gray-400 transition-transform duration-200 ${embedExpanded ? 'rotate-180' : ''}`} 
              />
            </div>
          </div>
          
          {/* 展开内容 */}
          {embedExpanded && (
            <div className="px-6 pb-6 border-t border-gray-100">
              <div className="pt-5 space-y-6">
                {/* 域名白名单 */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-900">域名白名单</h4>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          const newEnabled = !whitelistEnabled;
                          setWhitelistEnabled(newEnabled);
                          if (newEnabled && !whitelistDomains) {
                            setTempWhitelistDomains('');
                            setIsEditingWhitelist(true);
                          }
                        }}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${whitelistEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${whitelistEnabled ? 'translate-x-[18px]' : 'translate-x-1'}`} />
                      </button>
                      <span className="text-sm text-gray-700">开启后，仅允许指定域名加载智能体</span>
                    </div>
                    
                    {whitelistEnabled && (
                      <div className="mt-3">
                        {!isEditingWhitelist ? (
                          <div className="relative bg-white border border-gray-200 rounded-lg p-3 min-h-[80px]">
                            <button 
                              onClick={handleStartEditWhitelist}
                              className="absolute top-3 right-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1 transition-colors"
                            >
                              <Edit2 size={14} /> 编辑
                            </button>
                            {whitelistDomains ? (
                              <pre className="font-mono text-sm text-gray-700 whitespace-pre-wrap leading-relaxed pr-16">
                                {whitelistDomains}
                              </pre>
                            ) : (
                              <span className="text-sm text-gray-400">未配置域名，白名单限制未生效</span>
                            )}
                          </div>
                        ) : (
                          <div>
                            <textarea
                              value={tempWhitelistDomains}
                              onChange={(e) => setTempWhitelistDomains(e.target.value)}
                              placeholder={"https://example.com\nhttps://*.example.com"}
                              className="w-full p-3 border border-indigo-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[80px] font-mono bg-white"
                              autoFocus
                            />
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                <AlertCircle size={12} />
                                <span>每行填写一个域名</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={handleCancelEditWhitelist}
                                  className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                  取消
                                </button>
                                <button 
                                  onClick={handleSaveWhitelist}
                                  disabled={isSavingWhitelist}
                                  className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                >
                                  {isSavingWhitelist ? '保存中...' : '保存'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 嵌入代码 */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-900">获取嵌入代码</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {/* 全页面卡片 */}
                    <div className="relative">
                      <div 
                        onClick={() => setEmbedStyle('full')}
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${embedStyle === 'full' ? 'border-indigo-500 bg-white shadow-sm' : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'}`}
                      >
                        <h5 className="font-semibold text-gray-900 mb-1">全页面</h5>
                        <p className="text-xs text-gray-500 mb-3">将对话页完整铺开并嵌入到目标页面中，体验更沉浸且可以展示更多内容</p>
                        <div className="bg-gray-100 rounded-lg overflow-hidden h-44">
                          <div className="bg-gray-200 px-2 py-1.5 flex items-center gap-1.5">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 rounded-full bg-red-400" />
                              <div className="w-2 h-2 rounded-full bg-yellow-400" />
                              <div className="w-2 h-2 rounded-full bg-green-400" />
                            </div>
                            <div className="flex-1 flex justify-center">
                              <div className="bg-white rounded px-3 py-0.5 flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-gray-300" />
                                <div className="h-1.5 bg-gray-300 rounded w-12" />
                              </div>
                            </div>
                          </div>
                          <div className="flex h-[calc(100%-24px)]">
                            <div className="w-10 bg-gray-50 border-r border-gray-200 p-1.5 space-y-1">
                              <div className="h-1.5 bg-gray-300 rounded w-full" />
                              <div className="h-1.5 bg-gray-200 rounded w-full" />
                            </div>
                            <div className="flex-1 bg-white flex flex-col items-center justify-center p-2">
                              <div className="w-6 h-6 bg-indigo-500 rounded-lg mb-2 flex items-center justify-center">
                                <div className="w-3 h-3 bg-white rounded-sm" />
                              </div>
                              <div className="space-y-1 w-3/4">
                                <div className="h-1.5 bg-gray-200 rounded w-full" />
                                <div className="h-1.5 bg-gray-200 rounded w-2/3 mx-auto" />
                              </div>
                              <div className="mt-auto w-full">
                                <div className="bg-gray-100 rounded-full h-4 flex items-center px-2">
                                  <div className="h-1 bg-gray-300 rounded w-16" />
                                  <div className="ml-auto w-2 h-2 bg-indigo-400 rounded" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {embedStyle === 'full' && (
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-indigo-500" />
                      )}
                    </div>

                    {/* 聊天气泡卡片 */}
                    <div className="relative">
                      <div 
                        onClick={() => setEmbedStyle('bubble')}
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${embedStyle === 'bubble' ? 'border-indigo-500 bg-white shadow-sm' : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'}`}
                      >
                        <h5 className="font-semibold text-gray-900 mb-1">聊天气泡</h5>
                        <p className="text-xs text-gray-500 mb-3">以对话窗口的形式悬浮在页面上，可以在浏览页面其他内容时随时开启或关闭</p>
                        <div className="bg-gray-100 rounded-lg overflow-hidden h-44 relative">
                          <div className="p-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 bg-gray-300 rounded w-8" />
                              <div className="ml-auto flex gap-1">
                                <div className="h-1.5 bg-gray-300 rounded w-6" />
                                <div className="h-1.5 bg-gray-300 rounded w-6" />
                                <div className="h-1.5 bg-indigo-300 rounded w-8" />
                              </div>
                            </div>
                            <div className="h-1.5 bg-gray-300 rounded w-full mt-3" />
                            <div className="h-1.5 bg-gray-300 rounded w-4/5" />
                            <div className="h-1.5 bg-gray-300 rounded w-3/5" />
                          </div>
                          <div className="absolute bottom-2 right-2 w-24 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                            <div className="bg-indigo-500 px-1.5 py-1 flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-white rounded-full" />
                                <div className="h-1 bg-white/60 rounded w-6" />
                              </div>
                              <div className="w-2 h-2 text-white">×</div>
                            </div>
                            <div className="p-1.5 space-y-1">
                              <div className="flex gap-1">
                                <div className="w-2 h-2 bg-indigo-100 rounded-full shrink-0" />
                                <div className="bg-gray-100 rounded px-1 py-0.5">
                                  <div className="h-1 bg-gray-300 rounded w-10" />
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <div className="bg-indigo-100 rounded px-1 py-0.5">
                                  <div className="h-1 bg-indigo-300 rounded w-8" />
                                </div>
                              </div>
                            </div>
                            <div className="px-1.5 pb-1">
                              <div className="bg-gray-100 rounded h-2.5 flex items-center px-1">
                                <div className="h-0.5 bg-gray-300 rounded w-8" />
                                <div className="ml-auto w-1.5 h-1.5 bg-indigo-400 rounded-sm" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {embedStyle === 'bubble' && (
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-indigo-500" />
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-900 rounded-lg overflow-hidden text-gray-300 mt-5">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
                      <span className="text-xs text-gray-500">将代码添加到网站 &lt;body&gt; 内</span>
                      <button 
                        onClick={() => handleCopy(embedCode, 'embed')}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                      >
                        {copied === 'embed' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        {copied === 'embed' ? '已复制' : '复制代码'}
                      </button>
                    </div>
                    <pre className="p-4 text-xs font-mono overflow-x-auto">
                      <code>{embedCode}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* API Integration Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-start gap-6">
          <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0 text-white">
            <Terminal size={24} />
          </div>
          <div className="flex-1 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">API 接入</h3>
              <p className="text-gray-500 text-sm mt-1">通过 API 将智能体集成到您的应用系统中</p>
            </div>
            <a 
              href="https://eva.ai/docs/api" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 px-6 py-2.5 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              查看文档
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        title="重置链接确认"
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        width="400px"
        footer={
           <div className="flex w-full gap-3">
            <button onClick={() => setShowResetConfirm(false)} className="flex-1 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">取消</button>
            <button onClick={handleResetLink} className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">确认重置</button>
          </div>
        }
      >
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-6 h-6" />
          </div>
          <p className="text-gray-600 mb-2">重置后，旧的访问链接将立即失效。</p>
          <p className="text-gray-500 text-sm">您确定要生成新的访问链接吗？</p>
        </div>
      </Modal>

      {/* Init Warning Modal */}
      <Modal
        title="无法生成链接"
        isOpen={showInitWarning}
        onClose={() => setShowInitWarning(false)}
        width="400px"
        footer={
          <div className="flex w-full">
            <button 
              onClick={() => setShowInitWarning(false)} 
              className="flex-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              我知道了
            </button>
          </div>
        }
      >
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-gray-600">请先完成企业初始化后再生成部署链接</p>
        </div>
      </Modal>
      </div>
    </div>
  );
};
