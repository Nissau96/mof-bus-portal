import { getSupabaseAdmin } from "../_utils/supabaseAdmin.js";
import { getAuthUser } from "../_utils/getAuthUser.js";

/**
 * Returns the authenticated user's profile.
 *
 * This is used by the frontend to load the user's saved:
 * - Full name
 * - Email
 * - Role
 * - Division
 * - Bus route
 * - Drop-off location
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed." });
  }

  try {
    const user = await getAuthUser(req);

    if (!user) {
      return res.status(401).json({
        message: "You must be logged in to view your profile.",
      });
    }

    const supabase = getSupabaseAdmin();

    const { data: profile, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, role, staff_id, phone, division, bus_route, dropoff_location, is_disabled"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        message: error.message,
      });
    }

    if (!profile) {
      return res.status(404).json({
        message: "User profile was not found.",
      });
    }

    if (profile.is_disabled) {
      return res.status(403).json({
        message: "Your account has been disabled.",
      });
    }

    return res.status(200).json({
      profile,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Could not load profile.",
    });
  }
}