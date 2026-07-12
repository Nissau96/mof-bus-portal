import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import BookTicket from "./pages/BookTicket";
import SupabaseTest from "./pages/SupabaseTest";

/**
 * Main application router.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/book" element={<BookTicket />} />
        <Route path="/supabase-test" element={<SupabaseTest />} />
      </Routes>
    </BrowserRouter>
  );
}