import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { baseAccountApi } from "./vite.baseApi";

export default defineConfig({
  plugins: [react(), baseAccountApi()],
  server: { port: 5173 },
});
