import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split node_modules into separate chunks
          if (id.includes('node_modules')) {
            if (id.includes('three')) {
              return 'three';
            }
            if (id.includes('@react-three')) {
              return 'react-three';
            }
            if (id.includes('react')) {
              return 'react-vendor';
            }
            if (id.includes('canvas-confetti')) {
              return 'confetti';
            }
            return 'vendor'; // All other node_modules
          }
        },
      },
    },
  },
});
