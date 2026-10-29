import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { SeatMap } from '../../components/SeatMap';
import {
  ArrowLeft, Users, LayoutGrid, AlertTriangle, CheckCircle,
  X, ArrowRightLeft, UserPlus, Send, Loader2, MapPin
} from 'lucide-react';

export const AdminSeatChart = () => {
  const { tourId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [tour, setTour] = useState(null);
  const [seats, setSeats] = useState([]);
  const [seatDataMap, setSeatDataMap] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Seat panel
  const [selectedSeatNum, setSelectedSeatNum] = useState(null);
  const [selectedSeatInfo, setSelectedSeatInfo] = useState(null);

  // Reassign flow
  const [reassignMode, setReassignMode] = useState(false);
  const [targetSeat, setTargetSeat] = useState('');
  const [reassignLoading, setReassignLoading] = useState(false);

  // Allocate for offline
  const [allocateMode, setAllocateMode] = useState(false);
  const [unallocated, setUnallocated] = useState([]);
  const [allocBookingId, setAllocBookingId] = useState('');
  const [allocMemberId, setAllocMemberId] = useState('');
  const [allocSeat, setAllocSeat] = useState('');
  const [allocLoading, setAllocLoading] = useState(false);

  // Send travel info
  const [sendingInfo, setSendingInfo] = useState(false);

  useEffect(() => { load(); }, [tourId]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/admin/tours/${tourId}/seating-chart`);
      if (res.data.success) {
        const { tour: t, seats: s } = res.data.data;
        setTour(t);
        setSeats(s);
        const map = {};
        s.forEach((seat) => { map[seat.seatNumber] = { isOccupied: seat.isOccupied, passenger: seat.passenger || null }; });
        setSeatDataMap(map);
        await loadUnallocated();
      }
    } catch (err) {
      setError('Failed to load seating chart.');
    } finally {
      setLoading(false);
    }
  };

  const loadUnallocated = async () => {
    try {
      const res = await api.get('/admin/bookings');
      if (res.data.success) {
        const list = [];
        res.data.data
          .filter((b) => {
            const bt = b.tour?._id || b.tour;
            return bt === tourId && b.bookingStatus !== 'Cancelled';
          })
          .forEach((booking) => {
            (booking.members || []).forEach((m, idx) => {
              if (!m.seatNumber) {
                list.push({
                  bookingId: booking._id,
                  bookingRef: booking.bookingId,
                  memberId: m._id || String(idx),
                  name: m.name,
                  age: m.age,
                  gender: m.gender,
                  paymentStatus: booking.paymentStatus
                });
              }
            });
          });
        setUnallocated(list);
      }
    } catch (e) {
      console.error('Could not load unallocated:', e);
    }
  };

  const handleAdminSeatClick = (seatNum, info) => {
    if (reassignMode && selectedSeatNum) {
      setTargetSeat(String(seatNum));
      return;
    }
    setSelectedSeatNum(seatNum);
    setSelectedSeatInfo(info);
    setReassignMode(false);
    setTargetSeat('');
  };

  const handleReassign = async () => {
    if (!selectedSeatNum || !targetSeat) { setError('Select both from and to seats.'); return; }
    setReassignLoading(true); setError('');
    try {
      const res = await api.put(`/admin/tours/${tourId}/reassign-seat`, {
        fromSeat: selectedSeatNum, toSeat: Number(targetSeat)
      });
      if (res.data.success) {
        setMessage(res.data.message);
        setSelectedSeatNum(null); setSelectedSeatInfo(null);
        setReassignMode(false); setTargetSeat('');
        await load();
      }
    } catch (err) { setError(err.response?.data?.message || 'Reassign failed.'); }
    finally { setReassignLoading(false); }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    if (!allocBookingId || !allocSeat) { setError('Select passenger and seat.'); return; }
    setAllocLoading(true); setError('');
    try {
      const res = await api.post(`/admin/bookings/${allocBookingId}/allocate-seat`, {
        memberId: allocMemberId, seatNumber: Number(allocSeat)
      });
      if (res.data.success) {
        setMessage(`Seat #${allocSeat} allocated!`);
        setAllocateMode(false); setAllocBookingId(''); setAllocMemberId(''); setAllocSeat('');
        await load();
      }
    } catch (err) { setError(err.response?.data?.message || 'Allocation failed.'); }
    finally { setAllocLoading(false); }
  };

  const handleSendInfo = async () => {
    if (!window.confirm('Send travel information email to all confirmed passengers?')) return;
    setSendingInfo(true); setError('');
    try {
      const res = await api.post(`/admin/tours/${tourId}/send-travel-info`);
      if (res.data.success) setMessage(`✅ ${res.data.message}`);
    } catch (err) { setError(err.response?.data?.message || 'Failed to send.'); }
    finally { setSendingInfo(false); }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const occupiedCount = seats.filter((s) => s.isOccupied).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 mt-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Seat Management</h1>
          {tour && <p className="text-xs text-slate-500 mt-1">{tour.title} • {tour.destination} • {tour.vehicleType}</p>}
        </div>
        <button onClick={handleSendInfo} disabled={sendingInfo} className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow transition-all disabled:bg-slate-300">
          {sendingInfo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send Travel Info
        </button>
      </div>

      {tour && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Seats', val: tour.totalSeats, cls: 'text-slate-900' },
            { label: 'Occupied', val: occupiedCount, cls: 'text-rose-600' },
            { label: 'Available', val: tour.totalSeats - occupiedCount, cls: 'text-emerald-600' }
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-200 text-center">
              <div className={`text-2xl font-black ${s.cls}`}>{s.val}</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs font-semibold">
          <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /><span>{message}</span></div>
          <button onClick={() => setMessage('')} className="text-emerald-700 hover:underline">Dismiss</button>
        </div>
      )}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-700 text-xs font-semibold">
          <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /><span>{error}</span></div>
          <button onClick={() => setError('')} className="text-rose-600 hover:underline">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Seat Map */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-sky-600" /> Live Seat Map
            <span className="text-xs font-normal text-slate-400 ml-1">(Click an occupied seat to manage)</span>
          </h2>
          {tour && (
            <SeatMap
              totalSeats={tour.totalSeats}
              bookedSeats={seats.filter((s) => s.isOccupied).map((s) => s.seatNumber)}
              selectedSeats={selectedSeatNum ? [selectedSeatNum] : []}
              vehicleType={tour.vehicleType}
              adminMode={true}
              seatData={seatDataMap}
              highlightedSeat={reassignMode ? selectedSeatNum : null}
              onAdminSeatClick={handleAdminSeatClick}
            />
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Selected seat panel */}
          {selectedSeatNum !== null && selectedSeatInfo !== null && (
            <div className="bg-white rounded-3xl border border-sky-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-sky-600" /> Seat #{selectedSeatNum}
                </h3>
                <button onClick={() => { setSelectedSeatNum(null); setSelectedSeatInfo(null); setReassignMode(false); }}>
                  <X className="w-4 h-4 text-slate-400 hover:text-slate-700" />
                </button>
              </div>

              {selectedSeatInfo.isOccupied && selectedSeatInfo.passenger ? (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="font-bold text-slate-900 text-sm">{selectedSeatInfo.passenger.name}</div>
                    <div className="text-slate-600">{selectedSeatInfo.passenger.age} yrs • {selectedSeatInfo.passenger.gender}</div>
                    <div className="text-slate-500">Booking: {selectedSeatInfo.passenger.bookingRef || selectedSeatInfo.passenger.bookingId}</div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedSeatInfo.passenger.paymentStatus?.includes('Paid') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {selectedSeatInfo.passenger.paymentStatus}
                    </span>
                  </div>

                  {!reassignMode ? (
                    <button onClick={() => setReassignMode(true)} className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2">
                      <ArrowRightLeft className="w-4 h-4" /> Reassign / Swap Seat
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500">Enter target seat or click one on the map:</p>
                      <input
                        type="number" min="1" max={tour?.totalSeats}
                        value={targetSeat} onChange={(e) => setTargetSeat(e.target.value)}
                        placeholder={`Target seat (1–${tour?.totalSeats})`}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => { setReassignMode(false); setTargetSeat(''); }} className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
                        <button onClick={handleReassign} disabled={reassignLoading || !targetSeat} className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 disabled:bg-slate-300">
                          {reassignLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRightLeft className="w-3 h-3" />}
                          {reassignLoading ? '...' : 'Confirm'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-2">This seat is available. Click an occupied seat to manage it.</p>
              )}
            </div>
          )}

          {/* Unallocated members */}
          {unallocated.length > 0 && (
            <div className="bg-white rounded-3xl border border-amber-200 p-5 space-y-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <UserPlus className="w-4 h-4 text-amber-600" /> Unallocated ({unallocated.length})
              </h3>
              <p className="text-xs text-slate-500">Assign seats to offline/pending passengers.</p>

              {!allocateMode ? (
                <button onClick={() => setAllocateMode(true)} className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2">
                  <UserPlus className="w-4 h-4" /> Assign Seat
                </button>
              ) : (
                <form onSubmit={handleAllocate} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Passenger</label>
                    <select
                      required
                      value={allocBookingId + '|' + allocMemberId}
                      onChange={(e) => {
                        const [bid, mid] = e.target.value.split('|');
                        setAllocBookingId(bid); setAllocMemberId(mid);
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    >
                      <option value="">-- Choose --</option>
                      {unallocated.map((m, i) => (
                        <option key={i} value={m.bookingId + '|' + m.memberId}>
                          {m.name} ({m.age}y) — {m.paymentStatus}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Seat Number</label>
                    <input
                      type="number" min="1" max={tour?.totalSeats} required
                      value={allocSeat} onChange={(e) => setAllocSeat(e.target.value)}
                      placeholder={`1 – ${tour?.totalSeats}`}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setAllocateMode(false)} className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
                    <button type="submit" disabled={allocLoading} className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 disabled:bg-slate-300">
                      {allocLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                      {allocLoading ? '...' : 'Allocate'}
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {unallocated.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-amber-50 rounded-lg border border-amber-100 text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{m.name}</span>
                      <span className="text-slate-500 ml-1">({m.age}y, {m.gender})</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${m.paymentStatus?.includes('Paid') ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {m.paymentStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Passenger list */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-sky-600" /> Confirmed Passengers
            </h3>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {seats.filter((s) => s.isOccupied).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">No confirmed passengers yet.</p>
              ) : (
                seats.filter((s) => s.isOccupied).map((s) => (
                  <div
                    key={s.seatNumber}
                    onClick={() => handleAdminSeatClick(s.seatNumber, s)}
                    className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-sky-50 rounded-xl border border-slate-100 cursor-pointer transition-colors text-xs"
                  >
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-black text-[10px] flex-shrink-0">
                      #{s.seatNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 truncate">{s.passenger?.name}</div>
                      <div className="text-slate-500 text-[10px]">{s.passenger?.age}y • {s.passenger?.gender}</div>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ${s.passenger?.paymentStatus?.includes('Paid') ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {s.passenger?.paymentStatus?.split(' ')[0]}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
