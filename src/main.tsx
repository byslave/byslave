import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

void import('@capacitor/status-bar')
  .then(async ({ StatusBar, Style }) => {
    try {
      await StatusBar.setStyle({ style: Style.Dark })
      await StatusBar.setBackgroundColor({ color: '#070A16' })
    } catch {
      /* tarayıcı */
    }
  })
  .catch(() => {
    /* tarayıcı */
  })
