import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'

// Static / prerendered head tags are for crawlers without JS; each page's <Seo> renders its own.
document.querySelectorAll('head [data-seo]').forEach((node) => node.remove())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
