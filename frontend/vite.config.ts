import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  if (mode === 'production' && !env.VITE_API_URL?.trim()) {
    throw new Error(
      'Production build requires VITE_API_URL (Django origin, no trailing slash), e.g. https://your-service.onrender.com. On Vercel: Project → Settings → Environment Variables.',
    )
  }
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://127.0.0.1:8000'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
