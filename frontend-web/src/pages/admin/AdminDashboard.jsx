import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import {
  Users,
  Compass,
  CalendarCheck,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Bus,
  CheckCircle,
  Clock
} from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      if (res.data.success) {
        setStats(res.data.stats);
        setRecentBookings(res.data.recentBookings);
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
            Admin Control Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2">Operations Overview</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Monitor tour bookings, confirm 20% advance offline receipts, manage vehicle capacities, and control user access.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/tours"
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all"
          >
            + Create Tour
          </Link>
          <Link
            to="/admin/gallery"
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            Gallery & Programs
          </Link>
          <Link
            to="/admin/bookings"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all"
          >
            Review Payments
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Registered Users</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats?.totalUsers || 0}</p>
            <Link to="/admin/users" className="text-[11px] font-bold text-sky-600 hover:underline">
              Manage users & passwords →
            </Link>
          </div>
          <div className="p-3 bg-sky-50 rounded-xl text-sky-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Active Tours</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats?.totalTours || 0}</p>
            <Link to="/admin/tours" className="text-[11px] font-bold text-amber-600 hover:underline">
              View vehicle & seats →
            </Link>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Compass className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Total Bookings</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats?.totalBookings || 0}</p>
            <span className="text-[11px] text-slate-400">Total customer manifests</span>
          </div>
          <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Advance Collected</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              ₹{(stats?.totalRevenueCollected || 0).toLocaleString()}
            </p>
            <span className="text-[11px] text-slate-400">20% pre-registration sum</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Pending Offline Payments Attention Banner */}
      {stats?.pendingOfflinePaymentsCount > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-200/60 rounded-xl text-amber-900">
              <AlertTriangle className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <h3 className="font-black text-amber-950 text-sm">
                {stats.pendingOfflinePaymentsCount} Offline Payment Verification Request(s)
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Customers have submitted UPI/bank reference numbers waiting for your confirmation to reserve their seats.
              </p>
            </div>
          </div>
          <Link
            to="/admin/bookings?paymentStatus=Offline%20Verification%20Pending"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm whitespace-nowrap"
          >
            Review & Confirm Now →
          </Link>
        </div>
      )}

      {/* Recent Bookings Feed */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900">Recent Customer Bookings</h2>
          <Link
            to="/admin/bookings"
            className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            <span>View All Bookings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold">
                <th className="py-3 px-3">Booking ID</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Tour / Destination</th>
                <th className="py-3 px-3">Seats</th>
                <th className="py-3 px-3">20% Advance</th>
                <th className="py-3 px-3">Payment Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentBookings.map((b) => (
                <tr key={b._id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-slate-700">{b.bookingId}</td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-900 block">{b.user?.name}</span>
                    <span className="text-slate-500 text-[11px]">{b.user?.email}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-medium text-slate-800 block">{b.tour?.title}</span>
                    <span className="text-slate-500 text-[11px]">{b.tour?.destination}</span>
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900">{b.numberOfSeats}</td>
                  <td className="py-3 px-3 font-bold text-emerald-700">
                    ₹{b.pricing?.advanceRequiredAmount?.toLocaleString()}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        b.paymentStatus === 'Advance Paid' || b.paymentStatus === 'Fully Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.paymentStatus === 'Offline Verification Pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {b.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      to="/admin/bookings"
                      className="text-sky-600 hover:text-sky-800 font-bold hover:underline"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
