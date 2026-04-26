import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// LOGIKA PAKSA THEME
const theme = localStorage.getItem('theme');
if (theme === 'dark' || !theme) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)