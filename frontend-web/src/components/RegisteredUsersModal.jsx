import React, { useState, useEffect } from 'react';
import api from '../api/client';
import {
  Users,
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Search,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  Bus,
  Loader2
} from 'lucide-react';

export const RegisteredUsersModal = ({ tourId, isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && tourId) {
      fetchRegisteredUsers();
    }
  }, [isOpen, tourId]);

  const fetchRegisteredUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/tours/${tourId}/registered-users`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch registered users.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const tour = data?.tour;
  const stats = data?.stats;
  const passengers = data?.passengers || [];

  const filteredPassengers = passengers.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.passengerName.toLowerCase().includes(q) ||
      p.bookerName.toLowerCase().includes(q) ||
      (p.bookerPhone && p.bookerPhone.toLowerCase().includes(q)) ||
      (p.bookingRef && p.bookingRef.toLowerCase().includes(q)) ||
      (p.seatNumber && String(p.seatNumber).includes(q))
    );
  });

  // Export as CSV
  const downloadCSV = () => {
    if (!passengers.length) {
      alert('No passengers to export.');
      return;
    }

    const headers = [
      'Sl No',
      'Booking ID',
      'Primary Booker',
      'Contact Phone',
      'Email',
      'Passenger Name',
      'Age',
      'Gender',
      'Seat Number',
      'Payment Status',
      'Payment Method',
      'Amount Paid (INR)',
      'Total Fare (INR)',
      'Residential Address'
    ];

    const rows = passengers.map((p, idx) => [
      idx + 1,
      `"${p.bookingRef || p.bookingId}"`,
      `"${p.bookerName || ''}"`,
      `"${p.bookerPhone || ''}"`,
      `"${p.bookerEmail || ''}"`,
      `"${p.passengerName || ''}"`,
      p.age || '',
      p.gender || '',
      p.seatNumber || 'Unassigned',
      `"${p.paymentStatus || ''}"`,
      `"${p.paymentMethod || ''}"`,
      p.amountPaid || 0,
      p.totalAmount || 0,
      `"${(p.bookerAddress || '').replace(/"/g, '""')}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [
        `"Tour: ${tour?.title} - Destination: ${tour?.destination}"`,
        `"Departure: ${new Date(tour?.startDate).toLocaleDateString('en-IN')} | Return: ${new Date(tour?.endDate).toLocaleDateString('en-IN')}"`,
        `"Vehicle: ${tour?.vehicleType} | Total Seats: ${tour?.totalSeats} | Registered Passengers: ${passengers.length}"`,
        '',
        headers.join(','),
        ...rows.map((r) => r.join(','))
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Manifest_${(tour?.title || 'Tour').replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export as Word / Formatted Document (.doc HTML)
  const downloadDocument = () => {
    if (!passengers.length) {
      alert('No passengers to export.');
      return;
    }

    const docContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>Passenger Manifest</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #1e293b; }
        h1 { color: #0284c7; margin-bottom: 4px; }
        .meta { color: #64748b; font-size: 13px; margin-bottom: 20px; }
        .stats { background: #f0f9ff; border: 1px solid #bae6fd; padding: 12px; border-radius: 8px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
        th { background: #f8fafc; font-weight: bold; color: #334155; }
        tr:nth-child(even) { background: #f8fafc; }
        .badge { font-weight: bold; padding: 2px 6px; border-radius: 4px; }
      </style>
      </head>
      <body>
        <h1>✈️ WanderWise Travels — Boarding Manifest</h1>
        <div class="meta">
          <strong>Tour:</strong> ${tour?.title} | <strong>Destination:</strong> ${tour?.destination} | <strong>Vehicle:</strong> ${tour?.vehicleType}<br/>
          <strong>Departure:</strong> ${new Date(tour?.startDate).toLocaleDateString('en-IN')} | <strong>Return:</strong> ${new Date(tour?.endDate).toLocaleDateString('en-IN')}<br/>
          <strong>Pickup Location:</strong> ${tour?.startLocation}
        </div>
        <div class="stats">
          <strong>Total Passengers:</strong> ${passengers.length} | 
          <strong>Total Bookings:</strong> ${stats?.totalBookings || 0} | 
          <strong>Total Revenue:</strong> ₹${(stats?.totalRevenue || 0).toLocaleString()} | 
          <strong>Advance Collected:</strong> ₹${(stats?.totalAdvancePaid || 0).toLocaleString()}
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Seat #</th>
              <th>Passenger Name</th>
              <th>Age/Gender</th>
              <th>Primary Contact</th>
              <th>Phone</th>
              <th>Booking Ref</th>
              <th>Payment Status</th>
              <th>Amount Paid</th>
            </tr>
          </thead>
          <tbody>
            ${passengers
              .map(
                (p, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>#${p.seatNumber || 'TBD'}</strong></td>
                <td><strong>${p.passengerName}</strong>${p.isChild ? ' (Child)' : ''}</td>
                <td>${p.age}y / ${p.gender}</td>
                <td>${p.bookerName}</td>
                <td>${p.bookerPhone}</td>
                <td>${p.bookingRef}</td>
                <td>${p.paymentStatus}</td>
                <td>₹${Number(p.amountPaid).toLocaleString()}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
        <p style="margin-top: 30px; font-size: 11px; color: #94a3b8;">Generated on ${new Date().toLocaleString()} by WanderWise Tours & Travels Portal.</p>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', docContent], {
      type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Manifest_${(tour?.title || 'Tour').replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 my-8 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 to-sky-950 px-6 py-4 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base leading-tight">Registered Passengers Manifest</h3>
              <p className="text-xs text-sky-200 mt-0.5">
                {tour?.title || 'Loading tour...'} • {tour?.destination}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Loading passenger list...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
              {error}
            </div>
          ) : (
            <>
              {/* Tour Overview Banner & Financial Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Tour Status</span>
                  <span
                    className={`font-black text-sm mt-0.5 inline-block ${
                      tour?.status === 'Completed' ? 'text-purple-600' : 'text-emerald-600'
                    }`}
                  >
                    {tour?.status || 'Active'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Total Passengers</span>
                  <span className="font-black text-sm text-slate-900 mt-0.5 block">
                    {stats?.totalPassengers || 0} / {tour?.totalSeats} seats
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Total Revenue</span>
                  <span className="font-black text-sm text-slate-900 mt-0.5 block">
                    ₹{(stats?.totalRevenue || 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Advance Collected</span>
                  <span className="font-black text-sm text-emerald-600 mt-0.5 block">
                    ₹{(stats?.totalAdvancePaid || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Toolbar: Search + Download Document Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by passenger, booker, seat #..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={downloadCSV}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Download CSV</span>
                  </button>
                  <button
                    onClick={downloadDocument}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Download Document (.doc)</span>
                  </button>
                </div>
              </div>

              {/* Passengers Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto max-h-[45vh]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Seat</th>
                        <th className="py-2.5 px-3">Passenger</th>
                        <th className="py-2.5 px-3">Primary Booker</th>
                        <th className="py-2.5 px-3">Contact</th>
                        <th className="py-2.5 px-3">Booking ID</th>
                        <th className="py-2.5 px-3">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPassengers.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-400">
                            No passengers found for this tour.
                          </td>
                        </tr>
                      ) : (
                        filteredPassengers.map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3">
                              <span className="font-mono font-black text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 text-[11px]">
                                #{p.seatNumber || 'N/A'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-slate-900 block">{p.passengerName}</span>
                              <span className="text-[10px] text-slate-500">
                                {p.age} yrs • {p.gender} {p.isChild && '• Child'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-800">
                              {p.bookerName}
                            </td>
                            <td className="py-2.5 px-3 space-y-0.5 text-slate-600">
                              <div>{p.bookerPhone}</div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                                {p.bookerEmail}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                              {p.bookingRef}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  p.paymentStatus === 'Fully Paid' || p.paymentStatus === 'Advance Paid'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {p.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
