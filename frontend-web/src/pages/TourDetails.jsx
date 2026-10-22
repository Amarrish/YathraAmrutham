import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import {
  Calendar,
  Clock,
  MapPin,
  Bus,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Shield,
  ChevronRight
} from 'lucide-react';

export const TourDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTour = async () => {
      try {
        const res = await api.get(`/tours/${id}`);
        if (res.data.success) {
          setTour(res.data.data);
        } else {
          setError('Tour details not available');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error loading tour details');
      } finally {
        setLoading(false);
      }
    };

    fetchTour();
  }, [id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4">
        <p className="text-rose-600 font-bold">{error || 'Tour not found'}</p>
        <Link to="/" className="inline-block text-sm font-semibold text-sky-600 underline">
          Back to all tours
        </Link>
      </div>
    );
  }

  const advanceAmount = Math.round(tour.pricePerPerson * 0.2);
  const isSoldOut = tour.availableSeats <= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-slate-800">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/" className="hover:text-slate-800">Tours</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800 font-medium truncate max-w-[200px] sm:max-w-md">{tour.title}</span>
      </nav>

      {/* Hero Visual Section */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl bg-slate-900 h-[360px] sm:h-[450px]">
        <img
          src={
            tour.images && tour.images.length > 0
              ? tour.images[0]
              : 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80'
          }
          alt={tour.title}
          className="w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

        {/* Hero Overlay Content */}
        <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10 sm:right-10 text-white space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-sky-500/80 backdrop-blur-md text-xs font-bold uppercase tracking-wider">
              {tour.destination}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold flex items-center gap-1.5">
              <Bus className="w-3.5 h-3.5" /> {tour.vehicleType}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            {tour.title}
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-3xl line-clamp-2">
            {tour.description}
          </p>
        </div>
      </div>

      {/* Main Grid: Details (Left 2 cols) & Booking Action Card (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: All Tour Specs */}
        <div className="lg:col-span-2 space-y-8">
          {/* Key Schedule Information Bar */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-sky-500" /> Departure Date
              </span>
              <p className="font-bold text-slate-800 text-sm sm:text-base">{formatDate(tour.startDate)}</p>
            </div>

            <div className="space-y-1 sm:border-l sm:border-slate-100 sm:pl-4">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-teal-500" /> Coming Back Date
              </span>
              <p className="font-bold text-slate-800 text-sm sm:text-base">{formatDate(tour.endDate)}</p>
            </div>

            <div className="space-y-1 sm:border-l sm:border-slate-100 sm:pl-4">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" /> Starting Location
              </span>
              <p className="font-bold text-slate-800 text-sm sm:text-base truncate" title={tour.startLocation}>
                {tour.startLocation}
              </p>
            </div>
          </div>

          {/* Vehicle & Seats Specification */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Bus className="w-5 h-5 text-sky-600" />
              Transportation & Vehicle Specifications
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500">Vehicle Allocated:</span>
                <p className="font-bold text-slate-900 text-base mt-0.5">{tour.vehicleType}</p>
                <p className="text-xs text-slate-500 mt-1">Air-conditioned, sanitized, experienced driver.</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Seat Capacity:</span>
                  <span className="text-xs font-bold text-sky-600">
                    {tour.availableSeats} of {tour.totalSeats} seats open
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full transition-all ${
                      tour.availableSeats <= 3 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.max(5, (tour.availableSeats / tour.totalSeats) * 100)}%`
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Seats are guaranteed upon payment of the 20% advance.
                </p>
              </div>
            </div>
          </div>

          {/* Day-by-Day Itinerary */}
          {tour.itinerary && tour.itinerary.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
              <h3 className="font-bold text-slate-900 text-lg">Detailed Day-by-Day Itinerary</h3>
              <div className="space-y-4">
                {tour.itinerary.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center border border-sky-200">
                      Day {item.day}
                    </div>
                    <div className="space-y-1 flex-1">
                      <h4 className="font-bold text-slate-800 text-sm">{item.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inclusions & Exclusions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 text-emerald-700">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                What's Included
              </h4>
              <ul className="space-y-2 text-xs text-slate-600">
                {tour.inclusions?.map((inc, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{inc}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 text-rose-700">
                <XCircle className="w-4 h-4 text-rose-500" />
                What's Excluded
              </h4>
              <ul className="space-y-2 text-xs text-slate-600">
                {tour.exclusions?.map((exc, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">✗</span>
                    <span>{exc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Booking Card */}
        <div className="space-y-6">
          <div className="sticky top-24 bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-6">
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tour Fee</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-900">
                  ₹{tour.pricePerPerson.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 font-medium">/ person (seat)</span>
              </div>
            </div>

            {/* Advance payment highlight box */}
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>20% Advance Pre-Registration Fee</span>
              </div>
              <p className="text-amber-900 leading-relaxed">
                Pay only <strong className="font-bold text-amber-950">₹{advanceAmount.toLocaleString()}</strong> per seat today to lock in your booking!
              </p>
              <div className="text-[11px] font-semibold text-amber-950 bg-amber-100/70 p-2 rounded-lg border border-amber-300/50">
                ⚠️ Notice: The 20% advance is non-refundable upon cancellation.
              </div>
            </div>

            {/* Availability status */}
            <div className="flex items-center justify-between text-xs text-slate-600 py-2 border-y border-slate-100">
              <span>Status:</span>
              {isSoldOut ? (
                <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">Sold Out</span>
              ) : (
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  {tour.availableSeats} Seats Available
                </span>
              )}
            </div>

            {/* Book Now Button */}
            {isSoldOut ? (
              <button
                disabled
                className="w-full py-3.5 rounded-2xl font-bold text-sm bg-slate-200 text-slate-400 cursor-not-allowed"
              >
                Sold Out (No Seats Available)
              </button>
            ) : (
              <button
                onClick={() => navigate(`/book/${tour._id}`)}
                className="w-full py-3.5 rounded-2xl font-bold text-sm bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              >
                <span>Select & Book Seats</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <div className="text-center">
              <span className="text-[11px] text-slate-400">
                🔒 Safe & secure reservation • Instant or Offline payment
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
