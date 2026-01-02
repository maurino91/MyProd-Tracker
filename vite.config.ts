import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carica le variabili d'ambiente (es. da Vercel o .env locale)
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Questo permette al codice esistente "process.env.API_KEY" di funzionare
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})