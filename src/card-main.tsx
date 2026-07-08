import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import StandaloneBusinessCard from './StandaloneBusinessCard.tsx';
import './index.css';

createRoot(document.getElementById('card-root')!).render(
  <StrictMode>
    <BrowserRouter>
      <StandaloneBusinessCard />
    </BrowserRouter>
  </StrictMode>,
);
