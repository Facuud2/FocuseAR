import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Increase warning limit for chunk size (in KB) to reduce noisy warnings
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // More granular manualChunks: split by npm package so a single "vendor"
        // bundle doesn't grow too large. Scoped packages handled as @scope/name.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          const parts = id.split('node_modules/').pop()?.split('/');
          if (!parts || parts.length === 0) return undefined;
          // Handle scoped packages like @scope/name
          let pkg = parts[0];
          if (pkg.startsWith('@') && parts.length >= 2) {
            pkg = `${pkg}/${parts[1]}`;
          }
          // sanitize chunk name
          const chunkName = `vendor.${pkg.replace('@', '').replace('/', '_')}`;
          return chunkName;
        },
      },
    },
  },
});
