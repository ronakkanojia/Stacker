export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      build: {
        chunkSizeWarningLimit: 1000, // Increase to 1000kb for Three.js
        rollupOptions: {
          output: {
            manualChunks: {
              'three-vendor': ['three'],
              'react-three': ['@react-three/fiber', '@react-three/drei'],
            }
          }
        }
      },
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
