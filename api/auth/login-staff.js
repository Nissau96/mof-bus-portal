import { getSupabaseAdmin } from "../_utils/supabaseAdmin.js";
import { getSupabaseAnon } from "../_utils/supabaseAnon.js";

/**
 * Staff login endpoint.
 *
 * Staff users log in with Staff ID + password.
 * Supabase Auth requires email + password, so this endpoint:
 * 1. Finds the user's email from profiles using staff_id.
 * 2. Checks that the user is an active staff user.
 * 3. Signs in using Supabase Auth.
 * 4. Returns the Supabase session to the frontend.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed." });
  }

  try {
    const { staffId, password } = req.body;

    if (!staffId || !password) {
      return res.status(400).json({
        message: "Staff ID and password are required.",
      });
    }

    const admin = getSupabaseAdmin();

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, email, role, is_disabled")
      .eq("staff_id", staffId)
      .eq("role", "staff")
      .maybeSingle();

    if (profileError) {
      return res.status(500).json({
        message: profileError.message,
      });
    }

    if (!profile) {
      return res.status(401).json({
        message: "Invalid Staff ID or password.",
      });
    }

    if (profile.is_disabled) {
      return res.status(403).json({
        message: "This account has been disabled.",
      });
    }

    const anon = getSupabaseAnon();

    const { data: signInData, error: signInError } =
      await anon.auth.signInWithPassword({
        email: profile.email,
        password,
      });

    if (signInError) {
      return res.status(401).json({
        message: "Invalid Staff ID or password.",
      });
    }

    await admin.from("audit_logs").insert({
      user_id: profile.id,
      action: "staff_login",
      details: {
        staff_id: staffId,
      },
    });

    return res.status(200).json({
      message: "Login successful.",
      session: signInData.session,
      user: signInData.user,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Login failed.",
    });
  }
}