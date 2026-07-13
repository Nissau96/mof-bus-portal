import { requireAdmin } from "../_utils/requireAdmin.js";

/**
 * Enables or disables a user account.
 *
 * Admin-only endpoint.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed." });
  }

  try {
    const auth = await requireAdmin(req);

    if (auth.error) {
      return res.status(auth.error.status).json({
        message: auth.error.message,
      });
    }

    const { user: adminUser, supabase } = auth;
    const { userId, isDisabled } = req.body || {};

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required.",
      });
    }

    if (typeof isDisabled !== "boolean") {
      return res.status(400).json({
        message: "Account status must be provided.",
      });
    }

    if (userId === adminUser.id && isDisabled) {
      return res.status(400).json({
        message: "You cannot disable your own admin account.",
      });
    }

    const { data: targetUser, error: targetUserError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, is_disabled")
      .eq("id", userId)
      .maybeSingle();

    if (targetUserError) {
      return res.status(500).json({
        message: targetUserError.message,
      });
    }

    if (!targetUser) {
      return res.status(404).json({
        message: "User profile was not found.",
      });
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from("profiles")
      .update({
        is_disabled: isDisabled,
      })
      .eq("id", userId)
      .select(
        "id, full_name, email, role, staff_id, phone, division, bus_route, dropoff_location, is_disabled, created_at"
      )
      .single();

    if (updateError) {
      return res.status(500).json({
        message: updateError.message,
      });
    }

    await supabase.from("audit_logs").insert({
      user_id: adminUser.id,
      action: isDisabled ? "admin_disabled_user" : "admin_enabled_user",
      details: {
        target_user_id: targetUser.id,
        target_full_name: targetUser.full_name,
        target_email: targetUser.email,
        previous_is_disabled: targetUser.is_disabled,
        new_is_disabled: isDisabled,
      },
    });

    return res.status(200).json({
      message: isDisabled
        ? "User account has been disabled."
        : "User account has been reactivated.",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Could not update user status.",
    });
  }
}