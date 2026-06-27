import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css' // Phải có dòng này để Tailwind chạy
import 'leaflet/dist/leaflet.css';

// Read saved language from localStorage so the app renders in the correct
// language immediately (avoids flash-of-default-language).
const savedLang = typeof window !== 'undefined' ? localStorage.getItem('demi_mart_lang') : null;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Pass savedLang into App via global variable on window so App can forward it */}
    <App initialLanguage={savedLang} />
  </React.StrictMode>
)