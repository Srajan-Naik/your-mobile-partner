import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PublicRoute } from "@/components/auth/PublicRoute";

// Pages
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import VerifyPhone from "@/pages/VerifyPhone";
import PassengerDashboard from "@/pages/PassengerDashboard";
import DriverDashboard from "@/pages/DriverDashboard";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/verify-phone" element={<VerifyPhone />} />

            {/* Protected Passenger Routes */}
            <Route path="/passenger/dashboard" element={
              <ProtectedRoute requiredUserType="passenger"><PassengerDashboard /></ProtectedRoute>
            } />

            {/* Protected Driver Routes */}
            <Route path="/driver/dashboard" element={
              <ProtectedRoute requiredUserType="driver"><DriverDashboard /></ProtectedRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
