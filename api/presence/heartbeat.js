import { getSupabaseAdmin } from "../../server/_utils/supabaseAdmin.js";
import { getAuthUser } from "../../server/_utils/getAuthUser.js";

/**
 * Updates the authenticated user's presence heartbeat.
 *
 * This endpoint is called periodically by DashboardShell while the user
 * is logged in and actively using protected pages.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      message: "Method not allowed.",
    });
  }

  try {
    const user = await getAuthUser(req);

    if (!user) {
      return res.status(401).json({
        message: "You must be logged in to update presence.",
      });
    }

    const { currentPage } = req.body || {};
    const supabase = getSupabaseAdmin();

    const userAgent = req.headers["user-agent"] || "";

    const { error } = await supabase.from("user_presence").upsert(
      {
        user_id: user.id,
        last_seen_at: new Date().toISOString(),
        current_page: currentPage || "",
        user_agent: userAgent,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

    if (error) {
      return res.status(500).json({
        message: error.message || "Could not update user presence.",
      });
    }

    return res.status(200).json({
      message: "Presence updated.",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Presence update failed.",
    });
  }
}