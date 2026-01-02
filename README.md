# ClickMechanic booking prototype

This repo is a static booking flow that can be deployed to any static host (including GitHub Pages). Supabase Edge Functions back the booking submission and the optional admin dashboard.

## Hosting on GitHub Pages
1. Commit the repo to GitHub.
2. In **Settings → Pages**, set the source to the `work` branch (or your chosen branch) and root folder (`/`).
3. Pages will serve `index.html` (booking form) and `admin.html` (admin console). No build step is required.

## Admin dashboard
- Open `admin.html` to view/manage jobs.
- Enter your Supabase Functions base URL (e.g. `https://<project>.functions.supabase.co`) and the admin API token (see below). Values are saved locally in your browser.
- The dashboard reads jobs and lets you mark them as `done`.

### Supabase admin API
Deploy the `admin-jobs` Edge Function and set these environment variables:
- `SUPABASE_URL` – your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` – service role key (needed for RLS-protected writes)
- `ADMIN_API_KEY` – shared secret token used by the admin console (`Authorization: Bearer <token>`)

`admin-jobs` supports:
- `GET /admin-jobs` → `{ jobs: [...] }`
- `PATCH /admin-jobs` with `{ id, status }` → updates job status (supports `pending`, `done`, `completed`, `cancelled`).

Existing functions (`submit-job`, `lookup-vehicle`, `ai-clarify`) remain unchanged.
