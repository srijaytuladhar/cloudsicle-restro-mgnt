# Cloudsicle Restro — Restaurant Table-Ordering System

A complete restaurant table-ordering system built with **two separate React.js projects** connecting directly to **Supabase**.

## Architecture Overview

```
cloudsicle-restro/
├── supabase_schema.sql         # SQL schema migration for Supabase
├── admin-panel/                # Desktop Web Dashboard (Port 5173)
│   ├── src/
│   │   ├── lib/supabaseClient.js
│   │   ├── pages/Dashboard.jsx
│   │   ├── pages/Menu.jsx
│   │   ├── pages/Tables.jsx
│   │   ├── pages/Orders.jsx
│   │   ├── pages/Analytics.jsx
│   │   └── components/
│   ├── .env
│   └── package.json
└── user-panel/                 # Mobile Viewport Web App (Port 5174)
    ├── src/
    │   ├── lib/supabaseClient.js
    │   ├── pages/TableLanding.jsx
    │   ├── pages/Menu.jsx
    │   ├── pages/Cart.jsx
    │   ├── pages/OrderStatus.jsx
    │   └── components/
    ├── .env
    └── package.json
```

---

## 1. Database Setup (Supabase)

1. Open your Supabase Project SQL Editor.
2. Run the SQL statements inside `supabase_schema.sql`.
3. This creates all 6 tables (`cl_restro_tables`, `cl_restro_menu_categories`, `cl_restro_menu_items`, `cl_restro_bookings`, `cl_restro_orders`, `cl_restro_order_items`) with Row Level Security enabled.

---

## 2. Admin Panel Setup

```bash
cd admin-panel
npm install
npm run dev
```
- App runs on `http://localhost:5173`.
- Manage food menu items and categories.
- Create dining tables and download scannable QR codes.
- Track live order queue and advance status.
- View revenue and dish popularity analytics.

---

## 3. Customer User Panel Setup

```bash
cd user-panel
npm install
npm run dev
```
- App runs on `http://localhost:5174`.
- Mobile viewport experience (~480px centered frame).
- Scan/Visit table URL e.g. `http://localhost:5174/table/{table_id}`.
- Browse menu, add to cart, place orders in NPR.
- Live order status tracker polling Supabase every 5 seconds.
