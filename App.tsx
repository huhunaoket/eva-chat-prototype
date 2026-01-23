/**
 * EVA 对话页原型演示 - 主应用
 */

import React, { useState } from 'react';
import { ViewMode, PageState, FeatureOptions } from './types';
import { StateSwitcher } from './components/StateSwitcher';
import { PlaygroundLayout } from './components/PlaygroundLayout';
import { StandaloneLayout } from './components/StandaloneLayout';
import { WidgetLayout } from './components/WidgetLayout';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('playground');
  const [pageState, setPageState] = useState<PageState>('empty');
  const [features, setFeatures] = useState<FeatureOptions>({
    showKnowledgeRef: false,
    showFeedbackPanel: false,
    showHistory: false,
  });

  return (
    <div className="min-h-screen w-full flex flex-col relative">
      {/* 状态切换器 */}
      <StateSwitcher
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        pageState={pageState}
        onPageStateChange={setPageState}
        features={features}
        onFeaturesChange={setFeatures}
      />

      {/* 环境动画背景 */}
      {viewMode !== 'playground' && <div className="eva-ambient" />}

      {/* 页面内容 */}
      <div className="flex-1 flex flex-col relative z-10">
        {viewMode === 'playground' && (
          <PlaygroundLayout 
            pageState={pageState} 
            features={features}
            onPageStateChange={setPageState}
          />
        )}
        {viewMode === 'standalone' && (
          <StandaloneLayout 
            pageState={pageState} 
            features={features}
            onPageStateChange={setPageState}
          />
        )}
        {viewMode === 'widget' && (
          <WidgetLayout 
            pageState={pageState} 
            features={features}
            onPageStateChange={setPageState}
          />
        )}
      </div>
    </div>
  );
}
