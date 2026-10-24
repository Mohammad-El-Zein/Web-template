import React from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css'
import './i18n';
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Data-Router, damit useBlocker (Warnung bei ungespeicherten Änderungen) funktioniert.
// App behält ihre eigenen <Routes>, daher eine einzige Route für alle Pfade.
const router = createBrowserRouter([{ path: '*', element: <App /> }]);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
