import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PublicRoute } from "@/components/auth/PublicRoute";

// Auth Pages
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import VerifyPhone from "@/pages/VerifyPhone";

// Passenger Pages
import PassengerDashboard from "@/pages/PassengerDashboard";
import ReportItem from "@/pages/ReportItem";
import MyReports from "@/pages/MyReports";
import ReportDetail from "@/pages/ReportDetail";

// Driver Pages
import DriverDashboard from "@/pages/DriverDashboard";
import DriverReports from "@/pages/DriverReports";
import DriverVerification from "@/pages/DriverVerification";
import SmartMatch from "@/pages/SmartMatch";

// Shared Pages
import Conversations from "@/pages/Conversations";
import Chat from "@/pages/Chat";
import Profile from "@/pages/Profile";
import EditProfile from "@/pages/EditProfile";
import Notifications from "@/pages/Notifications";
import Rewards from "@/pages/Rewards";
import Settings from "@/pages/Settings";
import Support from "@/pages/Support";
import Emergency from "@/pages/Emergency";
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
            <Route path="/report-item" element={
              <ProtectedRoute requiredUserType="passenger"><ReportItem /></ProtectedRoute>
            } />
            <Route path="/my-reports" element={
              <ProtectedRoute requiredUserType="passenger"><MyReports /></ProtectedRoute>
            } />
            <Route path="/report/:id" element={
              <ProtectedRoute requiredUserType="passenger"><ReportDetail /></ProtectedRoute>
            } />

            {/* Protected Driver Routes */}
            <Route path="/driver/dashboard" element={
              <ProtectedRoute requiredUserType="driver"><DriverDashboard /></ProtectedRoute>
            } />
            <Route path="/driver/reports" element={
              <ProtectedRoute requiredUserType="driver"><DriverReports /></ProtectedRoute>
            } />
            <Route path="/driver/verification" element={
              <ProtectedRoute requiredUserType="driver"><DriverVerification /></ProtectedRoute>
            } />
            <Route path="/driver/smart-match" element={
              <ProtectedRoute requiredUserType="driver"><SmartMatch /></ProtectedRoute>
            } />

            {/* Shared Protected Routes */}
            <Route path="/conversations" element={<ProtectedRoute><Conversations /></ProtectedRoute>} />
            <Route path="/chat/:conversationId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/rewards" element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
            <Route path="/emergency" element={<ProtectedRoute><Emergency /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
