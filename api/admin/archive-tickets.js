import { requireAdmin } from "../_utils/requireAdmin.js";
import { getAccraDateTimeParts } from "../_utils/bookingRules.js";

/**
 * Archives old daily ticket records.
 *
 * Admin-only endpoint.
 *
 * Rules:
 * - Only archives tickets before today's Accra date.
 * - Does not touch today's active tickets.
 * - Moves old daily_tickets into archived_tickets.
 * - Deletes old daily_tickets after successful archive.
 * - Deletes old waiting_list records because they are no longer actionable.
 */
export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({
      message: "Method not allowed.",
    });
  }

  try {
    const auth = await requireAdmin(req);

    if (auth.error) {
      return res.status(auth.error.status).json({
        message: auth.error.message,
      });
    }

    const { user: adminUser, supabase } = auth;
    const { dateISO: today } = getAccraDateTimeParts();

    const { count: oldTicketsCount, error: oldTicketsCountError } =
      await supabase
        .from("daily_tickets")
        .select("*", { count: "exact", head: true })
        .lt("travel_date", today);

    if (oldTicketsCountError) {
      return res.status(500).json({
        message: oldTicketsCountError.message,
      });
    }

    const { count: oldWaitingCount, error: oldWaitingCountError } =
      await supabase
        .from("waiting_list")
        .select("*", { count: "exact", head: true })
        .lt("travel_date", today);

    if (oldWaitingCountError) {
      return res.status(500).json({
        message: oldWaitingCountError.message,
      });
    }

    if (req.method === "GET") {
      return res.status(200).json({
        today,
        oldTicketsCount: oldTicketsCount || 0,
        oldWaitingCount: oldWaitingCount || 0,
      });
    }

    const { data: oldTickets, error: oldTicketsError } = await supabase
      .from("daily_tickets")
      .select(
        "id, user_id, travel_date, ticket_number, dropoff_location, status, bus_route"
      )
      .lt("travel_date", today)
      .order("travel_date", { ascending: true })
      .order("ticket_number", { ascending: true });

    if (oldTicketsError) {
      return res.status(500).json({
        message: oldTicketsError.message,
      });
    }

    const archivePayload = (oldTickets || []).map((ticket) => ({
      original_ticket_id: ticket.id,
      user_id: ticket.user_id,
      travel_date: ticket.travel_date,
      ticket_number: ticket.ticket_number,
      dropoff_location: ticket.dropoff_location,
      status: ticket.status,
      bus_route: ticket.bus_route,
      archived_at: new Date().toISOString(),
    }));

    let archivedCount = 0;

    if (archivePayload.length > 0) {
      const { data: archivedRecords, error: archiveError } = await supabase
        .from("archived_tickets")
        .upsert(archivePayload, {
          onConflict: "original_ticket_id",
        })
        .select("id");

      if (archiveError) {
        return res.status(500).json({
          message: archiveError.message,
        });
      }

      archivedCount = archivedRecords?.length || 0;
    }

    const { error: deleteTicketsError } = await supabase
      .from("daily_tickets")
      .delete()
      .lt("travel_date", today);

    if (deleteTicketsError) {
      return res.status(500).json({
        message: deleteTicketsError.message,
      });
    }

    const { error: deleteWaitingError } = await supabase
      .from("waiting_list")
      .delete()
      .lt("travel_date", today);

    if (deleteWaitingError) {
      return res.status(500).json({
        message: deleteWaitingError.message,
      });
    }

    await supabase.from("audit_logs").insert({
      user_id: adminUser.id,
      action: "admin_archived_old_tickets",
      details: {
        today,
        old_tickets_found: oldTicketsCount || 0,
        old_waiting_records_found: oldWaitingCount || 0,
        archived_count: archivedCount,
      },
    });

    return res.status(200).json({
      message: "Old ticket records have been archived successfully.",
      today,
      oldTicketsFound: oldTicketsCount || 0,
      oldWaitingRecordsFound: oldWaitingCount || 0,
      archivedCount,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Could not archive old ticket records.",
    });
  }
}