import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Custom CSS file if needed
import App from './App';
import Footer from "./Footer";
import Background from './Background';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
      <Background />
    <App />
    <Footer/>
  </React.StrictMode>
);
