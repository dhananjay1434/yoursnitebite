
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { createContext, useContext, useEffect } from "react";
import { HelmetProvider } from 'react-helmet-async';
import { supabase } from "./supabaseClient";
import { initializeSecurity } from "@/lib/security";
import { setupGlobalErrorHandling, logger, LogCategory } from "@/services/logging";
import ErrorBoundary from "@/components/ErrorBoundary";

// Import the getValidCSRFToken function directly to avoid path issues
const getValidCSRFToken = () => {
  // Generate a token if none exists
  let token = sessionStorage.getItem('csrf_token');
  if (!token) {
    // Generate a random token
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    sessionStorage.setItem('csrf_token', token);
    localStorage.setItem('csrf_token_backup', token);
  }
  return token;
};

import Index from "./pages/Index";
import Products from "./pages/Products";
import Checkout from "./pages/Checkout";
import SecureOrderDetails from "./pages/SecureOrderDetails";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Account from "./pages/Account";
import BoxBuilder from "./pages/BoxBuilder";
import SnackBoxSelector from "./pages/SnackBoxSelector";

// Create Supabase Context
const SupabaseContext = createContext(supabase);
export const useSupabase = () => useContext(SupabaseContext);

const queryClient = new QueryClient();

const App = () => {
  // ✅ SECURE: Initialize security measures and logging on app load
  useEffect(() => {
    // Initialize comprehensive security
    initializeSecurity();

    // Setup global error handling
    setupGlobalErrorHandling();

    // Legacy CSRF token for compatibility
    const token = getValidCSRFToken();

    // Log application startup
    logger.info(LogCategory.SYSTEM, 'Application initialized', {
      version: '1.0.0',
      environment: import.meta.env.MODE,
      timestamp: new Date().toISOString(),
    });

    console.log('✅ Security and logging initialized, CSRF Token:', token.substring(0, 4) + '...');
  }, []);

  return (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SupabaseContext.Provider value={supabase}>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order-details" element={<SecureOrderDetails />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/box-builder" element={<BoxBuilder />} />
                  <Route path="/snack-boxes" element={<SnackBoxSelector />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AnimatePresence>
            </BrowserRouter>
          </SupabaseContext.Provider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);
};

export default App;
