import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // mode "offline": đóng gói toàn bộ thành 1 file HTML, mở trực tiếp bằng trình duyệt (không cần host)
    const offline = mode === 'offline';
    return {
      base: './',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss(), ...(offline ? [viteSingleFile()] : [])],
      build: {
        outDir: offline ? 'dist-offline' : 'dist',
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
