build: {
  chunkSizeWarningLimit: 600,
  rollupOptions: {
    output: {
      manualChunks(id) {
        if (id.includes('node_modules')) {
          if (id.includes('three')) {
            return 'three-vendor';
          }
          if (id.includes('react')) {
            return 'react-vendor';
          }
          return 'vendor';
        }
      }
    }
  }
}
