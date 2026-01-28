/**
 * EVA 对话页原型演示 - 主应用
 * 对齐 PRD v3 3.3.2 场景交互详解
 */

import React, { useState } from 'react';
import { ViewMode, PageStateConfig, FeatureOptions, PageViewState } from './types';
import { StateSwitcher } from './components/StateSwitcher';
import { PlaygroundLayout } from './components/PlaygroundLayout';
import { StandaloneLayout } from './components/StandaloneLayout';
import { WidgetLayout } from './components/WidgetLayout';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('playground');
  const [pageViewState, setPageViewState] = useState<PageViewState>('conversation');
  const [stateConfig, setStateConfig] = useState<PageStateConfig>({
    scenario: 'A',
    messageState: 'complete',
  });
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
        stateConfig={stateConfig}
        onStateConfigChange={setStateConfig}
        features={features}
        onFeaturesChange={setFeatures}
        pageViewState={pageViewState}
        onPageViewStateChange={setPageViewState}
      />

      {/* 环境动画背景 */}
      {viewMode !== 'playground' && <div className="eva-ambient" />}

      {/* 页面内容 */}
      <div className="flex-1 flex flex-col relative z-10">
        {viewMode === 'playground' && (
          <PlaygroundLayout
            stateConfig={stateConfig}
            features={features}
            onStateConfigChange={setStateConfig}
            pageViewState={pageViewState}
          />
        )}
        {viewMode === 'standalone' && (
          <StandaloneLayout
            stateConfig={stateConfig}
            features={features}
            onStateConfigChange={setStateConfig}
            pageViewState={pageViewState}
          />
        )}
        {viewMode === 'widget' && (
          <WidgetLayout
            stateConfig={stateConfig}
            features={features}
            onStateConfigChange={setStateConfig}
            pageViewState={pageViewState}
          />
        )}
      </div>
    </div>
  );
}
