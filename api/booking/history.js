import { getSupabaseAdmin } from "../_utils/supabaseAdmin.js";
import { getAuthUser } from "../_utils/getAuthUser.js";

/**
 * Returns the authenticated user's booking history.
 *
 * It combines:
 * - current daily tickets
 * - current waiting-list records
 * - archived ticket records
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed." });
  }

  try {
    const user = await getAuthUser(req);

    if (!user) {
      return res.status(401).json({
        message: "You must be logged in to view booking history.",
      });
    }

    const supabase = getSupabaseAdmin();

    const { data: dailyTickets, error: dailyTicketsError } = await supabase
      .from("daily_tickets")
      .select(
        "id, travel_date, ticket_number, bus_route, dropoff_location, status, created_at"
      )
      .eq("user_id", user.id)
      .order("travel_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (dailyTicketsError) {
      return res.status(500).json({
        message: dailyTicketsError.message,
      });
    }

    const { data: waitingList, error: waitingListError } = await supabase
      .from("waiting_list")
      .select(
        "id, travel_date, waiting_position, bus_route, dropoff_location, status, created_at"
      )
      .eq("user_id", user.id)
      .order("travel_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (waitingListError) {
      return res.status(500).json({
        message: waitingListError.message,
      });
    }

    const { data: archivedTickets, error: archivedTicketsError } =
      await supabase
        .from("archived_tickets")
        .select(
          "id, travel_date, ticket_number, bus_route, dropoff_location, status, created_at"
        )
        .eq("user_id", user.id)
        .order("travel_date", { ascending: false })
        .order("created_at", { ascending: false });

    if (archivedTicketsError) {
      return res.status(500).json({
        message: archivedTicketsError.message,
      });
    }

    const normalizedDailyTickets = (dailyTickets || []).map((ticket) => ({
      id: `daily-${ticket.id}`,
      source: "daily_tickets",
      travelDate: ticket.travel_date,
      ticketNumber: ticket.ticket_number
        ? String(ticket.ticket_number).padStart(2, "0")
        : "-",
      busRoute: ticket.bus_route,
      dropoffLocation: ticket.dropoff_location,
      status: ticket.status,
      createdAt: ticket.created_at,
    }));

    const normalizedWaitingList = (waitingList || []).map((record) => ({
      id: `waiting-${record.id}`,
      source: "waiting_list",
      travelDate: record.travel_date,
      ticketNumber: record.waiting_position
        ? `Waiting #${record.waiting_position}`
        : "Waiting",
      busRoute: record.bus_route,
      dropoffLocation: record.dropoff_location,
      status: record.status,
      createdAt: record.created_at,
    }));

    const normalizedArchivedTickets = (archivedTickets || []).map((ticket) => ({
      id: `archived-${ticket.id}`,
      source: "archived_tickets",
      travelDate: ticket.travel_date,
      ticketNumber: ticket.ticket_number
        ? String(ticket.ticket_number).padStart(2, "0")
        : "-",
      busRoute: ticket.bus_route,
      dropoffLocation: ticket.dropoff_location,
      status: ticket.status || "archived",
      createdAt: ticket.created_at,
    }));

    const history = [
      ...normalizedDailyTickets,
      ...normalizedWaitingList,
      ...normalizedArchivedTickets,
    ].sort((a, b) => {
      const firstDate = new Date(b.travelDate || b.createdAt);
      const secondDate = new Date(a.travelDate || a.createdAt);

      return firstDate - secondDate;
    });

    return res.status(200).json({
      history,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Could not load booking history.",
    });
  }
}