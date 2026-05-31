import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/global.css';
import AppRouter from './router';

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);
