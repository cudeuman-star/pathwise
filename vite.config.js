import { defineConfig } from "vite"; import react from "@vitejs/plugin-react"; import api from "./vite-api-plugin.js";
export default defineConfig({ plugins: [react(), api()] });
