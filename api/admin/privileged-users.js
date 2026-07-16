import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase server environment variables.");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getSupabaseUserClient(accessToken) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase client environment variables.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return "";
  }

  return authHeader.replace("Bearer ", "").trim();
}

async function requireAdmin(req, supabaseAdmin) {
  const accessToken = getBearerToken(req);

  if (!accessToken) {
    return {
      ok: false,
      status: 401,
      message: "Missing authorization token.",
    };
  }

  const userClient = getSupabaseUserClient(accessToken);

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser(accessToken);

  if (userError || !user) {
    return {
      ok: false,
      status: 401,
      message: "Invalid or expired session.",
    };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, role, is_disabled")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      ok: false,
      status: 403,
      message: "User profile could not be verified.",
    };
  }

  if (profile.role !== "admin" || profile.is_disabled) {
    return {
      ok: false,
      status: 403,
      message: "Administrator access is required.",
    };
  }

  return {
    ok: true,
    user,
    profile,
  };
}

function sendJson(res, status, payload) {
  res.status(status).json(payload);
}

function mapProfile(profile) {
  if (!profile) {
    return null;
  }

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

async function listPrivilegedUsers(req, res, supabaseAdmin) {
  const searchUsers = String(req.query.searchUsers || "").trim();

  if (searchUsers) {
    const query = searchUsers.replaceAll(",", " ");

    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, full_name, email, phone, staff_id, role, division, bus_route, dropoff_location, is_disabled"
      )
      .or(
        `full_name.ilike.%${query}%,email.ilike.%${query}%,staff_id.ilike.%${query}%,phone.ilike.%${query}%,division.ilike.%${query}%,bus_route.ilike.%${query}%`
      )
      .order("full_name", { ascending: true })
      .limit(10);

    if (error) {
      return sendJson(res, 500, {
        message: error.message || "Could not search users.",
      });
    }

    return sendJson(res, 200, {
      users: (profiles || []).map(mapProfile),
    });
  }

  const { data: privilegedRows, error } = await supabaseAdmin
    .from("privileged_users")
    .select("id, profile_id, staff_id, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return sendJson(res, 500, {
      message: error.message || "Could not load privileged users.",
    });
  }

  const profileIds = [
    ...new Set((privilegedRows || []).map((row) => row.profile_id).filter(Boolean)),
  ];

  const staffIds = [
    ...new Set((privilegedRows || []).map((row) => row.staff_id).filter(Boolean)),
  ];

  let profiles = [];

  if (profileIds.length > 0) {
    const { data, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, full_name, email, phone, staff_id, role, division, bus_route, dropoff_location, is_disabled"
      )
      .in("id", profileIds);

    if (profileError) {
      return sendJson(res, 500, {
        message: profileError.message || "Could not load privileged user profiles.",
      });
    }

    profiles = data || [];
  }

  if (staffIds.length > 0) {
    const { data, error: staffProfileError } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, full_name, email, phone, staff_id, role, division, bus_route, dropoff_location, is_disabled"
      )
      .in("staff_id", staffIds);

    if (staffProfileError) {
      return sendJson(res, 500, {
        message:
          staffProfileError.message || "Could not load staff profile records.",
      });
    }

    profiles = [...profiles, ...(data || [])];
  }

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const profileByStaffId = new Map(
    profiles
      .filter((profile) => profile.staff_id)
      .map((profile) => [profile.staff_id, profile])
  );

  const privilegedUsers = (privilegedRows || []).map((row) => {
    const profile =
      profileById.get(row.profile_id) || profileByStaffId.get(row.staff_id) || null;

    return {
      ...row,
      profile: mapProfile(profile),
    };
  });

  return sendJson(res, 200, {
    privilegedUsers,
  });
}

async function addPrivilegedUser(req, res, supabaseAdmin) {
  const { profileId, staffId } = req.body || {};

  if (!profileId && !staffId) {
    return sendJson(res, 400, {
      message: "Select a user before adding them to privileged users.",
    });
  }

  let profileQuery = supabaseAdmin
    .from("profiles")
    .select(
      "id, full_name, email, phone, staff_id, role, division, bus_route, dropoff_location, is_disabled"
    );

  if (profileId) {
    profileQuery = profileQuery.eq("id", profileId);
  } else {
    profileQuery = profileQuery.eq("staff_id", staffId);
  }

  const { data: profile, error: profileError } = await profileQuery.single();

  if (profileError || !profile) {
    return sendJson(res, 404, {
      message: "The selected user could not be found in profiles.",
    });
  }

  if (profile.is_disabled) {
    return sendJson(res, 400, {
      message: "Disabled users cannot be added to privileged users.",
    });
  }

  const { data: existingRecord, error: existingError } = await supabaseAdmin
    .from("privileged_users")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (existingError) {
    return sendJson(res, 500, {
      message: existingError.message || "Could not check existing privilege record.",
    });
  }

  if (existingRecord) {
    return sendJson(res, 409, {
      message: "This user is already on the privileged users list.",
    });
  }

  const { data: insertedRecord, error: insertError } = await supabaseAdmin
    .from("privileged_users")
    .insert({
      profile_id: profile.id,
      staff_id: profile.staff_id || null,
    })
    .select("id, profile_id, staff_id, created_at")
    .single();

  if (insertError) {
    return sendJson(res, 500, {
      message: insertError.message || "Could not add privileged user.",
    });
  }

  return sendJson(res, 201, {
    message: `${profile.full_name || "User"} has been added to privileged users.`,
    privilegedUser: {
      ...insertedRecord,
      profile: mapProfile(profile),
    },
  });
}

async function removePrivilegedUser(req, res, supabaseAdmin) {
  const { id } = req.body || {};

  if (!id) {
    return sendJson(res, 400, {
      message: "Privileged user record ID is required.",
    });
  }

  const { error } = await supabaseAdmin
    .from("privileged_users")
    .delete()
    .eq("id", id);

  if (error) {
    return sendJson(res, 500, {
      message: error.message || "Could not remove privileged user.",
    });
  }

  return sendJson(res, 200, {
    message: "Privileged user removed successfully.",
    removedId: id,
  });
}

export default async function handler(req, res) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const adminCheck = await requireAdmin(req, supabaseAdmin);

    if (!adminCheck.ok) {
      return sendJson(res, adminCheck.status, {
        message: adminCheck.message,
      });
    }

    if (req.method === "GET") {
      return listPrivilegedUsers(req, res, supabaseAdmin);
    }

    if (req.method === "POST") {
      return addPrivilegedUser(req, res, supabaseAdmin);
    }

    if (req.method === "DELETE") {
      return removePrivilegedUser(req, res, supabaseAdmin);
    }

    res.setHeader("Allow", "GET, POST, DELETE");

    return sendJson(res, 405, {
      message: "Method not allowed.",
    });
  } catch (error) {
    return sendJson(res, 500, {
      message: error.message || "Unexpected privileged users API error.",
    });
  }
}