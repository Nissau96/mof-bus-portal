import {
  CalendarCheck,
  Clock3,
  ListChecks,
  Route,
  TicketCheck,
  UserCheck,
  Zap,
} from "lucide-react";

/**
 * Dashboard metric cards shown on the main dashboard.
 * For now, these values are placeholders.
 * Later, they will come from Supabase.
 */
export const DASHBOARD_METRICS = [
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
  {
    label: "Waiting List",
    value: "0",
    description: "Users currently waiting",
    icon: ListChecks,
    tone: "amber",
  },
  {
    label: "Active Requests",
    value: "2",
    description: "Booking workflows in progress",
    icon: Zap,
    tone: "red",
  },
];

/**
 * Quick actions shown on the dashboard.
 * These link to future pages we will build.
 */
export const QUICK_ACTIONS = [
  {
    label: "Book Ticket",
    description: "Reserve your seat for today’s trip.",
    href: "/book",
    icon: TicketCheck,
  },
  {
    label: "View Route",
    description: "Check the approved drop-off route list.",
    href: "/route",
    icon: Route,
  },
  {
    label: "Booking History",
    description: "View your previous ticket records.",
    href: "/history",
    icon: Clock3,
  },
  {
    label: "My Profile",
    description: "Review your profile.",
    href: "/profile",
    icon: UserCheck,
  },
];