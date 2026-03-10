import { defineConfig } from "vite";
import fs from "node:fs";

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    https: {
      key: fs.readFileSync("./192.168.18.6+2-key.pem"),
      cert: fs.readFileSync("./192.168.18.6+2.pem"),
    },
  },
});

