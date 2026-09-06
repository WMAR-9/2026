import { defineConfig } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';
import viteImagemin from 'vite-plugin-imagemin';

export default defineConfig({
  base: './src',
  build: {
    outDir: 'dist',
    minify: 'terser',
    assetsInlineLimit: 0,
    cssCodeSplit: true,
    sourcemap: false,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      format: {
        comments: false,
      },
    },

    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        entryFileNames: `main.js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `[name].[ext]`,
      },
    },
  },
  plugins: [
    createHtmlPlugin({
      minify: true,
    }),
    viteImagemin({
      pngquant: {
        quality: [0.65, 0.9],
        speed: 4,
      },
    }),
  ],
  server: {
    host: '127.0.0.1',
    fs: {
      strict: false,
    },
  },
  resolve: {
    alias: {
      '@/': new URL('./src/', import.meta.url).pathname,
    },
  },
});