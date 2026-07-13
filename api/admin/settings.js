import { requireAdmin } from "../_utils/requireAdmin.js";

/**
 * Reads and updates system settings.
 *
 * Admin-only endpoint.
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
      const { data: settings, error } = await supabase
        .from("system_settings")
        .select(
          "id, bus_capacity, departure_start_time, departure_end_time, booking_open_time, updated_at"
        )
        .eq("id", 1)
        .maybeSingle();

      if (error) {
        return res.status(500).json({
          message: error.message,
        });
      }

      if (!settings) {
        return res.status(404).json({
          message: "System settings record was not found.",
        });
      }

      return res.status(200).json({
        settings,
      });
    }

    if (req.method === "POST") {
      const {
        busCapacity,
        bookingOpenTime,
        departureStartTime,
        departureEndTime,
      } = req.body || {};

      const parsedCapacity = Number(busCapacity);

      if (!Number.isInteger(parsedCapacity) || parsedCapacity < 1) {
        return res.status(400).json({
          message: "Bus capacity must be a positive whole number.",
        });
      }

      if (parsedCapacity > 200) {
        return res.status(400).json({
          message: "Bus capacity cannot exceed 200.",
        });
      }

      if (!bookingOpenTime || !departureStartTime || !departureEndTime) {
        return res.status(400).json({
          message: "Booking open time and departure times are required.",
        });
      }

      const timePattern = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

      if (
        !timePattern.test(bookingOpenTime) ||
        !timePattern.test(departureStartTime) ||
        !timePattern.test(departureEndTime)
      ) {
        return res.status(400).json({
          message: "Times must be in HH:MM or HH:MM:SS format.",
        });
      }

      const normalizedBookingOpenTime =
        bookingOpenTime.length === 5 ? `${bookingOpenTime}:00` : bookingOpenTime;

      const normalizedDepartureStartTime =
        departureStartTime.length === 5
          ? `${departureStartTime}:00`
          : departureStartTime;

      const normalizedDepartureEndTime =
        departureEndTime.length === 5
          ? `${departureEndTime}:00`
          : departureEndTime;

      const { data: currentSettings, error: currentSettingsError } =
        await supabase
          .from("system_settings")
          .select(
            "id, bus_capacity, departure_start_time, departure_end_time, booking_open_time"
          )
          .eq("id", 1)
          .maybeSingle();

      if (currentSettingsError) {
        return res.status(500).json({
          message: currentSettingsError.message,
        });
      }

      const { data: updatedSettings, error: updateError } = await supabase
        .from("system_settings")
        .update({
          bus_capacity: parsedCapacity,
          booking_open_time: normalizedBookingOpenTime,
          departure_start_time: normalizedDepartureStartTime,
          departure_end_time: normalizedDepartureEndTime,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1)
        .select(
          "id, bus_capacity, departure_start_time, departure_end_time, booking_open_time, updated_at"
        )
        .single();

      if (updateError) {
        return res.status(500).json({
          message: updateError.message,
        });
      }

      await supabase.from("audit_logs").insert({
        user_id: adminUser.id,
        action: "admin_updated_system_settings",
        details: {
          previous_settings: currentSettings,
          new_settings: updatedSettings,
        },
      });

      return res.status(200).json({
        message: "System settings have been updated.",
        settings: updatedSettings,
      });
    }

    return res.status(405).json({
      message: "Method not allowed.",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Could not process system settings request.",
    });
  }
}