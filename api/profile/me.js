import { getSupabaseAdmin } from "../../server/_utils/supabaseAdmin.js";
import { getAuthUser } from "../../server/_utils/getAuthUser.js";

function setNoStoreHeaders(res) {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function getProfileByUserId(supabase, userId) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, role, staff_id, phone, division, bus_route, dropoff_location, is_disabled"
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return profile;
}

/**
 * GET:
 * Returns the authenticated user's profile.
 *
 * POST:
 * Updates editable profile fields:
 * - Full name
 * - Email
 * - Phone
 * - Division
 * - Bus route
 * - Drop-off location
 */
export default async function handler(req, res) {
  setNoStoreHeaders(res);

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed." });
  }

  try {
    const user = await getAuthUser(req);

    if (!user) {
      return res.status(401).json({
        message: "You must be logged in to access your profile.",
      });
    }

    const supabase = getSupabaseAdmin();

    const existingProfile = await getProfileByUserId(supabase, user.id);

    if (!existingProfile) {
      return res.status(404).json({
        message: "User profile was not found.",
      });
    }

    if (existingProfile.is_disabled) {
      return res.status(403).json({
        message: "Your account has been disabled.",
      });
    }

    if (req.method === "GET") {
      return res.status(200).json({
        profile: existingProfile,
      });
    }

    const {
      fullName,
      email,
      phone,
      division,
      busRoute,
      dropoffLocation,
    } = req.body || {};

    const cleanedFullName = normalizeText(fullName);
    const cleanedEmail = normalizeEmail(email);
    const cleanedPhone = normalizeText(phone);
    const cleanedDivision = normalizeText(division);
    const cleanedBusRoute = normalizeText(busRoute);
    const cleanedDropoffLocation = normalizeText(dropoffLocation);

    if (
      !cleanedFullName ||
      !cleanedEmail ||
      !cleanedPhone ||
      !cleanedDivision ||
      !cleanedBusRoute ||
      !cleanedDropoffLocation
    ) {
      return res.status(400).json({
        message: "Please complete all editable profile fields.",
      });
    }

    if (!isValidEmail(cleanedEmail)) {
      return res.status(400).json({
        message: "Enter a valid email address.",
      });
    }

    if (cleanedEmail !== existingProfile.email) {
      const { data: duplicateProfile, error: duplicateEmailError } =
        await supabase
          .from("profiles")
          .select("id, email")
          .eq("email", cleanedEmail)
          .neq("id", user.id)
          .maybeSingle();

      if (duplicateEmailError) {
        return res.status(500).json({
          message: duplicateEmailError.message,
        });
      }

      if (duplicateProfile) {
        return res.status(409).json({
          message: "This email address is already in use by another account.",
        });
      }

      const { error: authEmailError } =
        await supabase.auth.admin.updateUserById(user.id, {
          email: cleanedEmail,
          email_confirm: true,
          user_metadata: {
            ...user.user_metadata,
            full_name: cleanedFullName,
            role: existingProfile.role,
            staff_id: existingProfile.staff_id || undefined,
          },
        });

      if (authEmailError) {
        return res.status(400).json({
          message: authEmailError.message,
        });
      }
    } else if (cleanedFullName !== existingProfile.full_name) {
      const { error: authMetadataError } =
        await supabase.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...user.user_metadata,
            full_name: cleanedFullName,
            role: existingProfile.role,
            staff_id: existingProfile.staff_id || undefined,
          },
        });

      if (authMetadataError) {
        return res.status(400).json({
          message: authMetadataError.message,
        });
      }
    }

    const { data: updatedProfile, error: updateProfileError } = await supabase
      .from("profiles")
      .update({
        full_name: cleanedFullName,
        email: cleanedEmail,
        phone: cleanedPhone,
        division: cleanedDivision,
        bus_route: cleanedBusRoute,
        dropoff_location: cleanedDropoffLocation,
      })
      .eq("id", user.id)
      .select(
        "id, full_name, email, role, staff_id, phone, division, bus_route, dropoff_location, is_disabled"
      )
      .single();

    if (updateProfileError) {
      return res.status(500).json({
        message: updateProfileError.message,
      });
    }

    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "profile_updated",
      details: {
        previous_profile: {
          full_name: existingProfile.full_name,
          email: existingProfile.email,
          phone: existingProfile.phone,
          division: existingProfile.division,
          bus_route: existingProfile.bus_route,
          dropoff_location: existingProfile.dropoff_location,
        },
        new_profile: {
          full_name: updatedProfile.full_name,
          email: updatedProfile.email,
          phone: updatedProfile.phone,
          division: updatedProfile.division,
          bus_route: updatedProfile.bus_route,
          dropoff_location: updatedProfile.dropoff_location,
        },
        email_changed: existingProfile.email !== updatedProfile.email,
      },
    });

    return res.status(200).json({
      message:
        existingProfile.email !== updatedProfile.email
          ? "Profile updated successfully. Use your new email address the next time you log in."
          : "Profile updated successfully.",
      profile: updatedProfile,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Could not process profile request.",
    });
  }
}