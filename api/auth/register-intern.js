import { getSupabaseAdmin } from "../../server/_utils/supabaseAdmin.js";

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

    const supabase = getSupabaseAdmin();

    const { data: createdUser, error: createUserError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: "intern_nsp",
          full_name: fullName,
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
      full_name: fullName,
      email,
      phone,
      division,
      bus_route: busRoute,
      dropoff_location: dropoffLocation,
    });

    if (profileError) {
      await supabase.auth.admin.deleteUser(userId);

      return res.status(400).json({
        message: profileError.message,
      });
    }

    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: "intern_registered",
      details: {
        email,
        division,
        bus_route: busRoute,
      },
    });

    return res.status(201).json({
      message: "Intern/NSP account created successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Registration failed.",
    });
  }
}