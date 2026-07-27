import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Menu from './pages/Menu';
import Tables from './pages/Tables';
import Orders from './pages/Orders';
import Analytics from './pages/Analytics';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
        <Sidebar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/tables" element={<Tables />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
