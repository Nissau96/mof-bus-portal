import { getSupabaseAdmin } from "../../server/_utils/supabaseAdmin.js";
import { getAuthUser } from "../../server/_utils/getAuthUser.js";

const ONLINE_WINDOW_MINUTES = 5;
const RECENT_WINDOW_MINUTES = 30;

function getPresenceStatus(lastSeenAt) {
  if (!lastSeenAt) {
    return "offline";
  }

  const lastSeenTime = new Date(lastSeenAt).getTime();
  const now = Date.now();
  const diffMinutes = (now - lastSeenTime) / 1000 / 60;

  if (diffMinutes <= ONLINE_WINDOW_MINUTES) {
    return "online";
  }

  if (diffMinutes <= RECENT_WINDOW_MINUTES) {
    return "recent";
  }

  return "offline";
}

function mapProfile(profile) {
  return {
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    phone: profile.phone,
    staff_id: profile.staff_id,
    role: profile.role,
    division: profile.division,
    bus_route: profile.bus_route,
    dropoff_location: profile.dropoff_location,
    is_disabled: profile.is_disabled,
  };
}

/**
 * Admin endpoint for viewing active/recent users.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      message: "Method not allowed.",
    });
  }

  try {
    const user = await getAuthUser(req);

    if (!user) {
      return res.status(401).json({
        message: "You must be logged in.",
      });
    }

    const supabase = getSupabaseAdmin();

    const { data: adminProfile, error: adminProfileError } = await supabase
      .from("profiles")
      .select("id, role, is_disabled")
      .eq("id", user.id)
      .maybeSingle();

    if (adminProfileError) {
      return res.status(500).json({
        message: adminProfileError.message,
      });
    }

    if (!adminProfile || adminProfile.role !== "admin" || adminProfile.is_disabled) {
      return res.status(403).json({
        message: "Administrator access is required.",
      });
    }

    const { data: presenceRows, error: presenceError } = await supabase
      .from("user_presence")
      .select("user_id, last_seen_at, current_page, user_agent, updated_at")
      .order("last_seen_at", { ascending: false });

    if (presenceError) {
      return res.status(500).json({
        message: presenceError.message || "Could not load active users.",
      });
    }

    const userIds = [
      ...new Set((presenceRows || []).map((row) => row.user_id).filter(Boolean)),
    ];

    let profiles = [];

    if (userIds.length > 0) {
      const { data: profileRows, error: profileError } = await supabase
        .from("profiles")
        .select(
          "id, full_name, email, phone, staff_id, role, division, bus_route, dropoff_location, is_disabled"
        )
        .in("id", userIds);

      if (profileError) {
        return res.status(500).json({
          message: profileError.message || "Could not load user profiles.",
        });
      }

      profiles = profileRows || [];
    }

    const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

    const users = (presenceRows || []).map((presence) => {
      const profile = profileById.get(presence.user_id) || null;

      return {
        userId: presence.user_id,
        lastSeenAt: presence.last_seen_at,
        currentPage: presence.current_page,
        userAgent: presence.user_agent,
        status: getPresenceStatus(presence.last_seen_at),
        profile: profile ? mapProfile(profile) : null,
      };
    });

    const summary = users.reduce(
      (accumulator, record) => {
        accumulator.total += 1;

        if (record.status === "online") {
          accumulator.online += 1;
        } else if (record.status === "recent") {
          accumulator.recent += 1;
        } else {
          accumulator.offline += 1;
        }

        return accumulator;
      },
      {
        total: 0,
        online: 0,
        recent: 0,
        offline: 0,
      }
    );

    return res.status(200).json({
      users,
      summary,
      onlineWindowMinutes: ONLINE_WINDOW_MINUTES,
      recentWindowMinutes: RECENT_WINDOW_MINUTES,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Could not load active users.",
    });
  }
}