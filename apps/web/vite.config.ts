import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react() as any],
  css: {
    postcss: "./postcss.config.cjs",
  },
  server: {
    port:
      process.env.PORT && process.env.PORT.trim() !== ""
        ? parseInt(process.env.PORT, 10)
        : process.env.VITE_PORT
          ? parseInt(process.env.VITE_PORT, 10)
          : 3002,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (_proxyReq, req, _res) => {
            console.log(
              "Proxying request:",
              req.method,
              req.url,
              "-> http://localhost:8000",
            );
          });
        },
      },
    },
  },
});
