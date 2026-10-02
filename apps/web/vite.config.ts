import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// VITE_BASE ใช้ตอน deploy ขึ้น GitHub Pages (เว็บอยู่ใต้ /ชื่อ-repo/) ตอนรัน dev ไม่ต้องตั้ง
export default defineConfig({ plugins: [react()], base: process.env.VITE_BASE ?? '/' });
