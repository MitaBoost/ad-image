import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AdImageGenerator from './AdImageGenerator'; // or './App' if you didn't rename the file

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AdImageGenerator />
  </React.StrictMode>,
);
