import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Header from '../components/Header';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Tag, 
  Utensils, 
  Check, 
  X, 
  Image as ImageIcon,
  FolderPlus,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

export default function Menu() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [confirmDeleteItemId, setConfirmDeleteItemId] = useState(null);
  const [confirmDeleteCategoryId, setConfirmDeleteCategoryId] = useState(null);

  // Modal states
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
    is_available: true
  });

  const [categoryName, setCategoryName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Categories
      const { data: catData, error: catErr } = await supabase
        .from('cl_restro_menu_categories')
        .select('*')
        .order('name');
      if (catErr) throw catErr;

      // Menu Items
      const { data: itemData, error: itemErr } = await supabase
        .from('cl_restro_menu_items')
        .select('*, category:cl_restro_menu_categories(id, name)')
        .order('created_at', { ascending: false });
      if (itemErr) throw itemErr;

      setCategories(catData || []);
      setItems(itemData || []);
    } catch (err) {
      console.error('Error fetching menu data:', err);
      setErrorMsg(err.message || 'Failed to load menu data from Supabase');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateItemModal = () => {
    setEditingItem(null);
    setItemForm({
      name: '',
      description: '',
      price: '',
      category_id: categories[0]?.id || '',
      image_url: '',
      is_available: true
    });
    setIsItemModalOpen(true);
  };

  const openEditItemModal = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category_id: item.category_id || '',
      image_url: item.image_url || '',
      is_available: item.is_available
    });
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.price) {
      toast.error('Name and price are required');
      return;
    }

    try {
      const payload = {
        name: itemForm.name.trim(),
        description: itemForm.description.trim(),
        price: parseFloat(itemForm.price),
        category_id: itemForm.category_id || null,
        image_url: itemForm.image_url.trim(),
        is_available: itemForm.is_available
      };

      if (editingItem) {
        const { error } = await supabase
          .from('cl_restro_menu_items')
          .update(payload)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success('Menu item updated successfully!');
      } else {
        const { error } = await supabase
          .from('cl_restro_menu_items')
          .insert([payload]);
        if (error) throw error;
        toast.success('Menu item created successfully!');
      }

      setIsItemModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Error saving menu item: ' + err.message);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      const { error } = await supabase
        .from('cl_restro_menu_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Menu item deleted successfully!');
      fetchData();
    } catch (err) {
      toast.error('Error deleting menu item: ' + err.message);
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      const { error } = await supabase
        .from('cl_restro_menu_items')
        .update({ is_available: !item.is_available })
        .eq('id', item.id);
      if (error) throw error;
      toast.success('Availability updated!');
      fetchData();
    } catch (err) {
      toast.error('Error updating availability: ' + err.message);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    try {
      const { error } = await supabase
        .from('cl_restro_menu_categories')
        .insert([{ name: categoryName.trim() }]);
      if (error) throw error;
      toast.success('Category added successfully!');
      setCategoryName('');
      setIsCategoryModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Error adding category: ' + err.message);
    }
  };

  const handleDeleteCategory = async (catId) => {
    try {
      const { error } = await supabase
        .from('cl_restro_menu_categories')
        .delete()
        .eq('id', catId);
      if (error) throw error;
      toast.success('Category deleted successfully!');
      fetchData();
    } catch (err) {
      toast.error('Error deleting category: ' + err.message);
    }
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'ALL' || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto">
      <Header 
        title="Menu Management" 
        subtitle="Manage food & beverage catalog, categories, pricing, and availability."
        onRefresh={fetchData}
        isRefreshing={loading}
      />

      <main className="p-8 space-y-6">
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-sm font-semibold border border-slate-800 transition"
            >
              <FolderPlus className="w-4 h-4 text-orange-400" />
              <span>Add Category</span>
            </button>

            <button
              onClick={openCreateItemModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-sm font-semibold shadow-lg shadow-orange-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Menu Item</span>
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'ALL'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            All Items ({items.length})
          </button>
          {categories.map((cat) => {
            const count = items.filter(i => i.category_id === cat.id).length;
            return (
              <div key={cat.id} className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    selectedCategory === cat.id
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              </div>
            );
          })}
        </div>

        {/* Menu Items Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading menu catalog...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800">
            <Utensils className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-semibold">No menu items found</p>
            <p className="text-slate-500 text-xs mt-1">Try tweaking your search or add a new menu item.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div 
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition group relative"
              >
                <div className="space-y-3">
                  {/* Image & Category Pill */}
                  <div className="relative h-40 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-700">
                        <ImageIcon className="w-10 h-10" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-300 border border-slate-700/60">
                      {item.category?.name || 'Uncategorized'}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-base text-white">{item.name}</h3>
                      <span className="text-sm font-extrabold text-emerald-400 shrink-0">
                        NPR {Number(item.price).toFixed(2)}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleAvailability(item)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                      item.is_available
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                    }`}
                  >
                    {item.is_available ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    {item.is_available ? 'Available' : 'Out of Stock'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditItemModal(item)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Edit Item"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteItemId(item.id)}
                      className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition border border-rose-500/20"
                      title="Delete Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Item Modal (Create / Edit) */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white">
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h2>
              <button 
                onClick={() => setIsItemModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Item Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Chicken Steam Momo"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Price (NPR) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    placeholder="250.00"
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={itemForm.category_id}
                    onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="">No Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea 
                  rows="3"
                  placeholder="Brief dish description..."
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Image URL</label>
                <input 
                  type="url" 
                  placeholder="https://images.unsplash.com/..."
                  value={itemForm.image_url}
                  onChange={(e) => setItemForm({ ...itemForm, image_url: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="is_available"
                  checked={itemForm.is_available}
                  onChange={(e) => setItemForm({ ...itemForm, is_available: e.target.checked })}
                  className="w-4 h-4 accent-orange-500 rounded"
                />
                <label htmlFor="is_available" className="text-xs font-medium text-slate-300 cursor-pointer">
                  Available for ordering
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-sm font-semibold shadow-lg shadow-orange-600/20"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white">Manage Categories</h2>
              <button 
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Existing Categories List */}
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Existing Categories</h4>
              {categories.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No categories added yet.</p>
              ) : (
                categories.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                    <span className="font-semibold text-slate-200">{c.name}</span>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteCategoryId(c.id)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleAddCategory} className="space-y-4 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New Category Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Desserts, Beverages"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmDeleteItemId !== null}
        title="Delete Menu Item"
        message="Are you sure you want to delete this menu item? This will remove it permanently from the food catalog."
        onConfirm={() => {
          handleDeleteItem(confirmDeleteItemId);
          setConfirmDeleteItemId(null);
        }}
        onCancel={() => setConfirmDeleteItemId(null)}
      />

      <ConfirmModal 
        isOpen={confirmDeleteCategoryId !== null}
        title="Delete Category"
        message="Deleting this category will remove it from all linked menu items. Are you sure you want to proceed?"
        onConfirm={() => {
          handleDeleteCategory(confirmDeleteCategoryId);
          setConfirmDeleteCategoryId(null);
        }}
        onCancel={() => setConfirmDeleteCategoryId(null)}
      />
    </div>
  );
}
