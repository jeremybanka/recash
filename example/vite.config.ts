import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  build: {
    sourcemap: `inline`,
    outDir: `./build`,
    chunkSizeWarningLimit: 7000,
  },
  server: {
    proxy: {
      "/api": {
        target: `http://localhost:8000`,
      },
      "/auth": {
        target: `http://localhost:8000`,
      },
    },
  },
})
