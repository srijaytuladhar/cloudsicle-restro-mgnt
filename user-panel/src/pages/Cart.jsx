import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  UtensilsCrossed
} from 'lucide-react';

export default function Cart({ bookingInfo, cart, setCart }) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdateQuantity = (itemId, delta) => {
    setCart(prevCart => {
      const existing = prevCart.find(c => c.id === itemId);
      if (!existing) return prevCart;

      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        return prevCart.filter(c => c.id !== itemId);
      }

      return prevCart.map(c => 
        c.id === itemId ? { ...c, quantity: newQty } : c
      );
    });
  };

  const removeItem = (itemId) => {
    setCart(prevCart => prevCart.filter(c => c.id !== itemId));
  };

  const totalAmount = cart.reduce((sum, i) => sum + (Number(i.price) * i.quantity), 0);

  const handlePlaceOrder = async () => {
    if (!bookingInfo || !bookingInfo.bookingId || !bookingInfo.tableId) {
      alert('Active table booking session required. Please scan a table QR code first.');
      return;
    }

    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create order in cl_restro_orders
      const { data: orderData, error: orderErr } = await supabase
        .from('cl_restro_orders')
        .insert([
          {
            booking_id: bookingInfo.bookingId,
            table_id: bookingInfo.tableId,
            status: 'ORDER_PLACED',
            total_amount: totalAmount
          }
        ])
        .select()
        .single();

      if (orderErr) throw orderErr;

      // 2. Prepare & batch insert order_items with snapshot price
      const itemsPayload = cart.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        price_at_order: Number(item.price)
      }));

      const { error: itemsErr } = await supabase
        .from('cl_restro_order_items')
        .insert(itemsPayload);

      if (itemsErr) throw itemsErr;

      // 3. Clear local cart & Navigate to order status
      setCart([]);
      navigate(`/order-status/${orderData.id}`);
    } catch (err) {
      console.error('Error placing order:', err);
      alert('Failed to place order: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-900 text-slate-600 flex items-center justify-center border border-slate-800">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-white">Your Cart is Empty</h2>
        <p className="text-xs text-slate-400">Add delicious items from the menu to place an order.</p>
        <button
          onClick={() => navigate('/menu')}
          className="mt-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-lg shadow-orange-600/20"
        >
          Browse Menu Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full justify-between p-4 space-y-6 pb-20">
      <div className="space-y-4">
        {/* Title */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <button 
            onClick={() => navigate('/menu')}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Menu</span>
          </button>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Review Order</h2>
        </div>

        {/* Table Banner */}
        {bookingInfo && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-orange-400" />
              <span className="text-slate-300 font-medium">Delivering to:</span>
            </div>
            <span className="font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
              {bookingInfo.tableName}
            </span>
          </div>
        )}

        {/* Cart Items List */}
        <div className="space-y-3">
          {cart.map((item) => (
            <div 
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-white truncate">{item.name}</h4>
                <p className="text-xs text-emerald-400 font-medium mt-0.5">
                  NPR {Number(item.price).toFixed(2)} each
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-2 py-1 rounded-xl">
                  <button
                    onClick={() => handleUpdateQuantity(item.id, -1)}
                    className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center hover:bg-slate-700 text-xs"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold text-white w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => handleUpdateQuantity(item.id, 1)}
                    className="w-6 h-6 rounded-lg bg-orange-600 text-white flex items-center justify-center hover:bg-orange-500 text-xs"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
                  title="Remove item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Total & Place Order Button */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl">
        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal</span>
            <span>NPR {totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Taxes & Service Charge</span>
            <span className="text-emerald-400">Included</span>
          </div>
          <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-extrabold text-white">
            <span>Total Payable</span>
            <span className="text-emerald-400">NPR {totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={handlePlaceOrder}
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-sm shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          {isSubmitting ? (
            <span>Sending to Kitchen...</span>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Place Order</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
