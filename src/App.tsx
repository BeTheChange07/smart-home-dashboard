import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login"; 

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<string | null>(null);

  // keep user after refresh
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(savedUser);
  }, []);

  const handleLogin = (username: string) => {
    localStorage.setItem("user", username);
    setUser(username);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* LOGIN PAGE */}
            <Route path="/login" element={<Login onLogin={handleLogin} />} />

            {/* PROTECTED DASHBOARD */}
            <Route
              path="/"
              element={
                user ? <Index username={user} /> : <Navigate to="/login" />
              }
            />

            {/* CATCH ALL */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
