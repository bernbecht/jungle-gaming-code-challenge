import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import '@fontsource/ibm-plex-mono/latin-600.css'
import '@fontsource/ibm-plex-mono/latin-700.css'
import '@/styles.css'
import { AppProviders } from '@/app/providers'

const root = document.getElementById('root')
if (!root) throw new Error('Elemento raiz da aplicação não encontrado.')

createRoot(root).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>,
)
