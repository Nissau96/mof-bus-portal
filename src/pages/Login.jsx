import { supabase } from "../lib/supabaseClient";
import { apiFetch } from "../lib/api";
import { saveSupabaseSession } from "../lib/auth";
import { useState } from "react";
import { ArrowRight, Eye, LockKeyhole, UserRound } from "lucide-react";
import AuthShell from "../components/auth/AuthShell";
import AuthTabs from "../components/auth/AuthTabs";
import FormInput from "../components/auth/FormInput";

/**
 * Login page.
 * Staff users log in with Staff ID + password.
 * Intern/NSP users log in with email + password.
 * Backend authentication will be connected in a later step.
 */
export default function Login() {
    const [activeTab, setActiveTab] = useState("staff");
    const [staffId, setStaffId] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleLogin(event) {
        event.preventDefault();

        if (activeTab === "staff" && !staffId) {
            alert("Please enter your Staff ID.");
            return;
        }

        if (activeTab === "intern" && !email) {
            alert("Please enter your email address.");
            return;
        }

        if (!password) {
            alert("Please enter your password.");
            return;
        }

        try {
            setIsSubmitting(true);

            if (activeTab === "staff") {
                const data = await apiFetch("/api/auth/login-staff", {
                    method: "POST",
                    body: JSON.stringify({
                        staffId,
                        password,
                    }),
                });

                await saveSupabaseSession(data.session);

                window.location.href = "/dashboard";
                return;
            }

            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                throw error;
            }

            window.location.href = "/dashboard";
        } catch (error) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <AuthShell
            title="Authentication"
            subtitle="Ministry of Finance Transport Portal"
        >
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
                    />
                )}

                <div className="relative">
                    <FormInput
                        id="password"
                        label="Password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={setPassword}
                    />

                    <LockKeyhole
                        className="pointer-events-none absolute bottom-3 left-3 hidden text-mof-text-muted"
                        size={18}
                    />

                    <button
                        type="button"
                        aria-label="Show password"
                        className="absolute bottom-3 right-3 text-mof-text-muted hover:text-mof-primary"
                    >
                        <Eye size={18} />
                    </button>
                </div>

                <div className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm text-mof-text">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-sm border-mof-border"
                        />
                        Remember me
                    </label>

                    <a
                        href="/forgot-password"
                        className="text-sm font-semibold text-mof-primary hover:underline"
                    >
                        Forgot Password?
                    </a>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn min-h-12 w-full rounded-xl border-0 bg-mof-primary text-white hover:bg-mof-primary-container disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSubmitting ? "Signing In..." : "Sign In"}
                    {!isSubmitting && <ArrowRight size={18} />}
                </button>

                <a
                    href="/register"
                    className="btn min-h-12 w-full rounded-xl border border-mof-border bg-white text-mof-text hover:bg-mof-surface-muted"
                >
                    Create Account
                </a>
            </form>
        </AuthShell>
    );
}