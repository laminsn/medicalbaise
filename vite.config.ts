import { defineConfig, type Plugin, type PreviewServer, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { getFxResponse } from "./api/fx";

function fxApiPlugin(): Plugin {
  const attach = (server: ViteDevServer | PreviewServer) => {
    server.middlewares.use(async (req, res, next) => {
      const url = req.url?.split("?")[0];
      if (url !== "/api/fx") {
        next();
        return;
      }
      try {
        const payload = await getFxResponse((req.headers || {}) as Record<string, string | string[] | undefined>);
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=3600");
        res.end(JSON.stringify(payload));
      } catch {
        res.statusCode = 503;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ error: "fx_unavailable", delayed: true }));
      }
    });
  };

  return {
    name: "baise-fx-api",
    configureServer: attach,
    configurePreviewServer: attach,
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(self), microphone=(self), geolocation=(self)",
      "Content-Security-Policy": [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net https://www.googletagmanager.com",
        "style-src 'self' 'unsafe-inline' https://api.mapbox.com https://fonts.googleapis.com",
        "img-src 'self' data: blob: https://*.supabase.co https://*.baiseapps.com https://www.facebook.com https://lh3.googleusercontent.com https://*.googleusercontent.com",
        "font-src 'self' data: https://fonts.gstatic.com",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.baiseapps.com wss://*.baiseapps.com https://api.mapbox.com https://events.mapbox.com https://connect.facebook.net https://www.google-analytics.com https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com",
        "frame-src 'self' https://checkout.stripe.com https://js.stripe.com https://accounts.google.com",
        "media-src 'self' blob: https://*.supabase.co https://*.baiseapps.com",
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
      ].join("; "),
      "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Resource-Policy": "same-origin",
    },
  },
  plugins: [react(), fxApiPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: mode !== "production",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") || id.includes("node_modules/react-router-dom")) {
            return "vendor-react";
          }
          if (id.includes("node_modules/@supabase")) {
            return "vendor-supabase";
          }
          if (id.includes("node_modules/@radix-ui")) {
            return "vendor-radix";
          }
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-")) {
            return "vendor-charts";
          }
          if (id.includes("node_modules/mapbox-gl")) {
            return "vendor-mapbox";
          }
        },
      },
    },
  },
}));
