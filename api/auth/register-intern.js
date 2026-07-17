import process from "node:process";

import { getSupabaseAdmin } from "../../server/_utils/supabaseAdmin.js";
import { sendPowerAutomateEmail } from "../../server/_utils/powerAutomateEmail.js";

/**
 * Registers an Intern or NSP user.
 *
 * Intern/NSP users do not require staff ID validation.
 * They still receive a profile record with division, bus route, and drop-off location.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed." });
  }

  try {
    const {
      fullName,
      email,
      phone,
      division,
      busRoute,
      dropoffLocation,
      password,
    } = req.body;

    if (
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

    const cleanedFullName = String(fullName).trim();
    const cleanedEmail = String(email).trim().toLowerCase();
    const cleanedPhone = String(phone).trim();
    const cleanedDivision = String(division).trim();
    const cleanedBusRoute = String(busRoute).trim();
    const cleanedDropoffLocation = String(dropoffLocation).trim();

    const supabase = getSupabaseAdmin();

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
          role: "intern_nsp",
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
      role: "intern_nsp",
      staff_id: null,
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
          message: `Your MoF Bus Portal Intern/NSP account has been created successfully.

Please join the official bus WhatsApp group using the link below:
${whatsappGroupLink}

Your registration details are:

Account Type: Intern/NSP
Division: ${cleanedDivision}
Bus Route: ${cleanedBusRoute}
Drop-off Location: ${cleanedDropoffLocation}

You can now log in to the Ministry of Finance Transport Booking Portal to book your daily bus ticket when booking opens.`,
          accountType: "Intern/NSP",
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
            error: emailError.message,
          },
        });
      }
    }

    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: "intern_registered",
      details: {
        email: cleanedEmail,
        division: cleanedDivision,
        bus_route: cleanedBusRoute,
        whatsapp_email_sent: whatsappEmailSent,
      },
    });

    return res.status(201).json({
      message: whatsappEmailSent
        ? "Intern/NSP account created successfully. A WhatsApp group invite has been sent to your email."
        : "Intern/NSP account created successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Registration failed.",
    });
  }
}