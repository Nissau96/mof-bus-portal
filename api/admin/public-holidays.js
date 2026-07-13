import { requireAdmin } from "../_utils/requireAdmin.js";

/**
 * Lists, adds, and deletes public holidays.
 *
 * Admin-only endpoint.
 *
 * Booking is blocked when today's date exists in public_holidays.
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
      const { data: holidays, error } = await supabase
        .from("public_holidays")
        .select("id, holiday_date, name, created_at")
        .order("holiday_date", { ascending: false });

      if (error) {
        return res.status(500).json({
          message: error.message,
        });
      }

      return res.status(200).json({
        holidays: holidays || [],
      });
    }

    if (req.method === "POST") {
      const { holidayDate, name } = req.body || {};

      const cleanedDate = String(holidayDate || "").trim();
      const cleanedName = String(name || "").trim();

      if (!cleanedDate) {
        return res.status(400).json({
          message: "Holiday date is required.",
        });
      }

      if (!cleanedName) {
        return res.status(400).json({
          message: "Holiday name is required.",
        });
      }

      const datePattern = /^\d{4}-\d{2}-\d{2}$/;

      if (!datePattern.test(cleanedDate)) {
        return res.status(400).json({
          message: "Holiday date must be in YYYY-MM-DD format.",
        });
      }

      const { data: holiday, error: insertError } = await supabase
        .from("public_holidays")
        .insert({
          holiday_date: cleanedDate,
          name: cleanedName,
        })
        .select("id, holiday_date, name, created_at")
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          return res.status(409).json({
            message: "A public holiday already exists for this date.",
          });
        }

        return res.status(500).json({
          message: insertError.message,
        });
      }

      await supabase.from("audit_logs").insert({
        user_id: adminUser.id,
        action: "admin_added_public_holiday",
        details: {
          holiday_id: holiday.id,
          holiday_date: holiday.holiday_date,
          name: holiday.name,
        },
      });

      return res.status(201).json({
        message: "Public holiday has been added.",
        holiday,
      });
    }

    if (req.method === "DELETE") {
      const { id } = req.body || {};

      if (!id) {
        return res.status(400).json({
          message: "Public holiday ID is required.",
        });
      }

      const { data: existingHoliday, error: existingError } = await supabase
        .from("public_holidays")
        .select("id, holiday_date, name")
        .eq("id", id)
        .maybeSingle();

      if (existingError) {
        return res.status(500).json({
          message: existingError.message,
        });
      }

      if (!existingHoliday) {
        return res.status(404).json({
          message: "Public holiday was not found.",
        });
      }

      const { error: deleteError } = await supabase
        .from("public_holidays")
        .delete()
        .eq("id", id);

      if (deleteError) {
        return res.status(500).json({
          message: deleteError.message,
        });
      }

      await supabase.from("audit_logs").insert({
        user_id: adminUser.id,
        action: "admin_removed_public_holiday",
        details: {
          holiday_id: existingHoliday.id,
          holiday_date: existingHoliday.holiday_date,
          name: existingHoliday.name,
        },
      });

      return res.status(200).json({
        message: "Public holiday has been removed.",
        removedId: id,
      });
    }

    return res.status(405).json({
      message: "Method not allowed.",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Could not process public holidays request.",
    });
  }
}