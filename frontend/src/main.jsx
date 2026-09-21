import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { HashRouter } from 'react-router-dom';
import axios from 'axios';
import './i18n';
import GlobalErrorBoundary from './components/GlobalErrorBoundary';

// Global Axios Interceptor for 401 Unauthorized handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Global Interceptor: 401 Unauthorized. Redirecting to splash.");
      localStorage.removeItem('token');
      localStorage.removeItem('farmId');
      window.location.hash = '#/splash';
    }
    return Promise.reject(error);
  }
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <GlobalErrorBoundary>
        <App />
      </GlobalErrorBoundary>
    </HashRouter>
  </React.StrictMode>,
)
