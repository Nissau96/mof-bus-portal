import { BrowserRouter, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import BookTicket from "./pages/BookTicket";
import SupabaseTest from "./pages/SupabaseTest";
import Profile from "./pages/Profile";
import BookingHistory from "./pages/BookingHistory";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";

import AdminDashboard from "./pages/AdminDashboard";
import AdminTickets from "./pages/AdminTickets";
import AdminUsers from "./pages/AdminUsers";
import AdminSettings from "./pages/AdminSettings";
import AdminAuditLogs from "./pages/AdminAuditLogs";
import AdminPrivilegedUsers from "./pages/AdminPrivilegedUsers";
import AdminBookingHistory from "./pages/AdminBookingHistory";
import AdminPublicHolidays from "./pages/AdminPublicHolidays";
import AdminMaintenance from "./pages/AdminMaintenance";
import AdminManifest from "./pages/AdminManifest";

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
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
      </Routes>
    </BrowserRouter>
  );
}