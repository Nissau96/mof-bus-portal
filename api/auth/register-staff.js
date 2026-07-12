import { getSupabaseAdmin } from "../_utils/supabaseAdmin.js";

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

    const supabase = getSupabaseAdmin();

    const { data: registryUser, error: registryError } = await supabase
      .from("employee_registry")
      .select("staff_id, full_name, email, division, is_active")
      .eq("staff_id", staffId)
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
    const submittedEmail = email.trim().toLowerCase();

    const registryName = registryUser.full_name.trim().toLowerCase();
    const submittedName = fullName.trim().toLowerCase();

    if (registryEmail !== submittedEmail) {
      return res.status(400).json({
        message: "Email does not match the employee registry.",
      });
    }

    if (registryName !== submittedName) {
      return res.status(400).json({
        message: "Full name does not match the employee registry.",
      });
    }

    if (registryUser.division !== division) {
      return res.status(400).json({
        message: "Division does not match the employee registry.",
      });
    }

    const { data: createdUser, error: createUserError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: "staff",
          staff_id: staffId,
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
      role: "staff",
      staff_id: staffId,
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
      action: "staff_registered",
      details: {
        staff_id: staffId,
        email,
        division,
        bus_route: busRoute,
      },
    });

    return res.status(201).json({
      message: "Staff account created successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Registration failed.",
    });
  }
}