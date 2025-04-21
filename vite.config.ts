// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
	build: {
		target: 'esnext',
		outDir: 'dist',
		ssr: true,
		lib: {
			entry: 'src/index.ts',
			formats: ['es'],
		},
		rollupOptions: {
			external: ['ws', 'fs', 'path'], // Add dependencies you don't want bundled here
		},
	}
})
