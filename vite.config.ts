build: {
  chunkSizeWarningLimit: 1000,
  rollupOptions: {
    output: {
      manualChunks: {
        'three-vendor': ['three'],
        'react-three': ['@react-three/fiber', '@react-three/drei'],
        'confetti': ['canvas-confetti']
      }
    }
  },
  minify: 'terser', // Better compression than default
  terserOptions: {
    compress: {
      drop_console: true, // Remove console.logs in production
    }
  }
}
