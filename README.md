# MOF Bus Portal

A Ministry of Finance staff transport booking portal built with React, Vite, Tailwind CSS, and Supabase.

The application supports role-based authentication, daily bus ticket booking, waiting list management, privileged booking windows, user profile updates, administrative controls, audit logging, and webhook-driven email notifications.

## Key Features

- Role-based access and authentication
  - Admin, Staff, and Intern/NSP user roles
  - Staff and Admin login using Staff ID plus password
  - Intern/NSP registration using email, password, and profile details
  - Supabase Auth for secure session management
- Daily booking flow
  - Book tickets for bus routes and drop-off locations
  - Waiting list placement and automatic promotion when tickets are canceled
  - Privileged early booking window for eligible users
  - No booking on weekends or public holidays
- Administrative portal
  - Admin dashboard with ticket and user summaries
  - User search, account controls, and active session monitoring
  - Manage privileged booking access and public holiday records
  - Archive old tickets, export manifests, and review audit logs
- Backend and integration
  - Supabase PostgreSQL and Auth integration via serverless API routes
  - Server-side admin client using Supabase service role key
  - Power Automate webhook support for email notifications
  - Configurable WhatsApp group invitation and admin notification emails

## Project Structure

- `src/`
  - `App.jsx` - main route definitions and access controls
  - `pages/` - app pages for authentication, booking, profile, history, and admin panels
  - `components/` - shared UI components and route protection wrappers
  - `context/` - theme and toast providers
  - `lib/` - frontend helpers for Supabase, API requests, and utilities
  - `assets/` - static media and icon assets
- `api/`
  - `auth/` - staff login and account registration endpoints
  - `profile/` - profile retrieval and update endpoint
  - `booking/` - booking summary, create, cancel, history, and ticket status endpoints
  - `admin/` - admin-only operations including manifests, logs, holidays, archives, and privileged users
- `server/_utils/`
  - `supabaseAdmin.js` - server-side Supabase admin client initialization
  - `supabaseAnon.js` - client setup for anonymous Supabase auth actions
  - `getAuthUser.js` - validates Authorization: Bearer tokens and returns the authenticated user
  - `requireAdmin.js` - enforces administrator-level access for admin routes
  - `bookingRules.js` - booking window logic, holiday handling, and privilege rules
  - `powerAutomateEmail.js` - webhook helper for sending email requests to Power Automate
  - `ghanaHolidays.js` - Ghana public holiday generator for calendar-based booking restrictions
- `scripts/`
  - `generate-secret.js` - generates a secure shared secret for Power Automate integration
- `public/` - static assets served by the application
- `vercel.json` - rewrite rules for SPA client-side routing and API handling

## User Experience

### User pages

- `/` - login page
- `/register` - user registration for Staff or Intern/NSP
- `/dashboard` - authenticated user dashboard summary
- `/book` - book a bus ticket with route and drop-off selection
- `/history` - view personal booking history
- `/profile` - manage user profile and email
- `/forgot-password` - password recovery entry page
- `/reset-password` - reset password page
- `/supabase-test` - authenticated test page for Supabase connectivity

### Admin pages

- `/admin` - admin overview dashboard
- `/admin/tickets` - ticket and booking management
- `/admin/users` - profile search and user account management
- `/admin/active-users` - active user monitoring
- `/admin/privileged-users` - privileged booking access management
- `/admin/booking-history` - archived booking history and reviews
- `/admin/public-holidays` - public holiday generation and management
- `/admin/maintenance` - archive old tickets and system maintenance
- `/admin/manifest` - export or view daily ticket manifests
- `/admin/audit-logs` - audit trail of system actions
- `/admin/settings` - system settings and operational configuration

## Booking Rules

- No booking on weekends
- No booking on public holidays
- Privileged users can book between 16:00 and 16:25
- A release buffer blocks new booking from 16:25 to 16:30
- Regular ticket booking opens at 16:30
- Booking closes after the configured departure end time
- Privileged users and staff receive higher priority than Intern/NSP users
- Non-admin users do not see seat availability until booking opens

## API Reference

### Authentication

- `POST /api/auth/login-staff`
  - Staff/Admin login using staffId and password
  - Returns Supabase session, user info, and profile data
- `POST /api/auth/register-staff`
  - Register a Staff account with Staff ID, email, phone, division, bus route, drop-off location, and password
- `POST /api/auth/register-intern`
  - Register an Intern/NSP account with email, phone, division, bus route, drop-off location, and password

### Profile

- `GET /api/profile/me`
  - Returns the authenticated user profile
- `POST /api/profile/me`
  - Updates profile fields and optionally changes email in Supabase Auth
  - Sends notification and audit logging for email changes when configured

### Booking

- `GET /api/booking/summary`
  - Fetches booking availability, current booking window status, and ticket capacity
- `GET /api/booking/my-ticket`
  - Returns the user's confirmed ticket or waiting list status for today
- `GET /api/booking/history`
  - Returns the authenticated user's booking history
- `POST /api/booking/create`
  - Creates a ticket request or waiting list entry for the authenticated user
- `POST /api/booking/cancel`
  - Cancels the user's ticket and promotes the first waiting list entry if available

### Admin actions

- `GET /api/admin/[action]` and `POST /api/admin/[action]`
  - Dynamic admin endpoint for actions such as audit-logs, booking-history, manifest, archive-tickets, public-holidays, and maintenance
- `GET /api/admin/privileged-users`
  - Lists privileged users and supports searching by staff ID or profile ID
- `POST /api/admin/privileged-users`
  - Adds privileged booking access for a Staff ID or profile ID
- `DELETE /api/admin/privileged-users`
  - Removes privileged booking access

## Environment Variables

### Client-side

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous public key

### Server-side

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous public key for server-side requests
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key for admin operations
- `POWER_AUTOMATE_EMAIL_WEBHOOK_URL` - Power Automate webhook endpoint for email notifications
- `POWER_AUTOMATE_SHARED_SECRET` - Shared secret validated by Power Automate webhook requests
- `ADMIN_REGISTRATION_EMAIL` - optional admin email to receive new registration notifications
- `WHATSAPP_GROUP_LINK` - optional WhatsApp group invite link sent on registration or updated email

> Note: Do not commit any secret values such as SUPABASE_SERVICE_ROLE_KEY or POWER_AUTOMATE_SHARED_SECRET.

## Development

1. Install dependencies

   ```bash
   npm install
   ```

2. Add local environment variables in `.env.local`

3. Start the development server

   ```bash
   npm run dev
   ```

4. Build for production

   ```bash
   npm run build
   ```

5. Preview a production build locally

   ```bash
   npm run preview
   ```

6. Lint the codebase

   ```bash
   npm run lint
   ```

7. Generate a Power Automate shared secret

   ```bash
   npm run generate:secret
   ```

## Deployment

The project is configured for static hosting with serverless API routes. The `vercel.json` rewrite rules route client-side navigation through `index.html` while preserving `/api` endpoints for backend actions.

For production deployment, configure the same environment variables in your hosting provider and keep all server-side secrets secure.

## Notes

- `src/lib/supabaseClient.js` initializes the frontend Supabase client using Vite env vars.
- `server/_utils/supabaseAdmin.js` initializes the Supabase admin client using the service role key.
- `server/_utils/getAuthUser.js` validates Authorization: Bearer tokens for backend API requests.
- `server/_utils/bookingRules.js` enforces booking windows, privileged access, and holiday closures.
- `server/_utils/powerAutomateEmail.js` sends webhook requests to Power Automate.
- `api/admin/[action].js` centralizes admin-only actions and enforces administrator access.
