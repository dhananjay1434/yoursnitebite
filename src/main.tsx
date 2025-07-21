import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { HelmetProvider } from 'react-helmet-async';
import { initializeSecurity } from './lib/security';

// Initialize security measures
try {
  initializeSecurity();
} catch (error) {
  console.warn('Security initialization failed:', error);
}

// Security wrapper component
const SecurityWrapper = ({ children }: { children: React.ReactNode }) => (
  <HelmetProvider>
    {children}
  </HelmetProvider>
);

createRoot(document.getElementById("root")!).render(
  <SecurityWrapper>
    <App />
  </SecurityWrapper>
);