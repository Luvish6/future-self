import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { applyTheme } from './lib/theme'
import { injectWorldCss } from './lib/worlds'

applyTheme()
injectWorldCss()
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
