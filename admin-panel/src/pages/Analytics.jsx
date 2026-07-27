import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Header from '../components/Header';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  ShoppingBag, 
  Award, 
  Calendar,
  DollarSign,
  BarChart3
} from 'lucide-react';

export default function Analytics() {
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('ALL'); // TODAY, THIS_WEEK, THIS_MONTH, ALL

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Orders
      const { data: ordersData, error: ordersErr } = await supabase
        .from('cl_restro_orders')
        .select('*')
        .order('created_at', { ascending: true });
      if (ordersErr) throw ordersErr;

      // 2. Fetch Order Items
      const { data: itemsData, error: itemsErr } = await supabase
        .from('cl_restro_order_items')
        .select('*, menu_item:cl_restro_menu_items(name)');
      if (itemsErr) throw itemsErr;

      // 3. Fetch Menu Items
      const { data: menuData, error: menuErr } = await supabase
        .from('cl_restro_menu_items')
        .select('*');
      if (menuErr) throw menuErr;

      setOrders(ordersData || []);
      setOrderItems(itemsData || []);
      setMenuItems(menuData || []);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter orders by date range
  const filterOrdersByRange = (ordersList) => {
    const now = new Date();
    return ordersList.filter(o => {
      const orderDate = new Date(o.created_at);
      if (dateFilter === 'TODAY') {
        return orderDate.toDateString() === now.toDateString();
      }
      if (dateFilter === 'THIS_WEEK') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return orderDate >= weekAgo;
      }
      if (dateFilter === 'THIS_MONTH') {
        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      }
      return true; // ALL
    });
  };

  const filteredOrders = filterOrdersByRange(orders);
  const paidOrders = filteredOrders.filter(o => o.status === 'PAYMENT_DONE');

  // Metrics
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const totalOrderCount = filteredOrders.length;
  const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

  // Chart Data 1: Most Ordered Items (Aggregated order_items)
  const filteredOrderIds = new Set(filteredOrders.map(o => o.id));
  const filteredItems = orderItems.filter(item => filteredOrderIds.has(item.order_id));

  const itemQtyMap = {};
  filteredItems.forEach(item => {
    const name = item.menu_item?.name || 'Unknown Item';
    itemQtyMap[name] = (itemQtyMap[name] || 0) + item.quantity;
  });

  const topItemsChartData = Object.entries(itemQtyMap)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8); // Top 8 items

  // Chart Data 2: Revenue Over Time (Grouped by date YYYY-MM-DD)
  const revenueByDayMap = {};
  paidOrders.forEach(o => {
    const dateStr = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    revenueByDayMap[dateStr] = (revenueByDayMap[dateStr] || 0) + (Number(o.total_amount) || 0);
  });

  const revenueChartData = Object.entries(revenueByDayMap).map(([date, revenue]) => ({
    date,
    revenue: parseFloat(revenue.toFixed(2))
  }));

  const BAR_COLORS = ['#f97316', '#fb923c', '#fdba74', '#38bdf8', '#818cf8', '#c084fc', '#34d399', '#f43f5e'];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto">
      <Header 
        title="Analytics & Sales Dashboard" 
        subtitle="Track total revenue, order metrics, popular dishes, and daily trends."
        onRefresh={fetchData}
        isRefreshing={loading}
      />

      <main className="p-8 space-y-8">
        {/* Date Range Selector */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
            <Calendar className="w-4 h-4 text-orange-400" />
            <span>Time Range Filter:</span>
          </div>

          <div className="flex items-center gap-2">
            {[
              { id: 'TODAY', label: 'Today' },
              { id: 'THIS_WEEK', label: 'This Week' },
              { id: 'THIS_MONTH', label: 'This Month' },
              { id: 'ALL', label: 'All Time' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setDateFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  dateFilter === f.id
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Total Revenue (Completed)</span>
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white mt-4">
              NPR {totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-500 mt-2">Sum of status PAYMENT_DONE orders</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Total Orders Placed</span>
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white mt-4">{totalOrderCount}</p>
            <p className="text-xs text-slate-500 mt-2">Total orders in selected range</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Average Order Value</span>
              <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white mt-4">
              NPR {avgOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-500 mt-2">Revenue / paid order count</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart 1: Revenue Over Time */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Revenue Trend Over Time
                </h3>
                <p className="text-xs text-slate-400">Daily revenue sum (PAYMENT_DONE)</p>
              </div>
            </div>

            <div className="h-72 w-full pt-4">
              {revenueChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  No revenue data recorded for this timeframe.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }}
                      formatter={(val) => [`NPR ${val}`, 'Revenue']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      dot={{ fill: '#10b981', r: 5 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 2: Most-Ordered Menu Items */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-orange-400" />
                  Most-Ordered Menu Items
                </h3>
                <p className="text-xs text-slate-400">Aggregated quantities from order items</p>
              </div>
            </div>

            <div className="h-72 w-full pt-4">
              {topItemsChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  No order item data available for this timeframe.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topItemsChartData} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#64748b" 
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }}
                      formatter={(val) => [`${val} items`, 'Quantity Ordered']}
                    />
                    <Bar dataKey="quantity" radius={[6, 6, 0, 0]}>
                      {topItemsChartData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
