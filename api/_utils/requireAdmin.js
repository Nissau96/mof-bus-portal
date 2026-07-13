import { getSupabaseAdmin } from "./supabaseAdmin.js";
import { getAuthUser } from "./getAuthUser.js";

/**
 * Verifies that the current authenticated user is an admin.
 *
 * Returns:
 * - user: Supabase Auth user
 * - profile: matching profile row
 * - supabase: admin Supabase client
 */
export async function requireAdmin(req) {
  const user = await getAuthUser(req);

  if (!user) {
    return {
      error: {
        status: 401,
        message: "You must be logged in to access this resource.",
      },
    };
  }

  const supabase = getSupabaseAdmin();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_disabled")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return {
      error: {
        status: 500,
        message: error.message,
      },
    };
  }

  if (!profile) {
    return {
      error: {
        status: 404,
        message: "User profile was not found.",
      },
    };
  }

  if (profile.is_disabled) {
    return {
      error: {
        status: 403,
        message: "Your account has been disabled.",
      },
    };
  }

  if (profile.role !== "admin") {
    return {
      error: {
        status: 403,
        message: "You do not have permission to access this resource.",
      },
    };
  }

  return {
    user,
    profile,
    supabase,
  };
}