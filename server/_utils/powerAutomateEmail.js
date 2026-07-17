import process from "node:process";

/**
 * Sends an email request to Power Automate.
 *
 * The Power Automate webhook URL and shared secret are stored only
 * on the server side. They must never be exposed in React frontend code.
 */
export async function sendPowerAutomateEmail({
  eventType,
  to,
  fullName,
  subject,
  message,
  accountType = "",
  staffId = "",
  division = "",
  ticketNumber = "",
  travelDate = "",
  busRoute = "",
  dropoffLocation = "",
  departureWindow = "",
}) {
  const webhookUrl = process.env.POWER_AUTOMATE_EMAIL_WEBHOOK_URL;
  const sharedSecret = process.env.POWER_AUTOMATE_SHARED_SECRET;

  if (!webhookUrl || !sharedSecret) {
    throw new Error("Missing Power Automate email environment variables.");
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      secret: sharedSecret,
      eventType,
      to,
      fullName,
      subject,
      message,
      accountType,
      staffId,
      division,
      ticketNumber,
      travelDate,
      busRoute,
      dropoffLocation,
      departureWindow,
    }),
  });

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");
    throw new Error(responseText || "Power Automate email request failed.");
  }

  return true;
}