// vite.config.ts
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
        build: {
                target: 'esnext',
                outDir: 'dist',
                ssr: true,
                rollupOptions: {
                        input: {
                                websocket: path.resolve(__dirname, 'src/index.ts'),
                                fetch: path.resolve(__dirname, 'src/fetch_transactions.ts'),
                        },
                        external: ['ws', 'fs', 'path'], // Add dependencies you don't want bundled here
                },
        }
})
