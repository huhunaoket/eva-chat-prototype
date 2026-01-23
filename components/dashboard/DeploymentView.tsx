import React, { useState } from 'react';
import { 
  Monitor, 
  Code, 
  Copy, 
  ExternalLink, 
  QrCode, 
  RefreshCw, 
  Check
} from 'lucide-react';
import { Modal } from './Modal';

export const DeploymentView: React.FC = () => {
  const [webUrl, setWebUrl] = useState('https://eva.ai/s/xf83jd');
  const [copied, setCopied] = useState<string | null>(null);
  
  // Modals
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Embed Config State
  const [whitelistEnabled, setWhitelistEnabled] = useState(false);
  const [whitelistDomains, setWhitelistDomains] = useState('');
  const [embedStyle, setEmbedStyle] = useState<'full' | 'bubble'>('full');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleResetLink = () => {
    const newId = Math.random().toString(36).substring(7);
    setWebUrl(`https://eva.ai/s/${newId}`);
    setShowResetConfirm(false);
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
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">集成与部署</h1>
        <p className="text-gray-500">将智能体能力分发到各个渠道。</p>
      </div>

      <div className="space-y-6">
        {/* Independent Webpage Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-start gap-6">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shrink-0 text-white">
            <Monitor size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-lg font-bold text-gray-900">独立网页</h3>
                <p className="text-gray-500 text-sm mt-1">即开即用的独立对话链接，支持电脑与移动端访问。</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mt-6">
              <button 
                onClick={() => setShowResetConfirm(true)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium px-2"
              >
                重置链接
              </button>
              
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  value={webUrl} 
                  readOnly 
                  className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm focus:outline-none"
                />
                <button 
                  onClick={() => handleCopy(webUrl, 'url')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {copied === 'url' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>

              <a 
                href={webUrl} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                访问网页
                <ExternalLink size={16} />
              </a>

              <button className="p-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <QrCode size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Website Embedding Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-start gap-6">
          <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shrink-0 text-white">
            <Code size={24} />
          </div>
          <div className="flex-1 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">网站嵌入</h3>
              <p className="text-gray-500 text-sm mt-1">将智能体以气泡或窗口形式嵌入您的官网。</p>
            </div>
            <button 
              onClick={() => setShowEmbedModal(true)}
              className="px-6 py-2.5 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              配置
            </button>
          </div>
        </div>
      </div>

      {/* Embed Configuration Modal */}
      <Modal
        title="网站嵌入配置"
        isOpen={showEmbedModal}
        onClose={() => setShowEmbedModal(false)}
        width="800px"
      >
        <div className="space-y-8">
          {/* Security Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-900 font-medium">
                <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-gray-300 rounded-full" />
                </div>
                安全限制
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">启用域名白名单</span>
                <button 
                  onClick={() => setWhitelistEnabled(!whitelistEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${whitelistEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition transition-transform ${whitelistEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
            
            {whitelistEnabled && (
              <textarea
                value={whitelistDomains}
                onChange={(e) => setWhitelistDomains(e.target.value)}
                placeholder="请输入允许加载的域名，如 example.com (支持多行)"
                className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[80px]"
              />
            )}
            {whitelistEnabled && (
              <p className="text-xs text-gray-400">只有列出的域名才允许加载此智能体。</p>
            )}
          </div>

          {/* Style Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-900 font-medium">
              <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-gray-300 rounded-full" />
              </div>
              样式选择
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => setEmbedStyle('full')}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${embedStyle === 'full' ? 'border-indigo-600 bg-indigo-50/10' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <h4 className="font-bold text-gray-900 mb-2">全页面</h4>
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">将应用对话页完整铺开并嵌入到目标页面中，体验更沉浸且可以展示更多内容</p>
                <div className="bg-gray-50 rounded-lg p-4 aspect-video flex items-center justify-center">
                  <div className="w-3/4 h-3/4 bg-white rounded shadow-sm flex flex-col p-2 gap-2">
                    <div className="w-8 h-8 bg-indigo-100 rounded self-center" />
                    <div className="w-full h-2 bg-gray-100 rounded" />
                    <div className="w-2/3 h-2 bg-gray-100 rounded self-center" />
                  </div>
                </div>
              </div>

              <div 
                onClick={() => setEmbedStyle('bubble')}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${embedStyle === 'bubble' ? 'border-indigo-600 bg-indigo-50/10' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <h4 className="font-bold text-gray-900 mb-2">聊天气泡</h4>
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">以对话窗口的形式悬浮在页面上，可以在浏览页面其他内容时随时开启或关闭</p>
                <div className="bg-gray-50 rounded-lg p-4 aspect-video relative">
                  <div className="absolute bottom-2 right-2 w-16 h-20 bg-white rounded shadow-sm border border-gray-100 flex flex-col p-1 gap-1">
                    <div className="w-full h-1 bg-gray-100 rounded" />
                    <div className="mt-auto w-4 h-4 bg-indigo-600 rounded-full self-end" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Code Snippet */}
          <div className="bg-gray-900 rounded-xl overflow-hidden text-gray-300">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <span className="text-sm font-medium text-gray-400">请将下方 JavaScript 嵌入您的网站</span>
              <button 
                onClick={() => handleCopy(embedCode, 'embed')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {copied === 'embed' ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
              </button>
            </div>
            <pre className="p-4 text-xs font-mono overflow-x-auto">
              <code>{embedCode}</code>
            </pre>
          </div>
        </div>
      </Modal>

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
    </div>
  );
};
