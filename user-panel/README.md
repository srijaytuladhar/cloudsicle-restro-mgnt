# Cloudsicle Restro — Customer Mobile App (User Panel)

A mobile web app designed for restaurant customers to scan table QR codes, browse food & beverage menus, place orders, and track order preparation status in real-time.

## Tech Stack
- **Framework:** React + Vite
- **Routing:** React Router v6
- **Styling:** Tailwind CSS + Lucide Icons (constrained to mobile viewport ~480px)
- **Database:** Supabase (`@supabase/supabase-js`)

## Setup & Running Instructions

1. **Install Dependencies:**
   ```bash
   cd user-panel
   npm install
   ```

2. **Environment Variables (`.env`):**
   Ensure `.env` file exists with:
   ```env
   VITE_SUPABASE_URL=https://wkdvuimyxqabfccvqmsp.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_PwfvydfqTv13iGC-yLLalA_5jjPW8yp
   ```

3. **Database Migration:**
   Ensure `supabase_schema.sql` (in root directory) has been executed in Supabase SQL Editor.

4. **Run Development Server:**
   ```bash
   npm run dev
   ```
   The User Panel will run at: `http://localhost:5174`

## Features & User Flow
1. **QR Code Scanning Landing (`/table/:tableId`):**
   - Customer scans table QR code and opens `/table/{table_id}`.
   - Shows table details & capacity, confirms table booking, and saves active session in `localStorage`.
2. **Interactive Digital Menu (`/menu`):**
   - Dishes grouped by category with search bar.
   - Item cards with description, price (NPR), and quantity steppers (+/-).
   - Sticky bottom cart bar displaying total items and NPR sum.
3. **Cart & Order Placement (`/cart`):**
   - Review selected dishes, edit quantities, and place order.
   - Inserts order into `cl_restro_orders` and snapshots item prices in `cl_restro_order_items`.
4. **Live Order Status Tracking (`/order-status/:orderId`):**
   - Visual step timeline: `ORDER PLACED → PREPARING IN KITCHEN → READY → SERVING → SERVED → PAYMENT DONE`.
   - **5-Second Polling:** Automatically queries Supabase every 5 seconds for live status updates.
   - Allows placing additional orders under the same table session while tracking existing orders.
