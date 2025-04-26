import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === "development" ? "/" : process.env.VITE_BASE_PATH || "/",
  optimizeDeps: {
    entries: ["src/main.tsx"],
    include: ['punycode'],
  },
  plugins: [
    react(),
    nodePolyfills({
      // Enable protocol imports ('node:' prefix) - includes punycode
      protocolImports: true,
      // Explicitly include punycode polyfill
      include: ['punycode'],
    }),
  ],
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "punycode": "punycode/",
    },
  },
  server: {
    // @ts-ignore
    allowedHosts: true,
  },
  // Adding build configuration for production
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Ensure paths are relative for Vercel deployment
    emptyOutDir: true,
  }
});
