//@ts-nocheck
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import {resolve} from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '')
	
	return {
		plugins: [react()],
		server: {
			port: 5003
		},
		define: {
			'import.meta.env.VITE_API_URL': JSON.stringify(env.API_URL)
		},
		resolve: {
			alias: {
				'@': resolve(__dirname, './src'),
				"@assets": resolve(__dirname, './src/assets'),
				"@components": resolve(__dirname, './src/components'),
				"@constants": resolve(__dirname, './src/constants'),
				"@screens": resolve(__dirname, './src/screens'),
				"@utils": resolve(__dirname, './src/utils'),
				"@services": resolve(__dirname, './src/services')
			}
		}
	}
})
