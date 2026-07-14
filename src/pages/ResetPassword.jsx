import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";

import AuthShell from "../components/auth/AuthShell";
import FormInput from "../components/auth/FormInput";
import { supabase } from "../lib/supabaseClient";

const USER_PROFILE_CACHE_KEY = "mof_bus_profile";

/**
 * Reset Password page.
 *
 * Allows a user to set a new password after opening the reset link.
 */
export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function prepareRecoverySession() {
      try {
        const hashParams = new URLSearchParams(
          window.location.hash.replace("#", "")
        );

        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }
        }

        if (isMounted) {
          setIsReady(true);
        }
      } catch (error) {
        alert(error.message || "Could not prepare password reset session.");

        if (isMounted) {
          setIsReady(false);
        }
      }
    }

    prepareRecoverySession();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!password) {
      alert("Please enter your new password.");
      return;
    }

    if (password.length < 8) {
      alert("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      setSuccessMessage("");

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      window.localStorage.removeItem(USER_PROFILE_CACHE_KEY);

      setSuccessMessage(
        "Your password has been updated. You can now log in again."
      );

      setTimeout(() => {
  navigate("/", { replace: true });
}, 1500);
    } catch (error) {
      alert(error.message || "Could not update password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Reset Password"
      subtitle="Create a new password for your account"
    >
      <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
        {!isReady && (
          <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-mof-text">
            Preparing password reset session...
          </div>
        )}

        <div className="relative">
          <FormInput
            id="password"
            label="New Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter new password"
            value={password}
            onChange={setPassword}
          />

          <LockKeyhole
            className="pointer-events-none absolute bottom-3 left-3 hidden text-mof-text-muted"
            size={18}
          />

          <button
            type="button"
            onClick={() => setShowPassword((currentValue) => !currentValue)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
            className="absolute bottom-3 right-3 text-mof-text-muted hover:text-mof-primary"
          >
            {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>

        <div className="relative">
          <FormInput
            id="confirmPassword"
            label="Confirm New Password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
          />

          <LockKeyhole
            className="pointer-events-none absolute bottom-3 left-3 hidden text-mof-text-muted"
            size={18}
          />

          <button
            type="button"
            onClick={() =>
              setShowConfirmPassword((currentValue) => !currentValue)
            }
            aria-label={
              showConfirmPassword
                ? "Hide confirm password"
                : "Show confirm password"
            }
            title={
              showConfirmPassword
                ? "Hide confirm password"
                : "Show confirm password"
            }
            className="absolute bottom-3 right-3 text-mof-text-muted hover:text-mof-primary"
          >
            {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>

        {successMessage && (
          <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-mof-primary">
            <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!isReady || isSubmitting}
          className="btn min-h-12 w-full rounded-xl border-0 bg-mof-primary text-white hover:bg-mof-primary-container disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Updating..." : "Update Password"}
          {!isSubmitting && <ArrowRight size={18} />}
        </button>

        <Link
          href="/"
          className="btn min-h-12 w-full rounded-xl border border-mof-border bg-white text-mof-text hover:bg-mof-surface-muted"
        >
          Back to Login
        </Link>
      </form>
    </AuthShell>
  );
}