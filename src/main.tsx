import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import AdminPanel from './AdminPanel.tsx';
import ClientPortal from './ClientPortal.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/*" element={<App />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/client" element={<ClientPortal />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
);
