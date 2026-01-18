import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import HanziVGExplorer from './research/HanziVGExplorer.jsx'
import HanziKaitiExplorer from './research/HanziKaitiExplorer.jsx'
import './index.css'

const pathname = window.location.pathname;
const isKaitiDemo = pathname.includes('kaiti');
const isVGExplorer = pathname.includes('research') || pathname.includes('hanzi');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isKaitiDemo ? <HanziKaitiExplorer /> : (isVGExplorer ? <HanziVGExplorer /> : <App />)}
  </React.StrictMode>,
)
