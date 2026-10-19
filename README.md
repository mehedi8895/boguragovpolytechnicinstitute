# Bogura Government Polytechnic Institute

Responsive, Bangla-first institutional website using HTML5, CSS3, Vanilla JavaScript, Supabase Auth/Postgres/Storage, and static hosting.

## Repository
https://github.com/mehedi8895/boguragovpolytechnicinstitute

## Current implementation
- Responsive public homepage with campus photo, institute overview, nine department cards, notice board, teacher empty state, contact details and footer.
- Mobile navigation and persisted dark/light theme.
- Department detail dialogs and graceful notice loading/empty/error states.
- Supabase-backed published notice reads.
- Separate Admin Panel using Supabase Auth and database role verification.
- CRUD UI for notices, faculty records and departments; optional PDF/photo uploads to Supabase Storage.
- SQL schema, indexes, triggers and RLS policies.
- No fabricated teacher records or invented principal/staff information.

## Important Supabase project warning
The project ID that was mentioned in the initial brief, `pkvcnxxuulzglzavzwuf`, currently identifies a Supabase project named **Gadgets BD**. Do not apply the BGPI schema to it. Another available project was named “mehedi8895's Project”, which has not been verified as the institute's dedicated project either. No BGPI database has been modified by this repository setup.

Use a dedicated, verified BGPI Supabase project. Creating a new project may incur charges; confirm pricing in Supabase before creating one. Once the institute project is confirmed, apply `supabase/schema.sql` in that project's SQL Editor.

## Configuration
Edit `assets/js/config.js`:
- `SUPABASE_URL`: Project URL from Supabase Dashboard → Project Settings → API.
- `SUPABASE_ANON_KEY`: publishable key (or legacy anon key) from the same page.

Only public browser keys belong here. Never use a service-role key, database password, or other privileged secret in this file or in GitHub.

## First administrator setup
1. Create/confirm the dedicated BGPI Supabase project.
2. Run `supabase/schema.sql` in its SQL Editor after reviewing the target project.
3. In Supabase Dashboard → Authentication, create the first admin Auth user. Do not build a public admin registration form.
4. Copy the Auth user's UUID from the user list.
5. In SQL Editor, run the following after replacing the UUID:
   ```sql
   insert into public.bgpi_admin_users (user_id, role, active)
   values ('REPLACE-WITH-AUTH-USER-UUID'::uuid, 'owner', true);
   ```
6. Add the project URL and public publishable/anon key to `assets/js/config.js`.
7. Sign in at `/admin.html`. Admin writes are enforced by RLS, not just frontend UI checks.

## Deployment on Vercel
1. Import `mehedi8895/boguragovpolytechnicinstitute` in Vercel.
2. Framework preset: Other. Build command: leave blank. Output directory: `.`.
3. After configuration, deploy. Since this is a static site, no server-side environment variables are required; the public Supabase URL/key are in `assets/js/config.js`.
4. If a deployment already exists, verify the production domain and latest Git commit before sharing it.

## Public institution details used
- Address: শেরপুর রোড, বগুড়া – ৫৮০০
- Office telephone: +8802588814060
- Mobile: 01309133819
- Email: bogra_poly@yahoo.com
- Official site: https://bogura.polytech.gov.bd/
- Official teacher page: https://bogura.polytech.gov.bd/views/teacher-list-faculty
- Official notice page: https://bogura.polytech.gov.bd/pages/notices
- Map: https://shorturl.at/mJTmU

The logo/crest in `assets/images/crest.svg` is an original illustrative placeholder, not a verified official institute logo. Replace it with an official asset only after verification.

## Known limitations / verification status
- Supabase project configuration and schema application: **Not verified / not performed** because the available project matching the supplied ID is named Gadgets BD and is not appropriate for this institute.
- Admin login and CRUD against a live BGPI database: **Not verified** until a dedicated project is configured.
- Vercel production deployment URL: **Not created or verified** in this setup.
- Teacher directory intentionally remains empty until a verified teacher PDF/list is supplied.
- Browser-level automated tests have not been run from this repository connector. Please test the live site at 360, 390, 768, 1024 and 1440 px, and verify RLS with both admin and non-admin accounts before production use.