# COM-DSS: Campus Occupancy Monitoring and Decision Support System

Dynamic frontend for ITU Ayazağa Campus occupancy monitoring. The original Google AI Studio prototype has been refactored into a React + Vite application while preserving the dark dashboard design, role switcher, sidebar, facility cards, campus map, charts, modal details, feedback controls, and admin views.

## Tech Stack

- React + Vite
- Tailwind CSS
- Supabase JavaScript client
- Chart.js via `react-chartjs-2`
- Lucide React icons

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create a local environment file:

```bash
cp .env.example .env.local
```

3. Add your Supabase frontend credentials:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Only use the Supabase anon/public key in the frontend. Do not place the service role key in `.env.local`, Vercel frontend variables, or client-side code.

4. Create and seed the database from the Supabase SQL editor:

- Run `supabase/schema.sql`
- Run `supabase/seed.sql`

5. Start the development server:

```bash
npm run dev
```

## Vercel Environment Variables

In Vercel, open the project settings and add these Environment Variables for Production, Preview, and Development as needed:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Redeploy after saving the variables. Never add `SUPABASE_SERVICE_ROLE_KEY` to a frontend deployment.

## Deploy Again

Push changes to the GitHub repository. Vercel will automatically build the Vite app from the connected repository. If you need a manual deployment, open the Vercel project and choose **Redeploy** from the latest deployment menu.

## Database Files

- `supabase/schema.sql` creates `users`, `facilities`, `occupancy_records`, `feedback_reports`, `recommendations`, and the `admin_analytics` view.
- `supabase/seed.sql` inserts the requested campus facilities and sample occupancy, feedback, recommendation, and chart data.
