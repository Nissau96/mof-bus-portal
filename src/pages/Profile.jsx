import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  BusFront,
  Building2,
  IdCard,
  Mail,
  MapPinned,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import DashboardShell from "../components/dashboard/DashboardShell";
import DivisionSelect from "../components/auth/DivisionSelect";
import BusRouteSelect from "../components/auth/BusRouteSelect";
import RouteSelect from "../components/auth/RouteSelect";
import { useTheme } from "../context/useTheme";
import { useToast } from "../context/useToast";
import { apiFetch } from "../lib/api";
import { setCachedProfile } from "../lib/profileCache";

function getRoleLabel(role) {
  if (role === "admin") {
    return "Admin";
  }

  if (role === "intern_nsp") {
    return "Intern/NSP";
  }

  if (role === "staff") {
    return "Staff";
  }

  return "User";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function ProfileInfoCard({ label, value, icon: Icon, isDark }) {
  return (
    <div
      className={`rounded-2xl p-4 ${
        isDark
          ? "border border-white/10 bg-white/5"
          : "border border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            isDark
              ? "bg-white/10 text-emerald-200"
              : "bg-emerald-50 text-mof-primary"
          }`}
        >
          <Icon size={19} aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <p
            className={`text-xs font-black uppercase tracking-wider ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {label}
          </p>

          <p
            className={`mt-1 break-words text-base font-black ${
              isDark ? "text-white" : "text-slate-950"
            }`}
          >
            {value || "Not provided"}
          </p>
        </div>
      </div>
    </div>
  );
}

function TextInput({ id, label, value, type = "text", onChange, isDark }) {
  return (
    <label className="block">
      <span
        className={`text-xs font-black uppercase tracking-wider ${
          isDark ? "text-slate-400" : "text-slate-500"
        }`}
      >
        {label}
      </span>

      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-2 min-h-12 w-full rounded-xl border px-4 text-sm font-bold outline-none transition ${
          isDark
            ? "border-white/10 bg-white/5 text-white focus:border-emerald-300"
            : "border-slate-200 bg-slate-50 text-slate-950 focus:border-mof-primary"
        }`}
      />
    </label>
  );
}

function ProfileSaveOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div
        role="status"
        aria-live="polite"
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-white p-6 text-center shadow-2xl"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <span
            className="loading loading-spinner loading-md text-mof-primary"
            aria-hidden="true"
          />
        </div>

        <h2 className="mt-5 text-xl font-black text-slate-950">
          Saving profile
        </h2>

        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          Please wait while we update your profile information.
        </p>
      </div>
    </div>
  );
}

/**
 * My Profile page.
 *
 * Displays and allows the authenticated user to edit safe profile information.
 */
