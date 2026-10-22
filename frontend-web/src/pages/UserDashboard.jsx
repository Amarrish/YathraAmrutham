import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  MapPin,
  Bus,
  Users,
  CheckCircle,
  Clock3,
  CreditCard,
  AlertCircle,
  Compass,
  ArrowRight
} from 'lucide-react';

export const UserDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bannerMessage, setBannerMessage] = useState(location.state?.successMessage || '');

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    try {
      const res = await api.get('/bookings/my-bookings');
      if (res.data.success) {
        setBookings(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching my bookings:', err);
    } finally {
      setLoading(false);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner notification if redirected from booking */}
      {bannerMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-900 text-sm font-semibold shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{bannerMessage}</span>
          </div>
          <button
            onClick={() => setBannerMessage('')}
            className="text-xs text-emerald-700 hover:text-emerald-950 font-bold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Welcome Hero Card */}
      <div className="bg-gradient-to-r from-sky-900 via-slate-900 to-sky-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
        <div className="relative space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-400/20">
            Customer Dashboard
          </span>
          <h1 className="text-2xl sm:text-4xl font-black">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
            Track your tour bookings, inspect departure points and vehicles, and review your 20% advance pre-registration payments.
          </p>

          <div className="pt-4 flex flex-wrap gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md"
            >
              <Compass className="w-4 h-4" />
              <span>Explore New Tours</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-sky-50 rounded-xl text-sky-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Total Bookings</span>
            <p className="text-2xl font-black text-slate-900">{bookings.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Confirmed Trips</span>
            <p className="text-2xl font-black text-slate-900">
              {bookings.filter((b) => b.bookingStatus === 'Confirmed').length}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Clock3 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Pending Offline Verifications</span>
            <p className="text-2xl font-black text-slate-900">
              {bookings.filter((b) => b.paymentStatus === 'Offline Verification Pending').length}
            </p>
          </div>
        </div>
      </div>

      {/* My Bookings Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900">My Tour Bookings & Tickets</h2>
          <span className="text-xs text-slate-500 font-semibold">{bookings.length} reservations</span>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto space-y-4">
            <Compass className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-base">No Bookings Yet</h3>
            <p className="text-xs text-slate-500">
              You haven't reserved any tours yet. Check out our exciting destinations and lock in your seats with just a 20% advance!
            </p>
            <Link
              to="/"
              className="inline-block px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-600/20"
            >
              Explore Tours Now
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const tour = booking.tour;
              const isConfirmed = booking.bookingStatus === 'Confirmed';
              const isPending = booking.paymentStatus === 'Offline Verification Pending';

              return (
                <div
                  key={booking._id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Top Bar with Booking ID & Status */}
                  <div className="bg-slate-50 px-6 py-3.5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                        {booking.bookingId}
                      </span>
                      <span className="text-xs text-slate-500">
                        Booked on {formatDate(booking.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Booking Status Badge */}
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          isConfirmed
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {booking.bookingStatus}
                      </span>

                      {/* Payment Status Badge */}
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          booking.paymentStatus === 'Advance Paid' || booking.paymentStatus === 'Fully Paid'
                            ? 'bg-sky-100 text-sky-800 border border-sky-300'
                            : isPending
                            ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        Payment: {booking.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Booking Body */}
                  <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Tour info */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-slate-900 text-base leading-tight">
                        {tour?.title || 'Tour Name Unavailable'}
                      </h3>
                      <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                          <span>Destination: <strong>{tour?.destination}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Bus className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                          <span>Vehicle: <strong>{tour?.vehicleType}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          <span>Departure: <strong>{formatDate(tour?.startDate)}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          <span>Return Date: <strong>{formatDate(tour?.endDate)}</strong></span>
                        </div>
                        <div className="text-slate-500 pt-1">
                          Pickup: <span className="font-medium text-slate-800">{tour?.startLocation}</span>
                        </div>
                      </div>
                    </div>

                    {/* Passenger Manifest */}
                    <div className="space-y-2 border-t md:border-t-0 md:border-l md:border-slate-100 md:pl-6 pt-4 md:pt-0">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-sky-600" />
                        Passenger List ({booking.numberOfSeats} Seats)
                      </span>
                      <div className="space-y-2">
                        {booking.members.map((m, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 bg-slate-50 rounded-xl text-xs flex items-center justify-between border border-slate-100"
                          >
                            <div>
                              <span className="font-bold text-slate-800 block">
                                #{idx + 1}. {m.name}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Age: {m.age} • Gender: {m.gender}
                              </span>
                            </div>
                            {m.isChild && (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                                Child
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Financial & Offline Notes */}
                    <div className="space-y-3 border-t md:border-t-0 md:border-l md:border-slate-100 md:pl-6 pt-4 md:pt-0 flex flex-col justify-between">
                      <div className="space-y-2 text-xs">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                          Payment Details ({booking.paymentMethod})
                        </span>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                          <div className="flex justify-between text-slate-600">
                            <span>Total Price:</span>
                            <span className="font-bold text-slate-900">
                              ₹{booking.pricing.totalAmount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-emerald-700 font-semibold">
                            <span>20% Advance ({booking.paymentStatus === 'Advance Paid' ? 'Paid' : 'Due'}):</span>
                            <span>₹{booking.pricing.advanceRequiredAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-slate-500 text-[11px]">
                            <span>Remaining 80% Balance:</span>
                            <span>₹{booking.pricing.remainingAmount.toLocaleString()}</span>
                          </div>
                        </div>

                        {booking.paymentMethod === 'Offline' && (
                          <div className="p-2 bg-amber-50 rounded-lg text-[11px] text-amber-900 border border-amber-200">
                            <strong>Offline Ref:</strong> {booking.offlinePaymentDetails?.referenceNumber || 'N/A'}{' '}
                            ({booking.offlinePaymentDetails?.paymentMode})
                          </div>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400">
                        {isConfirmed ? (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Seat officially reserved!
                          </span>
                        ) : (
                          <span className="text-amber-600 font-semibold flex items-center gap-1">
                            <Clock3 className="w-3.5 h-3.5" /> Awaiting Admin payment check
                          </span>
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
    </div>
  );
};
