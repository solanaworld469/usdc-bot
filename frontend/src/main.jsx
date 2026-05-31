import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AdminTabRouter from './admin/AdminTabRouter.jsx' // 👑 Pulls in the Admin Module
import './index.css'
import axios from 'axios';

// 🧭 Intercept the URL path before rendering the app
const currentPath = window.location.pathname;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* If the URL is exactly /admin, load the Godmode Dashboard. Otherwise, load the normal user app! */}
    {currentPath === '/admin' ? <AdminTabRouter /> : <App />}
  </React.StrictMode>,
)

// Forces EVERY frontend tab network request to completely bypass browser caching structures globally
axios.interceptors.request.use((config) => {
  const separator = config.url.includes('?') ? '&' : '?';
  config.url = `${config.url}${separator}nocache_engine_t=${Date.now()}`;
  return config;
});