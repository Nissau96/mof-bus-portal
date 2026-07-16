import process from "node:process";

import { getSupabaseAdmin } from "../../server/_utils/supabaseAdmin.js";
import { sendPowerAutomateEmail } from "../../server/_utils/powerAutomateEmail.js";

/**
 * Registers a permanent staff user.
 *
 * Security rules:
 * - Staff ID must exist in employee_registry.
 * - Email must match employee_registry.
 * - Full name must match employee_registry.
 * - Division must match employee_registry.
 * - Password is handled by Supabase Auth.
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

    const { data: registryUser, error: registryError } = await supabase
      .from("employee_registry")
      .select("staff_id, full_name, email, division, is_active")
      .eq("staff_id", cleanedStaffId)
      .maybeSingle();

    if (registryError) {
      return res.status(500).json({
        message: registryError.message,
      });
    }

    if (!registryUser || !registryUser.is_active) {
      return res.status(400).json({
        message: "Staff ID was not found in the active employee registry.",
      });
    }

    const registryEmail = registryUser.email.trim().toLowerCase();
    const registryName = registryUser.full_name.trim().toLowerCase();

    if (registryEmail !== cleanedEmail) {
      return res.status(400).json({
        message: "Email does not match the employee registry.",
      });
    }

    if (registryName !== cleanedFullName.toLowerCase()) {
      return res.status(400).json({
        message: "Full name does not match the employee registry.",
      });
    }

    if (registryUser.division !== cleanedDivision) {
      return res.status(400).json({
        message: "Division does not match the employee registry.",
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
          message: `Hello ${cleanedFullName},

Your MoF Bus Portal staff account has been created successfully.

Please join the official bus WhatsApp group using the link below:
${whatsappGroupLink}

Bus Route: ${cleanedBusRoute}
Drop-off Location: ${cleanedDropoffLocation}

Ministry of Finance Transport Booking Portal`,
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