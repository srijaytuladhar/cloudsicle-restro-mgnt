# Cloudsicle Restro — Admin Panel Dashboard

A web dashboard for restaurant owners and staff to manage menu items, dining tables with auto-generated scannable QR codes, live kitchen orders, and sales analytics.

## Tech Stack
- **Framework:** React + Vite
- **Routing:** React Router v6
- **Styling:** Tailwind CSS + Lucide Icons
- **Database:** Supabase (`@supabase/supabase-js`)
- **QR Generation:** `qrcode.react`
- **Analytics Charts:** `recharts`

## Setup & Running Instructions

1. **Install Dependencies:**
   ```bash
   cd admin-panel
   npm install
   ```

2. **Environment Variables (`.env`):**
   Ensure `.env` file exists with:
   ```env
   VITE_SUPABASE_URL=https://wkdvuimyxqabfccvqmsp.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_PwfvydfqTv13iGC-yLLalA_5jjPW8yp
   VITE_USER_APP_URL=http://localhost:5174
   ```

3. **Database Migration:**
   Make sure `supabase_schema.sql` (located in the root folder) has been executed in your Supabase SQL Editor.

4. **Run Development Server:**
   ```bash
   npm run dev
   ```
   The Admin Panel will run at: `http://localhost:5173`

## Features Included
- **Dashboard:** Executive view of today's revenue, live order counts, active table sessions, and recent kitchen orders.
- **Menu Management:** Complete CRUD operations for food categories and menu items with image previews, pricing in NPR, and availability toggles.
- **Table & QR Management:** Add/Edit restaurant tables with seating capacity. Generates scannable QR codes encoding `http://localhost:5174/table/{table_id}` with instant PNG downloads.
- **Live Order Queue:** Real-time stream of placed orders grouped by table. Interactive status dropdown & step advance controls following the exact status flow:
  `ORDER_PLACED → PREPARING_IN_KITCHEN → READY → SERVING → SERVED → PAYMENT_DONE`
- **Analytics:** Recharts visuals featuring total revenue, bar chart of most-ordered menu items, line chart of revenue trends, and date range filtering (Today, This Week, This Month, All Time).
