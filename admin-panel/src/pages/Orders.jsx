import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Header from '../components/Header';
import StatusBadge, { ORDER_FLOW, STATUS_CONFIG } from '../components/StatusBadge';
import { 
  ShoppingBag, 
  Clock, 
  ChevronRight, 
  CheckCircle, 
  Filter, 
  AlertCircle, 
  Receipt,
  UtensilsCrossed
} from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('cl_restro_orders')
        .select(`
          *,
          table:cl_restro_tables(id, name, capacity),
          items:cl_restro_order_items(
            id, quantity, price_at_order,
            menu_item:cl_restro_menu_items(name, image_url)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // 1. Supabase Realtime Subscription
    const subscription = supabase
      .channel('admin_orders_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cl_restro_orders' }, () => {
        fetchOrders();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cl_restro_order_items' }, () => {
        fetchOrders();
      })
      .subscribe();

    // 2. 5-second polling fallback
    const pollInterval = setInterval(() => {
      fetchOrders();
    }, 5000);

    return () => {
      supabase.removeChannel(subscription);
      clearInterval(pollInterval);
    };
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('cl_restro_orders')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', orderId);

      if (error) throw error;
      fetchOrders();
    } catch (err) {
      alert('Error updating order status: ' + err.message);
    }
  };

  // Group orders by table
  const filteredOrders = orders.filter(o => 
    selectedStatusFilter === 'ALL' || o.status === selectedStatusFilter
  );

  // Collect table groups
  const tableGroups = filteredOrders.reduce((acc, order) => {
    const tableId = order.table_id || 'unassigned';
    const tableName = order.table?.name || 'Unassigned Table';
    if (!acc[tableId]) {
      acc[tableId] = {
        tableId,
        tableName,
        orders: []
      };
    }
    acc[tableId].orders.push(order);
    return acc;
  }, {});

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto">
      <Header 
        title="Live Order Queue" 
        subtitle="Manage kitchen preparation pipeline and table service workflow."
        onRefresh={fetchOrders}
        isRefreshing={loading}
      />

      <main className="p-8 space-y-6">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
          <button
            onClick={() => setSelectedStatusFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedStatusFilter === 'ALL'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            All Orders ({orders.length})
          </button>
          {ORDER_FLOW.map((statusKey) => {
            const count = orders.filter(o => o.status === statusKey).length;
            const config = STATUS_CONFIG[statusKey];
            return (
              <button
                key={statusKey}
                onClick={() => setSelectedStatusFilter(statusKey)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                  selectedStatusFilter === statusKey
                    ? 'bg-slate-200 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>{config?.label}</span>
                <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full border border-slate-700">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading order queue...</div>
        ) : Object.keys(tableGroups).length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 rounded-2xl border border-slate-800">
            <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-semibold text-base">No orders matching filter</p>
            <p className="text-slate-500 text-xs mt-1">Orders placed by customers will populate automatically.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.values(tableGroups).map((group) => (
              <div 
                key={group.tableId}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4"
              >
                {/* Table Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                      <UtensilsCrossed className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{group.tableName}</h3>
                      <p className="text-xs text-slate-400">{group.orders.length} order(s) for this table</p>
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                    Table ID: {group.tableId.slice(0, 6)}
                  </span>
                </div>

                {/* Orders in this Table */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {group.orders.map((order) => {
                    const currentIndex = ORDER_FLOW.indexOf(order.status);
                    const nextStatus = currentIndex >= 0 && currentIndex < ORDER_FLOW.length - 1
                      ? ORDER_FLOW[currentIndex + 1]
                      : null;

                    return (
                      <div 
                        key={order.id}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          {/* Order ID & Status */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Receipt className="w-4 h-4 text-slate-400" />
                              <span className="font-mono text-xs font-semibold text-slate-300">
                                Order #{order.id.slice(0, 8)}
                              </span>
                            </div>
                            <StatusBadge status={order.status} size="md" />
                          </div>

                          {/* Items List */}
                          <div className="bg-slate-900/80 rounded-xl p-3 space-y-2 border border-slate-800/60">
                            {order.items && order.items.length > 0 ? (
                              order.items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between text-xs">
                                  <span className="text-slate-200 font-medium">
                                    <strong className="text-orange-400 mr-2">{item.quantity}x</strong>
                                    {item.menu_item?.name || 'Item'}
                                  </span>
                                  <span className="text-slate-400">
                                    NPR {(Number(item.price_at_order) * item.quantity).toFixed(2)}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-slate-500 italic">No items listed</p>
                            )}
                          </div>

                          {/* Total Amount */}
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs text-slate-400">Placed at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="text-base font-extrabold text-emerald-400">
                              NPR {Number(order.total_amount).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Status Transition Controls */}
                        <div className="pt-3 border-t border-slate-800 space-y-2">
                          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Update Order Status Workflow:
                          </label>
                          <div className="flex items-center gap-2">
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-semibold focus:outline-none focus:border-orange-500"
                            >
                              {ORDER_FLOW.map((s) => (
                                <option key={s} value={s}>
                                  {STATUS_CONFIG[s]?.label || s}
                                </option>
                              ))}
                            </select>

                            {nextStatus && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, nextStatus)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shrink-0 shadow-md shadow-orange-600/20 transition"
                                title={`Advance to ${STATUS_CONFIG[nextStatus]?.label}`}
                              >
                                <span>Advance</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
