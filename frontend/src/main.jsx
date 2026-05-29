import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import axios from 'axios';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)


// Forces EVERY frontend tab network request to completely bypass browser caching structures globally
axios.interceptors.request.use((config) => {
  const separator = config.url.includes('?') ? '&' : '?';
  config.url = `${config.url}${separator}nocache_engine_t=${Date.now()}`;
  return config;
});