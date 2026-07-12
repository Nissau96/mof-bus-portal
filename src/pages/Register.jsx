import { apiFetch } from "../lib/api";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import AuthShell from "../components/auth/AuthShell";
import AuthTabs from "../components/auth/AuthTabs";
import FormInput from "../components/auth/FormInput";
import RouteSelect from "../components/auth/RouteSelect";
import DivisionSelect from "../components/auth/DivisionSelect";
import BusRouteSelect from "../components/auth/BusRouteSelect";

/**
 * Registration page.
 * Staff registration includes Staff ID and Ministry email.
 * Intern/NSP registration uses email only.
 * The page is mobile-first and expands cleanly on tablets/desktops.
 */
export default function Register() {
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
        // Keeps all form state in one object.
        setForm((currentForm) => ({
            ...currentForm,
            [fieldName]: value,
        }));
    }

    async function handleRegister(event) {
        event.preventDefault();

        if (form.password !== form.confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        if (form.password.length < 8) {
            alert("Password must be at least 8 characters.");
            return;
        }

        if (!form.division) {
            alert("Please select your division.");
            return;
        }

        if (!form.busRoute) {
            alert("Please select your bus route.");
            return;
        }

        if (!form.dropoffLocation) {
            alert("Please select your preferred drop-off location.");
            return;
        }

        if (!form.acceptedTerms) {
            alert("Please accept the Terms of Service and Privacy Policy.");
            return;
        }

        try {
            setIsSubmitting(true);

            const payload = {
                staffId: form.staffId,
                fullName: form.fullName,
                email: form.email,
                phone: form.phone,
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

            alert(data.message);

            window.location.href = "/";
        } catch (error) {
            alert(error.message);
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
                    disabled={isSubmitting}
                    className="btn min-h-12 w-full rounded-xl border-0 bg-mof-primary text-white hover:bg-mof-primary-container disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSubmitting ? "Creating Account..." : "Create Account"}
                    {!isSubmitting && <ArrowRight size={18} />}
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
