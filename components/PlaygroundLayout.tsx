/**
 * Playground 布局 - 管理员视角（带完整侧边栏导航）
 */

import React, { useState } from 'react';
import { Plus, History, LogOut } from 'lucide-react';
import { PageState, FeatureOptions, Attachment } from '../types';
import { ChatArea } from './ChatArea';
import { ChatInput } from './ChatInput';
import { ChatHistory } from './ChatHistory';
import { Sidebar, DashboardView, NAV_ITEMS, User, Company, mockUser, mockCompany } from './dashboard/Sidebar';
import { DeploymentView } from './dashboard/DeploymentView';
import { SecurityCenter } from './dashboard/SecurityCenter';
import { Modal } from './dashboard/Modal';

interface PlaygroundLayoutProps {
  pageState: PageState;
  features: FeatureOptions;
  onPageStateChange: (state: PageState) => void;
}

export const PlaygroundLayout: React.FC<PlaygroundLayoutProps> = ({
  pageState,
  features,
  onPageStateChange,
}) => {
  const [showHistory, setShowHistory] = useState(features.showHistory);
  const [currentView, setCurrentView] = useState<DashboardView>('playground');
  
  // Modal States
  const [showProfile, setShowProfile] = useState(false);
  const [showCompany, setShowCompany] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  // Mock Data
  const [user, setUser] = useState<User>(mockUser);
  const [company, setCompany] = useState<Company>(mockCompany);

  // 同步 features.showHistory 变化
  React.useEffect(() => {
    setShowHistory(features.showHistory);
  }, [features.showHistory]);

  const handleSend = (message: string, attachments?: Attachment[]) => {
    console.log('发送消息:', message, '附件:', attachments);
    onPageStateChange('thinking');
  };

  const handleStop = () => {
    onPageStateChange('stopped');
  };

  const handleNewChat = () => {
    onPageStateChange('empty');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">智能座舱</h1>
            <p className="text-gray-500">这里是 AI 团队的指挥中心。</p>
          </div>
        );
      case 'playground':
        return (
          <div className="flex-1 flex flex-col">
            {/* 顶部栏 */}
            <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6">
              <h1 className="font-medium text-slate-800">新对话</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleNewChat}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  <span>新对话</span>
                </button>
                <button
                  onClick={() => setShowHistory(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <History size={16} />
                  <span>历史</span>
                </button>
              </div>
            </div>

            {/* 聊天区域 */}
            <div className="flex-1 flex flex-col bg-slate-50">
              <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
                <ChatArea 
                  pageState={pageState} 
                  features={features} 
                  isPlayground={true}
                  onPageStateChange={onPageStateChange}
                />
                <ChatInput 
                  pageState={pageState} 
                  onSend={handleSend} 
                  onStop={handleStop} 
                />
              </div>
            </div>

            {/* 会话历史抽屉 */}
            <ChatHistory
              isOpen={showHistory}
              onClose={() => setShowHistory(false)}
              onSelectSession={() => {
                setShowHistory(false);
                onPageStateChange('complete-direct');
              }}
              onDeleteSession={() => {}}
            />
          </div>
        );
      case 'knowledge':
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">知识库</h1>
            <p className="text-gray-500">管理智能体的知识来源。</p>
          </div>
        );
      case 'evolution':
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">进化</h1>
            <p className="text-gray-500">管理模型的进化和微调。</p>
          </div>
        );
      case 'questions':
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">题库</h1>
            <p className="text-gray-500">管理测试题库。</p>
          </div>
        );
      case 'deploy':
        return <DeploymentView />;
      case 'security':
        return <SecurityCenter />;
      default:
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">{NAV_ITEMS.find(i => i.id === currentView)?.label}</h1>
            <p className="text-gray-500">功能开发中...</p>
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex bg-slate-100 overflow-hidden">
      {/* 左侧导航 */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        user={user}
        company={company}
        onOpenProfile={() => setShowProfile(true)}
        onOpenCompany={() => setShowCompany(true)}
        onLogout={() => setShowLogout(true)}
      />

      {/* 主内容区 */}
      <main className={`flex-1 relative ${currentView === 'playground' ? 'flex flex-col overflow-hidden' : 'overflow-auto'}`}>
        {renderContent()}
      </main>

      {/* Profile Modal */}
      <Modal
        title="个人信息"
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        footer={
          <>
            <button onClick={() => setShowProfile(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">取消</button>
            <button onClick={() => setShowProfile(false)} className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">保存</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl overflow-hidden">
                {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : user.name.charAt(0)}
            </div>
            <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700">更换头像</button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">显示名称</label>
            <input 
              type="text" 
              value={user.name}
              onChange={e => setUser({...user, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
            <input 
              type="text" 
              value={user.phone}
              disabled
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>
      </Modal>

      {/* Company Modal */}
      <Modal
        title="企业信息"
        isOpen={showCompany}
        onClose={() => setShowCompany(false)}
        footer={
          <>
            <button onClick={() => setShowCompany(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">取消</button>
            <button onClick={() => setShowCompany(false)} className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">保存</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">公司名称</label>
            <input 
              type="text" 
              value={company.name}
              onChange={e => setCompany({...company, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">所属行业</label>
            <div className="relative">
              <select 
                value={company.industry}
                onChange={e => setCompany({...company, industry: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none bg-white"
              >
                <option>科技/互联网</option>
                <option>电子商务</option>
                <option>金融/保险</option>
                <option>教育/培训</option>
                <option>医疗/健康</option>
                <option>制造/工业</option>
                <option>其他</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Logout Modal */}
      <Modal
        title=""
        isOpen={showLogout}
        onClose={() => setShowLogout(false)}
        width="320px"
        footer={
          <div className="flex w-full gap-3">
            <button onClick={() => setShowLogout(false)} className="flex-1 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">取消</button>
            <button onClick={() => window.location.reload()} className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">确定退出</button>
          </div>
        }
      >
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogOut className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">确定要退出登录吗？</h3>
          <p className="text-sm text-gray-500">退出后需要重新验证手机号登录。</p>
        </div>
      </Modal>
    </div>
  );
};
