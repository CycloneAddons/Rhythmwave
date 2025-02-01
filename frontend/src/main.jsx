import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Footer from "./Footer";
import Background from './Background';
import { Loading } from "./Loading";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Loading>
    <Background />
    <App />
    <Footer/>
    </Loading>
  </React.StrictMode>
);
