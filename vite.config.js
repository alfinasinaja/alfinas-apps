import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // './' supaya aset tetap jalan di GitHub Pages, baik di domain utama maupun di subfolder repo
  base: './',
});