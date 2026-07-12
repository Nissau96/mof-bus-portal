import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Convert the current ES module file URL into a normal file path.
// This gives us the same behavior as __dirname in older CommonJS projects.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Vite configuration file.
// React handles JSX.
// Tailwind CSS v4 is loaded through the official Vite plugin.
// The resolve.alias section makes "@/..." point to the src folder.
// shadcn/ui needs this alias before it can initialize successfully.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});