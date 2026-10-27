import {defineConfig} from 'vitest/config';import react from '@vitejs/plugin-react';
export default defineConfig({base:process.env.VITE_PAGES_BASE||'/',plugins:[react()],test:{environment:'jsdom',setupFiles:'./src/testSetup.ts'}});
