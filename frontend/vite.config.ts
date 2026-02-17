import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    fs: {
      // Allow importing files from the workspace root and backend folder
      allow: [path.resolve(__dirname, '..'), path.resolve(__dirname, '../backend')],
    },
  },
});
