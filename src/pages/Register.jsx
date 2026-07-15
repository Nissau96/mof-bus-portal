import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import AuthShell from "../components/auth/AuthShell";
import AuthTabs from "../components/auth/AuthTabs";
import FormInput from "../components/auth/FormInput";
import RouteSelect from "../components/auth/RouteSelect";
import DivisionSelect from "../components/auth/DivisionSelect";
import BusRouteSelect from "../components/auth/BusRouteSelect";
import { useToast } from "../context/useToast";
import { apiFetch } from "../lib/api";

/**
 * Registration page.
 *
 * Staff registration includes Staff ID and Ministry email.
 * Intern/NSP registration uses email only.
 *
 * The page is mobile-first and expands cleanly on tablets/desktops.
 */
export default function Register() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState("staff");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    staffId: "",
    fullName: "",
    email: "",
    phone: "",
    division: "",
    busRoute: "",
    dropoffLocation: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  });

  function updateField(fieldName, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [fieldName]: value,
    }));
  }

  function validateForm() {
    if (activeTab === "staff" && !form.staffId.trim()) {
      showToast({
        type: "warning",
        title: "Staff ID required",
        message: "Enter your Staff ID before creating your account.",
      });
      return false;
    }

    if (!form.fullName.trim()) {
      showToast({
        type: "warning",
        title: "Full name required",
        message: "Enter your full name before creating your account.",
      });
      return false;
    }

    if (!form.email.trim()) {
      showToast({
        type: "warning",
        title: "Email required",
        message: "Enter your email address before creating your account.",
      });
      return false;
    }

    if (!form.phone.trim()) {
      showToast({
        type: "warning",
        title: "Phone number required",
        message: "Enter your phone number before creating your account.",
      });
      return false;
    }

    if (!form.division) {
      showToast({
        type: "warning",
        title: "Division required",
        message: "Please select your division.",
      });
      return false;
    }

    if (!form.busRoute) {
      showToast({
        type: "warning",
        title: "Bus route required",
        message: "Please select your bus route.",
      });
      return false;
    }

    if (!form.dropoffLocation) {
      showToast({
        type: "warning",
        title: "Drop-off location required",
        message: "Please select your preferred drop-off location.",
      });
      return false;
    }

    if (form.password.length < 8) {
      showToast({
        type: "warning",
        title: "Password too short",
        message: "Password must be at least 8 characters.",
      });
      return false;
    }

    if (form.password !== form.confirmPassword) {
      showToast({
        type: "warning",
        title: "Passwords do not match",
        message: "Confirm that both password fields contain the same value.",
      });
      return false;
    }

    if (!form.acceptedTerms) {
      showToast({
        type: "warning",
        title: "Terms required",
        message: "Please accept the Terms of Service and Privacy Policy.",
      });
      return false;
    }

    return true;
  }

  async function handleRegister(event) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        staffId: form.staffId.trim(),
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        division: form.division,
        busRoute: form.busRoute,
        dropoffLocation: form.dropoffLocation,
        password: form.password,
      };

      const endpoint =
        activeTab === "staff"
          ? "/api/auth/register-staff"
          : "/api/auth/register-intern";

      const data = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      showToast({
        type: "success",
        title: "Account created",
        message:
          data.message ||
          "Your account has been created successfully. You can now log in.",
      });

      navigate("/", { replace: true });
    } catch (error) {
      showToast({
        type: "error",
        title: "Registration failed",
        message: error.message || "Could not create your account.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Create Account"
      subtitle="Register for the MOF Staff Bus service"
      wide
    >
      <AuthTabs activeTab={activeTab} onChange={setActiveTab} />

      <form onSubmit={handleRegister} className="space-y-4 p-5 sm:p-6">
        {activeTab === "staff" && (
          <FormInput
            id="staffId"
            label="Staff ID"
            placeholder="e.g. MOF-12345"
            value={form.staffId}
            onChange={(value) => updateField("staffId", value)}
          />
        )}

        <FormInput
          id="fullName"
          label="Full Name"
          placeholder="As it appears on your ID"
          value={form.fullName}
          onChange={(value) => updateField("fullName", value)}
        />

        <FormInput
          id="email"
          label={activeTab === "staff" ? "Ministry Email" : "Email Address"}
          type="email"
          placeholder={
            activeTab === "staff" ? "name@mofep.gov.gh" : "name@example.com"
          }
          value={form.email}
          onChange={(value) => updateField("email", value)}
        />

        <FormInput
          id="phone"
          label="Phone Number"
          placeholder="+233 XX XXX XXXX"
          value={form.phone}
          onChange={(value) => updateField("phone", value)}
        />

        <DivisionSelect
          value={form.division}
          onChange={(value) => updateField("division", value)}
        />

        <BusRouteSelect
          value={form.busRoute}
          onChange={(value) => updateField("busRoute", value)}
        />

        <RouteSelect
          value={form.dropoffLocation}
          onChange={(value) => updateField("dropoffLocation", value)}
        />

        <FormInput
          id="password"
          label="Password"
          type="password"
          placeholder="Minimum 8 characters"
          value={form.password}
          onChange={(value) => updateField("password", value)}
        />

        <FormInput
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          value={form.confirmPassword}
          onChange={(value) => updateField("confirmPassword", value)}
        />

        <label className="flex items-start gap-3 text-sm leading-6 text-mof-text">
          <input
            type="checkbox"
            checked={form.acceptedTerms}
            onChange={(event) =>
              updateField("acceptedTerms", event.target.checked)
            }
            className="checkbox checkbox-sm mt-1 border-mof-border"
          />

          <span>
            I agree to the{" "}
            <Link to="/terms" className="font-semibold text-mof-primary">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="font-semibold text-mof-primary">
              Privacy Policy
            </Link>
          </span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn min-h-12 w-full rounded-xl border-0 bg-mof-primary text-white hover:bg-mof-primary-container disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creating Account..." : "Create Account"}
          {!isSubmitting && <ArrowRight size={18} />}
        </button>
      </form>

      <div className="rounded-b-2xl border-t border-mof-border bg-mof-surface-muted p-5 text-center text-sm">
        Already have an account?{" "}
        <Link to="/" className="font-semibold text-mof-primary hover:underline">
          Log in
        </Link>
      </div>
    </AuthShell>
  );
}