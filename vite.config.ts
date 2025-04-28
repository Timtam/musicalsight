import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import checker from "vite-plugin-checker"
import { nodePolyfills } from "vite-plugin-node-polyfills"
import svgr from "vite-plugin-svgr"
import viteTsconfigPaths from "vite-tsconfig-paths"

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        viteTsconfigPaths(),
        svgr({
            include: "**/*.svg?react",
        }),
        nodePolyfills({
            include: ["events"],
        }),
        checker({
            typescript: true,
        }),
    ],
    base: "/musicalsight/",
    server: {
        port: 3100,
    },
})
