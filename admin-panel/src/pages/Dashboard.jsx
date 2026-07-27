import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  SquareCheck, 
  Utensils, 
  TrendingUp, 
  ArrowRight,
  Clock,
  Sparkles,
  AlertCircle,
  Users
} from 'lucide-react';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    todayRevenue: 0,
    totalOrders: 0,
    activeOrders: 0,
    totalTables: 0,
    activeBookings: 0,
    totalMenuItems: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Orders
      const { data: ordersData, error: ordersErr } = await supabase
        .from('cl_restro_orders')
        .select(`
          *,
          table:cl_restro_tables(name),
          items:cl_restro_order_items(
            id, quantity, price_at_order,
            menu_item:cl_restro_menu_items(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (ordersErr) throw ordersErr;

      // 2. Fetch Tables
      const { data: tablesData, error: tablesErr } = await supabase
        .from('cl_restro_tables')
        .select(`
          *,
          bookings:cl_restro_bookings(id, status)
        `)
        .order('name');

      if (tablesErr) throw tablesErr;

      // 3. Fetch Menu items count
      const { count: menuCount, error: menuErr } = await supabase
        .from('cl_restro_menu_items')
        .select('*', { count: 'exact', head: true });

      if (menuErr) throw menuErr;

      // 4. Fetch Active Bookings count
      const { count: bookingsCount, error: bookingErr } = await supabase
        .from('cl_restro_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE');

      if (bookingErr) throw bookingErr;

      const orders = ordersData || [];
      const paidOrders = orders.filter(o => o.status === 'PAYMENT_DONE');
      const todayRev = paidOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      const activeOrds = orders.filter(o => o.status !== 'PAYMENT_DONE' && o.status !== 'CANCELLED').length;

      setMetrics({
        todayRevenue: todayRev,
        totalOrders: orders.length,
        activeOrders: activeOrds,
        totalTables: tablesData?.length || 0,
        activeBookings: bookingsCount || 0,
        totalMenuItems: menuCount || 0
      });

      setRecentOrders(orders.slice(0, 5));
      setTables(tablesData || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Realtime subscription for orders
    const subscription = supabase
      .channel('dashboard_orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cl_restro_orders' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto">
      <Header 
        title="Restaurant Dashboard" 
        subtitle="Live overview of active tables, orders, and revenue."
        onRefresh={fetchDashboardData}
        isRefreshing={loading}
      />

      <main className="p-8 space-y-8">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Total Revenue (Paid)</span>
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white mt-4">
              NPR {metrics.todayRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-500 mt-2">Cumulative revenue from completed orders</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Active Orders</span>
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-amber-400 mt-4">{metrics.activeOrders}</p>
            <p className="text-xs text-slate-500 mt-2">Orders currently in pipeline</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Active Table Sessions</span>
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <SquareCheck className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white mt-4">
              {metrics.activeBookings} <span className="text-sm font-normal text-slate-500">/ {metrics.totalTables} tables</span>
            </p>
            <p className="text-xs text-slate-500 mt-2">Tables with active customer bookings</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Menu Catalog</span>
              <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                <Utensils className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white mt-4">{metrics.totalMenuItems}</p>
            <p className="text-xs text-slate-500 mt-2">Available dishes & beverages</p>
          </div>
        </div>

        {/* Section: Live Orders & Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Live Orders */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-400" />
                  Recent Kitchen Orders
                </h2>
                <p className="text-xs text-slate-400">Real-time stream of placed orders</p>
              </div>
              <Link 
                to="/orders" 
                className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1 bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20"
              >
                Manage All Orders <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="text-center py-12 bg-slate-950/50 rounded-xl border border-slate-800/80">
                <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm font-medium">No orders recorded yet</p>
                <p className="text-slate-500 text-xs mt-1">Orders placed via the customer mobile app will appear here instantly.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((ord) => (
                  <div 
                    key={ord.id}
                    className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between hover:border-slate-700 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-white text-base">
                          {ord.table?.name || 'Unknown Table'}
                        </span>
                        <StatusBadge status={ord.status} size="sm" />
                      </div>
                      <p className="text-xs text-slate-400">
                        {ord.items?.map(i => `${i.quantity}x ${i.menu_item?.name || 'Item'}`).join(', ') || 'No item details'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-400 block">
                        NPR {Number(ord.total_amount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Table Status Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <SquareCheck className="w-5 h-5 text-blue-400" />
                  Table Availability
                </h2>
                <p className="text-xs text-slate-400">Overview of all dining tables</p>
              </div>
              <Link 
                to="/tables" 
                className="text-xs font-semibold text-blue-400 hover:text-blue-300"
              >
                View QR Codes &rarr;
              </Link>
            </div>

            {tables.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No tables registered. Go to Table Management to add tables.
              </div>
            ) : (
              <div className="space-y-3 flex flex-col">
                {tables.map((tbl) => {
                  const isOccupied = tbl.bookings?.some(b => b.status === 'ACTIVE');
                  return (
                    <div 
                      key={tbl.id} 
                      className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between relative overflow-hidden ${
                        isOccupied 
                          ? 'bg-rose-500/[0.02] border-rose-500/20 hover:border-rose-500/30' 
                          : 'bg-emerald-500/[0.02] border-emerald-500/20 hover:border-emerald-500/30'
                      }`}
                    >
                      {/* Left Accent Line */}
                      <div className={`absolute top-0 bottom-0 left-0 w-[3px] ${
                        isOccupied ? 'bg-rose-500/40' : 'bg-emerald-500/40'
                      }`} />

                      <div className="pl-2 space-y-1">
                        <h4 className="font-bold text-sm text-slate-100">{tbl.name}</h4>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-500" />
                            <span>{tbl.capacity} Seats</span>
                          </div>
                          <span className="text-slate-600 font-mono">ID: {tbl.id.slice(0, 6)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-lg border shrink-0 tracking-wide uppercase ${
                          isOccupied 
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {isOccupied ? 'Occupied' : 'Available'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
