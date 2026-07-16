import { BrowserRouter, Route, Routes } from "react-router-dom";

import AdminRoute from "./components/auth/AdminRoute";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicRoute from "./components/auth/PublicRoute";

import AdminAuditLogs from "./pages/AdminAuditLogs";
import AdminBookingHistory from "./pages/AdminBookingHistory";
import AdminDashboard from "./pages/AdminDashboard";
import AdminMaintenance from "./pages/AdminMaintenance";
import AdminManifest from "./pages/AdminManifest";
import AdminPrivilegedUsers from "./pages/AdminPrivilegedUsers";
import AdminPublicHolidays from "./pages/AdminPublicHolidays";
import AdminSettings from "./pages/AdminSettings";
import AdminTickets from "./pages/AdminTickets";
import AdminUsers from "./pages/AdminUsers";
import BookingHistory from "./pages/BookingHistory";
import BookTicket from "./pages/BookTicket";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import SupabaseTest from "./pages/SupabaseTest";

function ProtectedAdminPage({ children }) {
  return (
    <ProtectedRoute>
      <AdminRoute>{children}</AdminRoute>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/book"
          element={
            <ProtectedRoute>
              <BookTicket />
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <BookingHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/supabase-test"
          element={
            <ProtectedRoute>
              <SupabaseTest />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedAdminPage>
              <AdminDashboard />
            </ProtectedAdminPage>
          }
        />

        <Route
          path="/admin/tickets"
          element={
            <ProtectedAdminPage>
              <AdminTickets />
            </ProtectedAdminPage>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedAdminPage>
              <AdminUsers />
            </ProtectedAdminPage>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <ProtectedAdminPage>
              <AdminSettings />
            </ProtectedAdminPage>
          }
        />

        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedAdminPage>
              <AdminAuditLogs />
            </ProtectedAdminPage>
          }
        />

        <Route
          path="/admin/privileged-users"
          element={
            <ProtectedAdminPage>
              <AdminPrivilegedUsers />
            </ProtectedAdminPage>
          }
        />

        <Route
          path="/admin/booking-history"
          element={
            <ProtectedAdminPage>
              <AdminBookingHistory />
            </ProtectedAdminPage>
          }
        />

        <Route
          path="/admin/public-holidays"
          element={
            <ProtectedAdminPage>
              <AdminPublicHolidays />
            </ProtectedAdminPage>
          }
        />

        <Route
          path="/admin/maintenance"
          element={
            <ProtectedAdminPage>
              <AdminMaintenance />
            </ProtectedAdminPage>
          }
        />

        <Route
          path="/admin/manifest"
          element={
            <ProtectedAdminPage>
              <AdminManifest />
            </ProtectedAdminPage>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}