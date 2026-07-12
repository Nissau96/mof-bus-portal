import { useState } from "react";
import { ArrowRight } from "lucide-react";
import AuthShell from "../components/auth/AuthShell";
import AuthTabs from "../components/auth/AuthTabs";
import FormInput from "../components/auth/FormInput";
import RouteSelect from "../components/auth/RouteSelect";

/**
 * Registration page.
 * Staff registration includes Staff ID and Ministry email.
 * Intern/NSP registration uses email only.
 * The page is mobile-first and expands cleanly on tablets/desktops.
 */
export default function Register() {
  const [activeTab, setActiveTab] = useState("staff");

  const [form, setForm] = useState({
    staffId: "",
    fullName: "",
    email: "",
    phone: "",
    dropoffLocation: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  });

  function updateField(fieldName, value) {
    // Keeps all form state in one object.
    setForm((currentForm) => ({
      ...currentForm,
      [fieldName]: value,
    }));
  }

  function handleRegister(event) {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (!form.acceptedTerms) {
      alert("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    // Placeholder only.
    // In a later step, this will send the data to the registration API.
    alert(
      activeTab === "staff"
        ? `Staff registration placeholder for: ${form.staffId}`
        : `Intern/NSP registration placeholder for: ${form.email}`
    );
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
          placeholder={activeTab === "staff" ? "name@mofep.gov.gh" : "name@example.com"}
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
            <a href="/terms" className="font-semibold text-mof-primary">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="font-semibold text-mof-primary">
              Privacy Policy
            </a>
          </span>
        </label>

        <button
          type="submit"
          className="btn min-h-12 w-full rounded-xl border-0 bg-mof-primary text-white hover:bg-mof-primary-container"
        >
          Create Account
          <ArrowRight size={18} />
        </button>
      </form>

      <div className="rounded-b-2xl border-t border-mof-border bg-mof-surface-muted p-5 text-center text-sm">
        Already have an account?{" "}
        <a href="/" className="font-semibold text-mof-primary hover:underline">
          Log in
        </a>
      </div>
    </AuthShell>
  );
}