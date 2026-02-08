import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    tsconfigPaths(),
  ],
  base: "./", // <--- CRITICAL for Electron (makes paths relative)
  server: {
    port: 3000, // Keep port 3000 to match your current setup
  },
  build: {
    outDir: "dist", // Output to 'dist' instead of 'dist' to match CRA
  },
});
