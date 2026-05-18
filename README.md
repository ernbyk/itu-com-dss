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

Only use the Supabase anon/public key in the frontend.

4. Create and seed the database from the Supabase SQL editor:

- Run `supabase/com_dss_schema_seed.sql`

5. Start the development server:

```bash
npm run dev
```

## Vercel Environment Variables

In Vercel, open the project settings and add these Environment Variables for Production, Preview, and Development as needed:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Redeploy after saving the variables.

## Deploy Again

Push changes to the GitHub repository. Vercel will automatically build the Vite app from the connected repository. If you need a manual deployment, open the Vercel project and choose **Redeploy** from the latest deployment menu.

## Database Files

- `supabase/com_dss_schema_seed.sql` creates `facilities`, `occupancy_records`, `feedback_reports`, and `recommendations`, then inserts the requested campus facilities and sample occupancy/recommendation data.
