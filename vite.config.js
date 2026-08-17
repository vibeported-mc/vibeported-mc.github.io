import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Root user/org Pages site, so it is served from / rather than a repo sub-path.
export default defineConfig({
  base: "/",
  plugins: [react()],
});
