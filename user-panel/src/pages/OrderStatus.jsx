import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { 
  Clock, 
  ChefHat, 
  Sparkles, 
  UtensilsCrossed, 
  CheckCircle2, 
  BadgeCheck,
  Plus,
  RefreshCw,
  Receipt,
  Utensils,
  Coins,
  CreditCard,
  Loader2,
  X
} from 'lucide-react';

const ORDER_STEPS = [
  { key: 'ORDER_PLACED', label: 'Order Placed', icon: Clock },
  { key: 'PREPARING_IN_KITCHEN', label: 'Preparing in Kitchen', icon: ChefHat },
  { key: 'READY', label: 'Ready', icon: Sparkles },
  { key: 'SERVING', label: 'Serving', icon: UtensilsCrossed },
  { key: 'SERVED', label: 'Served', icon: CheckCircle2 },
  { key: 'PAYMENT_DONE', label: 'Payment Done', icon: BadgeCheck }
];

export default function OrderStatus({ bookingInfo }) {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [activeOrder, setActiveOrder] = useState(null);
  const [allBookingOrders, setAllBookingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastPolledAt, setLastPolledAt] = useState(null);
  const [isProcessingOnline, setIsProcessingOnline] = useState(false);

  const handlePayCash = async () => {
    if (!activeOrder) return;
    try {
      const { error } = await supabase
        .from('cl_restro_orders')
        .update({ 
          status: 'CASH_PAYMENT_PENDING', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', activeOrder.id);

      if (error) throw error;
      toast.success('Cash payment requested. Service staff notified.');
      fetchOrderDetails();
    } catch (err) {
      toast.error('Error updating to Cash Payment: ' + err.message);
    }
  };

  const handlePayOnline = async () => {
    if (!activeOrder) return;
    setIsProcessingOnline(true);
    setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('cl_restro_orders')
          .update({ 
            status: 'PAYMENT_DONE', 
            updated_at: new Date().toISOString() 
          })
          .eq('id', activeOrder.id);

        if (error) throw error;
        toast.success('Payment completed successfully!');
        fetchOrderDetails();
      } catch (err) {
        toast.error('Error updating to Online Payment: ' + err.message);
      } finally {
        setIsProcessingOnline(false);
      }
    }, 2000);
  };

  const fetchOrderDetails = async () => {
    try {
      if (orderId) {
        // Fetch specific order
        const { data, error } = await supabase
          .from('cl_restro_orders')
          .select(`
            *,
            items:cl_restro_order_items(
              id, quantity, price_at_order,
              menu_item:cl_restro_menu_items(name)
            )
          `)
          .eq('id', orderId)
          .single();

        if (!error && data) {
          setActiveOrder(data);
        }
      }

      // Fetch all orders for current booking session if available
      if (bookingInfo?.bookingId) {
        const { data: bookingOrders } = await supabase
          .from('cl_restro_orders')
          .select(`
            *,
            items:cl_restro_order_items(
              id, quantity, price_at_order,
              menu_item:cl_restro_menu_items(name)
            )
          `)
          .eq('booking_id', bookingInfo.bookingId)
          .order('created_at', { ascending: false });

        if (bookingOrders) {
          setAllBookingOrders(bookingOrders);
          if (!orderId && bookingOrders.length > 0) {
            setActiveOrder(bookingOrders[0]);
          }
        }
      }

      setLastPolledAt(new Date());
    } catch (err) {
      console.error('Error fetching order status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();

    // STRICT REQUIREMENT: Poll the order's status from Supabase every 5 seconds (setInterval)
    const pollTimer = setInterval(() => {
      fetchOrderDetails();
    }, 5000);

    return () => {
      clearInterval(pollTimer);
    };
  }, [orderId, bookingInfo?.bookingId]);

  if (loading && !activeOrder && allBookingOrders.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-slate-400">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs">Fetching live order status...</p>
      </div>
    );
  }

  if (!activeOrder && allBookingOrders.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Receipt className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-lg font-bold text-white">No Orders Placed Yet</h2>
        <p className="text-xs text-slate-400">Scan table QR and browse menu to place an order.</p>
        <button
          onClick={() => navigate('/menu')}
          className="px-5 py-2.5 rounded-xl bg-orange-600 text-white text-xs font-semibold"
        >
          Go to Menu
        </button>
      </div>
    );
  }

  const getStepIndex = (status) => {
    if (status === 'CASH_PAYMENT_PENDING') return 4; // Treated as Served, waiting for payment done
    return ORDER_STEPS.findIndex(s => s.key === status);
  };
  const currentStepIndex = getStepIndex(activeOrder?.status);

  return (
    <div className="flex flex-col min-h-full p-4 space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-orange-400">Order Tracker</span>
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin text-orange-500" />
              Polling 5s
            </span>
          </div>
          <p className="text-xs font-bold text-white mt-1">
            Table: {bookingInfo?.tableName || 'Active Table'}
          </p>
        </div>

        <button
          onClick={() => navigate('/menu')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-md shadow-orange-600/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add More Dishes</span>
        </button>
      </div>

      {/* Visual Stepper / Timeline for Active Order */}
      {activeOrder && activeOrder.status !== 'CANCELLED' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-orange-400" />
              <span className="font-mono text-xs font-bold text-slate-200">
                Order #{activeOrder.id.slice(0, 8)}
              </span>
            </div>
            <span className="text-xs font-extrabold text-emerald-400">
              NPR {Number(activeOrder.total_amount).toFixed(2)}
            </span>
          </div>

          {/* Stepper Timeline */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Status Timeline</h4>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {ORDER_STEPS.map((step, idx) => {
                const isAllPaid = activeOrder?.status === 'PAYMENT_DONE';
                const isPassed = isAllPaid || idx <= currentStepIndex;
                const isCurrent = !isAllPaid && idx === currentStepIndex;
                const Icon = step.icon;

                return (
                  <div key={step.key} className="relative flex items-center gap-3">
                    {/* Circle Node */}
                    <div 
                      className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition ${
                        isCurrent
                          ? 'bg-orange-500 border-orange-400 text-white ring-4 ring-orange-500/20'
                          : isPassed
                          ? 'bg-emerald-500 border-emerald-400 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-600'
                      }`}
                    >
                      {isPassed && !isCurrent ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="flex-1">
                      <p className={`text-xs font-semibold flex items-center gap-1.5 ${
                        isCurrent 
                          ? 'text-orange-400 font-extrabold text-sm' 
                          : isPassed 
                          ? 'text-slate-200' 
                          : 'text-slate-500'
                      }`}>
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span>{step.label}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Items Summary in this Order */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <h5 className="text-[11px] font-bold text-slate-400 uppercase">Items in this order</h5>
            <div className="bg-slate-950 rounded-xl p-3 space-y-1.5">
              {activeOrder.items?.map((i) => (
                <div key={i.id} className="flex justify-between text-xs text-slate-300">
                  <span>
                    <strong className="text-orange-400 mr-2">{i.quantity}x</strong>
                    {i.menu_item?.name || 'Item'}
                  </span>
                  <span>NPR {(Number(i.price_at_order) * i.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cancelled Order Banner */}
      {activeOrder && activeOrder.status === 'CANCELLED' && (
        <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-5 space-y-3 shadow-lg shadow-rose-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20">
              <X className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Order Cancelled</h3>
              <p className="text-xs text-rose-400 font-medium">This order was cancelled by the staff</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            If you have any questions or would like to place a new order, please scan another table QR code or contact restaurant staff.
          </p>
        </div>
      )}

      {/* Online Payment Processing Overlay */}
      {isProcessingOnline && (
        <div className="fixed inset-0 bg-slate-950/90 z-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
          <h3 className="text-lg font-bold text-white">Processing Online Payment</h3>
          <p className="text-xs text-slate-400 max-w-xs">Connecting to secure gateway. Please do not close or refresh this page.</p>
        </div>
      )}

      {/* Payment Selection Card */}
      {activeOrder && activeOrder.status === 'SERVED' && (
        <div className="bg-slate-900 border border-orange-500/30 rounded-2xl p-5 space-y-4 shadow-xl shadow-orange-500/5">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-orange-400" />
            <h3 className="text-sm font-bold text-white">Select Payment Method</h3>
          </div>
          <p className="text-xs text-slate-400">
            Your order has been served! Please select how you'd like to settle your bill of <strong>NPR {Number(activeOrder.total_amount).toFixed(2)}</strong>.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handlePayCash}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-orange-500/50 hover:bg-slate-900/60 transition group space-y-2"
            >
              <Coins className="w-6 h-6 text-amber-500 group-hover:scale-110 transition" />
              <span className="text-xs font-bold text-slate-200">Pay with Cash</span>
              <span className="text-[10px] text-slate-500 text-center">Pay staff directly</span>
            </button>
            <button
              onClick={handlePayOnline}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-orange-500/50 hover:bg-slate-900/60 transition group space-y-2"
            >
              <CreditCard className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition" />
              <span className="text-xs font-bold text-slate-200">Pay Online</span>
              <span className="text-[10px] text-slate-500 text-center">Simulated success</span>
            </button>
          </div>
        </div>
      )}

      {/* Cash Payment Pending Status Banner */}
      {activeOrder && activeOrder.status === 'CASH_PAYMENT_PENDING' && (
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-5 space-y-3 shadow-lg shadow-amber-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20 animate-pulse">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Cash Payment Pending</h3>
              <p className="text-xs text-amber-400 font-medium">Waiting for staff validation</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            A notification has been sent to the service staff. Please wait while they come to your table to collect <strong>NPR {Number(activeOrder.total_amount).toFixed(2)}</strong>.
          </p>
        </div>
      )}

      {/* Running List of All Orders in this Booking Session */}
      {allBookingOrders.length > 1 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            All Orders in Session ({allBookingOrders.length})
          </h3>

          <div className="space-y-3">
            {allBookingOrders.map((ord) => {
              const isSelected = activeOrder?.id === ord.id;
              return (
                <div 
                  key={ord.id}
                  onClick={() => setActiveOrder(ord)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected 
                      ? 'bg-slate-900 border-orange-500/50 shadow-md' 
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-200">
                        Order #{ord.id.slice(0, 6)}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-orange-400 font-semibold">
                        {ord.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {ord.items?.map(i => `${i.quantity}x ${i.menu_item?.name || ''}`).join(', ')}
                    </p>
                  </div>

                  <span className="text-xs font-bold text-emerald-400">
                    NPR {Number(ord.total_amount).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
