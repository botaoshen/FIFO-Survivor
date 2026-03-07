import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    // 【新增】设置 base 为相对路径。
    // 这样打包后的 HTML 就会去 ./assets 找图片，而不是去根目录找。
    // 这对你未来部署到 /game1/ 这种子目录至关重要。
    base: './', 

    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    
    // 【新增】build 配置，确保静态资源处理逻辑正确
    build: {
      // 建议将此限制设为 0。
      // 这样 Vite 不会把图片转成 Base64 编码，而是生成实际的文件。
      // 这能帮你更容易排查路径问题。
      assetsInlineLimit: 0, 
      // 确保资源文件夹名称一致
      assetsDir: 'assets',
    },

    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
