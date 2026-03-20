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
  const [role, setRole] = useState<"admin" | "user" | null>(null);

  // keep user after refresh
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedRole = localStorage.getItem("role");
    if (savedUser) setUser(savedUser);
    if (savedRole) setRole(savedRole as "admin" | "user");
  }, []);

  const handleLogin = (username: string) => {
    const userRole =
      username.toLowerCase() === "admin"
        ? "admin"
        : "user";
    localStorage.setItem("user", username);
    localStorage.setItem("role", userRole);
    setUser(username);
    setRole(userRole);
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

            {/* USER DASHBOARD */}
            <Route
              path="/"
              element={
                user ? <Index username={user} /> : <Navigate to="/login" />
              }
            />  
            {/* ADMIN DASHBOARD */}
            <Route
              path="/admin"
              element={
                user && role === "admin"
                  ? <Index username={user} isAdmin={true} />
                  : <Navigate to="/login" />
              }
            />


            {/* FALLBACK */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
