import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx' // ✅ 加上 .tsx 后缀，强制 Vite 查找精确文件
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
