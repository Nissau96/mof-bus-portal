import { requireAdmin } from "../_utils/requireAdmin.js";

/**
 * Returns recent audit logs for admin users.
 *
 * Admin-only endpoint.
 *
 * This endpoint does not rely on embedded Supabase relationships.
 * It loads audit logs first, then loads related profiles separately.
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

    const { data: logs, error: logsError } = await supabase
      .from("audit_logs")
      .select("id, user_id, action, details, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (logsError) {
      return res.status(500).json({
        message: logsError.message,
      });
    }

    const userIds = (logs || [])
      .map((log) => log.user_id)
      .filter(Boolean);

    const uniqueUserIds = [...new Set(userIds)];

    let profilesById = {};

    if (uniqueUserIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, staff_id, division")
        .in("id", uniqueUserIds);

      if (profilesError) {
        return res.status(500).json({
          message: profilesError.message,
        });
      }

      profilesById = (profiles || []).reduce((accumulator, profile) => {
        accumulator[profile.id] = profile;
        return accumulator;
      }, {});
    }

    const logsWithProfiles = (logs || []).map((log) => ({
      ...log,
      profile: profilesById[log.user_id] || null,
    }));

    const actions = [
      ...new Set((logs || []).map((log) => log.action).filter(Boolean)),
    ].sort();

    return res.status(200).json({
      logs: logsWithProfiles,
      actions,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Could not load audit logs.",
    });
  }
}