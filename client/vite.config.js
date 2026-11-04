
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
    // ByteXL preview path during development.
    // Root path during Docker production build.
    base: command === "serve" ? "/absproxy/5173/" : "/",

    plugins: [react()],

    server: {
        host: "0.0.0.0",
        port: 5173,
        strictPort: true,

        proxy: {
            "/absproxy/5173/api": {
                target: "http://127.0.0.1:5000",
                changeOrigin: true,
                rewrite: (path) =>
                    path.replace(/^\/absproxy\/5173/, "")
            }
        }
    }
}));
