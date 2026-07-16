import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";

import AuthShell from "../components/auth/AuthShell";
import AuthTabs from "../components/auth/AuthTabs";
import FormInput from "../components/auth/FormInput";
import { useToast } from "../context/useToast";
import { apiFetch } from "../lib/api";
import { saveSupabaseSession } from "../lib/auth";
import { setCachedProfile } from "../lib/profileCache";
import { supabase } from "../lib/supabaseClient";

/**
 * Login page.
 *
 * Staff/Admin users log in with Staff ID + password.
 * Intern/NSP users log in with email + password.
 *
 * After successful login, the user's profile is cached in localStorage
 * so DashboardShell can render the correct navigation instantly.
 */
export default function Login() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState("staff");
  const [staffId, setStaffId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleStaffLogin() {
    const data = await apiFetch("/api/auth/login-staff", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        staffId: staffId.trim(),
        password,
      }),
    });

    if (!data?.session) {
      throw new Error("Login succeeded but no session was returned.");
    }

    await saveSupabaseSession(data.session);

    setCachedProfile(data.profile);

    navigate(data.profile?.role === "admin" ? "/admin" : "/dashboard", {
      replace: true,
    });
  }

  async function handleInternLogin() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      throw new Error("Invalid email or password.");
    }

    await saveSupabaseSession(data.session);

    const profileData = await apiFetch("/api/profile/me");

    setCachedProfile(profileData.profile);

    navigate("/dashboard", { replace: true });
  }

  async function handleLogin(event) {
    event.preventDefault();

    if (activeTab === "staff" && !staffId.trim()) {
      showToast({
        type: "warning",
        title: "Staff ID required",
        message: "Please enter your Staff ID.",
      });
      return;
    }

    if (activeTab === "intern" && !email.trim()) {
      showToast({
        type: "warning",
        title: "Email required",
        message: "Please enter your email address.",
      });
      return;
    }

    if (!password) {
      showToast({
        type: "warning",
        title: "Password required",
        message: "Please enter your password.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      if (activeTab === "staff") {
        await handleStaffLogin();
        return;
      }

      await handleInternLogin();
    } catch (error) {
      showToast({
        type: "error",
        title: "Login failed",
        message: error.message || "Could not complete login.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {isSubmitting && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 flex items-center justify-center bg-mof-bg/90 px-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm rounded-3xl border border-mof-border bg-mof-surface p-6 text-center shadow-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-mof-border bg-mof-surface-muted p-2 shadow-sm">
              <img
                src="/moflogo.png"
                alt="Ministry of Finance Ghana logo"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="mx-auto mt-6 h-10 w-10 animate-spin rounded-full border-4 border-mof-border border-t-mof-primary" />

            <h2 className="mt-5 text-xl font-bold text-mof-text">
              Signing you in...
            </h2>

            <p className="mt-2 text-sm leading-6 text-mof-text-muted">
              Please wait while we verify your account.
            </p>
          </div>
        </div>
      )}

      <AuthShell title="Login" subtitle="Transport Booking Portal">
        <AuthTabs activeTab={activeTab} onChange={setActiveTab} />

        <form onSubmit={handleLogin} className="space-y-5 p-5 sm:p-6">
          {activeTab === "staff" ? (
            <div className="relative">
              <FormInput
                id="staffId"
                label="Staff ID"
                placeholder="Enter your Staff ID"
                value={staffId}
                onChange={setStaffId}
                disabled={isSubmitting}
              />

              <UserRound
                className="pointer-events-none absolute bottom-3 left-3 hidden text-mof-text-muted"
                size={18}
              />
            </div>
          ) : (
            <FormInput
              id="email"
              label="Email Address"
              type="email"
              placeholder="name@mof.gov.gh"
              value={email}
              onChange={setEmail}
              disabled={isSubmitting}
            />
          )}

          <div className="relative">
            <FormInput
              id="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={setPassword}
              disabled={isSubmitting}
            />

            <LockKeyhole
              className="pointer-events-none absolute bottom-3 left-3 hidden text-mof-text-muted"
              size={18}
            />

            <button
              type="button"
              onClick={() => setShowPassword((currentValue) => !currentValue)}
              disabled={isSubmitting}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
              className="absolute bottom-3 right-3 text-mof-text-muted hover:text-mof-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-mof-text">
              <input
                type="checkbox"
                disabled={isSubmitting}
                className="checkbox checkbox-sm border-mof-border disabled:cursor-not-allowed disabled:opacity-60"
              />
              Remember me
            </label>

            <Link
              to="/forgot-password"
              className="text-sm font-semibold text-mof-primary hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn min-h-12 w-full rounded-xl border-0 bg-mof-primary text-white hover:bg-mof-primary-container disabled:cursor-not-allowed disabled:opacity-60"
          >
            Sign In
            <ArrowRight size={18} />
          </button>

          <Link
            to="/register"
            className="btn min-h-12 w-full rounded-xl border border-mof-border bg-white text-mof-text hover:bg-mof-surface-muted"
          >
            Create Account
          </Link>
        </form>
      </AuthShell>
    </>
  );
}