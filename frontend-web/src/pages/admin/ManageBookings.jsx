import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../api/client';
import {
  CalendarCheck,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  Users,
  Bus,
  CreditCard,
  MapPin,
  ShieldCheck,
  XCircle,
  LayoutGrid,
  Filter,
  X,
  Compass
} from 'lucide-react';

export const ManageBookings = () => {
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get('paymentStatus') || 'All';

  const [bookings, setBookings] = useState([]);
  const [activeTours, setActiveTours] = useState([]);
  const [selectedTourId, setSelectedTourId] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, toursRes] = await Promise.all([
        api.get('/admin/bookings'),
        api.get('/tours?status=all')
      ]);

      if (bookingsRes.data.success) {
        setBookings(bookingsRes.data.data);
      }
      if (toursRes.data.success) {
        // Active tours list
        setActiveTours(toursRes.data.data.filter((t) => t.status !== 'Completed'));
      }
    } catch (err) {
      console.error('Error fetching admin bookings & tours:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOfflinePayment = async (bookingId) => {
    const notes = window.prompt(
      'Enter verification notes (optional):',
      'Verified 20% advance payment in bank / UPI account.'
    );
    if (notes === null) return;

    setActionLoadingId(bookingId);
    setError('');
    setMessage('');

    try {
      const res = await api.put(`/admin/bookings/${bookingId}/confirm-offline-payment`, {
        adminNotes: notes
      });
      if (res.data.success) {
        setMessage(res.data.message);
        const refetch = await api.get('/admin/bookings');
        if (refetch.data.success) setBookings(refetch.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error confirming offline payment.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdatePaymentStatus = async (bookingId, newStatus) => {
    if (!window.confirm(`Are you sure you want to change payment status to "${newStatus}"?`)) return;

    setActionLoadingId(bookingId);
    setError('');
    setMessage('');

    try {
      const res = await api.put(`/admin/bookings/${bookingId}/payment-status`, {
        paymentStatus: newStatus
      });
      if (res.data.success) {
        setMessage(res.data.message);
        const refetch = await api.get('/admin/bookings');
        if (refetch.data.success) setBookings(refetch.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating payment status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Compute tour-specific stats
  const getTourStats = (tourId) => {
    const tourBookings = bookings.filter((b) => (b.tour?._id || b.tour) === tourId);
    let totalPassengers = 0;
    let totalRevenue = 0;
    let pendingOffline = 0;

    tourBookings.forEach((b) => {
      totalPassengers += b.numberOfSeats || (b.members?.length || 0);
      totalRevenue += b.pricing?.amountPaid || 0;
      if (b.paymentStatus === 'Offline Verification Pending') {
        pendingOffline++;
      }
    });

    return { count: tourBookings.length, totalPassengers, totalRevenue, pendingOffline };
  };

  const filteredBookings = bookings.filter((b) => {
    // Filter by selected tour card
    if (selectedTourId) {
      const bTourId = b.tour?._id || b.tour;
      if (bTourId !== selectedTourId) return false;
    }

    // Filter by tab
    if (filter === 'Pending Offline' && b.paymentStatus !== 'Offline Verification Pending') return false;
    if (filter === 'Confirmed' && b.bookingStatus !== 'Confirmed') return false;
    if (filter === 'Fully Paid' && b.paymentStatus !== 'Fully Paid') return false;

    // Search query
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    const tourTitle = b.tour?.title?.toLowerCase() || '';
    return (
      b.bookingId.toLowerCase().includes(s) ||
      (b.user?.name && b.user.name.toLowerCase().includes(s)) ||
      (b.user?.email && b.user.email.toLowerCase().includes(s)) ||
      tourTitle.includes(s) ||
      (b.offlinePaymentDetails?.referenceNumber &&
        b.offlinePaymentDetails.referenceNumber.toLowerCase().includes(s))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Booking & Payment Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review customer seat reservations, select active tours to manage payments and boarding manifests.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-emerald-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Active Tours Payment Section ────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-amber-600" />
            Active Tours & Payment Collections
          </h2>

          {selectedTourId && (
            <button
              onClick={() => setSelectedTourId('')}
              className="text-xs text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1 hover:underline"
            >
              <X className="w-3.5 h-3.5" />
              Show All Tours Bookings
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {activeTours.map((t) => {
            const stats = getTourStats(t._id);
            const isSelected = selectedTourId === t._id;

            return (
              <div
                key={t._id}
                onClick={() => setSelectedTourId(isSelected ? '' : t._id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/20 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-1">
                    {t.title}
                  </h3>
                  {stats.pendingOffline > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white animate-pulse">
                      {stats.pendingOffline} Pending
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 truncate">
                  <MapPin className="w-3 h-3 text-rose-500 flex-shrink-0" />
                  {t.destination}
                </p>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Passengers</span>
                    <span className="font-black text-slate-800">
                      {stats.totalPassengers} / {t.totalSeats}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Collected</span>
                    <span className="font-black text-emerald-600">
                      ₹{stats.totalRevenue.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-2 text-right">
                  <span
                    className={`text-[10px] font-bold ${
                      isSelected ? 'text-amber-700 underline' : 'text-slate-400'
                    }`}
                  >
                    {isSelected ? '✓ Viewing Bookings' : 'Click to filter →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-200">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['All', 'Pending Offline', 'Confirmed', 'Fully Paid'].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filter === t
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {t}{' '}
              {t === 'Pending Offline' &&
                `(${bookings.filter((b) => b.paymentStatus === 'Offline Verification Pending').length})`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by ID, customer, tour..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Active Filter Pill */}
      {selectedTourId && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 font-semibold">
          <span>
            Filtering bookings for tour:{' '}
            <strong className="font-bold">
              {activeTours.find((t) => t._id === selectedTourId)?.title || 'Selected Tour'}
            </strong>{' '}
            ({filteredBookings.length} booking(s))
          </span>
          <button
            onClick={() => setSelectedTourId('')}
            className="text-[11px] text-amber-800 hover:text-amber-950 font-bold underline"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Bookings Card List */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto space-y-3">
          <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No Matching Bookings</h3>
          <p className="text-xs text-slate-500">
            No reservations found matching the current tour / payment filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const isOfflinePending = b.paymentStatus === 'Offline Verification Pending';
            const isConfirmed = b.bookingStatus === 'Confirmed';
            const tour = b.tour;
            const isTourRemoved = !tour || tour.isDeleted;

            return (
              <div
                key={b._id}
                className={`bg-white rounded-3xl border transition-all ${
                  isOfflinePending
                    ? 'border-amber-300 ring-2 ring-amber-400/20 shadow-md'
                    : 'border-slate-200 shadow-xs'
                } overflow-hidden`}
              >
                {/* Header Strip */}
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-black text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      {b.bookingId}
                    </span>
                    <span className="text-xs text-slate-500">
                      Placed on {formatDate(b.createdAt)}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                      Method: {b.paymentMethod}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        isConfirmed
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {b.bookingStatus}
                    </span>

                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        b.paymentStatus === 'Advance Paid' || b.paymentStatus === 'Fully Paid'
                          ? 'bg-sky-100 text-sky-800'
                          : isOfflinePending
                          ? 'bg-amber-500 text-white animate-pulse'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Payment: {b.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Tour details (handles Tour Name Unavailable if removed) */}
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Tour Information
                      </span>
                      {isTourRemoved && (
                        <span className="text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded">
                          Removed by Admin
                        </span>
                      )}
                    </div>

                    <p className="font-bold text-slate-900 text-sm">
                      {tour?.title || 'Tour Name Unavailable'}
                    </p>

                    <p className="flex items-center gap-1.5 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {tour?.destination || 'Destination Unavailable'}
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-700">
                      <Bus className="w-3.5 h-3.5 text-sky-600" />
                      {tour?.vehicleType || 'Vehicle Unavailable'}
                    </p>
                    <p className="text-slate-500">
                      Dep: <strong>{formatDate(tour?.startDate) || 'N/A'}</strong> • Ret:{' '}
                      <strong>{formatDate(tour?.endDate) || 'N/A'}</strong>
                    </p>
                    {tour?._id && !isTourRemoved && (
                      <Link
                        to={`/admin/seat-chart/${tour._id}`}
                        className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-[10px] font-bold transition-colors"
                      >
                        <LayoutGrid className="w-3 h-3" /> View Seat Chart
                      </Link>
                    )}
                  </div>

                  {/* Customer & Contact */}
                  <div className="space-y-1.5 text-xs text-slate-600 lg:border-l lg:border-slate-100 lg:pl-6">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Customer Contact
                    </span>
                    <p className="font-bold text-slate-900 text-sm">
                      {b.contactDetails?.primaryName || b.user?.name || 'Customer'}
                    </p>
                    <p className="text-slate-700">
                      {b.contactDetails?.primaryPhone || b.user?.phone || 'No phone'}
                    </p>
                    <p className="text-slate-500 truncate" title={b.contactDetails?.primaryEmail}>
                      {b.contactDetails?.primaryEmail || b.user?.email}
                    </p>
                    <p className="text-slate-400 text-[11px] truncate" title={b.contactDetails?.address}>
                      {b.contactDetails?.address || b.user?.address || 'No address'}
                    </p>
                  </div>

                  {/* Passenger Manifest */}
                  <div className="space-y-2 text-xs lg:border-l lg:border-slate-100 lg:pl-6">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Passengers ({b.numberOfSeats} Seats)
                    </span>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {(b.members || []).map((m, idx) => (
                        <div
                          key={idx}
                          className="p-1.5 bg-slate-50 rounded-lg flex items-center justify-between text-[11px]"
                        >
                          <span className="font-semibold text-slate-800">
                            #{idx + 1}. {m.name} ({m.age}y, {m.gender})
                          </span>
                          {m.seatNumber && (
                            <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">
                              Seat #{m.seatNumber}
                            </span>
                          )}
                          {m.isChild && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1 rounded">
                              Child
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Financials & Action Buttons */}
                  <div className="space-y-3 lg:border-l lg:border-slate-100 lg:pl-6 flex flex-col justify-between">
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Total Price:</span>
                        <span className="font-bold text-slate-900">
                          ₹{b.pricing?.totalAmount?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-700">
                        <span>20% Advance:</span>
                        <span>₹{b.pricing?.advanceRequiredAmount?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Amount Received:</span>
                        <span>₹{b.pricing?.amountPaid?.toLocaleString()}</span>
                      </div>

                      {b.paymentMethod === 'Offline' && (
                        <div className="mt-2 p-2 bg-amber-50 rounded-lg text-[11px] text-amber-950 border border-amber-200">
                          <strong>Offline Ref:</strong>{' '}
                          {b.offlinePaymentDetails?.referenceNumber || 'N/A'} (
                          {b.offlinePaymentDetails?.paymentMode})
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {isOfflinePending && (
                        <button
                          onClick={() => handleConfirmOfflinePayment(b._id)}
                          disabled={actionLoadingId === b._id}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Verify & Confirm 20% Advance</span>
                        </button>
                      )}

                      {b.paymentStatus === 'Advance Paid' && (
                        <button
                          onClick={() => handleUpdatePaymentStatus(b._id, 'Fully Paid')}
                          disabled={actionLoadingId === b._id}
                          className="w-full py-1.5 bg-slate-100 hover:bg-sky-50 text-sky-700 hover:text-sky-800 border border-slate-200 rounded-xl font-bold text-xs transition-colors"
                        >
                          Mark Remaining 80% as Paid
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
