import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  BusFront,
  Building2,
  IdCard,
  Mail,
  MapPinned,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import DashboardShell from "../components/dashboard/DashboardShell";
import { useTheme } from "../context/useTheme";
import { apiFetch } from "../lib/api";
import { useToast } from "../context/useToast";


function getRoleLabel(role) {
  if (role === "intern_nsp") {
    return "Intern/NSP";
  }

  if (role === "staff") {
    return "Staff";
  }

  return "User";
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
          <Icon size={19} />
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

/**
 * My Profile page.
 *
 * Displays the authenticated user's profile information from Supabase.
 */
export default function Profile() {
  const { isDark } = useTheme();
  const { showToast } = useToast();
  
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true);

        const data = await apiFetch("/api/profile/me");

        setProfile(data.profile);
      } catch (error) {
        showToast({
    type: "error",
    title: "Could not load profile",
    message: error.message || "Failed to load your profile details.",
  });
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [showToast]);

  const roleLabel = getRoleLabel(profile?.role);

  return (
    <DashboardShell>
      <div className="mb-6">
        <a
          href="/dashboard"
          className={`inline-flex items-center gap-2 text-sm font-bold ${
            isDark
              ? "text-slate-300 hover:text-white"
              : "text-slate-600 hover:text-mof-primary"
          }`}
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </a>
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
              Review your transport profile details, assigned bus route, and
              preferred drop-off location.
            </p>
          </div>

          <div
            className={`flex h-16 w-16 items-center justify-center rounded-3xl ${
              isDark
                ? "bg-white/15 text-emerald-200"
                : "bg-emerald-50 text-mof-primary"
            }`}
          >
            <UserRound size={30} />
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
        <>
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
                  <BadgeCheck size={15} />
                  {roleLabel}
                </span>

                <span
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide ${
                    isDark
                      ? "bg-white/10 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <ShieldCheck size={15} />
                  {profile.is_disabled ? "Disabled" : "Active"}
                </span>
              </div>
            </div>

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
          </section>

          {/* <section
            className={`mt-6 rounded-3xl p-5 sm:p-6 ${
              isDark
                ? "border border-white/10 bg-slate-900"
                : "border border-slate-200 bg-white"
            }`}
          >
            <h2
              className={`text-xl font-black ${
                isDark ? "text-white" : "text-slate-950"
              }`}
            >
              Profile Updates
            </h2>

            <p
              className={`mt-2 max-w-3xl text-sm leading-6 ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              For now, profile changes should be handled by the transport or
              system administrator to prevent users from changing their assigned
              division, route, or identity details without approval.
            </p>
          </section> */}
        </>
      )}
    </DashboardShell>
  );
}