import crypto from "node:crypto";

/**
 * Generates a secure random shared secret.
 *
 * This secret is used by:
 * 1. The Vercel backend API
 * 2. The Power Automate condition check
 *
 * Important:
 * Generate this once, copy it into .env.local, and copy the same value
 * into the Power Automate condition.
 */
const secret = crypto.randomBytes(48).toString("hex");

console.log("");
console.log("Generated Power Automate Shared Secret:");
console.log("");
console.log(secret);
console.log("");
console.log("Add this to .env.local:");
console.log("");
console.log(`POWER_AUTOMATE_SHARED_SECRET=${secret}`);
console.log("");
console.log("Use the same value in your Power Automate Condition:");
console.log("");
console.log(`triggerBody()?['secret'] is equal to ${secret}`);
console.log("");