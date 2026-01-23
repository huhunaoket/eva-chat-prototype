import React, { useState, useRef, useEffect } from 'react';
import { 
  User as UserIcon, 
  Building2, 
  LogOut, 
  ChevronRight,
  Home,
  MessageSquare,
  Book,
  Zap,
  FileQuestion,
  Rocket,
  Shield
} from 'lucide-react';

export type DashboardView = 'home' | 'playground' | 'knowledge' | 'evolution' | 'questions' | 'deploy' | 'security';

export const NAV_ITEMS = [
  { id: 'home' as const, label: '智能座舱', icon: Home },
  { id: 'playground' as const, label: 'Agent演练', icon: MessageSquare },
  { id: 'knowledge' as const, label: '知识库', icon: Book },
  { id: 'evolution' as const, label: '进化', icon: Zap },
  { id: 'questions' as const, label: '题库', icon: FileQuestion },
  { id: 'deploy' as const, label: '部署', icon: Rocket },
  { id: 'security' as const, label: '安全', icon: Shield },
];

export interface User {
  name: string;
  avatar?: string;
  phone: string;
}

export interface Company {
  name: string;
  industry: string;
}

interface SidebarProps {
  currentView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  user: User;
  company: Company;
  onOpenProfile: () => void;
  onOpenCompany: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  user,
  company,
  onOpenProfile,
  onOpenCompany,
  onLogout
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Helper to get avatar fallback
  const getAvatarFallback = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full z-20">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <div className="flex items-center gap-2 text-indigo-600">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
          </svg>
          <span className="font-bold text-lg tracking-tight">EVA.AI</span>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User Section at Bottom - 固定在底部 */}
      <div className="shrink-0 p-4 border-t border-gray-100 relative" ref={menuRef}>
        {/* Popover Menu */}
        {isMenuOpen && (
          <div className="absolute bottom-[calc(100%+8px)] left-4 right-4 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200 z-50">
            <div className="py-1">
              <button onClick={() => { onOpenProfile(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-center w-4 h-4">
                  <UserIcon className="w-4 h-4 text-gray-400" />
                </div>
                个人信息
              </button>
              <button onClick={() => { onOpenCompany(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-center w-4 h-4">
                  <Building2 className="w-4 h-4 text-gray-400" />
                </div>
                企业信息
              </button>
              <div className="my-1 h-px bg-gray-100" />
              <button onClick={() => { onLogout(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <div className="flex items-center justify-center w-4 h-4">
                  <LogOut className="w-4 h-4" />
                </div>
                退出登录
              </button>
            </div>
          </div>
        )}

        {/* User Trigger */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all duration-200 ${
            isMenuOpen ? 'bg-gray-100' : 'hover:bg-gray-50'
          }`}
        >
          <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0 overflow-hidden">
             {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
             ) : (
                getAvatarFallback(user.name)
             )}
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
            <div className="text-xs text-gray-500 truncate">{company.name}</div>
          </div>
          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isMenuOpen ? '-rotate-90' : ''}`} />
        </button>
      </div>
    </div>
  );
};

// Mock Data
export const mockUser: User = {
  name: '131****2412',
  avatar: '',
  phone: '131****2412'
};

export const mockCompany: Company = {
  name: '杭州智慧科技有限公司',
  industry: '电子商务'
};
