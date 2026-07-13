import { requireAdmin } from "../_utils/requireAdmin.js";
import { generateGhanaPublicHolidays } from "../_utils/ghanaHolidays.js";

/**
 * Lists, adds, generates, and deletes public holidays.
 *
 * Admin-only endpoint.
 *
 * Booking is blocked when today's date exists in public_holidays.
 *
 * Supported methods:
 * - GET: list public holidays
 * - POST: add a manual holiday or generate Ghana holidays for a year
 * - DELETE: remove a public holiday
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
        .select(
          "id, holiday_date, observed_date, base_date, name, holiday_type, source, year, created_at"
        )
        .order("observed_date", { ascending: false })
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
      const { holidayDate, name, year, mode } = req.body || {};

      /**
       * Auto-generate Ghana holidays for a selected year.
       *
       * This creates:
       * - New Year’s Day
       * - Constitution Day
       * - Independence Day
       * - Good Friday
       * - Easter Monday
       * - Labour Day
       * - Republic Day
       * - Founder’s Day
       * - Farmer’s Day
       * - Christmas Day
       * - Boxing Day
       *
       * Eid holidays are not generated because they must be entered manually
       * when official dates are announced.
       */
      if (mode === "generate_year") {
        const parsedYear = Number(year);

        if (
          !Number.isInteger(parsedYear) ||
          parsedYear < 2025 ||
          parsedYear > 2100
        ) {
          return res.status(400).json({
            message: "Enter a valid year between 2025 and 2100.",
          });
        }

        const generatedHolidays = generateGhanaPublicHolidays(parsedYear);

        const { data: holidays, error: upsertError } = await supabase
          .from("public_holidays")
          .upsert(generatedHolidays, {
            onConflict: "observed_date",
          })
          .select(
            "id, holiday_date, observed_date, base_date, name, holiday_type, source, year, created_at"
          );

        if (upsertError) {
          return res.status(500).json({
            message: upsertError.message,
          });
        }

        await supabase.from("audit_logs").insert({
          user_id: adminUser.id,
          action: "admin_generated_public_holidays",
          details: {
            year: parsedYear,
            generated_count: holidays?.length || 0,
            source: "ghana_holiday_generator",
          },
        });

        return res.status(201).json({
          message: `Ghana public holidays for ${parsedYear} have been generated.`,
          holidays: holidays || [],
        });
      }

      /**
       * Manual holiday entry.
       *
       * Use this for:
       * - Eid-ul-Fitr
       * - Shaqq Day
       * - Eid-ul-Adha
       * - Any Ministry-declared additional holiday
       * - Any one-off holiday
       */
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

      const parsedManualYear = Number(cleanedDate.slice(0, 4));

      const { data: holiday, error: insertError } = await supabase
        .from("public_holidays")
        .insert({
          holiday_date: cleanedDate,
          observed_date: cleanedDate,
          base_date: cleanedDate,
          name: cleanedName,
          holiday_type: "manual",
          source: "admin",
          year: parsedManualYear,
        })
        .select(
          "id, holiday_date, observed_date, base_date, name, holiday_type, source, year, created_at"
        )
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          return res.status(409).json({
            message: "A public holiday already exists for this observed date.",
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
          observed_date: holiday.observed_date,
          base_date: holiday.base_date,
          name: holiday.name,
          holiday_type: holiday.holiday_type,
          source: holiday.source,
          year: holiday.year,
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
        .select(
          "id, holiday_date, observed_date, base_date, name, holiday_type, source, year"
        )
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
          observed_date: existingHoliday.observed_date,
          base_date: existingHoliday.base_date,
          name: existingHoliday.name,
          holiday_type: existingHoliday.holiday_type,
          source: existingHoliday.source,
          year: existingHoliday.year,
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