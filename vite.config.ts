import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        chunkSizeWarningLimit: 2000, // Increase for Three.js
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                if (id.includes('three')) {
                  return 'three-vendor';
                }
                if (id.includes('@react-three')) {
                  return 'r3f-vendor';
                }
                if (id.includes('react') || id.includes('react-dom')) {
                  return 'react-vendor';
                }
                return 'vendor';
              }
            }
          }
        },
        target: 'es2015', // Better mobile browser support
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true, // Remove console logs in production
          }
        }
      }
    };
});
