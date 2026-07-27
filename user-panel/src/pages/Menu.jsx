import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { 
  Search, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Utensils, 
  Check, 
  AlertCircle,
  Image as ImageIcon,
  ChevronRight
} from 'lucide-react';

export default function Menu({ bookingInfo, cart, setCart }) {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      try {
        const { data: catData } = await supabase
          .from('cl_restro_menu_categories')
          .select('*')
          .order('name');

        const { data: itemData } = await supabase
          .from('cl_restro_menu_items')
          .select('*')
          .eq('is_available', true)
          .order('created_at', { ascending: false });

        setCategories(catData || []);
        setItems(itemData || []);
      } catch (err) {
        console.error('Error fetching customer menu:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  // Cart operations
  const getItemQuantity = (itemId) => {
    const found = cart.find(c => c.id === itemId);
    return found ? found.quantity : 0;
  };

  const handleUpdateQuantity = (item, delta) => {
    setCart(prevCart => {
      const existing = prevCart.find(c => c.id === item.id);
      if (!existing) {
        if (delta <= 0) return prevCart;
        return [...prevCart, { ...item, quantity: 1 }];
      }

      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        return prevCart.filter(c => c.id !== item.id);
      }

      return prevCart.map(c => 
        c.id === item.id ? { ...c, quantity: newQty } : c
      );
    });
  };

  const totalCartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const totalCartPrice = cart.reduce((sum, i) => sum + (Number(i.price) * i.quantity), 0);

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'ALL' || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col min-h-full pb-24">
      {/* Header Warning if no booking */}
      {!bookingInfo && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-[11px] text-amber-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>No table session active. Scan table QR code to order.</span>
          </div>
        </div>
      )}

      {/* Sticky Search & Category Bar */}
      <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md p-4 space-y-3 border-b border-slate-800 z-20">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Search dishes, momos, drinks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'ALL'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}
          >
            All Items
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === c.id
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Items Stream */}
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="text-center py-16 text-xs text-slate-500">Loading menu...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            No dishes available in this category.
          </div>
        ) : (
          filteredItems.map((item) => {
            const qty = getItemQuantity(item.id);

            return (
              <div 
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-3 items-center justify-between shadow-sm hover:border-slate-700 transition"
              >
                {/* Image */}
                <div className="w-20 h-20 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 relative">
                  {item.image_url ? (
                    <img 
                      src={item.image_url} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700">
                      <Utensils className="w-6 h-6" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="font-bold text-sm text-white truncate">{item.name}</h3>
                  {item.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-2">{item.description}</p>
                  )}
                  <span className="text-xs font-extrabold text-emerald-400 block pt-1">
                    NPR {Number(item.price).toFixed(2)}
                  </span>
                </div>

                {/* Stepper / Add Button */}
                <div className="shrink-0 pl-2">
                  {qty > 0 ? (
                    <div className="flex items-center gap-2 bg-slate-950 border border-orange-500/40 px-2 py-1.5 rounded-xl">
                      <button
                        onClick={() => handleUpdateQuantity(item, -1)}
                        className="w-6 h-6 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center hover:bg-slate-700"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-extrabold text-white w-4 text-center">{qty}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item, 1)}
                        className="w-6 h-6 rounded-lg bg-orange-600 text-white flex items-center justify-center hover:bg-orange-500"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUpdateQuantity(item, 1)}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 text-xs font-bold border border-orange-500/20 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sticky Bottom Cart Summary Bar */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 z-40">
          <button
            onClick={() => navigate('/cart')}
            className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white p-4 rounded-2xl shadow-xl shadow-orange-600/30 flex items-center justify-between font-semibold text-xs border border-orange-400/30 active:scale-[0.98] transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-black/20 flex items-center justify-center font-bold text-sm">
                {totalCartCount}
              </div>
              <div className="text-left">
                <p className="text-[11px] text-orange-100 font-medium">Cart Total</p>
                <p className="text-sm font-extrabold">NPR {totalCartPrice.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 font-bold text-xs uppercase tracking-wider">
              <span>View Cart</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
