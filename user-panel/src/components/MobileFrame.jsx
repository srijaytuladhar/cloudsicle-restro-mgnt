import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Utensils, ShoppingBag, Clock, QrCode, ScanLine } from 'lucide-react';
import QrScannerModal from './QrScannerModal';

export default function MobileFrame({ children, tableName, cartCount = 0, cartTotal = 0 }) {
  const location = useLocation();
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Hide bottom nav on landing page or empty states if needed
  const isLandingPage = location.pathname.startsWith('/table/');

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center items-center font-sans antialiased sm:py-6">
      {/* Mobile Shell Wrapper */}
      <div className="w-full max-w-[480px] h-screen sm:h-[880px] bg-slate-900 sm:rounded-[36px] sm:border-[8px] sm:border-slate-800 flex flex-col justify-between overflow-hidden shadow-2xl relative">
        
        {/* Top Header */}
        <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-5 py-4 flex items-center justify-between z-30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-white tracking-wide leading-tight">Cloudsicle Restro</h1>
              <p className="text-[11px] text-orange-400 font-medium">Table Digital Menu</p>
            </div>
          </div>

          {tableName ? (
            <div className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-semibold text-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{tableName}</span>
            </div>
          ) : (
            <button 
              onClick={() => setIsScannerOpen(true)}
              className="px-2.5 py-1 rounded-full bg-orange-600/10 hover:bg-orange-600/20 border border-orange-500/20 text-[11px] text-orange-400 font-semibold flex items-center gap-1 transition"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan QR</span>
            </button>
          )}
        </header>

        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-slate-950 relative">
          {children}
        </div>

        {/* Bottom Navigation */}
        {!isLandingPage && (
          <nav className="bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-6 py-2.5 flex items-center justify-around z-30 shrink-0">
            <NavLink
              to="/menu"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[11px] font-medium transition ${
                  isActive ? 'text-orange-500 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Utensils className="w-5 h-5" />
              <span>Menu</span>
            </NavLink>

            <NavLink
              to="/cart"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[11px] font-medium transition relative ${
                  isActive ? 'text-orange-500 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-orange-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <span>Cart</span>
            </NavLink>

            <NavLink
              to="/orders"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[11px] font-medium transition ${
                  isActive ? 'text-orange-500 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Clock className="w-5 h-5" />
              <span>My Orders</span>
            </NavLink>

            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex flex-col items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 transition"
            >
              <ScanLine className="w-5 h-5" />
              <span>Scan QR</span>
            </button>
          </nav>
        )}

        <QrScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
      </div>
    </div>
  );
}
