import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/eva-chat-prototype/',
  server: {
    port: 3000,
    host: '0.0.0.0',  // 监听所有网络接口，允许局域网访问
    proxy: {
      '/agentService': {
        target: 'http://dev.aweminds.cn',
        changeOrigin: true,
      },
    },
  },
});
