import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import MobileFrame from './components/MobileFrame';
import TableLanding from './pages/TableLanding';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import OrderStatus from './pages/OrderStatus';
import { Toaster, toast } from 'react-hot-toast';
import ConfirmModal from './components/ConfirmModal';

export default function App() {
  const [bookingInfo, setBookingInfo] = useState(() => {
    try {
      const stored = localStorage.getItem('restro_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [cart, setCart] = useState([]);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

  const handleConfirmCancel = async () => {
    setShowConfirmCancel(false);
    try {
      // Close the booking session in Supabase
      const { error } = await supabase
        .from('cl_restro_bookings')
        .update({ status: 'CLOSED' })
        .eq('id', bookingInfo.bookingId);
      
      if (error) throw error;
      toast.success('Table session ended successfully');
    } catch (err) {
      console.error('Error closing session in db:', err);
      toast.error('Failed to close table session');
    }
    
    // Clear local state and cart
    localStorage.removeItem('restro_session');
    setBookingInfo(null);
    setCart([]);
  };

  return (
    <BrowserRouter>
      <Toaster 
        position="top-center" 
        toastOptions={{ 
          style: { 
            background: '#0f172a', 
            color: '#fff', 
            border: '1px solid #1e293b',
            fontSize: '12px'
          } 
        }} 
      />
      
      <ConfirmModal 
        isOpen={showConfirmCancel}
        title="Exit Table Session"
        message={`Are you sure you want to end your session for ${bookingInfo?.tableName}? This will clear your current cart and release the table.`}
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowConfirmCancel(false)}
      />

      <MobileFrame 
        tableName={bookingInfo?.tableName} 
        cartCount={totalCartCount} 
        cartTotal={totalCartPrice}
        onCancelBooking={() => setShowConfirmCancel(true)}
      >
        <Routes>
          <Route 
            path="/table/:tableId" 
            element={<TableLanding setBookingInfo={setBookingInfo} />} 
          />
          <Route 
            path="/menu" 
            element={<Menu bookingInfo={bookingInfo} cart={cart} setCart={setCart} />} 
          />
          <Route 
            path="/cart" 
            element={<Cart bookingInfo={bookingInfo} cart={cart} setCart={setCart} />} 
          />
          <Route 
            path="/order-status/:orderId?" 
            element={<OrderStatus bookingInfo={bookingInfo} />} 
          />
          <Route 
            path="/orders" 
            element={<OrderStatus bookingInfo={bookingInfo} />} 
          />
          <Route path="*" element={<Navigate to="/menu" replace />} />
        </Routes>
      </MobileFrame>
    </BrowserRouter>
  );
}
