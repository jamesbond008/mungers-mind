import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // 只要 App.tsx 在同级目录下，这样写就能找到
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
