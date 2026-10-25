import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on all network interfaces (needed for LAN access and tunnels
    // like ngrok, which connect to your machine from "outside").
    host: true,
    // Vite normally rejects requests whose Host header isn't localhost, as
    // a security measure. Tunnels rewrite the Host header to their own
    // domain, so we allow any host here. Fine for local dev; don't do this
    // for a real production deployment.
    allowedHosts: true,
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
});
