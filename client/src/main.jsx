import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/contexts/AuthProvider"

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TooltipProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </TooltipProvider>
  </React.StrictMode>
)