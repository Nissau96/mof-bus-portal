import process from "node:process";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseAdmin } from "../../server/_utils/supabaseAdmin.js";

/**
 * Staff/Admin login endpoint.
 *
 * Allows users with role "staff" or "admin" to log in using:
 * - Staff ID
 * - Password
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      message: "Method not allowed.",
    });
  }

  try {
    const { staffId, password } = req.body || {};

    const cleanedStaffId = String(staffId || "").trim();
    const cleanedPassword = String(password || "");

    if (!cleanedStaffId || !cleanedPassword) {
      return res.status(400).json({
        message: "Staff ID and password are required.",
      });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({
        message: "Missing Supabase login environment variables.",
      });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, staff_id, role, is_disabled")
      .eq("staff_id", cleanedStaffId)
      .in("role", ["staff", "admin"])
      .maybeSingle();

    if (profileError) {
      return res.status(500).json({
        message: profileError.message,
      });
    }

    if (!profile) {
      return res.status(401).json({
        message: "No staff or admin account was found for this Staff ID.",
      });
    }

    if (profile.is_disabled) {
      return res.status(403).json({
        message: "Your account has been disabled. Please contact the administrator.",
      });
    }

    const cleanedEmail = String(profile.email || "").trim().toLowerCase();

    if (!cleanedEmail) {
      return res.status(400).json({
        message: "No email address is attached to this Staff ID.",
      });
    }

    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: loginData, error: loginError } =
      await supabaseAnon.auth.signInWithPassword({
        email: cleanedEmail,
        password: cleanedPassword,
      });

    if (loginError) {
      return res.status(401).json({
        message: `Supabase login failed: ${loginError.message}`,
      });
    }

    if (!loginData.session) {
      return res.status(401).json({
        message: "Supabase login succeeded but no session was returned.",
      });
    }

    await supabaseAdmin.from("audit_logs").insert({
      user_id: profile.id,
      action: "staff_login_success",
      details: {
        staff_id: cleanedStaffId,
        role: profile.role,
      },
    });

    return res.status(200).json({
      message: "Login successful.",
      user: loginData.user,
      session: loginData.session,
      profile: {
        ...profile,
        email: cleanedEmail,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Could not complete staff login.",
    });
  }
}