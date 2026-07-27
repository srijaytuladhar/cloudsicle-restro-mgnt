import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MobileFrame from './components/MobileFrame';
import TableLanding from './pages/TableLanding';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import OrderStatus from './pages/OrderStatus';

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

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

  return (
    <BrowserRouter>
      <MobileFrame 
        tableName={bookingInfo?.tableName} 
        cartCount={totalCartCount} 
        cartTotal={totalCartPrice}
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
