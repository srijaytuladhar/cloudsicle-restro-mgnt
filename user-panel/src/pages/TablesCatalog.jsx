import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Users, CheckCircle2, AlertCircle, ArrowRight, LayoutGrid, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

export default function TablesCatalog({ setBookingInfo }) {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(null); // stores tableId currently booking
  const [confirmTable, setConfirmTable] = useState(null); // stores table object to confirm

  const localSession = (() => {
    try {
      const stored = localStorage.getItem('restro_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase
        .from('cl_restro_tables')
        .select(`
          *,
          bookings:cl_restro_bookings(id, status)
        `)
        .order('name', { ascending: true });

      if (error) throw error;
      setTables(data || []);
    } catch (err) {
      console.error('Error fetching tables catalog:', err);
      toast.error('Failed to load tables availability');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();

    // 5-second live updates
    const pollInterval = setInterval(() => {
      fetchTables();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, []);

  const handleBookTableClick = (table) => {
    // If table is occupied by someone else, do not allow booking
    const activeBooking = table.bookings?.find(b => b.status === 'ACTIVE');
    const isOccupiedByOther = activeBooking && (!localSession || localSession.bookingId !== activeBooking.id);

    if (isOccupiedByOther) {
      toast.error("This table is currently occupied.");
      return;
    }

    if (activeBooking && localSession && localSession.bookingId === activeBooking.id) {
      // Already booked by current user, just enter menu
      navigate('/menu');
      return;
    }

    setConfirmTable(table);
  };

  const handleConfirmBooking = async () => {
    if (!confirmTable) return;
    const tableToBook = confirmTable;
    setConfirmTable(null);
    setBookingLoading(tableToBook.id);

    try {
      // 1. If user has another active booking session, optionally close it
      if (localSession?.bookingId) {
        await supabase
          .from('cl_restro_bookings')
          .update({ status: 'CLOSED' })
          .eq('id', localSession.bookingId);
      }

      // 2. Insert new booking
      const { data, error } = await supabase
        .from('cl_restro_bookings')
        .insert([
          {
            table_id: tableToBook.id,
            status: 'ACTIVE'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // 3. Save to localStorage & parent state
      const info = {
        bookingId: data.id,
        tableId: tableToBook.id,
        tableName: tableToBook.name,
        capacity: tableToBook.capacity
      };

      localStorage.setItem('restro_session', JSON.stringify(info));
      if (setBookingInfo) setBookingInfo(info);

      toast.success(`Table ${tableToBook.name} booked successfully!`);
      navigate('/menu');
    } catch (err) {
      console.error('Error booking table:', err);
      toast.error('Failed to book table: ' + err.message);
    } finally {
      setBookingLoading(null);
    }
  };

  return (
    <div className="flex flex-col min-h-full p-4 space-y-6 pb-20 overflow-y-auto">
      {/* Title Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-orange-400" />
            <h2 className="text-sm font-bold text-white">Table Availability</h2>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Select and book an available table directly.</p>
        </div>
        <div className="text-[10px] text-slate-500 flex items-center gap-1">
          <Clock className="w-3 h-3 text-orange-500 animate-pulse" />
          <span>Live updates</span>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-400">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs">Fetching tables status...</p>
        </div>
      ) : tables.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
          <AlertCircle className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-slate-300 font-semibold text-sm">No Tables Found</p>
          <p className="text-slate-500 text-xs">Please contact restaurant staff.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tables.map((tbl) => {
            const activeBooking = tbl.bookings?.find(b => b.status === 'ACTIVE');
            const isOccupiedByOther = activeBooking && (!localSession || localSession.bookingId !== activeBooking.id);
            const isMySession = activeBooking && localSession && localSession.bookingId === activeBooking.id;

            return (
              <div 
                key={tbl.id}
                className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between relative overflow-hidden ${
                  isMySession
                    ? 'bg-emerald-950/10 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                    : isOccupiedByOther
                    ? 'bg-rose-950/5 border-rose-500/10'
                    : 'bg-slate-900 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Left Indicator bar */}
                <div className={`absolute top-0 bottom-0 left-0 w-[4px] ${
                  isMySession
                    ? 'bg-emerald-500'
                    : isOccupiedByOther
                    ? 'bg-rose-500/50'
                    : 'bg-slate-700'
                }`} />

                <div className="pl-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-100">{tbl.name}</h3>
                    {isMySession && (
                      <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-500/30 uppercase tracking-wide">
                        Your Table
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>Seating: <strong>{tbl.capacity} Persons</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status Indicator */}
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg border tracking-wide uppercase shrink-0 ${
                    isOccupiedByOther
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : isMySession
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {isOccupiedByOther ? 'Occupied' : isMySession ? 'Booked' : 'Available'}
                  </span>

                  {/* Booking Action Button */}
                  <button
                    onClick={() => handleBookTableClick(tbl)}
                    disabled={isOccupiedByOther || bookingLoading !== null}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                      isMySession
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : isOccupiedByOther
                        ? 'bg-slate-800/40 text-slate-600 border border-slate-850 cursor-not-allowed'
                        : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-md shadow-orange-600/10'
                    }`}
                  >
                    {bookingLoading === tbl.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : isMySession ? (
                      <>
                        <span>Menu</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <span>Book</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal 
        isOpen={confirmTable !== null}
        title={`Book Table ${confirmTable?.name}`}
        message={
          localSession 
            ? `You currently have an active session at ${localSession.tableName}. Booking ${confirmTable?.name} will release your previous session and open a new one. Do you want to proceed?`
            : `Would you like to book ${confirmTable?.name} directly? This will open an active dining session and allow you to view the menu and place pre-orders.`
        }
        onConfirm={handleConfirmBooking}
        onCancel={() => setConfirmTable(null)}
      />
    </div>
  );
}
