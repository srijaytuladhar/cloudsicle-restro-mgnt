import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import Header from '../components/Header';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Download, 
  ExternalLink, 
  Users, 
  QrCode, 
  X,
  AlertCircle
} from 'lucide-react';

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);

  const [tableName, setTableName] = useState('');
  const [capacity, setCapacity] = useState('4');

  const userAppUrl = import.meta.env.VITE_USER_APP_URL || 'http://localhost:5174';

  const fetchTables = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cl_restro_tables')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setTables(data || []);
    } catch (err) {
      console.error('Error fetching tables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const openAddModal = () => {
    setEditingTable(null);
    setTableName('');
    setCapacity('4');
    setIsModalOpen(true);
  };

  const openEditModal = (tbl) => {
    setEditingTable(tbl);
    setTableName(tbl.name);
    setCapacity(tbl.capacity.toString());
    setIsModalOpen(true);
  };

  const handleSaveTable = async (e) => {
    e.preventDefault();
    if (!tableName.trim()) return;

    try {
      const payload = {
        name: tableName.trim(),
        capacity: parseInt(capacity, 10) || 2
      };

      if (editingTable) {
        const { error } = await supabase
          .from('cl_restro_tables')
          .update(payload)
          .eq('id', editingTable.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cl_restro_tables')
          .insert([payload]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchTables();
    } catch (err) {
      alert('Error saving table: ' + err.message);
    }
  };

  const handleDeleteTable = async (id) => {
    if (!confirm('Are you sure you want to delete this table? All associated bookings will be affected.')) return;
    try {
      const { error } = await supabase
        .from('cl_restro_tables')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchTables();
    } catch (err) {
      alert('Error deleting table: ' + err.message);
    }
  };

  const downloadQR = (tableId, tableNameStr) => {
    const canvas = document.getElementById(`qr-canvas-${tableId}`);
    if (!canvas) return;

    const pngUrl = canvas
      .toDataURL('image/png')
      .replace('image/png', 'image/octet-stream');

    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `QR_${tableNameStr.replace(/\s+/g, '_')}_${tableId.slice(0, 6)}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto">
      <Header 
        title="Table & QR Management" 
        subtitle="Configure dining tables and download scannable QR codes for customers."
        onRefresh={fetchTables}
        isRefreshing={loading}
      />

      <main className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Active Restaurant Tables</h2>
            <p className="text-xs text-slate-400">Total registered tables: {tables.length}</p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-sm font-semibold shadow-lg shadow-orange-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Table</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading tables...</div>
        ) : tables.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
            <QrCode className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-300 font-semibold">No tables created yet</p>
            <p className="text-slate-500 text-xs">Create your first dining table to generate scannable ordering QR codes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables.map((table) => {
              const qrTargetUrl = `${userAppUrl}/table/${table.id}`;

              return (
                <div 
                  key={table.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center justify-between hover:border-slate-700 transition relative group"
                >
                  {/* Action Buttons Top Right */}
                  <div className="absolute top-4 right-4 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                    <button
                      onClick={() => openEditModal(table)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Edit Table"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTable(table.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition border border-rose-500/20"
                      title="Delete Table"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Header */}
                  <div className="w-full text-left mb-4">
                    <h3 className="font-bold text-lg text-white">{table.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <Users className="w-3.5 h-3.5 text-orange-400" />
                      <span>Capacity: <strong className="text-slate-200">{table.capacity} Persons</strong></span>
                    </div>
                  </div>

                  {/* Inline Canvas QR Display */}
                  <div className="p-4 bg-white rounded-2xl shadow-xl my-2 border border-slate-200">
                    <QRCodeCanvas
                      id={`qr-canvas-${table.id}`}
                      value={qrTargetUrl}
                      size={160}
                      level="H"
                      includeMargin={true}
                    />
                  </div>

                  {/* QR Target Link */}
                  <div className="w-full mt-3 mb-5">
                    <a 
                      href={qrTargetUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-medium truncate max-w-full bg-orange-500/10 px-3 py-1 rounded-lg border border-orange-500/20"
                    >
                      <span>Scan Target URL</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>

                  {/* Download PNG Button */}
                  <button
                    onClick={() => downloadQR(table.id, table.name)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                  >
                    <Download className="w-4 h-4 text-orange-400" />
                    <span>Download QR (PNG)</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add / Edit Table Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white">
                {editingTable ? 'Edit Table' : 'Add New Table'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Table Name / Number *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Table 1 (Balcony), Booth 4"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Seating Capacity (Guests)</label>
                <input 
                  type="number" 
                  min="1"
                  max="50"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-sm font-semibold shadow-lg shadow-orange-600/20"
                >
                  Save Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
