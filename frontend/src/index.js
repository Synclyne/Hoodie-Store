import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ✅ ONE style block only
const style = document.createElement('style');

style.innerHTML = `
@media (max-width: 768px) {
  input,
  select,
  textarea {
    font-size: 16px !important;
  }
}

@media (max-width: 768px) {

  /* Navbar */
  .desktop-links { display: none !important; }
  .hamburger { display: block !important; }
  .mobile-menu { display: flex !important; flex-direction: column; }

  /* Shop sidebar */
  .shop-sidebar {
    position: fixed !important;
    left: 0;
    top: 0;
    height: 100vh !important;
    width: 260px;
    background: #f5f3ef;
    z-index: 300;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .filter-toggle { display: block !important; }
  .close-filters { display: block !important; }
}
`;

document.head.appendChild(style);
