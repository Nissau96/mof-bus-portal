import { requireAdmin } from "../_utils/requireAdmin.js";

/**
 * Lists, adds, and removes privileged users.
 *
 * Admin-only endpoint.
 *
 * The booking RPC checks privileged_users by staff_id, so this API uses
 * staff_id as the main identifier.
 */
export default async function handler(req, res) {
  try {
    const auth = await requireAdmin(req);

    if (auth.error) {
      return res.status(auth.error.status).json({
        message: auth.error.message,
      });
    }

    const { user: adminUser, supabase } = auth;

    if (req.method === "GET") {
      const { data: privilegedUsers, error: privilegedError } = await supabase
        .from("privileged_users")
        .select("id, staff_id, created_at")
        .order("created_at", { ascending: false });

      if (privilegedError) {
        return res.status(500).json({
          message: privilegedError.message,
        });
      }

      const staffIds = (privilegedUsers || [])
        .map((record) => record.staff_id)
        .filter(Boolean);

      let profilesByStaffId = {};

      if (staffIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select(
            "id, full_name, email, role, staff_id, phone, division, bus_route, dropoff_location, is_disabled"
          )
          .in("staff_id", staffIds);

        if (profilesError) {
          return res.status(500).json({
            message: profilesError.message,
          });
        }

        profilesByStaffId = (profiles || []).reduce((accumulator, profile) => {
          accumulator[profile.staff_id] = profile;
          return accumulator;
        }, {});
      }

      const records = (privilegedUsers || []).map((record) => ({
        ...record,
        profile: profilesByStaffId[record.staff_id] || null,
      }));

      return res.status(200).json({
        privilegedUsers: records,
      });
    }

    if (req.method === "POST") {
      const { staffId } = req.body || {};
      const cleanedStaffId = String(staffId || "").trim();

      if (!cleanedStaffId) {
        return res.status(400).json({
          message: "Staff ID is required.",
        });
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, staff_id, is_disabled")
        .eq("staff_id", cleanedStaffId)
        .maybeSingle();

      if (profileError) {
        return res.status(500).json({
          message: profileError.message,
        });
      }

      if (!profile) {
        return res.status(404).json({
          message:
            "No registered staff profile was found with this Staff ID. Register the staff user first.",
        });
      }

      if (profile.role !== "staff" && profile.role !== "admin") {
        return res.status(400).json({
          message: "Only staff or admin accounts can be added as privileged users.",
        });
      }

      const { data: privilegedUser, error: insertError } = await supabase
        .from("privileged_users")
        .insert({
          staff_id: cleanedStaffId,
        })
        .select("id, staff_id, created_at")
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          return res.status(409).json({
            message: "This Staff ID is already on the privileged users list.",
          });
        }

        return res.status(500).json({
          message: insertError.message,
        });
      }

      await supabase.from("audit_logs").insert({
        user_id: adminUser.id,
        action: "admin_added_privileged_user",
        details: {
          staff_id: cleanedStaffId,
          target_user_id: profile.id,
          target_full_name: profile.full_name,
          target_email: profile.email,
        },
      });

      return res.status(201).json({
        message: "Privileged user has been added.",
        privilegedUser: {
          ...privilegedUser,
          profile,
        },
      });
    }

    if (req.method === "DELETE") {
      const { id } = req.body || {};

      if (!id) {
        return res.status(400).json({
          message: "Privileged user record ID is required.",
        });
      }

      const { data: existingRecord, error: existingError } = await supabase
        .from("privileged_users")
        .select("id, staff_id")
        .eq("id", id)
        .maybeSingle();

      if (existingError) {
        return res.status(500).json({
          message: existingError.message,
        });
      }

      if (!existingRecord) {
        return res.status(404).json({
          message: "Privileged user record was not found.",
        });
      }

      const { error: deleteError } = await supabase
        .from("privileged_users")
        .delete()
        .eq("id", id);

      if (deleteError) {
        return res.status(500).json({
          message: deleteError.message,
        });
      }

      await supabase.from("audit_logs").insert({
        user_id: adminUser.id,
        action: "admin_removed_privileged_user",
        details: {
          privileged_user_id: existingRecord.id,
          staff_id: existingRecord.staff_id,
        },
      });

      return res.status(200).json({
        message: "Privileged user has been removed.",
        removedId: id,
      });
    }

    return res.status(405).json({
      message: "Method not allowed.",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Could not process privileged users request.",
    });
  }
}