export default function Profile() {
  const { isDark } = useTheme();
  const { showToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    division: "",
    busRoute: "",
    dropoffLocation: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  function hydrateForm(profileData) {
    setForm({
      fullName: profileData?.full_name || "",
      email: profileData?.email || "",
      phone: profileData?.phone || "",
      division: profileData?.division || "",
      busRoute: profileData?.bus_route || "",
      dropoffLocation: profileData?.dropoff_location || "",
    });
  }

  function updateField(fieldName, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [fieldName]: value,
    }));
  }

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);

      const data = await apiFetch("/api/profile/me");

      setProfile(data.profile);
      hydrateForm(data.profile);
    } catch (error) {
      showToast({
        type: "error",
        title: "Could not load profile",
        message: error.message || "Failed to load your profile details.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadProfile();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadProfile]);

  function validateForm() {
    if (!form.fullName.trim()) {
      showToast({
        type: "warning",
        title: "Full name required",
        message: "Enter your full name.",
      });
      return false;
    }

    if (!form.email.trim()) {
      showToast({
        type: "warning",
        title: "Email required",
        message: "Enter your email address.",
      });
      return false;
    }

    if (!isValidEmail(form.email.trim())) {
      showToast({
        type: "warning",
        title: "Invalid email",
        message: "Enter a valid email address.",
      });
      return false;
    }

    if (!form.phone.trim()) {
      showToast({
        type: "warning",
        title: "Phone required",
        message: "Enter your phone number.",
      });
      return false;
    }

    if (!form.division) {
      showToast({
        type: "warning",
        title: "Division required",
        message: "Select your division.",
      });
      return false;
    }

    if (!form.busRoute) {
      showToast({
        type: "warning",
        title: "Bus route required",
        message: "Select your assigned bus route.",
      });
      return false;
    }

    if (!form.dropoffLocation) {
      showToast({
        type: "warning",
        title: "Drop-off required",
        message: "Select your preferred drop-off location.",
      });
      return false;
    }

    return true;
  }

  function handleEditProfile() {
    hydrateForm(profile);
    setIsEditing(true);
  }

  function handleCancelEdit() {
    hydrateForm(profile);
    setIsEditing(false);
  }

  async function handleSaveProfile(event) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);

      const data = await apiFetch("/api/profile/me", {
        method: "POST",
        body: JSON.stringify({
          fullName: form.fullName.trim().replace(/\s+/g, " "),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          division: form.division,
          busRoute: form.busRoute,
          dropoffLocation: form.dropoffLocation,
        }),
      });

      setProfile(data.profile);
      hydrateForm(data.profile);
      setCachedProfile(data.profile);
      setIsEditing(false);

      showToast({
        type: "success",
        title: "Profile updated",
        message: data.message || "Your profile information was updated.",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Could not update profile",
        message: error.message || "Failed to update your profile information.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const roleLabel = getRoleLabel(profile?.role);

  return (
    <DashboardShell>
      {isSaving && <ProfileSaveOverlay />}

      <div className="mb-6">
        <Link
          to="/dashboard"
          className={`inline-flex items-center gap-2 text-sm font-bold ${
            isDark
              ? "text-slate-300 hover:text-white"
              : "text-slate-600 hover:text-mof-primary"
          }`}
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Back to dashboard
        </Link>
      </div>

      <section
        className={`relative overflow-hidden rounded-3xl p-6 shadow-sm sm:p-8 ${
          isDark
            ? "border border-white/10 bg-[#3e5048]"
            : "border border-slate-200 bg-white"
        }`}
      >
        <div
          className={`pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full border-[18px] ${
            isDark ? "border-white/5" : "border-emerald-50"
          }`}
        />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p
              className={`text-xs font-black uppercase tracking-[0.22em] ${
                isDark ? "text-white/80" : "text-mof-primary"
              }`}
            >
              User Account
            </p>

            <h1
              className={`mt-4 text-3xl font-black tracking-tight sm:text-4xl ${
                isDark ? "text-white" : "text-slate-950"
              }`}
            >
              My Profile
            </h1>

            <p
              className={`mt-3 max-w-2xl text-sm font-semibold leading-6 ${
                isDark ? "text-white" : "text-slate-700"
              }`}
            >
              Review and update your transport profile details, email address,
              assigned bus route, and preferred drop-off location.
            </p>
          </div>

          <div
            className={`flex h-16 w-16 items-center justify-center rounded-3xl ${
              isDark
                ? "bg-white/15 text-emerald-200"
                : "bg-emerald-50 text-mof-primary"
            }`}
          >
            <UserRound size={30} aria-hidden="true" />
          </div>
        </div>
      </section>

      {isLoading && (
        <section
          className={`mt-6 rounded-3xl p-6 ${
            isDark
              ? "border border-white/10 bg-slate-900 text-slate-300"
              : "border border-slate-200 bg-white text-slate-600"
          }`}
        >
          <p className="text-sm font-bold">Loading profile details...</p>
        </section>
      )}

      {!isLoading && profile && (
        <section
          className={`mt-6 rounded-3xl p-5 sm:p-6 ${
            isDark
              ? "border border-white/10 bg-slate-900"
              : "border border-slate-200 bg-white"
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p
                className={`text-xs font-black uppercase tracking-[0.22em] ${
                  isDark ? "text-emerald-200" : "text-mof-primary"
                }`}
              >
                Profile Summary
              </p>

              <h2
                className={`mt-2 text-2xl font-black ${
                  isDark ? "text-white" : "text-slate-950"
                }`}
              >
                {profile.full_name}
              </h2>

              <p
                className={`mt-1 text-sm font-semibold ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                {profile.email}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide ${
                  isDark
                    ? "bg-emerald-500/10 text-emerald-200"
                    : "bg-emerald-50 text-mof-primary"
                }`}
              >
                <BadgeCheck size={15} aria-hidden="true" />
                {roleLabel}
              </span>

              <span
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide ${
                  profile.is_disabled
                    ? isDark
                      ? "bg-red-500/10 text-red-200"
                      : "bg-red-50 text-red-700"
                    : isDark
                      ? "bg-white/10 text-white"
                      : "bg-slate-100 text-slate-700"
                }`}
              >
                <ShieldCheck size={15} aria-hidden="true" />
                {profile.is_disabled ? "Disabled" : "Active"}
              </span>

              {!isEditing && (
                <button
                  type="button"
                  onClick={handleEditProfile}
                  className={`inline-flex min-h-9 items-center justify-center rounded-full px-4 text-xs font-black uppercase tracking-wide transition ${
                    isDark
                      ? "bg-white text-slate-950 hover:bg-emerald-100"
                      : "bg-mof-primary text-white hover:bg-mof-primary-container"
                  }`}
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {!isEditing && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <ProfileInfoCard
                label="Full Name"
                value={profile.full_name}
                icon={UserRound}
                isDark={isDark}
              />

              <ProfileInfoCard
                label="Role"
                value={roleLabel}
                icon={BadgeCheck}
                isDark={isDark}
              />

              {profile.role === "staff" && (
                <ProfileInfoCard
                  label="Staff ID"
                  value={profile.staff_id}
                  icon={IdCard}
                  isDark={isDark}
                />
              )}

              <ProfileInfoCard
                label="Email"
                value={profile.email}
                icon={Mail}
                isDark={isDark}
              />

              <ProfileInfoCard
                label="Phone"
                value={profile.phone}
                icon={Phone}
                isDark={isDark}
              />

              <ProfileInfoCard
                label="Division"
                value={profile.division}
                icon={Building2}
                isDark={isDark}
              />

              <ProfileInfoCard
                label="Assigned Bus Route"
                value={profile.bus_route}
                icon={BusFront}
                isDark={isDark}
              />

              <ProfileInfoCard
                label="Preferred Drop-off"
                value={profile.dropoff_location}
                icon={MapPinned}
                isDark={isDark}
              />
            </div>
          )}

          {isEditing && (
            <form onSubmit={handleSaveProfile} className="mt-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  id="fullName"
                  label="Full Name"
                  value={form.fullName}
                  onChange={(value) => updateField("fullName", value)}
                  isDark={isDark}
                />

                <TextInput
                  id="email"
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={(value) => updateField("email", value)}
                  isDark={isDark}
                />

                <TextInput
                  id="phone"
                  label="Phone Number"
                  value={form.phone}
                  onChange={(value) => updateField("phone", value)}
                  isDark={isDark}
                />

                <div>
                  <ProfileInfoCard
                    label="Role"
                    value={roleLabel}
                    icon={BadgeCheck}
                    isDark={isDark}
                  />
                </div>

                {profile.role === "staff" && (
                  <div>
                    <ProfileInfoCard
                      label="Staff ID"
                      value={profile.staff_id}
                      icon={IdCard}
                      isDark={isDark}
                    />
                  </div>
                )}
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
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
              </div>

              <section
                className={`rounded-3xl p-5 ${
                  isDark
                    ? "border border-white/10 bg-white/5 text-slate-300"
                    : "border border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                <p className="text-sm font-semibold leading-6">
                  Changing your email updates both your profile email and your
                  login email. Use the new email address the next time you log
                  in.
                </p>
              </section>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    isDark
                      ? "border-white/10 text-slate-300 hover:bg-white/10"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <X size={18} aria-hidden="true" />
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    isDark
                      ? "bg-white text-slate-950 hover:bg-emerald-100"
                      : "bg-mof-primary text-white hover:bg-mof-primary-container"
                  }`}
                >
                  {isSaving ? (
                    <span
                      className="loading loading-spinner loading-sm"
                      aria-hidden="true"
                    />
                  ) : (
                    <Save size={18} aria-hidden="true" />
                  )}
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </section>
      )}
    </DashboardShell>
  );
}