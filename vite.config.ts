import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages publica em https://m-pretti.github.io/skill-tree-cerc/
  base: '/skill-tree-cerc/',
});
