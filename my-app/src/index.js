import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

// Service Worker Logic
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
   // unregister हटाकर register लिखें
serviceWorkerRegistration.register();
      .then((reg) => console.log('SW Good:', reg))
      .catch((err) => console.log('SW Bad:', err));
  });
}