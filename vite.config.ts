
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Security headers plugin for development
const securityHeadersPlugin = () => ({
  name: 'security-headers',
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      // Set security headers for development
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.gpteng.co",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data: https://cdn.fontshare.com",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co ws://localhost:*",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; '));
      next();
    });
  }
});

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    mode === 'development' && securityHeadersPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize for production and SEO
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select'],
          router: ['react-router-dom'],
          seo: ['react-helmet-async', 'react-schemaorg'],
        },
        // Optimize chunk names for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Optimize for Core Web Vitals
    target: 'es2015',
    cssCodeSplit: true,
    assetsInlineLimit: 4096, // Inline small assets
    // Ensure SEO files are copied to build output
    copyPublicDir: true,
  },
}));
