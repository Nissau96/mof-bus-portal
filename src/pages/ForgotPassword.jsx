import { useState } from "react";
import { ArrowLeft, Mail, Send } from "lucide-react";

import AuthShell from "../components/auth/AuthShell";
import FormInput from "../components/auth/FormInput";
import { supabase } from "../lib/supabaseClient";
import { Link } from "react-router-dom";
import { useToast } from "../context/useToast";


/**
 * Forgot Password page.
 *
 * Sends a Supabase password reset email to the user.
 */
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const { showToast } = useToast();

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanedEmail = email.trim();

    if (!cleanedEmail) {
      showToast({
  type: "warning",
  title: "Email required",
  message: "Please enter your email address.",
});
      return;
    }

    try {
      setIsSubmitting(true);
      setSuccessMessage("");

      const redirectTo = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(
        cleanedEmail,
        {
          redirectTo,
        }
      );

      if (error) {
        throw error;
      }

      setSuccessMessage(
        "Password reset instructions have been sent to your email address."
      );

      showToast({
  type: "success",
  title: "Reset link sent",
  message: "Please check your email for password reset instructions.",
});
    } catch (error) {
      showToast({
  type: "error",
  title: "Could not send reset link",
  message: error.message || "Could not send password reset email.",
});
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Forgot Password"
      subtitle="Reset your Ministry of Finance bus portal password"
    >
      <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
        <div className="relative">
          <FormInput
            id="email"
            label="Email Address"
            type="email"
            placeholder="name@mofep.gov.gh"
            value={email}
            onChange={setEmail}
          />

          <Mail
            className="pointer-events-none absolute bottom-3 left-3 hidden text-mof-text-muted"
            size={18}
          />
        </div>

        {successMessage && (
          <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-mof-primary">
            {successMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn min-h-12 w-full rounded-xl border-0 bg-mof-primary text-white hover:bg-mof-primary-container disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send size={18} />
          {isSubmitting ? "Sending..." : "Send Reset Link"}
        </button>

        <Link
          href="/"
          className="btn min-h-12 w-full rounded-xl border border-mof-border bg-white text-mof-text hover:bg-mof-surface-muted"
        >
          <ArrowLeft size={18} />
          Back to Login
        </Link>
      </form>
    </AuthShell>
  );
}