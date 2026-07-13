import { requireAdmin } from "../_utils/requireAdmin.js";

/**
 * Returns registered user profiles for admin users.
 *
 * Admin-only endpoint.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed." });
  }

  try {
    const auth = await requireAdmin(req);

    if (auth.error) {
      return res.status(auth.error.status).json({
        message: auth.error.message,
      });
    }

    const { supabase } = auth;

    const { data: users, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, role, staff_id, phone, division, bus_route, dropoff_location, is_disabled, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        message: error.message,
      });
    }

    return res.status(200).json({
      users: users || [],
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Could not load users.",
    });
  }
}