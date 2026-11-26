import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        // The Express API allows this origin by default (CLIENT_ORIGIN in
        // server/config.env), so keep CRA's port rather than Vite's 5173.
        port: 3000,
    },
    build: {
        // Matches the /build entry already in client/.gitignore.
        outDir: 'build',
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './src/test/setup.js',
        css: false,
    },
});
