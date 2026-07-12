import {
  CalendarClock,
  Clock,
  MapPinned,
  ShieldCheck,
  TicketCheck,
} from "lucide-react";

/**
 * Booking summary data displayed on the booking page.
 *
 * These are temporary frontend placeholder values.
 * Later, they will come from Supabase and the booking API.
 */
export const BOOKING_SUMMARY = [
  {
    label: "Booking Status",
    value: "Open",
    description: "Available for today",
    icon: ShieldCheck,
  },
  {
    label: "Available Seats",
    value: "36",
    description: "Current remaining capacity",
    icon: TicketCheck,
  },
  {
    label: "Departure Window",
    value: "4:45 PM - 5:00 PM",
    description: "GMT",
    icon: Clock,
  },
  {
    label: "Travel Date",
    value: "Today",
    description: "Weekday service only",
    icon: CalendarClock,
  },
];

/**
 * Route summary shown beside the booking form.
 */
export const ROUTE_SUMMARY = {
  title: "Approved Staff Bus Route",
  description:
    "Select your preferred drop-off location from the approved Ministry staff bus route.",
  icon: MapPinned,
};