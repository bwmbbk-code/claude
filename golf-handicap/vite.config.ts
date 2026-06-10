import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages deploys under /claude/ — local dev uses /
const base = process.env.GITHUB_ACTIONS ? '/claude/' : '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['golf-192.svg', 'golf-512.svg'],
      manifest: {
        name: '골프 핸디캡 계산기',
        short_name: 'Golf HCP',
        description: 'USGA World Handicap System 기반 골프 핸디캡 계산기',
        theme_color: '#1b4332',
        background_color: '#1b4332',
        display: 'standalone',
        orientation: 'portrait',
        scope: base,
        start_url: base,
        icons: [
          {
            src: 'golf-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: 'golf-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg}'],
      },
    }),
  ],
});
