import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // 빌드 및 개발 서버가 src 폴더 내의 모든 파일을 스캔하도록 설정
});