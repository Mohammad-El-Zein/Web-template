import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import './index.css'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
// Nach Bootstrap laden, damit die Bootstrap-Farben auf die Markenfarben umgestellt werden
import './theme.css';
import { StoreContextProvider } from './context/StoreContext.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import "./i18n.js";

// Einstellungen zuerst laden, damit Sprache und Farben stimmen, bevor die Gerichte geladen werden
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <SettingsProvider>
  <StoreContextProvider>
     <App />
  </StoreContextProvider>
  </SettingsProvider>
  </BrowserRouter>
)
