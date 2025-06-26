import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: 'CATATAN KANG RIAN', // <-- DIUBAH
        short_name: 'Catatan KR', // <-- DIUBAH
        description: 'Aplikasi pencatatan, koleksi, dan utilitas pribadi.', // <-- DIUBAH
        start_url: '.',
        display: 'standalone',
        theme_color: '#1F2937',
        background_color: '#F3F4F6',
        screenshots: [
          {
            src: 'screenshot1.png',
            sizes: '597x1280', 
            type: 'image/png'
          },
          {
            src: 'screenshot2.png',
            sizes: '592x1280',
            type: 'image/png'
          }
        ],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})