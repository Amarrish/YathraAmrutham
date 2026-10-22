import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { TourCard } from '../components/TourCard';
import { Search, MapPin, Bus, Filter, Sparkles, ShieldCheck, CreditCard, Award } from 'lucide-react';

export const Home = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [priceRange, setPriceRange] = useState('');

  const vehicleOptions = [
    'All Vehicles',
    'Buses',
    'Traveller',
    'Car',
    'Cruiser'
  ];

  useEffect(() => {
    fetchTours();
  }, [selectedVehicle, priceRange]);

  const fetchTours = async () => {
    setLoading(true);
    try {
      let queryUrl = '/tours?';
      if (selectedVehicle && selectedVehicle !== 'All Vehicles') {
        queryUrl += `vehicleType=${encodeURIComponent(selectedVehicle)}&`;
      }
      if (priceRange) {
        if (priceRange === 'under10k') queryUrl += `maxPrice=10000&`;
        if (priceRange === 'above10k') queryUrl += `minPrice=10000&`;
      }
      const res = await api.get(queryUrl);
      if (res.data.success) {
        setTours(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching tours:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTours = tours.filter((tour) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      tour.title.toLowerCase().includes(s) ||
      tour.destination.toLowerCase().includes(s) ||
      tour.startLocation.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-900 via-slate-900 to-slate-950 text-white pt-20 pb-28 px-4 sm:px-6 lg:px-8 rounded-b-3xl shadow-2xl">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Curated Expeditions • Real-Time Seats • Transparent Pricing</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Discover Unforgettable Journeys Across <span className="bg-gradient-to-r from-sky-400 to-teal-300 bg-clip-text text-transparent">Incredible India</span>
          </h1>


          {/* Search & Filter Bar */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 sm:p-4 rounded-2xl max-w-3xl mx-auto shadow-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Destination Search */}
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  placeholder="Search destination, city, or tour..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/90 text-slate-900 rounded-xl text-sm font-medium placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Vehicle Type Filter */}
              <div className="relative">
                <Bus className="w-5 h-5 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/90 text-slate-900 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none cursor-pointer"
                >
                  {vehicleOptions.map((v) => (
                    <option key={v} value={v === 'All Vehicles' ? '' : v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Filter */}
              <div className="relative">
                <Filter className="w-5 h-5 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/90 text-slate-900 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none cursor-pointer"
                >
                  <option value="">All Price Ranges</option>
                  <option value="under10k">Under ₹10,000 / seat</option>
                  <option value="above10k">Above ₹10,000 / seat</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-4">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">20% Advance Seat Lock</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Confirm your seat reservations with just 20% upfront. Balance is payable before departure.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-4">
            <div className="p-3 bg-sky-50 rounded-xl text-sky-600">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Verified Vehicle Fleet</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Clear vehicle specifications: Buses, Tempo Travellers, and Innova SUVs with known capacities.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Online & Offline Payment</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Choose instant digital advance checkout or offline bank/UPI transfer verified directly by admin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tours Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Available Tours & Departures</h2>
            <p className="text-xs text-slate-500 mt-1">
              Showing {filteredTours.length} active tours ready for seat booking
            </p>
          </div>

          {(search || selectedVehicle || priceRange) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedVehicle('');
                setPriceRange('');
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline self-start sm:self-auto"
            >
              Clear Filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 animate-pulse">
                <div className="bg-slate-200 h-48 rounded-xl w-full" />
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
                <div className="h-8 bg-slate-200 rounded w-full" />
              </div>
            ))}
          </div>
        ) : filteredTours.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-3">
            <MapPin className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-base">No Tours Found</h3>
            <p className="text-xs text-slate-500">
              We couldn't find any tours matching your search criteria. Try clearing filters or searching another destination.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTours.map((tour) => (
              <TourCard key={tour._id} tour={tour} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
