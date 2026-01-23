import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages 部署时的 base 路径，改成你的仓库名
  // 例如仓库是 username/eva-chat-prototype，则 base: '/eva-chat-prototype/'
  base: process.env.NODE_ENV === 'production' ? '/eva-chat-prototype/' : '/',
  server: {
    port: 3003,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
