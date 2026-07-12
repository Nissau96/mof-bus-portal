import {
  CalendarCheck,
  Clock3,
  TicketCheck,
  UserCheck,
} from "lucide-react";

/**
 * User dashboard metric cards.
 * 
 * This is intentionally simplified for normal users.
 * Admin users will later receive a separate admin dashboard with more metrics.
 */
export const USER_DASHBOARD_METRICS = [
  {
    label: "Today’s Ticket #",
    value: "0",
    description: "No confirmed ticket yet",
    icon: TicketCheck,
    tone: "blue",
  },
  {
    label: "Available Seats",
    value: "36",
    description: "Seats currently available",
    icon: CalendarCheck,
    tone: "green",
  },
];

/**
 * User dashboard quick actions.
 * 
 * Booking itself remains available through the main hero button,
 * while this section focuses on user account and history actions.
 */
export const USER_QUICK_ACTIONS = [
  {
    label: "Booking History",
    description: "View your previous ticket records.",
    href: "/history",
    icon: Clock3,
  },
  {
    label: "My Profile",
    description: "Review your staff or intern profile.",
    href: "/profile",
    icon: UserCheck,
  },
];