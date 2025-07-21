import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { HelmetProvider } from 'react-helmet-async';

// Security headers wrapper component
const SecurityWrapper = ({ children }: { children: React.ReactNode }) => (
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

createRoot(document.getElementById("root")!).render(<SecurityWrapper><App /></SecurityWrapper>);