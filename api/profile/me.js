import process from "node:process";

import { getSupabaseAdmin } from "../../server/_utils/supabaseAdmin.js";
import { getAuthUser } from "../../server/_utils/getAuthUser.js";
import { sendPowerAutomateEmail } from "../../server/_utils/powerAutomateEmail.js";

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

function getAccountTypeLabel(role) {
  if (role === "staff") {
    return "Staff";
  }

  if (role === "intern_nsp") {
    return "Intern/NSP";
  }

  if (role === "admin") {
    return "Administrator";
  }

  return "User";
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

async function sendEmailChangeNotification({
  supabase,
  userId,
  previousEmail,
  profile,
}) {
  const whatsappGroupLink = process.env.WHATSAPP_GROUP_LINK;

  if (!whatsappGroupLink) {
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: "profile_email_notification_skipped",
      details: {
        previous_email: previousEmail,
        new_email: profile.email,
        reason: "WHATSAPP_GROUP_LINK is not configured.",
      },
    });

    return {
      sent: false,
      skipped: true,
      reason: "WHATSAPP_GROUP_LINK is not configured.",
    };
  }

  const accountType = getAccountTypeLabel(profile.role);

  const staffIdLine = profile.staff_id
    ? `Staff ID: ${profile.staff_id}\n`
    : "";

  try {
    await sendPowerAutomateEmail({
      eventType: "profile_email_changed_whatsapp_invite",
      to: profile.email,
      fullName: profile.full_name,
      subject: "Your MoF Bus Portal Email Has Been Updated",
      message: `Hello ${profile.full_name},

Your email address for the Ministry of Finance Transport Booking Portal has been updated successfully.

Previous Email: ${previousEmail}
New Email: ${profile.email}

Please use your new email address the next time you log in to the MoF Bus Portal.

You can join or rejoin the official bus WhatsApp group using the link below:
${whatsappGroupLink}

Your current profile details are:

Account Type: ${accountType}
${staffIdLine}Division: ${profile.division}
Bus Route: ${profile.bus_route}
Drop-off Location: ${profile.dropoff_location}

You can continue using the Ministry of Finance Transport Booking Portal to book your daily bus ticket when booking opens.

If you did not make this change, please contact the system administrator immediately.`,
      accountType,
      staffId: profile.staff_id || "",
      division: profile.division,
      busRoute: profile.bus_route,
      dropoffLocation: profile.dropoff_location,
    });

    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: "profile_email_notification_sent",
      details: {
        previous_email: previousEmail,
        new_email: profile.email,
        event_type: "profile_email_changed_whatsapp_invite",
        whatsapp_link_included: true,
      },
    });

    return {
      sent: true,
      skipped: false,
      reason: null,
    };
  } catch (emailError) {
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: "profile_email_notification_failed",
      details: {
        previous_email: previousEmail,
        new_email: profile.email,
        error: emailError.message,
      },
    });

    return {
      sent: false,
      skipped: false,
      reason: emailError.message,
    };
  }
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
 *
 * When the email address changes:
 * - Supabase Auth is updated.
 * - The profile record is updated.
 * - A notification is sent to the new email address.
 * - The WhatsApp group link is included when configured.
 */
export default async function handler(req, res) {
  setNoStoreHeaders(res);

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({
      message: "Method not allowed.",
    });
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

    const previousEmail = normalizeEmail(existingProfile.email);
    const emailChanged = cleanedEmail !== previousEmail;
    const fullNameChanged =
      cleanedFullName !== normalizeText(existingProfile.full_name);

    if (emailChanged) {
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
    } else if (fullNameChanged) {
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
      if (emailChanged) {
        await supabase.auth.admin.updateUserById(user.id, {
          email: previousEmail,
          email_confirm: true,
          user_metadata: {
            ...user.user_metadata,
            full_name: existingProfile.full_name,
            role: existingProfile.role,
            staff_id: existingProfile.staff_id || undefined,
          },
        });
      }

      return res.status(500).json({
        message: updateProfileError.message,
      });
    }

    let emailNotificationResult = {
      sent: false,
      skipped: false,
      reason: null,
    };

    if (emailChanged) {
      emailNotificationResult = await sendEmailChangeNotification({
        supabase,
        userId: user.id,
        previousEmail,
        profile: updatedProfile,
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
        email_changed: emailChanged,
        email_notification_sent: emailNotificationResult.sent,
        email_notification_skipped: emailNotificationResult.skipped,
        email_notification_error:
          emailNotificationResult.reason || null,
      },
    });

    let responseMessage = "Profile updated successfully.";

    if (emailChanged && emailNotificationResult.sent) {
      responseMessage =
        "Profile updated successfully. Use your new email address the next time you log in. A confirmation email containing the WhatsApp group link has been sent to your new email address.";
    } else if (emailChanged && emailNotificationResult.skipped) {
      responseMessage =
        "Profile updated successfully. Use your new email address the next time you log in. The notification email was not sent because the WhatsApp group link is not configured.";
    } else if (emailChanged) {
      responseMessage =
        "Profile updated successfully. Use your new email address the next time you log in. The confirmation email could not be sent.";
    }

    return res.status(200).json({
      message: responseMessage,
      profile: updatedProfile,
      emailChanged,
      emailNotificationSent: emailNotificationResult.sent,
      emailNotificationSkipped: emailNotificationResult.skipped,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Could not process profile request.",
    });
  }
}