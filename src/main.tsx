import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // ✅ 只要你把 App.tsx 移进了 src，这行就能找到文件
import './index.css'   // ✅ 这行对应你 src 里的 index.css

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
