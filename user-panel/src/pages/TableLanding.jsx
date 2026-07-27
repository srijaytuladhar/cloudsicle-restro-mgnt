import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Users, CheckCircle2, QrCode, AlertCircle, ArrowRight } from 'lucide-react';

export default function TableLanding({ setBookingInfo }) {
  const { tableId } = useParams();
  const navigate = useNavigate();

  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchTableInfo = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        if (!tableId) throw new Error('No Table ID specified in QR Code.');

        const { data, error } = await supabase
          .from('cl_restro_tables')
          .select('*')
          .eq('id', tableId)
          .single();

        if (error || !data) {
          throw new Error('Table not found or invalid QR code.');
        }

        setTable(data);
      } catch (err) {
        console.error('Error fetching table:', err);
        setErrorMsg(err.message || 'Invalid Table QR Code');
      } finally {
        setLoading(false);
      }
    };

    fetchTableInfo();
  }, [tableId]);

  const handleConfirmBooking = async () => {
    if (!table) return;
    setBookingLoading(true);
    try {
      // Create new booking row
      const { data, error } = await supabase
        .from('cl_restro_bookings')
        .insert([
          {
            table_id: table.id,
            status: 'ACTIVE'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Save to localStorage & parent state
      const info = {
        bookingId: data.id,
        tableId: table.id,
        tableName: table.name,
        capacity: table.capacity
      };

      localStorage.setItem('restro_session', JSON.stringify(info));
      if (setBookingInfo) setBookingInfo(info);

      // Redirect to menu
      navigate('/menu');
    } catch (err) {
      alert('Error creating booking session: ' + err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-slate-400">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Verifying Table QR Code...</p>
      </div>
    );
  }

  if (errorMsg || !table) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-white">Invalid Table Scan</h2>
        <p className="text-xs text-slate-400 max-w-xs">{errorMsg}</p>
        <button
          onClick={() => navigate('/menu')}
          className="mt-4 px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
        >
          Go to Menu Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col justify-between p-6 bg-gradient-to-b from-slate-900 to-slate-950">
      <div className="space-y-6 pt-6 text-center">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-orange-500/20">
          <QrCode className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-semibold border border-orange-500/20">
            QR Code Scanned
          </span>
          <h2 className="text-2xl font-extrabold text-white">{table.name}</h2>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <Users className="w-4 h-4 text-slate-400" />
            <span>Capacity: {table.capacity} Persons</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-left space-y-3 text-xs text-slate-300">
          <h4 className="font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Session Details
          </h4>
          <p className="text-slate-400">
            By confirming, a dining session will be opened for <strong>{table.name}</strong>. You will be able to order food directly to this table.
          </p>
        </div>
      </div>

      <div className="pb-6">
        <button
          onClick={handleConfirmBooking}
          disabled={bookingLoading}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-base shadow-xl shadow-orange-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          {bookingLoading ? (
            <span>Creating Session...</span>
          ) : (
            <>
              <span>Book & View Menu</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
