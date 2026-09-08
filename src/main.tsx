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
  .then(({ StatusBar, Style }) => {
    void StatusBar.setStyle({ style: Style.Dark })
    void StatusBar.setBackgroundColor({ color: '#070A16' })
  })
  .catch(() => {
    /* tarayıcı */
  })
