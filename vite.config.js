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
        name: 'DevStudy Hub',
        short_name: 'DevStudy',
        description: 'Platform pencatatan modular dan utilitas AI untuk developer.',
        start_url: '.',
        display: 'standalone',
        theme_color: '#1F2937',
        background_color: '#F3F4F6',
        screenshots: [
          {
            src: 'screenshot1.png',
            sizes: '1872x750', // <-- DIUBAH SESUAI UKURAN ASLI
            type: 'image/png'
          },
          {
            src: 'screenshot2.png',
            sizes: '1883x790', // <-- DIUBAH SESUAI UKURAN ASLI
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