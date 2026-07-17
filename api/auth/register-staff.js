import process from "node:process";

import { getSupabaseAdmin } from "../../server/_utils/supabaseAdmin.js";
import { sendPowerAutomateEmail } from "../../server/_utils/powerAutomateEmail.js";

/**
 * Registers a staff user without requiring a pre-existing employee_registry entry.
 *
 * Rules:
 * - Staff ID is required.
 * - Staff ID must not already exist in profiles.
 * - Email must not already exist in profiles.
 * - Password is handled by Supabase Auth.
 * - WhatsApp group invite email is sent after successful registration if configured.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed." });
  }

  try {
    const {
      staffId,
      fullName,
      email,
      phone,
      division,
      busRoute,
      dropoffLocation,
      password,
    } = req.body;

    if (
      !staffId ||
      !fullName ||
      !email ||
      !phone ||
      !division ||
      !busRoute ||
      !dropoffLocation ||
      !password
    ) {
      return res.status(400).json({
        message: "Please complete all required fields.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters.",
      });
    }

    const cleanedStaffId = String(staffId).trim();
    const cleanedFullName = String(fullName).trim();
    const cleanedEmail = String(email).trim().toLowerCase();
    const cleanedPhone = String(phone).trim();
    const cleanedDivision = String(division).trim();
    const cleanedBusRoute = String(busRoute).trim();
    const cleanedDropoffLocation = String(dropoffLocation).trim();

    const supabase = getSupabaseAdmin();

    const { data: existingStaffProfile, error: staffCheckError } =
      await supabase
        .from("profiles")
        .select("id, staff_id")
        .eq("staff_id", cleanedStaffId)
        .maybeSingle();

    if (staffCheckError) {
      return res.status(500).json({
        message: staffCheckError.message,
      });
    }

    if (existingStaffProfile) {
      return res.status(409).json({
        message: "This Staff ID has already been registered.",
      });
    }

    const { data: existingEmailProfile, error: emailCheckError } =
      await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", cleanedEmail)
        .maybeSingle();

    if (emailCheckError) {
      return res.status(500).json({
        message: emailCheckError.message,
      });
    }

    if (existingEmailProfile) {
      return res.status(409).json({
        message: "This email address has already been registered.",
      });
    }

    const { data: createdUser, error: createUserError } =
      await supabase.auth.admin.createUser({
        email: cleanedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          role: "staff",
          staff_id: cleanedStaffId,
          full_name: cleanedFullName,
        },
      });

    if (createUserError) {
      return res.status(400).json({
        message: createUserError.message,
      });
    }

    const userId = createdUser.user.id;

    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      role: "staff",
      staff_id: cleanedStaffId,
      full_name: cleanedFullName,
      email: cleanedEmail,
      phone: cleanedPhone,
      division: cleanedDivision,
      bus_route: cleanedBusRoute,
      dropoff_location: cleanedDropoffLocation,
      is_disabled: false,
    });

    if (profileError) {
      await supabase.auth.admin.deleteUser(userId);

      return res.status(400).json({
        message: profileError.message,
      });
    }

    let whatsappEmailSent = false;
    const whatsappGroupLink = process.env.WHATSAPP_GROUP_LINK;

    if (whatsappGroupLink) {
      try {
        await sendPowerAutomateEmail({
          eventType: "registration_whatsapp_invite",
          to: cleanedEmail,
          fullName: cleanedFullName,
          subject: "Welcome to the MoF Bus Portal",
          message: `Your MoF Bus Portal Staff account has been created successfully.

Please join the official bus WhatsApp group using the link below:
${whatsappGroupLink}

Your registration details are:

Account Type: Staff
Staff ID: ${cleanedStaffId}
Division: ${cleanedDivision}
Bus Route: ${cleanedBusRoute}
Drop-off Location: ${cleanedDropoffLocation}

You can now log in to the Ministry of Finance Transport Booking Portal to book your daily bus ticket when booking opens.`,
          accountType: "Staff",
          staffId: cleanedStaffId,
          division: cleanedDivision,
          busRoute: cleanedBusRoute,
          dropoffLocation: cleanedDropoffLocation,
        });

        whatsappEmailSent = true;
      } catch (emailError) {
        await supabase.from("audit_logs").insert({
          user_id: userId,
          action: "registration_whatsapp_email_failed",
          details: {
            email: cleanedEmail,
            staff_id: cleanedStaffId,
            error: emailError.message,
          },
        });
      }
    }

    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: "staff_registered",
      details: {
        staff_id: cleanedStaffId,
        email: cleanedEmail,
        division: cleanedDivision,
        bus_route: cleanedBusRoute,
        registration_mode: "self_service_without_employee_registry",
        whatsapp_email_sent: whatsappEmailSent,
      },
    });

    return res.status(201).json({
      message: whatsappEmailSent
        ? "Staff account created successfully. A WhatsApp group invite has been sent to your email."
        : "Staff account created successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Registration failed.",
    });
  }
}