import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  // 개발 서버에서는 루트 경로('/')를 사용하고,
  // 빌드 시에만 '/BreinSinc/' 경로를 사용하도록 설정합니다.
  // 이렇게 하면 로컬 개발과 GitHub Pages 배포가 모두 정상적으로 동작합니다.
  const base = command === 'serve' ? '/' : '/BreinSinc/';

  return {
    base: base,
    root: resolve(__dirname, '.'),
    plugins: [react()],
    server: {
      host: '0.0.0.0', // 다른 기기에서의 접속을 허용
      port: 5173,      // 포트 번호 명시
      hmr: {
        protocol: 'ws',
      },
    },
    build: {
      outDir: resolve(__dirname, 'dist'),
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
        },
      },
    },
  }
})
