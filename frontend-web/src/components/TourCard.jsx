import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Bus, ArrowRight, Clock } from 'lucide-react';

export const TourCard = ({ tour }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const advanceAmount = Math.round(tour.pricePerPerson * 0.2);

  // Status badge styling
  const isSoldOut = tour.availableSeats <= 0;
  const isFillingFast = tour.availableSeats > 0 && tour.availableSeats <= 5;

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
      {/* Tour Image & Badges */}
      <div className="relative h-52 overflow-hidden bg-slate-100">
        <img
          src={
            tour.images && tour.images.length > 0
              ? tour.images[0]
              : 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80'
          }
          alt={tour.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Vehicle Badge */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-slate-800 flex items-center gap-1.5 shadow-sm">
          <Bus className="w-3.5 h-3.5 text-sky-600" />
          <span>{tour.vehicleType}</span>
        </div>

        {/* Seat Availability Badge */}
        <div className="absolute top-3 right-3">
          {isSoldOut ? (
            <span className="bg-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
              Sold Out
            </span>
          ) : isFillingFast ? (
            <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm animate-pulse">
              Only {tour.availableSeats} Seats Left!
            </span>
          ) : (
            <span className="bg-emerald-600/90 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
              {tour.availableSeats} Seats Available
            </span>
          )}
        </div>

        {/* Destination Pill on image */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white text-xs font-semibold drop-shadow">
          <MapPin className="w-3.5 h-3.5 text-sky-400" />
          <span>{tour.destination}</span>
        </div>
      </div>

      {/* Tour Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="font-bold text-lg text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">
            {tour.title}
          </h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
            {tour.description}
          </p>
        </div>

        {/* Dates and Origin specs */}
        <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between text-slate-700">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-sky-500" /> Departure:
            </span>
            <span className="font-semibold">{formatDate(tour.startDate)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-700">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Clock className="w-3.5 h-3.5 text-teal-500" /> Coming Back:
            </span>
            <span className="font-semibold">{formatDate(tour.endDate)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-700 pt-1 border-t border-slate-200/60">
            <span className="text-slate-500">Starting From:</span>
            <span className="font-medium text-slate-800 truncate max-w-[170px]" title={tour.startLocation}>
              {tour.startLocation}
            </span>
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="pt-2 flex items-end justify-between border-t border-slate-100">
          <div>
            <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Per Seat</div>
            <div className="text-xl font-black text-slate-900">
              ₹{tour.pricePerPerson.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
              20% Adv: ₹{advanceAmount.toLocaleString()}
            </div>
          </div>

          <Link
            to={`/tours/${tour._id}`}
            className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-sky-600/20 transition-all hover:gap-2"
          >
            <span>View & Book</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
